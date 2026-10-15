import type {
  BandAxis,
  DrawFrame,
  GraphNode,
  PangenomeModel,
} from "./pangenomeModel";
import { bpAtGraphX, graphXAtBp, referenceTicks } from "./pangenomeModel";

/* ══════════════════════════════════════════════════════════════════════════
   Where the tube map puts things. No drawing here, so it can be tested.

   Down, every column is a stack, all starting from the same top line - so
   every node sits at the same level, as in figure 2d of Eizenga et al. 2020.
   A node's box holds just the tubes of the haplotypes through it, packed
   together in lane order, and the alleles of a site are stacked directly
   under one another. Haplotypes that step over the column without entering
   any of its nodes - a deletion - keep a place in the stack too, without a
   box, so their tubes carry on past the nodes rather than through them.
   Whichever item holds the earliest lane goes on top, which puts the
   reference's own node first and lets it run level.

   Across, a node is as wide as its sequence at the window's scale, and the
   tubes change height in gaps between the columns, as in the figure. A gap
   is only let in where some tube does change height, and it is wider the
   more haplotypes part from the rest there: nothing where they all carry
   straight on, a little where one takes another allele, more where half do.
   A bend is made wholly inside its gap, never inside a node.

   A link from one alternative allele to another - off the reference at both
   ends, whatever columns it passes over between them - is drawn as a thin
   line instead of a tube. The tube still runs through each allele's own
   box; only the way between the two thins. Anything reaching the reference
   stays a tube.

   Every node gets a box of its own, including two at one depth that spell
   the same bases. They are different places - in the MHC, a second copy of
   a stretch, the same bases a couple of thousand further on - and drawing
   them as one box made a reader count the ways through both as the ways
   through one. It costs a tangle where a haplotype walks both copies, and
   the tooltip says what tells them apart.

   The gaps are paid for out of the window, the way the linear view pays for
   alleles longer than the reference's: the room they take in the window on
   screen is set aside first and the bases share what is left, so the
   window's first base still sits on its left edge and its last base on its
   right. A window so busy its gaps would take more than half of it - more,
   up to four fifths, when the reader has asked for wider gaps - has them all
   narrowed together. `tubeAxis` is that arithmetic, and it is what the
   pan is told, so a pan lands on the base it should in this view too.

   Inside a gap the tubes are drawn in turns: a couple from each bundle of
   tubes going between the same two items, then a couple from the next.
   Where bundles cross, neither lies wholly over the other.
   ══════════════════════════════════════════════════════════════════════════ */

/** Room at the top for the ruler. */
export const TUBE_RULER_H = 0;
/** Between the ruler and the top of the stacks. */
export const TUBE_TOP_PAD = 6;
/** The strip across the top of a box that carries its sequence. */
export const TUBE_LABEL_H = 16;
/** Between the last tube in a box and the foot of the box. */
export const TUBE_BOX_PAD = 3;
/** Between one item of a column's stack and the next one under it. */
export const TUBE_ITEM_GAP = 4;
/** Room under the tallest stack. */
export const TUBE_FOOT_PAD = 10;
/** The gap where tubes change height but no haplotype parts from the rest. */
export const TUBE_GAP_MIN = 8;
/** How much wider a gap is for each haplotype that does part. */
export const TUBE_GAP_PER_PATH = 4;
export const TUBE_GAP_MAX = 56;
/** The most of the window on screen the gaps may take between them, at
    their own size. Drawn wider they may take more, up to the MAX, so the
    bases always keep some of the window. */
export const TUBE_GAP_BUDGET = 0.5;
export const TUBE_GAP_BUDGET_MAX = 0.8;
/** How many tubes of a bundle go over or under at a time where bundles cross. */
export const CROSS_CHUNK = 2;
/** How near a thin link the pointer has to be to be over it. */
const LINK_HIT = 4;

/** One thing in a column's stack: a node's box, or the tubes passing over. */
export interface TubeItem {
  /** The node's id, or `pass@column`. */
  key: string;
  /** Null for the tubes passing over the column. */
  node: GraphNode | null;
  column: number;
  /** Lane indices, top to bottom. */
  lanes: number[];
  /** Each lane's place among `lanes`. */
  slot: Map<number, number>;
  top: number;
  /** Where the first tube starts. */
  slotsTop: number;
  bottom: number;
}

/** One column of one haplotype's tube. */
export interface TrackEntry {
  column: number;
  item: TubeItem;
  /** The node the haplotype actually walks here; null passing over. */
  node: GraphNode | null;
  /** The centre of the tube here. */
  y: number;
  /** The haplotype's coordinate at the node's first base; null passing over. */
  start: number | null;
  /** Where the haplotype's bases there end, in its own coordinates; null
      passing over. */
  end: number | null;
  segment: number;
  /** Whether the tube carries on into the next entry, one column on. */
  joined: boolean;
}

export interface TubeStacks {
  /** Each column's items, top to bottom. */
  columns: TubeItem[][];
  /** Each lane's tube, column by column. */
  tracks: TrackEntry[][];
  tubeH: number;
  height: number;
}

/** The tube map's axis: the linear view's arithmetic, with the gaps let in. */
export interface TubeAxis extends BandAxis {
  /** The gap in front of each column, in pixels, as drawn. */
  gapBefore: number[];
  /** How many pixels a stretch of layout inside one column is drawn across. */
  lengthPx: (fromX: number, toX: number) => number;
  /** How wide the drawing is when there is no band to fill. */
  width: number;
}

/**
 * A stretch of one tube: straight where `y0` equals `y1`, a bend otherwise.
 * A bend's centre line is the cubic from (x0, y0) to (x1, y1) with both
 * control points half way across, so it leaves and arrives level.
 */
export interface TubePiece {
  /** Index into `model.lanes`. */
  lane: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  /** Draw order inside its gap; -1 for a straight run. */
  z: number;
  /** The track entries it joins, and where one hands over to the other. */
  from: number;
  to: number;
  split: number;
  /** Part of a link between two alternative alleles, drawn as a thin line. */
  thin: boolean;
}

/** Every tube bending in the gap in front of one column, in drawing order. */
export interface TubeCrossing {
  column: number;
  x0: number;
  x1: number;
  pieces: TubePiece[];
}

/** A haplotype leaving the window and coming back, or walking backwards. */
export interface TubeSeam {
  lane: number;
  /** The track entry the tube stops at; it picks up at the next one. */
  entry: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface TubeBox {
  node: GraphNode;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Where a track entry's tube runs across: its node, or its whole column. */
export interface TubeSpan {
  left: number;
  right: number;
}

export interface TubeGeometry {
  tubeH: number;
  stacks: TubeStacks;
  boxes: TubeBox[];
  /** Where each column starts, and its boxes, for finding what is at a pixel. */
  columnLeft: number[];
  boxesByColumn: TubeBox[][];
  /** Each track entry's span, matching `stacks.tracks`. */
  spans: TubeSpan[][];
  /** The straight stretches, which never overlap and are drawn first. */
  runs: TubePiece[];
  /** The gaps where tubes bend, left to right. */
  crossings: TubeCrossing[];
  seams: TubeSeam[];
  /** Each lane's pieces, left to right, for the hover. */
  byLane: TubePiece[][];
}

interface Visit {
  node: GraphNode;
  start: number;
  end: number;
  segment: number;
}

/** A step that moves on along the layout within one walk. */
const movesOn = (a: Visit, b: Visit) =>
  a.segment === b.segment && b.node.column > a.node.column;

/**
 * Stacks every column and runs each haplotype's tube through the stacks.
 * Needs no axis, so the box around the drawing can ask how tall it is.
 */
export function tubeStacks(model: PangenomeModel, tubeH: number): TubeStacks {
  const laneIndex = new Map(model.lanes.map((lane) => [lane.key, lane.index]));
  const columnCount = model.columns.length;

  const visits: Visit[][] = model.lanes.map((lane) => {
    const list: Visit[] = [];
    for (const step of lane.steps) {
      const node = model.nodeById.get(step.node);
      if (node) {
        list.push({ node, start: step.start, end: step.end, segment: step.segment });
      }
    }
    return list;
  });

  /* Which node each lane is in, column by column, and which lanes step over
     a column without entering any of its nodes. */
  const inColumn: Array<Map<number, GraphNode>> = Array.from(
    { length: columnCount },
    () => new Map(),
  );
  for (const node of model.nodes) {
    for (const key of node.lanes) {
      const lane = laneIndex.get(key);
      if (lane !== undefined) inColumn[node.column].set(lane, node);
    }
  }
  const passing: Array<Set<number>> = Array.from(
    { length: columnCount },
    () => new Set(),
  );
  visits.forEach((list, lane) => {
    for (let i = 0; i + 1 < list.length; i++) {
      if (!movesOn(list[i], list[i + 1])) continue;
      for (let c = list[i].node.column + 1; c < list[i + 1].node.column; c++) {
        if (!inColumn[c].has(lane)) passing[c].add(lane);
      }
    }
  });

  const top = TUBE_RULER_H + TUBE_TOP_PAD;
  let deepest = top;
  const itemByNode = new Map<string, TubeItem>();
  const passItem: Array<TubeItem | undefined> = [];

  const makeItem = (
    key: string,
    node: GraphNode | null,
    column: number,
    lanes: number[],
  ): TubeItem => {
    lanes.sort((a, b) => a - b);
    return {
      key,
      node,
      column,
      lanes,
      slot: new Map(lanes.map((lane, i) => [lane, i])),
      top: 0,
      slotsTop: 0,
      bottom: 0,
    };
  };

  const columns: TubeItem[][] = model.columns.map((column, c) => {
    /* A box for each node here, whatever its bases: two that spell the same
       thing are two places, and the ways into and out of one of them are
       not the ways into the other. */
    const items: TubeItem[] = [];
    for (const id of column.nodeIds) {
      const node = model.nodeById.get(id);
      if (!node) continue;
      const lanes = new Set<number>();
      for (const key of node.lanes) {
        const lane = laneIndex.get(key);
        if (lane !== undefined) lanes.add(lane);
      }
      const item = makeItem(node.id, node, c, Array.from(lanes));
      itemByNode.set(node.id, item);
      items.push(item);
    }
    if (passing[c].size) {
      const item = makeItem(`pass@${c}`, null, c, Array.from(passing[c]));
      passItem[c] = item;
      items.push(item);
    }

    /* The earliest lane on top; a node nobody walks goes to the bottom. */
    const firstLane = (item: TubeItem) =>
      item.lanes.length ? item.lanes[0] : Number.MAX_SAFE_INTEGER;
    items.sort((a, b) => firstLane(a) - firstLane(b));

    let y = top;
    items.forEach((item, i) => {
      item.top = y;
      /* A box keeps a strip at its top for its sequence. Tubes passing over
         have no box, and when they are on top they line up with the tubes in
         the boxes either side. */
      item.slotsTop = item.node || i === 0 ? y + TUBE_LABEL_H : y;
      item.bottom =
        item.slotsTop +
        item.lanes.length * tubeH +
        (item.node ? TUBE_BOX_PAD : 0);
      deepest = Math.max(deepest, item.bottom);
      y = item.bottom + TUBE_ITEM_GAP;
    });
    return items;
  });

  /* Each lane's tube: its visits, with an entry for every column stepped
     over in between. */
  const tracks: TrackEntry[][] = visits.map((list, lane) => {
    const track: TrackEntry[] = [];
    const add = (
      column: number,
      item: TubeItem | undefined,
      node: GraphNode | null,
      visit: Visit,
      start: number | null,
    ) => {
      const slot = item?.slot.get(lane);
      if (!item || slot === undefined) return false;
      track.push({
        column,
        item,
        node,
        y: item.slotsTop + (slot + 0.5) * tubeH,
        start,
        end: start === null ? null : visit.end,
        segment: visit.segment,
        joined: false,
      });
      return true;
    };

    list.forEach((visit, i) => {
      const previous = list[i - 1];
      if (!previous || !movesOn(previous, visit) || !track.length) {
        add(
          visit.node.column,
          itemByNode.get(visit.node.id),
          visit.node,
          visit,
          visit.start,
        );
        return;
      }
      /* Carried on column by column: over each one stepped past, then into
         this visit's node. Should a column have no place for it, the tube
         stops there and resumes at the next visit, as a seam. */
      for (let c = previous.node.column + 1; c <= visit.node.column; c++) {
        const into = c === visit.node.column;
        const node = into ? visit.node : inColumn[c].get(lane);
        const item = node ? itemByNode.get(node.id) : passItem[c];
        const last = track[track.length - 1];
        const walked = into ? visit.node : null;
        if (!add(c, item, walked, visit, into ? visit.start : null)) return;
        last.joined = true;
      }
    });
    return track;
  });

  return { columns, tracks, tubeH, height: deepest + TUBE_FOOT_PAD };
}

/**
 * The gap in front of each column, in pixels, before any narrowing.
 *
 * None where every tube carries straight on into the column. Where any tube
 * changes height, TUBE_GAP_MIN, and TUBE_GAP_PER_PATH more for every
 * haplotype that parts from the rest - every one outside the largest bundle
 * of tubes going between the same two items.
 */
export function junctionGaps(
  stacks: TubeStacks,
  columnCount: number,
): number[] {
  const bundles: Array<Map<string, number>> = Array.from(
    { length: columnCount },
    () => new Map(),
  );
  const moves = new Array<boolean>(columnCount).fill(false);
  for (const track of stacks.tracks) {
    for (let k = 0; k + 1 < track.length; k++) {
      const a = track[k];
      if (!a.joined) continue;
      const b = track[k + 1];
      const counts = bundles[b.column];
      const key = `${a.item.key}>${b.item.key}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
      if (a.y !== b.y) moves[b.column] = true;
    }
  }
  return bundles.map((counts, column) => {
    if (!moves[column]) return 0;
    let total = 0;
    let largest = 0;
    for (const count of counts.values()) {
      total += count;
      largest = Math.max(largest, count);
    }
    return Math.min(
      TUBE_GAP_MAX,
      TUBE_GAP_MIN + TUBE_GAP_PER_PATH * (total - largest),
    );
  });
}

/**
 * The tube map's axis: where a place along the layout is drawn, with the gaps
 * in front of the columns let in, and fitted so the window on screen shows
 * exactly the region asked for.
 *
 * Without a band to fill, the bases are drawn at `pxPerBase` and the gaps are
 * added on top. `gapScale` draws every gap that much wider, and lets the gaps
 * take that much more of a busy window before they are narrowed.
 * `fixedGaps`, when given, are the gaps in pixels, column by column, used as
 * they are: the band laid out with them already (see fetchPangenomeData).
 */
export function tubeAxis(
  model: PangenomeModel,
  stacks: TubeStacks,
  frame: DrawFrame | undefined,
  pxPerBase: number,
  gapScale = 1,
  /* Whose reference walk says where each base is, when the model drawn is
     not the one fetched: the grouped tube map's boxes cover whole sites, and
     reading coordinates off them put a base anywhere in a long site at its
     start - one site across the band left nothing to fit the window by. Its
     columns keep the fetched model's layout, so that model's walk reads true
     on them. */
  anchorsFrom?: PangenomeModel,
  fixedGaps?: number[],
): TubeAxis {
  const { columns } = model;
  const raw =
    fixedGaps && fixedGaps.length === columns.length
      ? fixedGaps
      : junctionGaps(stacks, columns.length).map((gap) => gap * gapScale);
  const given = raw === fixedGaps;
  const anchors = referenceTicks(anchorsFrom ?? model);

  /* The last column starting at or before a place - or, `strict`, before
     it. -1 in front of the first. */
  const columnAt = (graphX: number, strict: boolean) => {
    let lo = 0;
    let hi = columns.length - 1;
    let found = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (strict ? columns[mid].x < graphX : columns[mid].x <= graphX) {
        found = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return found;
  };
  const running = (gaps: number[]) => {
    let sum = 0;
    return gaps.map((gap) => (sum += gap));
  };
  /* All the gap in front of a place. A column's gap is in front of its first
     base, so a place at a column's start is already past it. */
  const gapTo = (sums: number[], graphX: number, strict = false) => {
    const column = columnAt(graphX, strict);
    return column < 0 ? 0 : sums[column];
  };

  let gapBefore = raw;
  let scale = pxPerBase;
  let fromX = 0;
  let fromPx = 0;

  const bandBp = frame ? frame.endBp - frame.startBp : 0;
  const windowPx = frame ? frame.viewToPx - frame.viewFromPx : 0;
  if (frame && anchors.length >= 2 && bandBp > 0 && frame.width > 0 && windowPx > 0) {
    const bpAtBandPx = (atPx: number) =>
      frame.startBp + (atPx / frame.width) * bandBp;
    const viewFrom = graphXAtBp(anchors, bpAtBandPx(frame.viewFromPx));
    const viewTo = graphXAtBp(anchors, bpAtBandPx(frame.viewToPx));
    if (viewFrom !== null && viewTo !== null && viewTo > viewFrom) {
      /* The gaps between the window's first base and its last: not the one
         in front of the first, nor one in front of a column that only starts
         where the last base ends. */
      const sums = running(raw);
      const inWindow = gapTo(sums, viewTo, true) - gapTo(sums, viewFrom);
      const budget =
        Math.min(TUBE_GAP_BUDGET_MAX, TUBE_GAP_BUDGET * gapScale) * windowPx;
      const narrow = !given && inWindow > budget ? budget / inWindow : 1;
      gapBefore = raw.map((gap) => gap * narrow);
      /* What is left once the gaps are paid for, shared by the bases. */
      scale = (windowPx - inWindow * narrow) / (viewTo - viewFrom);
      fromX = viewFrom;
      fromPx = frame.viewFromPx;
    }
  }

  const sums = running(gapBefore);
  const gapAtFrom = gapTo(sums, fromX);
  const px = (graphX: number) =>
    fromPx +
    (graphX - fromX) * scale +
    gapTo(sums, graphX) -
    gapAtFrom;

  /* The other way, for the pan: which place along the layout a pixel is. A
     pixel in a gap is the first base after it. */
  const columnPx = columns.map((column) => px(column.x));
  const graphXAtPx = (atPx: number) => {
    let lo = 0;
    let hi = columns.length - 1;
    let found = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (columnPx[mid] - gapBefore[mid] <= atPx) {
        found = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    const column = columns[found];
    if (!column) return fromX + (atPx - fromPx) / scale;
    const start = columnPx[found];
    if (atPx < start && atPx >= start - gapBefore[found]) return column.x;
    return column.x + (atPx - start) / scale;
  };

  return {
    scale,
    originX: graphXAtPx(0),
    px,
    pxAtBp: (bp) => {
      const at = graphXAtBp(anchors, bp);
      return at === null ? null : px(at);
    },
    bpAtPx: (atPx) => bpAtGraphX(anchors, graphXAtPx(atPx)),
    gapBefore,
    lengthPx: (fromX, toX) => (toX - fromX) * scale,
    width: px(model.totalBp),
  };
}

/**
 * How many pixels a base takes on average across the band, gaps included -
 * what the ruler chooses its round numbers from.
 *
 * Not the axis's scale: that is what the bases have left once the gaps are
 * paid for, so it falls as the gaps widen, and marks chosen from it thin out
 * from every 50 bases to every 500 until the ruler reads like a different
 * window. The window holds the same bases whatever the gaps, so this does not
 * move with them.
 */
export function rulerPxPerBase(
  model: PangenomeModel,
  axis: TubeAxis,
  frame: DrawFrame | undefined,
): number {
  const bandBp = frame ? frame.endBp - frame.startBp : 0;
  return frame && bandBp > 0 && frame.width > 0
    ? frame.width / bandBp
    : axis.width / Math.max(1, model.totalBp);
}

/**
 * The order tubes are drawn in where they cross: a chunk from each bundle in
 * turn, so each bundle goes over the others and then under them.
 *
 * Bundles are taken in the order of their first lane, and a bundle's lanes in
 * lane order. With five tubes going one way and four the other, and chunks of
 * two, that is two of the five, two of the four, the next two of the five...
 */
export function weave<T>(
  items: T[],
  bundleOf: (item: T) => string,
  laneOf: (item: T) => number,
): T[] {
  const bundles = new Map<string, T[]>();
  for (const item of items) {
    const key = bundleOf(item);
    const bundle = bundles.get(key);
    if (bundle) bundle.push(item);
    else bundles.set(key, [item]);
  }
  const ordered = Array.from(bundles.values())
    .map((bundle) => bundle.sort((a, b) => laneOf(a) - laneOf(b)))
    .sort((a, b) => laneOf(a[0]) - laneOf(b[0]));

  const out: T[] = [];
  for (let from = 0; out.length < items.length; from += CROSS_CHUNK) {
    for (const bundle of ordered) {
      out.push(...bundle.slice(from, from + CROSS_CHUNK));
    }
  }
  return out;
}

/** Where every box and every piece of every tube goes across. */
export function buildTubeGeometry(
  model: PangenomeModel,
  axis: TubeAxis,
  stacks: TubeStacks,
): TubeGeometry {
  const { tubeH, tracks } = stacks;
  /* A column's own width, and a node's, come from the axis. */
  const columnLeft = model.columns.map((column) => axis.px(column.x));
  const columnRight = model.columns.map(
    (column, c) =>
      columnLeft[c] + axis.lengthPx(column.x, column.x + column.width),
  );

  const boxes: TubeBox[] = [];
  const boxesByColumn: TubeBox[][] = model.columns.map(() => []);
  stacks.columns.forEach((items, c) => {
    for (const item of items) {
      if (!item.node) continue;
      /* From where the node itself starts: its column's start in a model
         of nodes, but a walk of the grouped tube map starts where its own
         nodes do, inside a site that is wider than it. */
      const left = axis.px(item.node.x);
      const box: TubeBox = {
        node: item.node,
        left,
        right: left + axis.lengthPx(item.node.x, item.node.x + item.node.length),
        top: item.top,
        bottom: item.bottom,
      };
      boxes.push(box);
      boxesByColumn[c].push(box);
    }
  });

  const spans: TubeSpan[][] = tracks.map((track) =>
    track.map((entry) => {
      const node = entry.item.node;
      const left = node ? axis.px(node.x) : columnLeft[entry.column];
      return {
        left,
        right: node
          ? left + axis.lengthPx(node.x, node.x + node.length)
          : columnRight[entry.column],
      };
    }),
  );

  /* The real node a tube last left, and the one it next enters, entry by
     entry along each unbroken stretch of it - so a stretch passing over a
     column belongs to the link between the nodes either side of it. */
  const nodeBefore = tracks.map((track) => {
    const out: Array<GraphNode | null> = new Array(track.length);
    let last: GraphNode | null = null;
    track.forEach((entry, k) => {
      if (k > 0 && !track[k - 1].joined) last = null;
      if (entry.item.node) last = entry.item.node;
      out[k] = last;
    });
    return out;
  });
  const nodeAfter = tracks.map((track) => {
    const out: Array<GraphNode | null> = new Array(track.length);
    let next: GraphNode | null = null;
    for (let k = track.length - 1; k >= 0; k--) {
      if (!track[k].joined) next = null;
      if (track[k].item.node) next = track[k].item.node;
      out[k] = next;
    }
    return out;
  });
  const offReference = (node: GraphNode | null) =>
    node !== null && !node.onReference;
  /* Whether the way from entry k on to entry k + 1 is a link between two
     alternative alleles. */
  const altLink = (lane: number, k: number) =>
    offReference(nodeBefore[lane][k]) && offReference(nodeAfter[lane][k + 1]);

  /* Each step from one entry to the next either carries on into the next
     column, and bends in the gap in front of it, or it does not - the
     haplotype left the window, or walked backwards - and is a seam. */
  interface Member {
    lane: number;
    entry: number;
    a: TrackEntry;
    b: TrackEntry;
  }
  const groups = new Map<number, Member[]>();
  const seams: TubeSeam[] = [];
  tracks.forEach((track, lane) => {
    for (let k = 0; k + 1 < track.length; k++) {
      const a = track[k];
      const b = track[k + 1];
      if (a.joined) {
        const member = { lane, entry: k, a, b };
        const group = groups.get(b.column);
        if (group) group.push(member);
        else groups.set(b.column, [member]);
      } else {
        seams.push({
          lane,
          entry: k,
          x0: spans[lane][k].right,
          y0: a.y,
          x1: spans[lane][k + 1].left,
          y1: b.y,
        });
      }
    }
  });

  const zoneOut = tracks.map((track) => new Array<number>(track.length));
  const zoneIn = tracks.map((track) => new Array<number>(track.length));
  const crossings: TubeCrossing[] = [];

  for (const [column, members] of groups) {
    const x1 = columnLeft[column];
    const x0 = x1 - axis.gapBefore[column];
    for (const { lane, entry } of members) {
      zoneOut[lane][entry] = x0;
      zoneIn[lane][entry + 1] = x1;
    }
    if (!(x1 > x0)) continue;

    const pieces = weave(
      members,
      (m) => `${m.a.item.key}>${m.b.item.key}`,
      (m) => m.lane,
    ).map(
      (m, z): TubePiece => ({
        lane: m.lane,
        x0,
        x1,
        y0: m.a.y,
        y1: m.b.y,
        z,
        from: m.entry,
        to: m.entry + 1,
        split: (x0 + x1) / 2,
        thin: altLink(m.lane, m.entry),
      }),
    );
    crossings.push({ column, x0, x1, pieces });
  }
  crossings.sort((p, q) => p.x0 - q.x0);

  /* Between the gaps a tube runs straight - across the empty end of a short
     allele too, and right across a column it passes over. Across a column
     passed over, and past the end of an allele's own bases, it is on its way
     to the next node, so there it is thin if that way is a link between
     two alternative alleles. */
  const runs: TubePiece[] = [];
  tracks.forEach((track, lane) => {
    track.forEach((entry, k) => {
      const span = spans[lane][k];
      const x0 = zoneIn[lane][k] ?? span.left;
      const x1 = zoneOut[lane][k] ?? span.right;
      const run = (from: number, to: number, thin: boolean) => {
        if (!(to > from)) return;
        runs.push({
          lane,
          x0: from,
          x1: to,
          y0: entry.y,
          y1: entry.y,
          z: -1,
          from: k,
          to: k,
          split: to,
          thin,
        });
      };

      if (!entry.item.node) {
        run(
          x0,
          x1,
          offReference(nodeBefore[lane][k]) &&
            offReference(nodeAfter[lane][k]),
        );
      } else if (entry.joined && altLink(lane, k) && x1 > span.right) {
        run(x0, span.right, false);
        run(Math.max(x0, span.right), x1, true);
      } else {
        run(x0, x1, false);
      }
    });
  });

  const byLane: TubePiece[][] = model.lanes.map(() => []);
  for (const run of runs) byLane[run.lane].push(run);
  for (const crossing of crossings) {
    for (const piece of crossing.pieces) byLane[piece.lane].push(piece);
  }
  for (const list of byLane) list.sort((p, q) => p.x0 - q.x0 || p.x1 - q.x1);

  return {
    tubeH,
    stacks,
    boxes,
    columnLeft,
    boxesByColumn,
    spans,
    runs,
    crossings,
    seams,
    byLane,
  };
}

/** Where a piece's centre line is at `x`. */
export function curveY(piece: TubePiece, x: number): number {
  if (piece.y0 === piece.y1 || !(piece.x1 > piece.x0)) return piece.y0;
  const u = Math.min(1, Math.max(0, (x - piece.x0) / (piece.x1 - piece.x0)));
  /* With both control points half way across, the curve's x runs as
     1.5t(1-t) + t^3 of the way over - always forward, so t can be found by
     halving - and its y as 3t^2 - 2t^3 of the way down. */
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 24; k++) {
    const t = (lo + hi) / 2;
    if (1.5 * t * (1 - t) + t * t * t < u) lo = t;
    else hi = t;
  }
  const t = (lo + hi) / 2;
  return piece.y0 + (piece.y1 - piece.y0) * (3 * t * t - 2 * t * t * t);
}

/** Which tube is drawn on top at a point, and which entry of its track. */
export function tubeAt(
  geometry: TubeGeometry,
  x: number,
  y: number,
): { lane: number; entry: number } | null {
  const half = geometry.tubeH / 2;
  let best: { lane: number; entry: number } | null = null;
  let bestZ = -Infinity;

  geometry.byLane.forEach((pieces, lane) => {
    let lo = 0;
    let hi = pieces.length - 1;
    let found = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (pieces[mid].x0 <= x) {
        found = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    /* The piece starting at or before x, or the one before it when x is
       exactly where they meet. */
    for (const k of [found, found - 1]) {
      const piece = pieces[k];
      if (!piece || x > piece.x1) continue;
      /* A thin link is drawn a pixel or two wide, but it is a haplotype's
         way on like any other, so it answers for as much room as a tube.
         It cannot steal a tube's hit: it is drawn behind, and the z-order
         decides. */
      const reach = Math.max(piece.thin ? LINK_HIT : 0, half);
      if (Math.abs(y - curveY(piece, x)) <= reach && piece.z > bestZ) {
        bestZ = piece.z;
        best = { lane, entry: x < piece.split ? piece.from : piece.to };
      }
      break;
    }
  });
  return best;
}

/**
 * The seam at a point, if any.
 *
 * A seam is where a haplotype's tube stops and picks up again - it left the
 * window, or a column had no room to carry it through. It is drawn, so it
 * is pointed at, and a reader asking what the mark means gets an answer
 * rather than nothing.
 */
export function seamAt(
  geometry: TubeGeometry,
  x: number,
  y: number,
): TubeSeam | null {
  const reach = Math.max(geometry.tubeH / 2, LINK_HIT);
  let best: TubeSeam | null = null;
  let nearest = Infinity;
  for (const seam of geometry.seams) {
    /* Either way round: a haplotype can pick up again at a node drawn
       level with the one it stopped at, or behind it. */
    const left = Math.min(seam.x0, seam.x1);
    const right = Math.max(seam.x0, seam.x1);
    if (x < left - reach || x > right + reach) continue;
    const t = seam.x1 === seam.x0 ? 0 : (x - seam.x0) / (seam.x1 - seam.x0);
    const at = seam.y0 + (seam.y1 - seam.y0) * Math.min(1, Math.max(0, t));
    const gap = Math.abs(y - at);
    if (gap <= reach && gap < nearest) {
      nearest = gap;
      best = seam;
    }
  }
  return best;
}

/**
 * The node box at a point, if any.
 *
 * Whatever a box has a tube in belongs to the tube: a reader pointing inside
 * a box wants the haplotype there, not the box around it, and the caller
 * asks the tubes first. A box answers for the rest of itself - its label
 * strip, its foot, the room either side of a tube that has bent away - since
 * silence there is worse than the wrong answer.
 */
export function boxAt(
  geometry: TubeGeometry,
  x: number,
  y: number,
): TubeBox | null {
  const { columnLeft } = geometry;
  let lo = 0;
  let hi = columnLeft.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (columnLeft[mid] <= x) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  for (const box of geometry.boxesByColumn[found] ?? []) {
    if (x >= box.left && x < box.right && y >= box.top && y < box.bottom) {
      return box;
    }
  }
  return null;
}
