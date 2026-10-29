import { memo, useCallback, useLayoutEffect, useRef } from "react";
import type { BarRaster, MarkGlyph, RasterPart, WhiteRun } from "./barRaster";
import { hitAt, lettersAround, markAt, whiteAt } from "./barRaster";
import type { NodeLetters } from "./letters";
import { sequenceSize } from "./nodeDetail";
import { fitCanvas, useScreenSize } from "./canvasScreen";
import type { FittedCanvas } from "./canvasScreen";

/* ══════════════════════════════════════════════════════════════════════════
   One haplotype's bar, painted from its raster (barRaster.ts).

   The vocabulary is the alignment's (linearModel.ts): the bar is plain
   where the haplotype reads what the reference reads, letters where it
   reads other bases over the same reference, hatched where it replaces a
   stretch with no base pairing claimed (its letters still spelled, in the
   hatched style) and over an open end, white with the size written in it
   where it skips reference, arrowed where it reads the reference on the
   other strand. Bases with no room on the reference are marks: a glyph
   above the bar at the point they go in, with "+n" when it fits, taking no
   room. So the bar is the reference's length, like every other bar.

   Painted, not drawn: one pass over the raster onto a canvas, and the
   pointer's x is the index into the raster, so a hover is a lookup and not
   a hit test. The canvas is sized to the screen's own pixels (canvasScreen).
   ══════════════════════════════════════════════════════════════════════════ */

/** The band at the top of a row where the marks sit, above the bar. */
export const MARK_BAND = 12;

/** What the pointer is on. */
export type BarTarget =
  | { kind: "base"; part: RasterPart; offset: number; bp: number; zoom: NodeLetters | null; x: number; y: number; at: number }
  | { kind: "mark"; glyph: MarkGlyph; x: number; y: number; at: number }
  | { kind: "white"; white: WhiteRun; x: number; y: number; at: number };

export interface BarCanvasProps {
  raster: BarRaster;
  /** The band, in pixels: the canvas is the whole of it. */
  width: number;
  height: number;
  /** The haplotype's colour. */
  color: string;
  /** Dimmed when another haplotype is the one being looked at. */
  dim: boolean;
  /** The haplotype's own strand runs backwards along the whole bar: a piece
      aligned flipped as a whole, drawn arrowed end to end. */
  reversed?: boolean;
  onHover: (target: BarTarget | null) => void;
  /** What the hover says of the place clicked. */
  onPick: (target: BarTarget) => void;
  /**
   * Zoomed out, the bar is read a section at a time and only on a click:
   * given these, a click reports where it landed instead of picking a base,
   * moving over the bar reports the section the pointer is in, and the bar
   * is hatched a section at a time where the haplotype is off the reference
   * for more than `sectionAltBp` bases of it.
   */
  sections?: ReadonlyArray<{ left: number; right: number }>;
  sectionAltBp?: number;
  onPress?: (at: { x: number; clientX: number; clientY: number }) => void;
  onPoint?: (at: { x: number } | null) => void;
}

/** How many bases of the haplotype the card shows either side of what
    the pointer covers. */
const LETTER_HALF = 48;

/* Ivory hatching on the haplotype's pastel; see pastelColor. */
const HATCH_INK = "#fffff0";
const HATCH_PITCH = 6;
const HATCH_WIDTH = 1.5;
/* A mismatch is a black chip with a white letter; a replacement's letter
   is ink on the hatching, no chip, since no pairing is claimed. */
const CHIP_INK = "#000000";
const CHIP_LETTER = "#ffffff";
const REPLACED_LETTER = "#1d2430";
/* What is read on the reverse strand: arrows pointing left, as
   AnnotationArrows draws a minus-strand query in genomealign. */
const STRAND_INK = "rgba(0, 0, 0, 0.55)";
const ARROW_WIDTH = 5;
const ARROW_SEPARATION = 16;
const ARROW_HEIGHT = 13;
/* A mark: a small triangle pointing into the bar, and its size. */
const MARK_INK = "#c2410c";
const MARK_HALF = 4;
const MARK_TALL = 7;
const MARK_FONT = 9;
/** The most of the bar's height a letter may take. */
const LETTER_OF_BAR = 0.7;
/** Below this a letter is a smudge, so none is drawn. */
const SEQUENCE_MIN_SIZE = 4;
const MONO_STACK = 'ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", monospace';
const SANS_STACK = 'system-ui, -apple-system, "Segoe UI", sans-serif';
const DIM_ALPHA = 0.3;
/** Margin between a letter's ink and the top and bottom of its chip. */
const CHIP_MARGIN = 0.14;
const LETTER_SAMPLE = "ACGTN";
const INK_PROBE_SIZE = 100;
/* A deletion's size, in the white it leaves: small and grey, it says what
   the white is and is not a mark of the haplotype's own. */
const DELETION_FONT = 11;
const DELETION_INK = "#6b7280";
const DELETION_PAD = 4;

function BarCanvas({
  raster,
  width,
  height,
  color,
  dim,
  reversed = false,
  onHover,
  onPick,
  sections,
  sectionAltBp = 0,
  onPress,
  onPoint,
}: BarCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const nudge = useRef(0);
  const screen = useScreenSize(ref);
  const fitted = useRef<FittedCanvas | null>(null);

  const repaint = useCallback(() => {
    if (!fitted.current) return;
    paintBar(fitted.current, { raster, width, height, color, reversed, sections, sectionAltBp });
  }, [raster, width, height, color, reversed, sections, sectionAltBp]);

  /* Painted again only for a new size or something new to draw: the
     observer's exact size usually matches the first paint's guess. */
  const painted = useRef<{ repaint: () => void; pw: number; ph: number } | null>(null);
  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas || width <= 0 || height <= 0) return;
    const ready = fitCanvas(canvas, width, height, screen, nudge);
    if (!ready) return;
    fitted.current = ready;
    const last = painted.current;
    if (last && last.repaint === repaint && last.pw === ready.pw && last.ph === ready.ph) return;
    repaint();
    painted.current = { repaint, pw: ready.pw, ph: ready.ph };
  }, [repaint, screen, width, height]);

  /** What is under the pointer. */
  const targetAt = (event: React.MouseEvent<HTMLCanvasElement>): BarTarget | null => {
    const box = event.currentTarget.getBoundingClientRect();
    const at = event.clientX - box.left;
    const y = event.clientY - box.top;
    const x = event.clientX;
    const clientY = event.clientY;
    if (y < MARK_BAND + 2) {
      const glyph = markAt(raster, at);
      if (glyph) return { kind: "mark", glyph, x, y: clientY, at };
    }
    const hit = hitAt(raster, at);
    if (hit) {
      return {
        kind: "base",
        part: hit.part,
        offset: hit.offset,
        bp: hit.bp,
        zoom: lettersAround(raster, hit, LETTER_HALF),
        x,
        y: clientY,
        at,
      };
    }
    const glyph = markAt(raster, at);
    if (glyph) return { kind: "mark", glyph, x, y: clientY, at };
    const white = whiteAt(raster, at);
    if (white) return { kind: "white", white, x, y: clientY, at };
    return null;
  };

  return (
    <canvas
      ref={ref}
      className="pgv-lane-canvas"
      style={{ width, height, opacity: dim ? DIM_ALPHA : 1 }}
      onClick={(event) => {
        if (onPress) {
          const box = event.currentTarget.getBoundingClientRect();
          onPress({ x: event.clientX - box.left, clientX: event.clientX, clientY: event.clientY });
          return;
        }
        const target = targetAt(event);
        if (target) onPick(target);
      }}
      onMouseMove={(event) => {
        /* A held button is a pan about to happen; between the press and
           the move the reader is not asking about what is under it. */
        if (event.buttons !== 0 || onPress) {
          onHover(null);
          if (onPress) {
            const box = event.currentTarget.getBoundingClientRect();
            onPoint?.(event.buttons !== 0 ? null : { x: event.clientX - box.left });
          }
          return;
        }
        onHover(targetAt(event));
      }}
      onMouseLeave={() => {
        onHover(null);
        onPoint?.(null);
      }}
    />
  );
}

interface BarPaint {
  raster: BarRaster;
  width: number;
  height: number;
  color: string;
  reversed: boolean;
  sections?: ReadonlyArray<{ left: number; right: number }>;
  sectionAltBp: number;
}

/** The kinds that take room on the bar, and so are painted in its colour. */
const roomy = (part: RasterPart) =>
  part.kind === "match" ||
  part.kind === "mismatch" ||
  part.kind === "replaced" ||
  part.kind === "inverted" ||
  part.kind === "open";

/** One haplotype's bar: its runs, the hatching, the arrows, the letters,
    the whites' sizes and the marks. */
function paintBar({ ctx, pw, ph, sx, sy }: FittedCanvas, paint: BarPaint) {
  const { raster, width, height, color, reversed, sections, sectionAltBp } = paint;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, pw, ph);
  const toScreen = (x: number) => Math.round(x * sx);
  /* The bar under the marks' band. */
  const top = Math.round(MARK_BAND * sy);
  const tall = Math.max(1, Math.round((height - MARK_BAND - 1) * sy));
  const clip = (a: number, b: number): [number, number] => [Math.max(0, a), Math.min(pw, b)];

  /* The bar itself: one fillRect per run of touching parts, every break
     at least a screen pixel wide so it can be seen. */
  ctx.fillStyle = color;
  eachRun(raster.parts, roomy, sx, pw, (from, to) => ctx.fillRect(from, top, to - from, tall));

  /* White where the haplotype skips reference, at least a screen pixel
     wide, cleared after the runs so a deletion inside an inverted span
     shows through the arrows too. */
  for (const part of raster.parts) {
    if (part.kind !== "white" || !(part.right > part.left)) continue;
    const a = toScreen(part.left);
    const b = Math.max(a + 1, toScreen(part.right));
    const [from, to] = clip(a, b);
    if (to > from) ctx.clearRect(from, top, to - from, tall);
  }

  /* The hatching: replacements and open ends - or, zoomed out, whole
     sections where more than sectionAltBp of the haplotype's bases there
     are off the reference. */
  ctx.strokeStyle = HATCH_INK;
  ctx.lineWidth = HATCH_WIDTH * sx;
  if (sections?.length) {
    for (const section of sections) {
      let alt = 0;
      for (const part of raster.parts) {
        if (part.right <= section.left || part.left >= section.right) continue;
        if (part.kind === "mismatch" || part.kind === "replaced" || part.kind === "open" || part.kind === "mark") {
          alt += part.len;
        }
      }
      if (alt <= sectionAltBp) continue;
      /* Across all the bar the haplotype has in the section. */
      eachRun(
        raster.parts,
        (part) => roomy(part) && part.right > section.left && part.left < section.right,
        sx,
        pw,
        (from, to) => {
          const [a, b] = clip(Math.max(from, toScreen(section.left)), Math.min(to, toScreen(section.right)));
          if (b > a) hatch(ctx, a, b, top, tall, HATCH_PITCH * sx);
        },
      );
    }
  } else {
    eachRun(
      raster.parts,
      (part) => part.kind === "replaced" || part.kind === "open",
      sx,
      pw,
      (from, to) => hatch(ctx, from, to, top, tall, HATCH_PITCH * sx),
    );
  }

  /* Arrows pointing left over what is read on the other strand. */
  ctx.strokeStyle = STRAND_INK;
  ctx.lineWidth = Math.max(1, Math.round(sx));
  if (reversed) {
    eachRun(raster.parts, roomy, sx, pw, (from, to) => arrows(ctx, from, to, top, tall, sx));
  } else {
    eachRun(raster.parts, (part) => part.kind === "inverted", sx, pw, (from, to) =>
      arrows(ctx, from, to, top, tall, sx),
    );
  }

  /* The letters, where a base is wide enough for one: a mismatch's on a
     chip, a replacement's on the hatching. Not zoomed out. */
  if (!sections?.length) {
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = `${INK_PROBE_SIZE}px ${MONO_STACK}`;
    const probe = ctx.measureText(LETTER_SAMPLE);
    const inkAbove = probe.actualBoundingBoxAscent / INK_PROBE_SIZE;
    const inkBelow = probe.actualBoundingBoxDescent / INK_PROBE_SIZE;
    for (const part of raster.parts) {
      if ((part.kind !== "mismatch" && part.kind !== "replaced") || !part.seq || part.len <= 0) continue;
      if (part.right <= 0 || part.left >= width) continue;
      const perBase = (part.right - part.left) / part.len;
      const size = Math.min(sequenceSize(perBase), (tall / sy) * LETTER_OF_BAR);
      if (size < SEQUENCE_MIN_SIZE) continue;
      const fontPx = Math.floor(size * sy);
      ctx.font = `${fontPx}px ${MONO_STACK}`;
      const advance = ctx.measureText(LETTER_SAMPLE).width / LETTER_SAMPLE.length;
      const above = inkAbove * fontPx;
      const below = inkBelow * fontPx;
      const margin = Math.max(sy, fontPx * CHIP_MARGIN);
      const baseline = Math.round(top + tall / 2 + (above - below) / 2);
      const chipTop = Math.max(top, Math.floor(baseline - above - margin));
      const chipBottom = Math.min(top + tall, Math.ceil(baseline + below + margin));
      const first = Math.max(0, Math.floor(-part.left / perBase));
      const last = Math.min(part.len, Math.ceil((width - part.left) / perBase));
      for (let i = first; i < last; i++) {
        const letter = part.seq.charAt(i);
        if (!letter) continue;
        const a = toScreen(part.left + i * perBase);
        const b = i < part.len - 1 ? toScreen(part.left + (i + 1) * perBase) : toScreen(part.right);
        if (b <= a) continue;
        if (part.kind === "mismatch") {
          ctx.fillStyle = CHIP_INK;
          ctx.fillRect(a, chipTop, b - a, chipBottom - chipTop);
          ctx.fillStyle = CHIP_LETTER;
        } else {
          ctx.fillStyle = REPLACED_LETTER;
        }
        ctx.fillText(letter, Math.round((part.left + (i + 0.5) * perBase) * sx - advance / 2), baseline);
      }
    }
  }

  /* Each white's size, where it fits in the white: a deletion inside the
     band in the middle of it, one running out of the band at the end that
     is here, with an arrow the way it goes. */
  if (raster.whites.length) {
    ctx.font = `${Math.round(DELETION_FONT * sy)}px ${SANS_STACK}`;
    ctx.fillStyle = DELETION_INK;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    const pad = DELETION_PAD * sx;
    for (const white of raster.whites) {
      const [from, to] = clip(white.left * sx, white.right * sx);
      const textWidth = ctx.measureText(white.text).width;
      if (textWidth + pad * 2 > to - from) continue;
      const x =
        white.open === null || white.open === "span"
          ? (from + to - textWidth) / 2
          : white.open === "right"
            ? from + pad
            : to - pad - textWidth;
      ctx.fillText(white.text, Math.round(x), Math.round(top + tall / 2));
    }
  }

  /* The marks: a glyph each in the band above the bar, with its size to
     the right where the next glyph leaves room. */
  if (raster.marks.length) {
    ctx.font = `${Math.round(MARK_FONT * sy)}px ${SANS_STACK}`;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.fillStyle = MARK_INK;
    const half = MARK_HALF * sx;
    const tip = top;
    const base = top - MARK_TALL * sy;
    raster.marks.forEach((glyph, k) => {
      const x = glyph.x * sx;
      if (x < -half || x > pw + half) return;
      ctx.beginPath();
      ctx.moveTo(x - half, base);
      ctx.lineTo(x + half, base);
      ctx.lineTo(x, tip);
      ctx.closePath();
      ctx.fill();
      const text = `+${glyph.bp.toLocaleString()}`;
      const textWidth = ctx.measureText(text).width;
      const next = raster.marks[k + 1];
      const room = (next ? next.x * sx - half : pw) - (x + half + 2 * sx);
      if (textWidth <= room) ctx.fillText(text, Math.round(x + half + 2 * sx), Math.round(base - 1 * sy));
    });
  }
}

/**
 * Calls `draw` once for each run of touching parts `keep` accepts, in
 * screen pixels and clipped to `[0, limit)`, every break between runs at
 * least a screen pixel wide: rounded to the screen, a break of a fraction
 * of a pixel closed, and a part of a fraction of one vanished.
 */
function eachRun(
  parts: RasterPart[],
  keep: (part: RasterPart) => boolean,
  sx: number,
  limit: number,
  draw: (from: number, to: number) => void,
) {
  let start = Infinity;
  let end = -Infinity;
  let held: [number, number] | null = null;
  const flush = (nextFrom: number | null) => {
    if (!held) return;
    let [a, b] = held;
    if (nextFrom !== null && b >= nextFrom) b = nextFrom - 1;
    a = Math.max(0, a);
    b = Math.min(limit, b);
    if (b > a) draw(a, b);
    held = null;
  };
  const close = () => {
    if (!(end > start)) return;
    const a = Math.round(start * sx);
    flush(a);
    held = [a, Math.max(a + 1, Math.round(end * sx))];
  };
  const kept = parts.filter((part) => keep(part) && part.right >= part.left).sort((a, b) => a.left - b.left);
  for (const part of kept) {
    if (part.left <= end + 1e-6 && part.right >= start) {
      start = Math.min(start, part.left);
      end = Math.max(end, part.right);
      continue;
    }
    close();
    start = part.left;
    end = part.right;
  }
  close();
  flush(null);
}

/** Arrows pointing left across a span, `<`, started from a multiple of
    their spacing so a run broken by a gap stays in step. */
function arrows(ctx: CanvasRenderingContext2D, from: number, to: number, top: number, height: number, sx: number) {
  const width = ARROW_WIDTH * sx;
  if (to - from < width) return;
  const step = ARROW_SEPARATION * sx;
  let first = Math.ceil(from / step) * step;
  if (first + width > to) first = (from + to - width) / 2;
  const tall = Math.min(height - 2 * sx, ARROW_HEIGHT * sx);
  const middle = top + height / 2;
  ctx.beginPath();
  for (let tip = first; tip + width <= to; tip += step) {
    ctx.moveTo(tip + width, middle - tall / 2);
    ctx.lineTo(tip, middle);
    ctx.lineTo(tip + width, middle + tall / 2);
  }
  ctx.stroke();
}

/** Diagonals across a span, clipped to it, started from a multiple of the
    pitch so two runs either side of a gap stay in step. */
function hatch(ctx: CanvasRenderingContext2D, from: number, to: number, top: number, height: number, pitch: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(from, top, to - from, height);
  ctx.clip();
  ctx.beginPath();
  const first = Math.floor((from - height) / pitch) * pitch;
  for (let x = first; x < to + height; x += pitch) {
    ctx.moveTo(x, top + height);
    ctx.lineTo(x + height, top);
  }
  ctx.stroke();
  ctx.restore();
}

export default memo(BarCanvas);
