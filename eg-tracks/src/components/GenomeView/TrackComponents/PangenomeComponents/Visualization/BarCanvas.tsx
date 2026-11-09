import { memo, useCallback, useLayoutEffect, useRef } from "react";
import type { BarHit, BarRaster, EndCap, MarkGlyph, RasterPart, WhiteRun } from "./barRaster";
import { capAt, hitAt, lettersAround, markAt, markLabel, ownOf, whiteAt } from "./barRaster";
import { GAP_MIN_PX } from "./barTiers";
import type { BarTiers } from "./barTiers";
import type { NodeLetters } from "./letters";
import { sequenceSize } from "./nodeDetail";
import { fitCanvas, useScreenSize } from "./canvasScreen";
import type { FittedCanvas } from "./canvasScreen";

/* ══════════════════════════════════════════════════════════════════════════
   One haplotype's bar, painted from its raster (barRaster.ts).

   The vocabulary is the alignment's (rowAlign.ts): the row's bar is plain
   where the haplotype reads what the reference reads, letters where it
   reads other bases over the same reference, hatched where it replaces a
   stretch with no base pairing claimed (its letters still spelled, in the
   hatched style), white with the size written in it where it skips
   reference, arrowed where it reads the reference on the other strand.
   Bases with no room on the reference are marks: a glyph above the bar at
   the point they go in, with "+n" when it fits, taking no room. Marks
   closer than a glyph's width share one, which names the largest and how
   many more ("+32.2 Kb & 2 more"). So the bar is the reference's length,
   like every other bar. Where the walk leaves the reference and never
   comes back, the bar stops at a cap, with "missing data" past it where it
   
   Painted, not drawn: one pass over the raster onto a canvas, and the
   pointer's x is the index into the raster, so a hover is a lookup and not
   a hit test. The canvas is sized to the screen's own pixels (canvasScreen).

   Zoomed out, below a pixel a base, the bar is painted from what
   barTiers.ts says it draws of its bins instead: the haplotype's colour,
   unbroken by gaps too small to see; a grey stripe across each bin with
   small variants where they are dense; each white gap at its true width,
   never widened; the big variants as themselves; a dark tick at each other
   small variant's base, on top of the gaps; and arrows over what is read
   on the other strand. No letters. And the pointer reads it by bins too:
   a variant drawn as itself keeps its own card, and anywhere else the
   pointer means the bin round it (zoomedOutTarget).
   ══════════════════════════════════════════════════════════════════════════ */

/** The band at the top of a row where the marks sit, above the bar. */
export const MARK_BAND = 12;
/** What the pointer is on. Zoomed out, `bin`: the bin round the pointer,
    from `from` to before `to` in reference bases, where it is on no
    variant drawn as itself. */
export type BarTarget =
  | { kind: "base"; part: RasterPart; offset: number; bp: number; zoom: NodeLetters | null; x: number; y: number; at: number }
  | { kind: "mark"; glyph: MarkGlyph; x: number; y: number; at: number }
  | { kind: "white"; white: WhiteRun; x: number; y: number; at: number }
  | { kind: "end"; cap: EndCap; x: number; y: number; at: number }
  | { kind: "bin"; from: number; to: number; x: number; y: number; at: number };

export interface BarCanvasProps {
  raster: BarRaster;
  /** The band, in pixels: the canvas is the whole of it. */
  width: number;
  height: number;
  /** The haplotype's colour. */
  color: string;
  /** Dimmed when another haplotype is the one being looked at. */
  dim: boolean;
  /** What the pointer is on as it moves over the bar: null where it is on
      nothing, and while a button is held. */
  onHover: (target: BarTarget | null) => void;
  /** What the hover says of the place clicked. */
  onPick: (target: BarTarget) => void;
  /** Zoomed out: what the bar draws of its bins (barTiers.ts), which it is
      painted from instead of part by part, and which the pointer reads.
      Every bar below a pixel a base has them and no other, so they are
      what says the bar is zoomed out: no letters or chips, and the pointer
      reads bins. */
  tiers?: BarTiers;
  /** Zoomed out: the bin a hover or a click at a point of the band reads,
      in reference bases (LinearView). */
  binAt?: (at: number) => { from: number; to: number } | null;
  /** The band's pixels in view when it was laid out, for a label that
      should sit where it can be seen. */
  view?: [number, number];
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
   AnnotationArrows draws a minus-strand query in genomealign. Zoomed out,
   each is stroked over a wider white one, so it shows on the darker greys
   too. */
const STRAND_INK = "rgba(0, 0, 0, 0.55)";
const STRAND_HALO = "#ffffff";
const STRAND_HALO_WIDTH = 3;
const ARROW_WIDTH = 5;
const ARROW_SEPARATION = 16;
const ARROW_HEIGHT = 13;
/* A mark: a small triangle pointing into the bar, and its size. A nested
   mark (rule D, nestedMarks.ts) is violet, its label in the monospace
   face so its chips line up with its letters. */
const MARK_INK = "#c2410c";
const MARK_HALF = 4;
const MARK_TALL = 7;
const MARK_FONT = 9;
export const NESTED_INK = "#7c3aed";
const NESTED_FONT = 10;
/** Room either side of a chip's letters, in pixels. */
const CHIP_PAD = 1;
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
/* A bar's end where the walk leaves the reference for good: a dark cap,
   and "missing data" past it in the deletion's grey, set in italics. */
const END_INK = "#374151";
const END_WIDTH = 2;
const END_TEXT = "missing data";
/** Zoomed out, the grey stripe of a bin with small variants, by its cell's
    class (barTiers.ts), 1 to 5: under 1, 1-3, 3-10, 10-30, and 30 or more
    small variants per kb. Fixed and neutral, the same on every lane, each
    at least 0.06 darker than the one before in OKLCH lightness. The
    darkest is a mid grey, well lighter than the ticks' black and the caps'
    ink, so a dense stretch is not read as missing data; the lightest is
    well darker than a white gap. Each differs from every pastel a lane can
    be given by at least ΔE 5 in OKLab (× 100), classes 4 and 5 by at least
    12 (claude-memory/testing/tools/drawCheck.mjs checks all of this). */
export const STRIPE_INKS: readonly string[] = ["#b7b7b7", "#a4a4a4", "#919191", "#7f7f7f", "#6d6d6d"];
/** Places closer than this, in screen pixels, are one: the axis's own
    arithmetic (a band 4,032 px wide comes out 4,031.9999999999986) must
    not move a label at the view's edge by a pixel, nor cut it. */
const SAME_PX = 1e-6;

function BarCanvas({
  raster,
  width,
  height,
  color,
  dim,
  onHover,
  onPick,
  tiers,
  binAt,
  view,
}: BarCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const nudge = useRef(0);
  const screen = useScreenSize(ref);
  const fitted = useRef<FittedCanvas | null>(null);

  const repaint = useCallback(() => {
    if (!fitted.current) return;
    paintBar(fitted.current, { raster, width, height, color, tiers, view });
  }, [raster, width, height, color, tiers, view]);

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
    if (tiers) return zoomedOutTarget(raster, tiers, binAt, { at, y, x, clientY });
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
    const cap = capAt(raster, at);
    if (cap) return { kind: "end", cap, x, y: clientY, at };
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
        const target = targetAt(event);
        if (target) onPick(target);
      }}
      onMouseMove={(event) => {
        /* A held button is a pan about to happen; between the press and
           the move the reader is not asking about what is under it. */
        if (event.buttons !== 0) {
          onHover(null);
          return;
        }
        onHover(targetAt(event));
      }}
      onMouseLeave={() => onHover(null)}
    />
  );
}

/**
 * What the pointer is on zoomed out, below a pixel a base, where a pixel
 * holds several bases and the part painted there is usually the match
 * after an SNV: about four SNVs in five could not be pointed at one by
 * one. So the pointer reads the bin round it (`binAt`), whose card lists
 * them. A variant drawn as itself keeps its own card, as at mid zoom,
 * checked in this order: a kept mark's glyph in the marks' band, a cap, a
 * white gap, a big deletion-insertion's hatching, and bases read on the
 * other strand too narrow for more than one arrow. Wider arrows give the
 * bin: its card lists the inversion, and what lies inside it can still be
 * pointed at. A bin holding none of the row's bases is nothing (binAt
 * gives null): no card on an empty stretch, as at mid zoom.
 */
function zoomedOutTarget(
  raster: BarRaster,
  tiers: BarTiers,
  binAt: BarCanvasProps["binAt"],
  { at, y, x, clientY }: { at: number; y: number; x: number; clientY: number },
): BarTarget | null {
  if (y < MARK_BAND + 2) {
    const glyph = markAt(raster, at);
    if (glyph) return { kind: "mark", glyph, x, y: clientY, at };
  }
  const cap = capAt(raster, at);
  if (cap) return { kind: "end", cap, x, y: clientY, at };
  const white = raster.whites.find((run) => pointedAt(run, at));
  if (white) return { kind: "white", white, x, y: clientY, at };
  const hit = ownPartAt(raster, tiers, at);
  if (hit) {
    const { part, offset, bp } = hit;
    return { kind: "base", part, offset, bp, zoom: lettersAround(raster, hit, LETTER_HALF), x, y: clientY, at };
  }
  const bin = binAt?.(at);
  return bin ? { kind: "bin", from: bin.from, to: bin.to, x, y: clientY, at } : null;
}

/** Whether the pointer is on a stretch of the bar: inside it, or within
    half a pixel of its middle, so one narrower than a pixel can still be
    pointed at. */
const pointedAt = ({ left, right }: { left: number; right: number }, at: number) => {
  const middle = (left + right) / 2;
  return at >= Math.min(left, middle - 0.5) && at < Math.max(right, middle + 0.5);
};

/** Zoomed out, the part drawn as a variant of its own under the pointer,
    other than a white or a mark: a big deletion-insertion's replaced
    bases, hatched, or what an arrow glyph stands for, the inverted span
    under it first. Null elsewhere. */
function ownPartAt(raster: BarRaster, tiers: BarTiers, at: number): BarHit | null {
  for (const big of tiers.big) {
    if (big.fill !== "hatch") continue;
    for (const index of big.parts) {
      const part = raster.parts[index];
      if (part?.kind === "replaced" && pointedAt(part, at)) return hitIn(part, at);
    }
  }
  for (const glyph of tiers.arrowGlyphs) {
    if (Math.abs(at - glyph.x) > ARROW_WIDTH / 2) continue;
    const under = raster.parts.filter(
      (part) => part.arrowed && roomy(part) && part.right >= glyph.left && part.left <= glyph.right,
    );
    const part = under.find((candidate) => candidate.kind === "inverted") ?? under[0];
    if (part) return hitIn(part, at);
  }
  return null;
}

/** A part's base at the pointer: the one its pixel shows, or the end
    nearer the pointer where the pointer is just past the part. */
function hitIn(part: RasterPart, at: number): BarHit {
  const perBase = part.right > part.left && part.len > 0 ? (part.right - part.left) / part.len : 1;
  const offset = Math.min(Math.max(0, part.len - 1), Math.max(0, Math.floor((at - part.left) / perBase)));
  return { part, offset, pixel: Math.round(at), bp: ownOf(part, offset) };
}

interface BarPaint {
  raster: BarRaster;
  width: number;
  height: number;
  color: string;
  tiers?: BarTiers;
  view?: [number, number];
}

/** The kinds that take room on the bar, and so are painted in its colour. */
const roomy = (part: RasterPart) =>
  part.kind === "match" || part.kind === "mismatch" || part.kind === "replaced" || part.kind === "inverted";

/** Where the bar is on its canvas, in screen pixels. */
interface BarBox {
  pw: number;
  sx: number;
  sy: number;
  top: number;
  tall: number;
}

/** One row's bar: its runs, the hatching, the arrows, the letters, the
    whites' sizes and the marks; zoomed out, from its tiers. */
function paintBar({ ctx, pw, ph, sx, sy }: FittedCanvas, paint: BarPaint) {
  const { raster, width, height, color, tiers, view } = paint;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, pw, ph);
  const toScreen = (x: number) => Math.round(x * sx);
  /* The bar under the marks' band, over the rule at the row's foot. */
  const top = Math.round(MARK_BAND * sy);
  const tall = Math.max(1, Math.round((height - MARK_BAND - 1) * sy));
  const clip = (a: number, b: number): [number, number] => [Math.max(0, a), Math.min(pw, b)];
  const box: BarBox = { pw, sx, sy, top, tall };

  /* Zoomed out, below a pixel a base, from its tiers; everything after
     this is a bar at a pixel a base or more. */
  if (tiers) {
    paintBins(ctx, raster, tiers, color, box);
    paintOver(ctx, raster, view, box);
    return;
  }

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

  /* The hatching: the replacements' bases. */
  ctx.strokeStyle = HATCH_INK;
  ctx.lineWidth = HATCH_WIDTH * sx;
  eachRun(
    raster.parts,
    (part) => part.kind === "replaced",
    sx,
    pw,
    (from, to) => hatch(ctx, from, to, top, tall, HATCH_PITCH * sx),
  );

  /* Arrows pointing left over what is read on the other strand: an
     inverted run. The parts inside it are drawn over its span and take no
     arrows of their own. */
  ctx.strokeStyle = STRAND_INK;
  ctx.lineWidth = Math.max(1, Math.round(sx));
  eachRun(raster.parts, (part) => part.arrowed && !part.inverted && roomy(part), sx, pw, (from, to) =>
    arrows(ctx, from, to, top, tall, sx),
  );

  /* The letters, where a base is wide enough for one: a mismatch's on a
     chip, a replacement's on the hatching. A mismatch keeps its chip
     where its letter would not fit - a dark tick a base wide, at mid
     zoom. Zoomed out a bar has neither: it was painted from its tiers. */
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
    const spell = size >= SEQUENCE_MIN_SIZE;
    if (!spell && part.kind !== "mismatch") continue;
    let advance = 0;
    let baseline = 0;
    let chipTop = Math.round(top + tall * 0.25);
    let chipBottom = Math.round(top + tall * 0.75);
    if (spell) {
      const fontPx = Math.floor(size * sy);
      ctx.font = `${fontPx}px ${MONO_STACK}`;
      advance = ctx.measureText(LETTER_SAMPLE).width / LETTER_SAMPLE.length;
      const above = inkAbove * fontPx;
      const below = inkBelow * fontPx;
      const margin = Math.max(sy, fontPx * CHIP_MARGIN);
      baseline = Math.round(top + tall / 2 + (above - below) / 2);
      chipTop = Math.max(top, Math.floor(baseline - above - margin));
      chipBottom = Math.min(top + tall, Math.ceil(baseline + below + margin));
    }
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
      if (spell) ctx.fillText(letter, Math.round((part.left + (i + 0.5) * perBase) * sx - advance / 2), baseline);
    }
  }

  paintOver(ctx, raster, view, box);
}

/** Whether a label, in screen pixels from where it starts to where it
    ends, is clear of the view's edges. A label is drawn whole inside the
    view or not at all: cut by the view's edge, "+21,909" lost its "+" and
    read as a coordinate. One wholly outside the view, in the band either
    side, is drawn, to be seen whole in a pan. */
function uncutBy(view: [number, number] | undefined, sx: number) {
  const edges = view ? [view[0] * sx, view[1] * sx] : [];
  return (from: number, to: number) => !edges.some((edge) => from < edge - SAME_PX && to > edge + SAME_PX);
}

/** What every bar draws over its runs, at every zoom: each drawn white's
    size where it fits, the marks' glyphs and the caps. */
function paintOver(
  ctx: CanvasRenderingContext2D,
  raster: BarRaster,
  view: [number, number] | undefined,
  { pw, sx, sy, top, tall }: BarBox,
) {
  const clip = (a: number, b: number): [number, number] => [Math.max(0, a), Math.min(pw, b)];
  const uncut = uncutBy(view, sx);

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
      let [from, to] = clip(white.left * sx, white.right * sx);
      const textWidth = ctx.measureText(white.text).width;
      if (textWidth + pad * 2 > to - from) continue;
      /* A white carries its size in what of it is in view, not in the
         whole of it, where it could be off screen: a white across the band
         in the middle of that, one running out of the band from where its
         junction is or, off screen, from the edge of the view. */
      if (view) {
        const a = Math.max(from, view[0] * sx);
        const b = Math.min(to, view[1] * sx);
        if (b - a >= textWidth + pad * 2) [from, to] = [a, b];
      }
      const x =
        white.open === null || white.open === "span"
          ? (from + to - textWidth) / 2
          : white.open === "right"
            ? from + pad
            : to - pad - textWidth;
      const at = Math.round(x);
      if (uncut(at, at + textWidth)) ctx.fillText(white.text, at, Math.round(top + tall / 2));
    }
  }

  /* The marks: a glyph each in the band above the bar, with its label
     (markLabel) to the right where the next glyph leaves room. */
  if (raster.marks.length) {
    const plainFont = `${Math.round(MARK_FONT * sy)}px ${SANS_STACK}`;
    const nestedFont = `600 ${Math.round(NESTED_FONT * sy)}px ${MONO_STACK}`;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    const half = MARK_HALF * sx;
    const tip = top;
    const base = top - MARK_TALL * sy;
    const pad = CHIP_PAD * sx;
    /* A chip's box round its letters: the ink's height in the nested
       font, a margin above and below, inside the marks' band. */
    ctx.font = nestedFont;
    const probe = ctx.measureText(LETTER_SAMPLE);
    const chipTop = Math.max(0, Math.floor(tip - 1 * sy - probe.actualBoundingBoxAscent - sy));
    const chipBottom = Math.min(tip, Math.ceil(tip - 1 * sy + probe.actualBoundingBoxDescent + sy));
    raster.marks.forEach((glyph, k) => {
      const x = glyph.x * sx;
      if (x < -half || x > pw + half) return;
      const ink = glyph.nested ? NESTED_INK : MARK_INK;
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.moveTo(x - half, base);
      ctx.lineTo(x + half, base);
      ctx.lineTo(x, tip);
      ctx.closePath();
      ctx.fill();
      ctx.font = glyph.nested ? nestedFont : plainFont;
      const next = raster.marks[k + 1];
      const room = (next ? next.x * sx - half : pw) - (x + half + 2 * sx);
      /* Beside the glyph, its foot on the bar: above the glyph it would
         run off the top of the canvas. The longest form that fits. */
      const at = Math.round(x + half + 2 * sx);
      const baseline = Math.round(tip - 1 * sy);
      const widthOf = (runs: typeof glyph.forms[number]) => runs.reduce((w, run) => w + ctx.measureText(run.text).width + (run.chip ? 2 * pad : 0), 0);
      /* The longest form that fits the room and is not cut by the view's
         edge; a shorter one where the longest would be. */
      const form = glyph.forms.find((runs) => widthOf(runs) <= room && uncut(at, at + widthOf(runs)));
      if (!form) return;
      const textWidth = widthOf(form);
      let cursor = at;
      for (const run of form) {
        const w = ctx.measureText(run.text).width;
        if (run.chip) {
          ctx.fillStyle = CHIP_INK;
          ctx.fillRect(Math.round(cursor), chipTop, Math.ceil(w + 2 * pad), chipBottom - chipTop);
          ctx.fillStyle = CHIP_LETTER;
          ctx.fillText(run.text, Math.round(cursor + pad), baseline);
          cursor += w + 2 * pad;
        } else {
          ctx.fillStyle = ink;
          ctx.fillText(run.text, Math.round(cursor), baseline);
          cursor += w;
        }
      }
    });
  }

  /* The bar's ends where the walk leaves the reference for good: a cap at
     the junction, a little proud of the bar, and "missing data" in the
     empty stretch past it where it fits. */
  if (raster.caps.length) {
    ctx.strokeStyle = END_INK;
    ctx.lineWidth = Math.max(1, Math.round(END_WIDTH * sx));
    ctx.font = `italic ${Math.round(DELETION_FONT * sy)}px ${SANS_STACK}`;
    ctx.fillStyle = DELETION_INK;
    ctx.textBaseline = "middle";
    const pad = DELETION_PAD * sx;
    const textWidth = ctx.measureText(END_TEXT).width;
    for (const cap of raster.caps) {
      const x = Math.round(cap.x * sx);
      if (x < -pad || x > pw + pad) continue;
      ctx.beginPath();
      ctx.moveTo(x, top - Math.round(2 * sy));
      ctx.lineTo(x, top + tall + Math.round(1 * sy));
      ctx.stroke();
      const room = (cap.side === "right" ? cap.right - cap.x : cap.x - cap.left) * sx;
      if (textWidth + 2 * pad > room) continue;
      const from = cap.side === "right" ? x + pad : x - pad - textWidth;
      if (!uncut(from, from + textWidth)) continue;
      ctx.textAlign = cap.side === "right" ? "left" : "right";
      ctx.fillText(END_TEXT, cap.side === "right" ? x + pad : x - pad, Math.round(top + tall / 2));
    }
  }
}

/**
 * A bar zoomed out, below a pixel a base, from what barTiers.ts says it
 * draws of its bins. In order: the haplotype's colour; the grey stripes;
 * the whites; the big deletion-insertions' hatching; the ticks and the big
 * variants' chips, on top of the whites and the hatching; the arrows.
 * Then, as at every zoom, the whites' sizes, the marks kept and the caps
 * (paintOver). Each is one pass over the parts or over the tiers.
 */
function paintBins(ctx: CanvasRenderingContext2D, raster: BarRaster, tiers: BarTiers, color: string, box: BarBox) {
  const { pw, sx, top, tall } = box;
  const clip = (a: number, b: number): [number, number] => [Math.max(0, a), Math.min(pw, b)];
  /* The bar's middle half, where mid zoom draws its chips. */
  const midTop = Math.round(top + tall * 0.25);
  const midTall = Math.round(top + tall * 0.75) - midTop;

  /* The haplotype's colour over its parts, joined across a gap narrower
     than a screen pixel, or than the 0.5 px a white needs to be drawn
     where that is wider (a screen of 3 pixels to the CSS pixel). So a
     white too small to see does not cut the bar, and one under a screen
     pixel is blended in below. */
  const filled: Array<[number, number]> = [];
  ctx.fillStyle = color;
  eachRun(
    raster.parts,
    roomy,
    sx,
    pw,
    (from, to) => {
      filled.push([from, to]);
      ctx.fillRect(from, top, to - from, tall);
    },
    Math.max(1, GAP_MIN_PX * sx),
  );

  /* The grey stripes, in the middle half and only where the bar is
     filled: one rect per run of bins of one class, its edges rounded once
     from the axis every bar shares, so they line up from lane to lane. */
  const stripes = tiers.stripes;
  let f = 0;
  for (let i = 0; i < stripes.length; ) {
    const cls = stripes[i].cls;
    let j = i + 1;
    while (j < stripes.length && stripes[j].cls === cls && stripes[j].left === stripes[j - 1].right) j++;
    const [a, b] = clip(Math.round(stripes[i].left * sx), Math.round(stripes[j - 1].right * sx));
    i = j;
    const ink = STRIPE_INKS[cls - 1];
    if (!ink || b <= a) continue;
    ctx.fillStyle = ink;
    while (f < filled.length && filled[f][1] <= a) f++;
    for (let k = f; k < filled.length && filled[k][0] < b; k++) {
      const from = Math.max(a, filled[k][0]);
      const to = Math.min(b, filled[k][1]);
      if (to > from) ctx.fillRect(from, midTop, to - from, midTall);
    }
  }

  /* White where the haplotype skips reference, at its true width and never
     widened. A screen pixel wide or more, it is cleared from its left edge
     to its right, each rounded once to the screen. Under a screen pixel,
     the one at its middle is taken toward white by as much of it as the
     white covers. A white too small to see is not drawn: the track's
     legend counts it. Cleared after the runs and the stripes, so a
     deletion inside an inverted span shows too. */
  const thin: Array<{ left: number; right: number }> = [];
  for (const white of tiers.whites) {
    if (!white.drawn) continue;
    if ((white.right - white.left) * sx < 1) {
      thin.push(white);
      continue;
    }
    const [a, b] = clip(Math.round(white.left * sx), Math.round(white.right * sx));
    if (b > a) ctx.clearRect(a, top, b - a, tall);
  }
  if (thin.length) {
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = CHIP_INK;
    for (const white of thin) {
      const x = Math.floor(((white.left + white.right) / 2) * sx);
      if (x < 0 || x >= pw) continue;
      ctx.globalAlpha = (white.right - white.left) * sx;
      ctx.fillRect(x, top, 1, tall);
    }
    ctx.restore();
  }

  /* The big deletion-insertions' replaced bases: hatched at any width, as
     at mid zoom, so one narrower than the pitch shows a stripe or two of
     it. Nothing else is hatched. */
  const hatched = new Set<number>();
  for (const big of tiers.big) {
    if (!big.fill) continue;
    for (const index of big.parts) if (raster.parts[index]?.kind === "replaced") hatched.add(index);
  }
  if (hatched.size) {
    ctx.strokeStyle = HATCH_INK;
    ctx.lineWidth = HATCH_WIDTH * sx;
    eachRun(raster.parts, (part) => hatched.has(part.index), sx, pw, (from, to) =>
      hatch(ctx, from, to, top, tall, HATCH_PITCH * sx),
    );
  }

  /* A small variant's tick: a CSS pixel of the chips' black at its own
     base, in the middle half, as mid zoom draws a mismatch. A big MNV's or
     deletion-insertion's mismatched bases keep their chips, each at least
     as wide. On top of the whites, so a small variant beside a gap stays
     seen, and of the hatching, as mid zoom paints its chips over it. */
  const tickWide = Math.max(1, Math.round(sx));
  ctx.fillStyle = CHIP_INK;
  for (const tick of tiers.ticks) {
    const x = Math.round(tick.x * sx);
    const [a, b] = clip(x, x + tickWide);
    if (b > a) ctx.fillRect(a, midTop, b - a, midTall);
  }
  for (const big of tiers.big) {
    if (big.kind !== "MNV" && big.kind !== "deletion-insertion") continue;
    for (const index of big.parts) {
      const part = raster.parts[index];
      if (part?.kind !== "mismatch") continue;
      const x = Math.round(part.left * sx);
      const [a, b] = clip(x, Math.max(x + tickWide, Math.round(part.right * sx)));
      if (b > a) ctx.fillRect(a, midTop, b - a, midTall);
    }
  }

  /* Arrows pointing left over what is read on the other strand: along each
     run 5 px or wider, and one arrow at the middle of a narrower run. Each
     is stroked white, then dark over it. */
  const strand = (draw: () => void) => {
    ctx.strokeStyle = STRAND_HALO;
    ctx.lineWidth = STRAND_HALO_WIDTH * Math.max(1, Math.round(sx));
    draw();
    ctx.strokeStyle = STRAND_INK;
    ctx.lineWidth = Math.max(1, Math.round(sx));
    draw();
  };
  for (const run of tiers.arrowRuns) strand(() => arrows(ctx, run.left * sx, run.right * sx, top, tall, sx));
  for (const glyph of tiers.arrowGlyphs) strand(() => arrow(ctx, glyph.x * sx, top, tall, sx));
}

/**
 * Calls `draw` once for each run of touching parts `keep` accepts, in
 * screen pixels and clipped to `[0, limit)`, every break between runs at
 * least a screen pixel wide: rounded to the screen, a break of a fraction
 * of a pixel closed, and a part of a fraction of one vanished. Parts less
 * than `joinBelow` screen pixels apart are one run; by default only parts
 * that touch.
 */
function eachRun(
  parts: RasterPart[],
  keep: (part: RasterPart) => boolean,
  sx: number,
  limit: number,
  draw: (from: number, to: number) => void,
  joinBelow = 0,
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
    if ((part.left <= end + 1e-6 || (part.left - end) * sx < joinBelow) && part.right >= start) {
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

/** One arrow pointing left, `<`, centred on `x`: what is read on the other
    strand where it is too narrow for arrows along it. */
function arrow(ctx: CanvasRenderingContext2D, x: number, top: number, height: number, sx: number) {
  const width = ARROW_WIDTH * sx;
  const tall = Math.min(height - 2 * sx, ARROW_HEIGHT * sx);
  const middle = top + height / 2;
  ctx.beginPath();
  ctx.moveTo(x + width / 2, middle - tall / 2);
  ctx.lineTo(x - width / 2, middle);
  ctx.lineTo(x + width / 2, middle + tall / 2);
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
