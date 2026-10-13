import { memo, useCallback, useLayoutEffect, useRef } from "react";
import type { LaneRaster, RasterNode } from "./laneRaster";
import { cardAt, laneLetters } from "./laneRaster";
import { sequenceSize } from "./nodeDetail";
import { fitCanvas, useScreenSize } from "./canvasScreen";
import type { FittedCanvas } from "./canvasScreen";

/* ══════════════════════════════════════════════════════════════════════════
   One haplotype's bar, drawn on a canvas.

   A bar used to be one SVG rect per run, plus a hatch rect over each diverging
   stretch, plus a box and a letter per allele - eight thousand elements across
   ten haplotypes in a busy window with context, and most of the drawing. None
   of them were interesting on their own: the bar is a strip of colour with
   some of it marked, and the letters are text.

   So it is painted instead, from the pixel array in laneRaster. One pass, and
   nothing left behind for the browser to keep track of. What is lost is the
   hit testing that came free with the elements - and what replaces it is
   simpler: the pointer's x *is* the index into the array, which is how
   eg-tracks' density tracks answer the same question.
   ══════════════════════════════════════════════════════════════════════════ */

export interface LaneCanvasProps {
  raster: LaneRaster;
  /** The band, in pixels: the canvas is the whole of it. */
  width: number;
  height: number;
  /** What one card of a stack gets, top to top: the bar's own row. */
  rowH: number;
  /** The haplotype's colour. */
  color: string;
  contig: string;
  /**
   * The reference's own lane. It spells out every base it carries, since
   * every one of them is the reference's: the rules the other lanes are
   * drawn by - matching stays plain, a copy is coloured - would leave it
   * blank.
   */
  isReference: boolean;
  /**
   * Whether the reference's bar is the one spelling the sequence out. It
   * is while the alleles button is on; with it off the graph strip is
   * back under the ruler and says the same thing, so the bar stays plain
   * rather than saying it twice.
   */
  spellReference: boolean;
  /** Dimmed when another haplotype is the one being looked at. */
  dim: boolean;
  /**
   * The nodes of the route picked in the graph, if one is. A bar's own
   * stretches on it are drawn in the selection colour: a route runs through
   * whichever rows of a bar its stretches were threaded into, so it cannot
   * be shown by lighting a row.
   */
  route?: ReadonlySet<string>;

  onHover: (hover: LaneHover | null) => void;
  /** The node under the pointer, when the bar is clicked. */
  onPick: (id: string) => void;
  /**
   * Zoomed out, the bar is read a section at a time and only on a click:
   * given this, a click reports where it landed instead of picking a node,
   * and moving over the bar says nothing.
   */
  /* Where along the band it was clicked, and where on the screen - for a
     card opened at the pointer. */
  onPress?: (at: { x: number; clientX: number; clientY: number }) => void;
  /** Where the pointer is over the bar in that mode, or null once it
      leaves - for outlining the section it would open. */
  onPoint?: (x: number | null) => void;
  /**
   * Zoomed out, the stretches of the band read as one; see SECTION_PX in
   * LinearPathView. Given these, a section where this haplotype is off the
   * reference anywhere is hatched across all of it, in line with the
   * strip's sections, rather than in slivers a pixel wide.
   */
  sections?: ReadonlyArray<{ left: number; right: number }>;
  /** A section is hatched only where more than this many bases of the
      haplotype's own there are off the reference. */
  sectionAltBp?: number;
}

export interface LaneHover {
  /** Where the pointer is, on screen. */
  x: number;
  y: number;
  title: string;
  lines: string[];
  /** The node under it, for whoever wants to draw to it. */
  nodeId: string;
  /**
   * Where that visit is drawn: the band's own pixels and which row of the
   * bar. The visit rather than the node, since a haplotype can read the
   * same allele in two places and the pointer is on one of them.
   */
  box: { left: number; right: number; card: number };
  /** The letters of the node under the pointer, for the tooltip. */
  zoom: {
    letters: string[];
    at: number;
    /** How many bases the pointer's pixel covers; see `NodeLetters`. */
    span: number;
    from: number;
    to: number;
    /** The coordinates of the marked bases. */
    markFrom: number;
    markTo: number;
    clippedLeft: boolean;
    clippedRight: boolean;
    length: number;
  } | null;
}

/** How many bases of the haplotype the tooltip shows either side of what
    the pointer covers. The letters read across node boundaries, so this is
    a window on the sequence rather than on the node; see `laneLetters`. */
const LETTER_HALF = 48;

/* The bar, the hatching over a diverging stretch, and the letters. Taken from
   the stylesheet's values rather than read back out of it: a canvas has no
   cascade to ask. */
const HATCH_INK = "#ffffff";
/** Both in CSS pixels, scaled to the screen's with everything else. */
const HATCH_PITCH = 6;
const HATCH_WIDTH = 1.5;
const CHIP_INK = "#000000";
/* A stretch on the picked route, in the same blue the graph above draws it
   in - see `.pgv-node-route`. */
const ROUTE_INK = "#007aff";

/** The most of a row's height a letter may take, leaving the chip around it
    inside the row. */
const LETTER_OF_ROW = 0.7;
/** Below this a letter is a smudge, so the node draws none. A run of them
    with no room to be spelled is left to the hatching: a block of ink with
    no letters in it says a stretch diverges, which the hatching already
    said. */
const SEQUENCE_MIN_SIZE = 4;
const MONO_STACK =
  'ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", monospace';
const LETTER_INK = "#ffffff";
const DIM_ALPHA = 0.3;
/** Margin between a letter's ink and the top and bottom of its chip, as a
    share of the font size. */
const CHIP_MARGIN = 0.14;
/** The letters whose ink a chip is sized to hold. */
const LETTER_SAMPLE = "ACGTN";
/** The size the ink is measured at, then scaled from. */
const INK_PROBE_SIZE = 100;

function LaneCanvas({
  raster,
  width,
  height,
  rowH,
  color,
  contig,
  isReference,
  spellReference,
  dim,
  route,
  onHover,
  onPick,
  onPress,
  onPoint,
  sections,
  sectionAltBp = 0,
}: LaneCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  /** How far the canvas is shifted to sit on whole screen pixels. */
  const nudge = useRef(0);

  /* How many screen pixels the canvas covers; see canvasScreen.ts. */
  const screen = useScreenSize(ref);

  /* What is on the canvas now, so a repaint costs no measuring of the page. */
  const fitted = useRef<FittedCanvas | null>(null);

  const repaint = useCallback(() => {
    if (!fitted.current) return;
    paintLane(fitted.current, {
      raster,
      width,
      rowH,
      color,
      isReference,
      spellReference,
      route,
      sections,
      sectionAltBp,
    });
  }, [
    raster,
    width,
    rowH,
    color,
    isReference,
    spellReference,
    route,
    sections,
    sectionAltBp,
  ]);

  /* What the canvas was last painted with. The observer reports the screen's
     exact size a moment after the first paint, and that is nearly always the
     size the first paint guessed: painting every bar again for it was a
     second full drawing of the band after it was already on screen - the
     pause after a busy window appears. Only a new size, which clears the
     canvas, or something new to draw repaints. */
  const painted = useRef<{
    repaint: () => void;
    pw: number;
    ph: number;
  } | null>(null);

  /* Before the browser paints: a new region's ruler and reference strip
     reach the screen in the same frame as its bars, rather than over a
     frame of the last region's bars still on the canvas. */
  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas || width <= 0 || height <= 0) return;
    /* Sized to the screen's own pixels and lined up with them; see
       canvasScreen.ts. */
    const ready = fitCanvas(canvas, width, height, screen, nudge);
    if (!ready) return;
    fitted.current = ready;
    const last = painted.current;
    if (
      last &&
      last.repaint === repaint &&
      last.pw === ready.pw &&
      last.ph === ready.ph
    ) {
      return;
    }
    repaint();
    painted.current = { repaint, pw: ready.pw, ph: ready.ph };
  }, [repaint, screen, width, height]);


  return (
    <canvas
      ref={ref}
      className="pgv-lane-canvas"
      /* Sized in CSS here, so the observer has a box to measure before the
         first paint; dimmed as a whole, so a dim is a style change and not a
         repaint. */
      style={{ width, height, opacity: dim ? DIM_ALPHA : 1 }}
      /* The same question the hover asks, answered on a click: which node
         is under the pointer. A route can then be picked from the
         haplotype reading it, which is where a reader is looking. */
      onClick={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        if (onPress) {
          onPress({
            x: event.clientX - box.left,
            clientX: event.clientX,
            clientY: event.clientY,
          });
          return;
        }
        const rows = Math.max(1, Math.round(height / rowH));
        const row = Math.max(0, Math.floor((event.clientY - box.top) / rowH));
        const shared = !isReference && row >= rows - 1;
        const hit = cardAt(raster, event.clientX - box.left, shared ? 0 : row);
        if (hit) onPick(hit.node.id);
      }}
      onMouseMove={(event) => {
        /* A held button is a pan about to happen, and the pan itself stops
           the events reaching here at all. Between the two - pressed, not
           yet moved - the reader is not asking about whatever the pointer
           came to rest on. */
        if (event.buttons !== 0 || onPress) {
          onHover(null);
          if (onPress) {
            onPoint?.(
              event.buttons !== 0
                ? null
                : event.clientX - event.currentTarget.getBoundingClientRect().left,
            );
          }
          return;
        }
        const box = event.currentTarget.getBoundingClientRect();
        const at = event.clientX - box.left;
        /* Each card has a row of the bar, and answers for itself: the same
           pixels, but its own stretch of the haplotype. */
        const row = Math.max(0, Math.floor((event.clientY - box.top) / rowH));
        const hit = cardAt(raster, at, row);
        if (!hit) {
          onHover(null);
          return;
        }
        const zoom = laneLetters(raster, hit, LETTER_HALF);
        onHover({
          x: event.clientX,
          y: event.clientY,
          nodeId: hit.node.id,
          box: {
            left: hit.node.left,
            right: hit.node.right,
            card: hit.node.card,
          },
          /* No name: the bar is already labelled down the side of the
             view, so the row said what the reader could see. */
          title: "",
          lines: [
            `${hit.bp.toLocaleString()} on ${contig}`,
            `node ${hit.node.id}, ${hit.node.length} bp`,
            hit.alt ? "off the reference walk" : "on the reference walk",
            /* Which of the visits to this place this one is, counted down
               the bar - not its row, since the rows of a bar are threads of
               the haplotype and a place is not always visited on the first
               of them. */
            ...(hit.node.stack > 1
              ? [
                  `copy ${
                    (raster.stacks[hit.node.group]?.indexOf(hit.index) ?? 0) +
                    1
                  } of ${hit.node.stack} drawn here`,
                ]
              : []),
          ],
          zoom,
        });
      }}
      onMouseLeave={() => {
        onHover(null);
        onPoint?.(null);
      }}
    />
  );
}


interface LanePaint {
  raster: LaneRaster;
  width: number;
  /** What one card of a stack gets, top to top. */
  rowH: number;
  color: string;
  /** See `LaneCanvasProps` for these two. */
  isReference: boolean;
  spellReference: boolean;
  /** See `LaneCanvasProps`. */
  route?: ReadonlySet<string>;
  /** See `LaneCanvasProps` for these two. */
  sections?: ReadonlyArray<{ left: number; right: number }>;
  sectionAltBp?: number;
}

/** One haplotype's bar: its ground, its runs, the hatching and the letters. */
function paintLane(
  { ctx, pw, ph, sx, sy }: FittedCanvas,
  {
    raster,
    width,
    rowH,
    color,
    isReference,
    spellReference,
    route,
    sections,
    sectionAltBp = 0,
  }: LanePaint,
) {
  {

    /* Drawn in the canvas's own pixels, which are now the screen's, rather
       than under a scale. Every edge is rounded to a whole pixel and comes out
       sharp: under a scale, a CSS pixel's edge at 125% lands a quarter of the
       way into a screen pixel and is smeared across two. */
    const toScreen = (x: number) => Math.round(x * sx);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    /* Cleared, not grounded: a wash the width of the bar reads as a
       stretch of something, and where the haplotype is not in the window
       there is nothing. What separates one bar from the next is the rule
       under it. */
    ctx.clearRect(0, 0, pw, ph);

    /* The bar itself, from the nodes' own edges rather than from the raster.
       The raster has an entry per CSS pixel, and a screen with two or three
       pixels to each of those can place an edge that much more finely. One
       fillRect per run of touching nodes rather than per node.

       A row at a time, because a row is a thread of the haplotype and not
       all of them run the width of the window: painting the whole height
       of the bar wherever any row had something put a solid block under
       the three rows that were empty there.

       Every break the haplotype has is left open, however narrow: zoomed
       out a base is a fraction of a pixel, and the tracks drawn along the
       bar break wherever it has no bases, so the bar shows each of those
       too - at least a screen pixel wide, so it can be seen. Nodes that
       touch are one run, however narrow each is. The reference's strip
       shows its own gaps the same way; see LinearPathView. */
    const band = rowH * sy;
    const rowBands: Array<{ top: number; tall: number }> = [];
    for (let r = 0; r < raster.rows; r++) {
      const top = r * band;
      const tall = Math.min(ph - top, band);
      if (tall <= 0) break;
      rowBands.push({ top, tall });
    }

    /* Twice over where a route is picked: what is on it in the selection
       colour, the rest in the haplotype's own. A run is joined from
       touching nodes, so asking separately keeps the two apart. */
    const onRoute = (node: RasterNode) => route?.has(node.id) ?? false;
    rowBands.forEach(({ top, tall }, r) => {
      ctx.fillStyle = color;
      eachRunKeepingGaps(
        raster.nodes,
        (node) => node.card === r && !onRoute(node),
        sx,
        pw,
        (from, to) => ctx.fillRect(from, top, to - from, tall),
      );
      if (!route) return;
      ctx.fillStyle = ROUTE_INK;
      eachRun(
        raster.nodes,
        (node) => node.card === r && onRoute(node),
        toScreen,
        pw,
        (from, to) => ctx.fillRect(from, top, to - from, tall),
      );
    });

    /* Every base a visit carries is spelled out. */
    const spells = (node: RasterNode, i: number) =>
      !!node.sequence.charAt(i);

    /* The diverging stretches, hatched. The diagonals are drawn across the
       whole run and clipped to it, so they line up with their neighbours
       instead of restarting at every boundary. */
    ctx.strokeStyle = HATCH_INK;
    ctx.lineWidth = HATCH_WIDTH * sx;
    if (sections?.length) {
      /* Zoomed out: a section of a row is hatched across all the bar it
         has there where more than `sectionAltBp` of its bases are off the
         reference, so the marks line up with the strip's sections above and
         a scatter of SNPs does not hatch the whole bar. A visit belongs to
         the section its middle is in, as the strip's nodes do. */
      const marks = new Map<number, { from: number; to: number; alt: number }>();
      for (const node of raster.nodes) {
        if (!(node.right > node.left)) continue;
        const middle = (node.left + node.right) / 2;
        let lo = 0;
        let hi = sections.length - 1;
        while (lo < hi) {
          const mid = (lo + hi + 1) >> 1;
          if (sections[mid].left <= middle) lo = mid;
          else hi = mid - 1;
        }
        const section = sections[lo];
        if (section.left > middle) continue;
        const key = node.card * sections.length + lo;
        const mark = marks.get(key);
        if (!mark) {
          marks.set(key, {
            from: Math.max(section.left, node.left),
            to: Math.min(section.right, node.right),
            alt: node.onReference ? 0 : node.length,
          });
          continue;
        }
        mark.from = Math.min(mark.from, Math.max(section.left, node.left));
        mark.to = Math.max(mark.to, Math.min(section.right, node.right));
        if (!node.onReference) mark.alt += node.length;
      }
      for (const [key, mark] of marks) {
        if (!(mark.alt > 0 && mark.alt > sectionAltBp)) continue;
        const band = rowBands[Math.floor(key / sections.length)];
        if (!band) continue;
        const from = Math.max(0, toScreen(mark.from));
        const to = Math.min(pw, toScreen(mark.to));
        if (to > from) {
          hatch(ctx, from, to, band.top, band.tall, HATCH_PITCH * sx);
        }
      }
    } else {
      rowBands.forEach(({ top, tall }, r) =>
        eachRun(
          raster.nodes,
          (node) => !node.onReference && node.card === r,
          toScreen,
          pw,
          (from, to) => hatch(ctx, from, to, top, tall, HATCH_PITCH * sx),
        ),
      );
    }

    /* The letters, wherever a visit has something the reference strip does
       not already say:

         - an allele that diverges from the reference, which the hatching
           marks as well; and
         - a visit that shares its place with another visit of the same
           haplotype. That is a copy of a stretch from elsewhere in its own
           sequence, usually brought in by a higher context, and its own
           coordinates are not the ones it is drawn at - so even where it
           matches the reference it is worth reading, and a blank card in a
           stack cannot be told from its neighbour.

       A single visit that agrees with the reference stays plain: the strip
       under the ruler is already its sequence. So does the reference's own
       lane, for the same reason.

       Whether there is room is asked of each node rather than of the zoom. The
       axis bends where a site is wider than the reference allele, so two nodes
       at one zoom do not get the same room per base; a node that cannot fit a
       legible letter draws none, and the tooltip carries them instead.

       Walked by node, not by pixel: a letter belongs to a base.

       Where a haplotype walks two nodes the layout puts in one place - its
       own second copy of a stretch - the visits are laid out as cards down
       the bar rather than over each other: the last walked in front, whose
       pixels the bar itself shows, and the others behind it with their
       letters still showing. The pointer brings the one behind to the
       front. */
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    /* How far the letters' ink reaches above and below the baseline, per px
       of font size. Measured rather than taken from the font size: the em box
       is not centred on a capital, so a chip sized from it clipped the tops
       of the letters. Measured once, since the ink scales with the size. */
    ctx.font = `${INK_PROBE_SIZE}px ${MONO_STACK}`;
    const probe = ctx.measureText(LETTER_SAMPLE);
    const inkAbove = probe.actualBoundingBoxAscent / INK_PROBE_SIZE;
    const inkBelow = probe.actualBoundingBoxDescent / INK_PROBE_SIZE;

    /* Measured before any are drawn: a stack is laid out by its tallest
       card, so every card has to be known first. */
    interface Card {
      node: RasterNode;
      fontPx: number;
      advance: number;
      above: number;
      below: number;
      margin: number;
      height: number;
    }
    const cards: Card[] = [];
    const spelling = isReference ? spellReference : true;
    for (const node of spelling ? raster.nodes : []) {
      if (node.length <= 0) continue;
      /* The reference spells out everything it carries. In any other lane,
         matching the reference is plain - the visit in place of a stack
         included - unless it is a copy from elsewhere in the haplotype,
         whose own coordinates are not the ones it is drawn at. */
      if (!isReference && node.onReference && node.copyFrom === 0) {
        continue;
      }
      if (node.right <= 0 || node.left >= width) continue;
      const perBase = (node.right - node.left) / node.length;
      /* As big as the base is wide, but no taller than the row it is drawn
         in has room for: the chip around a letter is a little over the
         letter itself, and a row shorter than that clipped the tops and
         feet off. */
      const size = Math.min(sequenceSize(perBase), rowH * LETTER_OF_ROW);
      if (size < SEQUENCE_MIN_SIZE) continue;
      /* A whole number of screen pixels, rounded down so a letter never
         outgrows its base: a font's hinting only lines its stems up with the
         pixels at a whole size. */
      const fontPx = Math.floor(size * sy);
      ctx.font = `${fontPx}px ${MONO_STACK}`;
      const advance =
        ctx.measureText(LETTER_SAMPLE).width / LETTER_SAMPLE.length;
      const above = inkAbove * fontPx;
      const below = inkBelow * fontPx;
      const margin = Math.max(sy, fontPx * CHIP_MARGIN);
      cards.push({
        node,
        fontPx,
        advance,
        above,
        below,
        margin,
        height: above + below + margin * 2,
      });
    }

    /* Each card has a row of the bar to itself, the one in front in the
       top row - where a visit with nothing stacked on it sits, so nothing
       moves for having a card behind it. A row keeps its place under the
       pointer: the hover says what is there without shifting it. */
    const row = rowH * sy;
    const shiftOf = (node: RasterNode) => node.card * row;

    /* Back to front, so the card in front is drawn over the rest. */
    const order = cards
      .map((card) => ({ card, shift: shiftOf(card.node) }))
      .sort((a, b) => b.shift - a.shift);

    for (const { card, shift } of order) {
      const { node, fontPx, advance, above, below, margin } = card;
      ctx.font = `${fontPx}px ${MONO_STACK}`;
      const perBase = (node.right - node.left) / node.length;
      /* The ink centred in the lane on a whole-pixel baseline, its card's
         own shift added, and the chip around it kept inside the lane. */
      const baseline = Math.round(row / 2 + (above - below) / 2 + shift);
      const chipTop = Math.max(0, Math.floor(baseline - above - margin));
      const chipBottom = Math.min(ph, Math.ceil(baseline + below + margin));

      /* Each chip runs between its base's edges, rounded the same way the
         bar's are, so the first and last meet the bar's edges exactly. */
      const first = Math.max(0, Math.floor(-node.left / perBase));
      const last = Math.min(
        node.length,
        Math.ceil((width - node.left) / perBase),
      );

      for (let i = first; i < last; i++) {
        if (!spells(node, i)) continue;
        const letter = node.sequence.charAt(i);
        const a = toScreen(node.left + i * perBase);
        const inner = i < node.length - 1;
        const b = inner
          ? toScreen(node.left + (i + 1) * perBase)
          : toScreen(node.right);
        if (b <= a) continue;
        /* Chip to chip with no pixel between them: a run of alleles is one
           black stretch with the letters in it, the way a sequence reads,
           rather than a row of separate boxes. */
        ctx.fillStyle = CHIP_INK;
        ctx.fillRect(a, chipTop, b - a, chipBottom - chipTop);
        ctx.fillStyle = LETTER_INK;
        /* From a whole pixel, rather than centred on a fractional one. */
        ctx.fillText(
          letter,
          Math.round((node.left + (i + 0.5) * perBase) * sx - advance / 2),
          baseline,
        );
      }
    }
  }
}


/**
 * Calls `draw` once for each run of touching nodes that `keep` accepts, in
 * screen pixels and clipped to `[0, limit)`. Nodes are joined while each
 * starts inside the run so far, which the lane's own order gives for a
 * haplotype moving along the axis; one that jumps back starts a run of its
 * own.
 */
function eachRun(
  nodes: LaneRaster["nodes"],
  keep: (node: LaneRaster["nodes"][number]) => boolean,
  toScreen: (x: number) => number,
  limit: number,
  draw: (from: number, to: number) => void,
  /* A break up to this wide, in screen pixels, joins the runs either side. */
  bridge = 0,
) {
  let from = 0;
  let to = -1;
  for (const node of nodes) {
    if (!keep(node)) continue;
    const a = Math.max(0, toScreen(node.left));
    const b = Math.min(limit, toScreen(node.right));
    if (b <= a) continue;
    if (to >= from && a >= from && a <= to + bridge) {
      to = Math.max(to, b);
      continue;
    }
    if (to > from) draw(from, to);
    from = a;
    to = b;
  }
  if (to > from) draw(from, to);
}

/**
 * The bar's runs, from the nodes' exact edges rather than rounded ones:
 * nodes that touch are one run, however narrow each is, and any break
 * between two runs is drawn at least a screen pixel wide - rounded to the
 * screen, a break of a fraction of a pixel closed, and a node of a fraction
 * of one vanished and opened a break that is not there.
 */
function eachRunKeepingGaps(
  nodes: LaneRaster["nodes"],
  keep: (node: LaneRaster["nodes"][number]) => boolean,
  sx: number,
  limit: number,
  draw: (from: number, to: number) => void,
) {
  /* The run being gathered, in CSS pixels. */
  let start = Infinity;
  let end = -Infinity;
  /* The last run, in screen pixels, held until the next one says how
     close it comes. */
  let held: [number, number] | null = null;
  const flush = (nextFrom: number | null) => {
    if (!held) return;
    let [a, b] = held;
    /* A break of under a pixel would round away: open it by one. */
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
  for (const node of nodes) {
    if (!keep(node) || !(node.right >= node.left)) continue;
    if (node.left <= end + 1e-6 && node.right >= start) {
      start = Math.min(start, node.left);
      end = Math.max(end, node.right);
      continue;
    }
    close();
    start = node.left;
    end = node.right;
  }
  close();
  flush(null);
}

/** Diagonals across a span, clipped to it. */
function hatch(
  ctx: CanvasRenderingContext2D,
  from: number,
  to: number,
  top: number,
  height: number,
  pitch: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(from, top, to - from, height);
  ctx.clip();
  ctx.beginPath();
  /* Started from a multiple of the pitch rather than from the run, so two
     runs either side of a gap stay in step. */
  const first = Math.floor((from - height) / pitch) * pitch;
  for (let x = first; x < to + height; x += pitch) {
    ctx.moveTo(x, top + height);
    ctx.lineTo(x + height, top);
  }
  ctx.stroke();
  ctx.restore();
}

export default memo(LaneCanvas);
