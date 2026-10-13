import type { Lane, PangenomeModel } from "./pangenomeModel";

/* ══════════════════════════════════════════════════════════════════════════
   One haplotype's bar, as an array with one entry per pixel.

   This is the arrangement eg-tracks uses for its density tracks: the data is
   reduced once to a value per pixel of the band - `xToValueMaker` there - and
   everything afterwards reads that array. Drawing walks it, and a hover
   indexes it straight with the pointer's own x, the way
   `getHoverTooltip.numerical` does with `data[Math.round(relativeX)]`.

   Two reasons it is worth building here rather than drawing from the walk.

   A bar drawn from its nodes needs one element per node, and a busy window
   with context has eight thousand of them across ten haplotypes - which was
   most of the drawing. A bar drawn from this is one pass over a few thousand
   array entries onto a canvas, and leaves nothing behind.

   And a hover no longer has to be a hit test. There is nothing to hit: the
   pointer's x is the index, so what is under it is known without the browser
   keeping a box for every node to find it by.
   ══════════════════════════════════════════════════════════════════════════ */

/** What one pixel of a lane holds. -1 in `node` means the lane is absent. */
export interface LaneRaster {
  key: string;
  /**
   * How many rows the bar has; see `laneRows`.
   *
   * The four arrays below hold one row after another, so the pixel `x` of
   * row `r` is at `r * width + x`. One array each rather than one per row:
   * a bar is read a pixel at a time and this is one allocation, not four a
   * row.
   */
  rows: number;
  /** Index into `nodes`, or -1 where this row of the bar is empty. */
  node: Int32Array;
  /** Which base of that node, so a pixel knows its own letter. */
  base: Int32Array;
  /** 1 where the haplotype is off the reference walk. */
  alt: Uint8Array;
  /** The haplotype's own coordinate at this pixel. */
  bp: Float64Array;
  /** The nodes referred to by `node`, in the order the lane visits them. */
  nodes: RasterNode[];
  /** Visits drawn in the same place as each other, as indices into `nodes`,
      the one in front first. */
  stacks: number[][];
  /** How many pixels wide the band is, so a caller can bound its reads. */
  width: number;
}

export interface RasterNode {
  id: string;
  sequence: string;
  length: number;
  onReference: boolean;
  /** Where it starts in the haplotype's own coordinates. */
  start: number;
  /* The pixels it is drawn between. Kept so the letters can be laid out by
     walking the nodes rather than the band: a letter belongs to a base, and
     whether there is room for one is a question about this node and not about
     the zoom - the axis bends, so two nodes at the same zoom do not always
     get the same room per base. */
  left: number;
  right: number;
  /* Where a haplotype walks two nodes the layout puts in one place - its
     own second copy of a stretch - their letters would land on each other.
     These say which stack a visit is in and where in it, so the drawing can
     lay them out as cards. */
  /** Its place in its stack: 0 in front. */
  card: number;
  /** How many visits share its pixels, itself included. */
  stack: number;
  /** Which stack, or -1 when it is drawn on its own. */
  group: number;
  /**
   * The reference's allele at this visit's place - the reference walk's node
   * in the same column - or null where the reference has nothing there.
   *
   * Every node in a column starts at the column's left edge, so base i of
   * this visit is drawn at the same x as base i of the reference's allele.
   * That is what makes comparing them letter by letter mean "the same
   * spot", and lets a lane hide the letters it shares with the reference.
   */
  refSequence: string | null;
  /**
   * Where this visit really sits in its haplotype, against where the view
   * draws it. A stack is one haplotype reaching one place more than once;
   * one of those visits is the haplotype in place and the rest are copies
   * of the stretch from elsewhere in it - usually brought in by a higher
   * context. For a copy this is 1 when it comes from further along the
   * haplotype and -1 when it comes from earlier. It is 0 for the visit in
   * place, and for any visit drawn on its own.
   */
  copyFrom: -1 | 0 | 1;
}

/* The reference's allele in each column, worked out once per model rather
   than once per lane. There is at most one: the reference walk's levels
   strictly increase, so it never visits a column twice. */
const referenceByModel = new WeakMap<PangenomeModel, Map<number, string>>();

function referenceAlleles(model: PangenomeModel): Map<number, string> {
  let byColumn = referenceByModel.get(model);
  if (!byColumn) {
    byColumn = new Map();
    for (const node of model.nodeById.values()) {
      if (node.onReference) byColumn.set(node.column, node.sequence);
    }
    referenceByModel.set(model, byColumn);
  }
  return byColumn;
}

/**
 * Reduce a lane's walk to one entry per pixel of the band.
 *
 * A node covers the pixels its bases are drawn at, which is the axis's own
 * mapping - the same `px` the ruler and the graph are placed by, so the bar
 * cannot drift from either. Where a base is narrower than a pixel the last
 * one to be written wins, which is the same thing the eye sees; where it is
 * wider than a pixel the run is filled.
 */
export function rasteriseLane(
  lane: Lane,
  model: PangenomeModel,
  /* Where a place along the layout is drawn - the axis's own mapping, so
     the bar cannot drift from the ruler or the graph. Taken as the function
     rather than the axis, because a drawing with no band to fit still has
     one of these. */
  px: (graphX: number) => number,
  width: number,
  /* Where each node is drawn, when the caller has it already: a node is in
     the same place in every lane, so rasterising them all asks once per
     node rather than twice per visit - see `rasteriseLanes`. */
  placed?: Map<string, { left: number; right: number }>,
): LaneRaster {
  const w = Math.max(0, Math.ceil(width));
  /* One row per thread of the haplotype, worked out before anything is
     drawn so that the bar's height is settled: see `laneRows`. */
  const rowOf = laneRows(lane.steps, layoutSpan(model));
  const rows = rowOf.reduce((deepest, row) => Math.max(deepest, row + 1), 1);
  const node = new Int32Array(rows * w).fill(-1);
  const base = new Int32Array(rows * w).fill(-1);
  const alt = new Uint8Array(rows * w);
  const bp = new Float64Array(rows * w);
  const nodes: RasterNode[] = [];
  const reference = referenceAlleles(model);

  let stepIndex = -1;
  for (const step of lane.steps) {
    stepIndex += 1;
    const graphNode = model.nodeById.get(step.node);
    if (!graphNode) continue;

    const isAlt = graphNode.onReference ? 0 : 1;
    const drawn = placed?.get(graphNode.id);
    const left = drawn ? drawn.left : px(graphNode.x);
    const right = drawn ? drawn.right : px(graphNode.x + graphNode.length);

    const index = nodes.length;
    nodes.push({
      id: graphNode.id,
      sequence: graphNode.sequence,
      length: graphNode.length,
      onReference: graphNode.onReference,
      start: step.start,
      left,
      right,
      card: rowOf[stepIndex],
      stack: 1,
      group: -1,
      refSequence: reference.get(graphNode.column) ?? null,
      copyFrom: 0,
    });

    if (!(right > left)) continue;

    /* Clipped to the band before the loop, so a node hanging off either end -
       the extraction returns whole nodes, so the first and last always do -
       costs nothing to skip. */
    const from = Math.max(0, Math.floor(left));
    const to = Math.min(w, Math.ceil(right));
    const perBase = (right - left) / graphNode.length;

    /* Into its own row of the arrays. */
    const at = rowOf[stepIndex] * w;
    for (let x = from; x < to; x++) {
      /* The centre of the pixel, so a base that only just covers one is not
         claimed by its neighbour. */
      const into = (x + 0.5 - left) / perBase;
      const offset = Math.min(
        graphNode.length - 1,
        Math.max(0, Math.floor(into)),
      );
      node[at + x] = index;
      base[at + x] = offset;
      alt[at + x] = isAlt;
      bp[at + x] = step.start + offset;
    }
  }

  /* The seams, once every visit has been placed: their pixels go to
     whichever side of the seam they are nearer, so the pointer crossing one
     goes from the base before it to the base after it. */
  for (let i = 0; i + 1 < nodes.length; i++) {
    const before = nodes[i];
    const after = nodes[i + 1];
    if (!follows(before, after)) continue;
    const gap = after.left - before.right;
    if (!(gap > 0) || before.length <= 0) continue;
    const perBase = (before.right - before.left) / before.length;
    /* Or one the bar is painted over: too narrow to read as a gap. */
    if (!(perBase > 0) || gap > Math.max(perBase * SEAM_BASES, SEAM_PX)) {
      continue;
    }

    const middle = (before.right + after.left) / 2;
    const from = Math.max(0, Math.ceil(before.right));
    const to = Math.min(w, Math.floor(after.left));
    /* Both sides of a seam continue one stretch of the haplotype, so they
       are drawn in the same row of the bar. */
    const at = before.card * w;
    for (let x = from; x < to; x++) {
      /* Only what neither visit's own bases reached. */
      if (node[at + x] >= 0) continue;
      const near = x + 0.5 < middle ? i : i + 1;
      const visit = nodes[near];
      const offset = near === i ? visit.length - 1 : 0;
      node[at + x] = near;
      base[at + x] = offset;
      alt[at + x] = visit.onReference ? 0 : 1;
      bp[at + x] = visit.start + offset;
    }
  }

  /* Visits this haplotype makes to one column - its own second copy of a
     stretch, which the layout puts in the same place. Grouped by column
     rather than by the pixels they cover, so the same visits stack at every
     zoom and a pair that merely touches does not. Which row each is drawn
     in is not decided here but by the walk - see `laneRows` - so the group
     is only for saying how many visits share a place, and for lifting one
     clear of the others under the pointer. */
  const stacks: number[][] = [];
  const byColumn = new Map<number, number[]>();
  nodes.forEach((visit, index) => {
    const column = model.nodeById.get(visit.id)?.column;
    if (column === undefined) return;
    const together = byColumn.get(column);
    if (together) together.push(index);
    else byColumn.set(column, [index]);
  });

  for (const together of byColumn.values()) {
    if (together.length < 2) continue;
    /* In the order they are drawn down the bar, the top row first. */
    const order = [...together].sort(
      (a, b) => nodes[a].card - nodes[b].card || a - b,
    );
    const group = stacks.length;
    stacks.push(order);
    for (const index of order) {
      nodes[index].stack = order.length;
      nodes[index].group = group;
    }
  }
  markCopies(nodes);

  return { key: lane.key, rows, node, base, alt, bp, nodes, stacks, width: w };
}

/** The most rows a bar is given, so a haplotype that leaves its own line
    many times does not give itself a bar the height of the drawing. */
export const MAX_CARDS = 4;

/**
 * Which row of its bar each step of a walk is drawn in.
 *
 * A row is one thread of the haplotype: every visit on it continues where
 * the last left off. Where the walk does not continue - the visit after one
 * ending at 532 starts at 879, not 533 - it is no thread of that row's, and
 * it takes a row of its own rather than being drawn after something it does
 * not follow. Read along a row, a bar is sequence; read down it, the rows
 * are the places the haplotype is at once.
 *
 * A row is waiting to be continued from wherever its last visit ended, so a
 * haplotype that steps aside and comes back returns to the line it left.
 *
 * A row whose thread has finished - nothing later in the walk carries on from
 * where it left off - is free again, for a stretch drawn clear to the right
 * of everything on it. A bar that kept a row for every thread anywhere in the
 * band was mostly empty rows to anyone looking at one window of it. What a
 * row must never take is a stretch that jumped while the line it would be
 * drawn after is still going: that is the whole point of counting threads,
 * so a live row is not reused however far away the new stretch is.
 *
 * Past `MAX_CARDS` rows the last one takes whatever is left, the bar having
 * nowhere else to put it.
 */
export function laneRows(
  steps: Lane["steps"],
  /** Where a step is drawn, in the layout's own coordinates. Without it no
      row is ever reused, which is the roomier reading of the same rule. */
  spanOf?: (step: Lane["steps"][number]) => Span | null,
): number[] {
  /* The walk in threads: runs of visits that carry on from one another. */
  interface Thread {
    from: number;
    to: number;
    start: number;
    end: number;
    left: number;
    right: number;
  }
  const threads: Thread[] = [];
  steps.forEach((step, index) => {
    const span = spanOf ? spanOf(step) : null;
    const open = threads[threads.length - 1];
    if (open && open.end === step.start) {
      open.to = index;
      open.end = step.end;
      if (span) {
        open.left = Math.min(open.left, span.left);
        open.right = Math.max(open.right, span.right);
      }
      return;
    }
    threads.push({
      from: index,
      to: index,
      start: step.start,
      end: step.end,
      /* Nowhere in particular, so it neither fits anywhere nor lets
         anything else fit after it. */
      left: span ? span.left : Number.NEGATIVE_INFINITY,
      right: span ? span.right : Number.POSITIVE_INFINITY,
    });
  });

  /* Which threads are carried on by a later one, and so are still live. */
  const startingAt = new Map<number, number[]>();
  threads.forEach((thread, index) => {
    const at = startingAt.get(thread.start);
    if (at) at.push(index);
    else startingAt.set(thread.start, [index]);
  });
  const livesOn = (index: number) =>
    (startingAt.get(threads[index].end) ?? []).some((later) => later > index);

  const rows: Array<{ end: number; live: boolean; right: number }> = [];
  const at = new Array<number>(steps.length).fill(0);
  threads.forEach((thread, index) => {
    let row = rows.findIndex((r) => r.end === thread.start);
    if (row < 0) {
      row = rows.findIndex((r) => !r.live && r.right <= thread.left);
    }
    if (row < 0) row = Math.min(rows.length, MAX_CARDS - 1);
    rows[row] = {
      end: thread.end,
      live: livesOn(index),
      right: Math.max(rows[row]?.right ?? Number.NEGATIVE_INFINITY, thread.right),
    };
    for (let step = thread.from; step <= thread.to; step++) at[step] = row;
  });
  return at;
}

/** Where something is drawn along the layout. */
interface Span {
  left: number;
  right: number;
}

/** Where each step of a walk is drawn, for `laneRows`. */
export function layoutSpan(
  model: PangenomeModel,
): (step: Lane["steps"][number]) => Span | null {
  return (step) => {
    const node = model.nodeById.get(step.node);
    return node ? { left: node.x, right: node.x + node.length } : null;
  };
}

/**
 * How many rows each haplotype's bar needs, by lane.
 *
 * Taken from the layout rather than from a raster, because the height of
 * the bars is settled before anything is drawn - and a bar that changed
 * height with the zoom would move everything under it.
 */
export function stackDepths(model: PangenomeModel): number[] {
  /* Asked for on every render, by the view, its container and the legend
     beside it, and a model never changes once built: worked out once. */
  const known = depthsByModel.get(model);
  if (known) return known;
  const spanOf = layoutSpan(model);
  const depths = model.lanes.map((lane) =>
    laneRows(lane.steps, spanOf).reduce(
      (deepest, row) => Math.max(deepest, row + 1),
      1,
    ),
  );
  depthsByModel.set(model, depths);
  return depths;
}
const depthsByModel = new WeakMap<PangenomeModel, number[]>();

/**
 * Tells, for each stack, which visit is the haplotype in place and where
 * each of the others comes from.
 *
 * The visits drawn on their own are in place by definition, so they give
 * the coordinate the haplotype has on its way into a stack: the nearest one
 * to the left, carried on to the stack at the lane's own rate. The card
 * closest to that is in place. That estimate only has to pick a card - a
 * copy is typically a thousand or two bases away, where the estimate is off
 * by tens - and the direction is then read from the exact difference
 * between the copy's own coordinate and the in-place card's, not from the
 * estimate.
 *
 * Coming in from the left rather than out to the right is a choice, and it
 * matters only in a tandem duplication, where either copy could be called
 * the one in place. Making it the same way every time keeps one copy marked
 * consistently along the whole stretch, instead of the mark flipping half
 * way across as a nearest-of-both-sides rule would.
 */
function markCopies(nodes: RasterNode[]): void {
  /* The top row is the haplotype's own line through the window: every visit
     on it continues the one before. Anything on another row left that line
     and is a stretch from somewhere else in the haplotype. */
  const anchors = nodes
    .filter((visit) => visit.card === 0 && visit.length > 0 && visit.right > visit.left)
    .sort((a, b) => a.left - b.left);
  if (anchors.length === 0) return;
  /* The anchors are in order of their left edge, so the first one starting
     at or past a point is found by halving rather than by walking the whole
     line from the left for every visit: a haplotype with thousands of
     visits off its line made that the slowest part of drawing the bars.
     What it finds is what the walk found - the nearest anchor ending at or
     before the point, of those before the first that starts past it. */
  const arriving = (x: number): number => {
    let lo = 0;
    let hi = anchors.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (anchors[mid].left >= x) hi = mid;
      else lo = mid + 1;
    }
    const after: RasterNode | null = lo < anchors.length ? anchors[lo] : null;
    let before: RasterNode | null = null;
    for (let i = lo - 1; i >= 0; i--) {
      if (anchors[i].right <= x) {
        before = anchors[i];
        break;
      }
    }
    if (before) {
      const perBase = (before.right - before.left) / before.length;
      return before.start + before.length + (x - before.right) / perBase;
    }
    if (after) {
      const perBase = (after.right - after.left) / after.length;
      return after.start - (after.left - x) / perBase;
    }
    return NaN;
  };

  for (const visit of nodes) {
    if (visit.card === 0) continue;
    /* Where the haplotype's own line has got to where this is drawn. */
    const expected = arriving((visit.left + visit.right) / 2);
    if (!Number.isFinite(expected)) continue;
    visit.copyFrom =
      visit.start > expected ? 1 : visit.start < expected ? -1 : 0;
  }
}

/**
 * What one row of the bar holds at a pixel.
 *
 * Each row is a thread of the haplotype and answers for itself: the same
 * pixels, but its own stretch, with its own coordinates, its own node and
 * its own letters. A row past the last is the last; a row with nothing drawn
 * on it at this pixel answers with whatever the bar does show there, so the
 * tooltip does not blink out over a bar that plainly has something in it.
 */
export function cardAt(
  raster: LaneRaster,
  at: number,
  row: number,
): RasterHit | null {
  const x = Math.round(at);
  if (x < 0 || x >= raster.width) return null;
  const wanted = Math.min(Math.max(0, Math.round(row)), raster.rows - 1);
  return rowAt(raster, x, wanted) ?? hitAt(raster, at);
}

/** Every lane of a model, rasterised against one band. */
export function rasteriseLanes(
  model: PangenomeModel,
  px: (graphX: number) => number,
  width: number,
): LaneRaster[] {
  const placed = new Map<string, { left: number; right: number }>();
  for (const node of model.nodes) {
    placed.set(node.id, { left: px(node.x), right: px(node.x + node.length) });
  }
  return model.lanes.map((lane) =>
    rasteriseLane(lane, model, px, width, placed),
  );
}

/** What the pointer is over. Null where the haplotype is not in the window. */
export interface RasterHit {
  node: RasterNode;
  /** Where that node sits in `nodes`, so a caller can walk out from it. */
  index: number;
  /** Which base of it, and that base's letter. */
  offset: number;
  letter: string;
  /**
   * The pointer's own pixel, in the band's pixels.
   *
   * `offset` is the one base the pixel is answered with; this is what the
   * pixel actually covers, which is how the tooltip knows how much of the
   * sequence the pointer really means.
   */
  pixel: number;
  /** The haplotype's own coordinate there. */
  bp: number;
  alt: boolean;
}

/**
 * Read one pixel - the whole of a hover.
 *
 * `at` is the pointer's x within the band, which is all eg-tracks passes its
 * own tooltips: `relativeX`, rounded, used as an index.
 */
export function hitAt(raster: LaneRaster, at: number): RasterHit | null {
  const x = Math.round(at);
  if (x < 0 || x >= raster.width) return null;
  /* The first row with anything at this pixel, which is the one a reader
     looking at the bar sees there. */
  for (let row = 0; row < raster.rows; row++) {
    const hit = rowAt(raster, x, row);
    if (hit) return hit;
  }
  return null;
}

/** One row of the bar at one pixel, or null where that row is empty here. */
function rowAt(
  raster: LaneRaster,
  x: number,
  row: number,
): RasterHit | null {
  const at = row * raster.width + x;
  const index = raster.node[at];
  if (index < 0) return null;
  const node = raster.nodes[index];
  if (!node) return null;
  const offset = raster.base[at];
  return {
    node,
    index,
    offset,
    pixel: x,
    letter: node.sequence.charAt(offset) || "",
    bp: raster.bp[at],
    alt: raster.alt[at] === 1,
  };
}

/**
 * The letters of the node under the pointer.
 *
 * The node is the unit a reader is pointing at - one allele, one stretch of
 * sequence - so it is the node that is spelled out rather than a fixed window
 * of the neighbourhood. A long one is cut down around the base being pointed
 * at, and says which end it lost.
 */
export interface NodeLetters {
  letters: string[];
  /** The first of them the pointer's pixel covers; `span` says how many. */
  at: number;
  /**
   * How many bases the pointer's own pixel covers, starting at `at`.
   *
   * Zoomed in a base is several pixels wide and this is 1: the pointer is
   * on one base and the tooltip says which. Zoomed out a pixel covers
   * several bases and the pointer cannot mean one of them, so the tooltip
   * marks the run it does mean. The idea is `genomealignFine`'s in
   * eg-tracks, which marks `round(basesPerPixel)` bases.
   *
   * It is worked out from the pixel's own edges rather than from a rounded
   * rate, because a rate is one number for the whole node and the number
   * of bases under a pixel is not: at two and a half bases to the pixel
   * some pixels hold two and some hold three, and rounding leaves the
   * third unmarked. The width it is measured from is the node's drawn one,
   * so shortening a stretch raises it by itself.
   */
  span: number;
  /** The coordinate of the first and last letter shown. */
  from: number;
  to: number;
  /** The coordinate of the first and last letter marked. */
  markFrom: number;
  markTo: number;

  /** Whether the node runs on past what is shown. */
  clippedLeft: boolean;
  clippedRight: boolean;
  /** The node in full, for saying how much was left out. */
  length: number;
}

/**
 * The bases of one node the pointer's pixel means.
 *
 * Where the bases are drawn smaller than a pixel - a window wide enough
 * that a repeat is a few pixels of many bases - the
 * pointer cannot mean one of them, so it means all the ones its pixel
 * covers: the first its left edge falls in through the last its right edge
 * reaches, a base straddling an edge belonging to both pixels.
 *
 * Where a base is a pixel or wider, the pointer is inside one base and
 * means that one - the one the pixel is painted with. Its edges do still
 * overlap two, because a base boundary falls at a fraction of a pixel, and
 * marking both of them there made the tooltip read G, then GA, then A on
 * the way from one letter to the next. The eye crossing that boundary sees
 * G and then A.
 */
function coveredBases(
  node: RasterNode,
  pixel: number,
  fallback: number,
): { first: number; last: number } {
  const perBase =
    node.length > 0 ? (node.right - node.left) / node.length : 0;
  if (!(perBase > 0)) return { first: fallback, last: fallback };
  if (perBase >= 1) return { first: fallback, last: fallback };
  const inside = (base: number) =>
    Math.min(node.length - 1, Math.max(0, base));
  const first = inside(Math.floor((pixel - node.left) / perBase));
  const last = Math.max(
    first,
    inside(Math.ceil((pixel + 1 - node.left) / perBase) - 1),
  );
  return { first, last };
}

/** Whether one visit is the very next stretch of the haplotype after another. */
const follows = (before: RasterNode, after: RasterNode) =>
  before.start + before.length === after.start;

/**
 * How wide a space between two such visits the pointer can still be said to
 * be inside one of them, in bases of the visit before it.
 *
 * Every column is as wide as its widest allele, so a haplotype with a
 * shorter one - or with none at all, where another carries an insertion -
 * is drawn with room after it that it has no bases for. The bar is left
 * open there, since the haplotype really has nothing to show. But a base of
 * room is a seam between two of its own neighbouring bases, and sweeping
 * across it the pointer is on one or the other: it used to fall through the
 * crack instead and the tooltip blinked out between two adjacent alleles.
 *
 * A quarter over one, because the axis bends where a site is wider than the
 * reference allele and the two sides of a seam are not drawn at quite the
 * same rate.
 */
const SEAM_BASES = 1.25;
/** Or under a pixel, whatever the bases: the bar shows such a break, a
    pixel wide, but the pointer crossing it is still on one side or the
    other. */
const SEAM_PX = 1;

/**
 * The haplotype's own sequence around the pointer, across node boundaries.
 *
 * A node boundary is the graph's business, not the reader's: a haplotype is
 * one sequence, and a tooltip that stops at the edge of an allele cuts a
 * word in half. So the letters are read through the lane's walk, `half`
 * bases either side. The shape is `genomealignFine`'s in eg-tracks, which
 * shows ten bases either side of the cursor and highlights the middle.
 *
 * What is marked, though, stays inside the visit the pointer was answered
 * with, so the node named above the sequence, the coordinate beside it and
 * the marked letters are all the same node's. Marking across the boundary
 * as well left those three disagreeing.
 *
 * It stops where the walk stops being one stretch of the haplotype: next to
 * a copy from elsewhere the neighbouring visit is a thousand bases away in
 * its own coordinates, and reading on would splice together sequence that is
 * not adjacent.
 */
export function laneLetters(
  raster: LaneRaster,
  hit: RasterHit,
  half: number,
): NodeLetters {
  const { index, pixel } = hit;
  const nodes = raster.nodes;

  /* The bases of this visit that the pixel covers - only this visit's: see
     above. */
  const { first: firstBase, last: lastBase } = coveredBases(
    hit.node,
    pixel,
    hit.offset,
  );
  const firstIndex = index;
  const lastIndex = index;
  const marked = hit.node.sequence.slice(firstBase, lastBase + 1);

  const head = nodes[firstIndex];
  let before = head.sequence.slice(Math.max(0, firstBase - half), firstBase);
  for (let i = firstIndex - 1; before.length < half && i >= 0; i--) {
    if (!follows(nodes[i], nodes[i + 1])) break;
    before = nodes[i].sequence.slice(-(half - before.length)) + before;
  }

  const tail = nodes[lastIndex];
  let after = tail.sequence.slice(lastBase + 1, lastBase + 1 + half);
  for (let i = lastIndex + 1; after.length < half && i < nodes.length; i++) {
    if (!follows(nodes[i - 1], nodes[i])) break;
    after += nodes[i].sequence.slice(0, half - after.length);
  }

  const markFrom = head.start + firstBase;
  const markTo = tail.start + lastBase;
  return {
    letters: (before + marked + after).split(""),
    at: before.length,
    span: marked.length,
    from: markFrom - before.length,
    to: markTo + after.length,
    markFrom,
    markTo,
    /* Whether the haplotype runs on past what is shown. */
    clippedLeft: before.length >= half,
    clippedRight: after.length >= half,
    length: hit.node.length,
  };
}

/**
 * One node's worth, for a view whose nodes are the things being pointed at -
 * the tube map, where each is drawn as its own box.
 */
export function nodeLetters(hit: RasterHit, cap: number): NodeLetters {
  const { node, offset, pixel } = hit;
  const { first, last } = coveredBases(node, pixel, offset);

  if (node.length <= cap) {
    return {
      letters: node.sequence.split(""),
      at: first,
      span: last - first + 1,
      from: node.start,
      to: node.start + node.length - 1,
      markFrom: node.start + first,
      markTo: node.start + last,
      clippedLeft: false,
      clippedRight: false,
      length: node.length,
    };
  }

  /* Centred on the pointer, then slid back inside the node so a base near
     either end still shows a full window rather than a half-empty one. */
  const half = Math.floor(cap / 2);
  const start = Math.min(Math.max(0, first - half), node.length - cap);
  const end = start + cap;
  const at = Math.max(0, first - start);
  return {
    letters: node.sequence.slice(start, end).split(""),
    at,
    /* Clipped to the window: a pixel covering more than it shows marks all
       of what it shows. */
    span: Math.min(last - first + 1, cap - at),
    from: node.start + start,
    to: node.start + end - 1,
    markFrom: node.start + first,
    markTo: node.start + last,
    clippedLeft: start > 0,
    clippedRight: end < node.length,
    length: node.length,
  };
}
