import type { Carriers } from "../../../../../getRemoteData/gbz/subgraph";
import { niceBpCount } from "../../../../../models/util";

/* ══════════════════════════════════════════════════════════════════════════
   Shared model behind both pangenome renderings.

   The gbz-base subgraph JSON is turned into a *linearized* graph: nodes are
   sorted into columns by their longest-path topological level, and every
   column is given a width in bases. Alternative alleles of the same site land
   in the same column and are stacked into rows, so the reference walk runs
   along row 0 and bubbles hang below it.

   That single layout drives both views:

     - the "vg viz" view uses the column x-offsets as a base-level coordinate
       and paints one bar per haplotype (figure 2c of Eizenga et al. 2020)
     - the tube map view uses the column x-offsets *and* the row assignment,
       and threads each haplotype through the nodes as a tube (figure 2d)

   A haplotype reaches us as several walks rather than one, because a walk
   that leaves the extracted window is cut there and resumes when it comes
   back. Those pieces are stitched into one lane, and the seams are kept so
   both views can draw the haplotype leaving the window.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Incoming data shapes (gbz-base subgraph JSON) ─────────────────────── */
export interface RawStep {
  id: string;
  is_reverse?: boolean;
}

export interface RawPath {
  name?: string;
  sample?: string;
  contig?: string;
  haplotype?: number;
  is_reference?: boolean;
  path?: RawStep[];
  /** The GBZ path the walk is a piece of: one continuous walk, whatever
      the window cut it into. */
  path_handle?: string;
}

export interface RawEdge {
  from: string;
  to: string;
  from_is_reverse?: boolean;
  to_is_reverse?: boolean;
}

/* ── Derived model ─────────────────────────────────────────────────────── */
export interface GraphNode {
  id: string;
  sequence: string;
  length: number;
  /** Column index: nodes sharing a column are alleles of the same site. */
  column: number;
  /** Linearized offset of the column, in bases from the left edge. */
  x: number;
  /** 0 for the reference allele, 1+ for the alternatives hanging below it. */
  row: number;
  /** Lane keys traversing this node, in lane order. */
  lanes: string[];
  onReference: boolean;
  /**
   * The stretch of the reference this node's site covers, in haplotype
   * coordinates. A node the reference walks through reports its own span; an
   * allele beside it reports the span of the site it is an alternative to. A
   * site the reference skips entirely is an insertion point, and reports a
   * zero-width span at the position it sits between.
   */
  refStart: number;
  refEnd: number;
  /** Nothing on the reference leads to it and it leads to nothing on the
      reference, in what was fetched: it has no place against the
      reference here, and is not drawn in the bars. */
  untied?: boolean;
  /** Where on the reference the reference's own path reads this node,
      when that is outside this band: its place is there, not here. Such a
      node is untied here too. */
  elsewhere?: number;
  /** For a copy - a walk's second time or more over a node, within one
      piece of it - the node it copies; see buildModel. */
  copyOf?: string;
}

/**
 * A haplotype jumping over reference: the white in its bar, and how much
 * it skips. An end is null where it lies outside the band - a deletion
 * running to a node the reference's path only reads elsewhere.
 */
export interface LaneDeletion {
  /** Where the white starts and ends, along the layout. */
  left: number | null;
  right: number | null;
  /** The reference it skips: `refFrom` up to `refTo`. */
  refFrom: number;
  refTo: number;
  bp: number;
  /** The visit on the reference here it leaves or rejoins at, as an index
      into the lane's steps, and the two nodes the jump is between, in
      walk order. */
  step: number;
  walk: [string, string];
  /** Which end is outside the band, if either: the end whose white runs
      to the band's edge. */
  open: "left" | "right" | null;
  /** Whether the haplotype reads the reference forwards here, its walk
      running left to right along the layout - false too where it switches
      strand, so a view drawing a deletion between its two steps leaves
      that one out. */
  forward: boolean;
  /** Where the walk switches strand, the first of the two steps it switches
      between: what is skipped there is not between those two - they are
      the two ends of an inverted stretch - but from where the stretch
      before the switch ends to where the one after it starts. */
  turn?: number;
}

/** A deletion's size, as genomealign gives a gap's: Kb from 10,000, Mb
    from 750,000, below that the count itself. */
export function deletionSize(bp: number): string {
  return bp >= 10000 ? niceBpCount(bp) : `${bp.toLocaleString()} bp`;
}

/** A deletion's label: "−5,045 bp →" for one running out of the band to
    the right, "← −980 bp" to the left, "−12 bp" for one inside it. */
export function deletionText(
  bp: number,
  open: "left" | "right" | null,
): string {
  const size = `−${deletionSize(bp)}`;
  return open === "left" ? `← ${size}` : open === "right" ? `${size} →` : size;
}

export interface LaneSegment {
  nodes: string[];
  /** Haplotype coordinates of the walk, when the walk name carries them. */
  start: number | null;
  end: number | null;
  /** The contig they are coordinates on - the lane's own, unless the lane
      joins a haplotype's contigs; see oneLanePerHaplotype. */
  contig?: string;
}

export interface Lane {
  key: string;
  label: string;
  sample: string;
  contig: string;
  haplotype: number;
  isReference: boolean;
  color: string;
  /** Vertical rank, shared by both views so a haplotype keeps its position. */
  index: number;
  segments: LaneSegment[];
  /** Every node the lane visits, in order, with the seams flattened out. */
  order: string[];
  /**
   * The same visits, each carrying its position in *this haplotype's* own
   * coordinates - which are not the reference's. Walks arrive named
   * `SAMPLE#HAP#CONTIG[start-end]`, and those starts are what these count from.
   */
  steps: LaneStep[];
  nodeSet: Set<string>;
  /** Bases of this haplotype inside the window. */
  bp: number;
  /** First to last position this haplotype occupies here, in its own coordinates. */
  interval: { start: number; end: number } | null;
  /** Where it jumps over the reference; see laneDeletions. */
  deletions?: LaneDeletion[];
}

/** One node visit by one haplotype, placed in that haplotype's coordinates. */
export interface LaneStep {
  node: string;
  start: number;
  end: number;
  /** Which of the lane's walks this visit belongs to. */
  segment: number;
  /** Read on the reverse strand: the haplotype has the node's bases
      reverse-complemented here - inside an inversion, or all along a contig
      assembled the other way round from the reference. */
  reverse?: boolean;
}

const COMPLEMENT: Record<string, string> = {
  A: "T",
  C: "G",
  G: "C",
  T: "A",
  a: "t",
  c: "g",
  g: "c",
  t: "a",
};

/** A sequence as the other strand reads it: complemented, back to front. */
export function reverseComplement(sequence: string): string {
  let out = "";
  for (let i = sequence.length - 1; i >= 0; i--) {
    const base = sequence.charAt(i);
    out += COMPLEMENT[base] ?? base;
  }
  return out;
}

export interface GraphEdge {
  key: string;
  from: string;
  to: string;
  lanes: string[];
}

export interface Column {
  index: number;
  x: number;
  /** From its first node's start to its last node's end. Its nodes start
      where each is led to, not all at x - see buildModel; the tube map
      keeps a column as wide as its widest node, its nodes at its start:
      see columnarModel. */
  width: number;
  nodeIds: string[];
}

/* ── The band a drawing has to fill ─────────────────────────────────────
   A window is windowWidth pixels of the reference, and the browser keeps
   three of them fetched, so the band is windowWidth * 3. Pixels and bases
   are locked together by that: a drawing of any other width would mean
   panning by a window did not move by a window of bases, and every
   conversion between the two would be off by the difference.

   The extraction does not stop where the band does - it returns whole
   nodes, so it overshoots at both ends, by 0.4% of the band in a busy
   window and 13% in a quiet one where the nodes are long. Those bases are
   drawn where they belong, off the end of the band, and clipped. */
export interface DrawFrame {
  /** The base at x = 0. */
  startBp: number;
  /** The base at x = width. */
  endBp: number;
  /** How wide the band is in pixels: windowWidth per window fetched. */
  width: number;
  /* Which slice of the band the reader is actually looking at - the
     middle window of the three, the other two being runway. The drawing
     is fitted to this rather than to the band as a whole, because this is
     the part that has to show the region that was asked for. */
  viewFromPx: number;
  viewToPx: number;
}

export interface PangenomeModel {
  nodes: GraphNode[];
  nodeById: Map<string, GraphNode>;
  columns: Column[];
  lanes: Lane[];
  edges: GraphEdge[];
  reference: Lane | null;
  /** Total width of the linearized layout, in bases. */
  totalBp: number;
  rowCount: number;
  /** The stretch of the reference this whole subgraph covers. */
  referenceInterval: { start: number; end: number } | null;
  /** How many haplotypes the graph has, when `lanes` holds only some of
      them - a track row drawing one haplotype, or the strip alone. */
  laneCount?: number;
  /** How common each node and allele is in the whole pangenome, counted
      over every haplotype in the window rather than the lanes drawn. */
  carriers?: Carriers;
}

/**
 * A walk's passes over a stretch it reads more than once, made whole.
 *
 * A copy is named by how many times the walk's GBZ path has read its node -
 * see buildModel - but a pass can read nodes the earlier ones did not: the
 * allele a second copy carries and the first does not, or ground the first
 * pass started after. Counted node by node, those were read for the first
 * time, kept their own names, and were laid where the original is, with
 * whoever reads it in place: TOY04#2's first copy carries an SNP's
 * alternative and its second the reference's, and the two were drawn the
 * other way round; TOY01#1 reading an alternative only in a copy pulled a
 * haplotype reading it in place into the copy's room; NA21093#2's second
 * pass began with 146 bp at the window's edge laid over its first.
 *
 * So a run of steps between two steps of a later pass is on that pass where
 * those two are next to each other in the stretch - their originals one
 * after the other along the reference, the way the walk reads them, with
 * only the run's own ground between: an allele inside the copy. And a run
 * of nodes read for the first time at a piece's end, before or after a
 * copy, is on the copy's pass where it is on the copy's near side and on
 * ground the path read in place - the start or end of the pass. Without
 * the first test, in the amylase cluster stretches read in place between
 * two copies of different repeats went too, 1,892 steps of HG002#1 at
 * chr17:38.9 Mb among them. And only where the pass is anchored: out from
 * the run through the copy, the walk reaches a step read in place on the
 * reference, which is what gives a copy its place. A pass with none - a
 * window's piece starting and ending inside a repeat - is left as counted:
 * whole, nothing tied it, and three thousand nodes of HG02027#2 in the
 * amylase cluster went undrawn. Ground read on the same GBZ path only, as
 * passes are counted: another contig of the haplotype reading it is a
 * dupe, not a pass.
 *
 * `ranks` gives each step's place along the reference's walk, where it is
 * on it; `reverse`, its strand; `paths`, each piece's GBZ path. Changes
 * `passes` in place; the reference's own walk is not given to it.
 */
function wholePasses(
  passes: number[][],
  ranks: Array<Array<number | undefined>>,
  reverse: boolean[][],
  paths: Array<string | undefined>,
): void {
  /* Whether every step from `from` to `to` that is on the reference lies
     between `low` and `high` along it. */
  const between = (k: number, from: number, to: number, low: number, high: number) => {
    for (let j = from; j <= to; j++) {
      const rank = ranks[k][j];
      if (rank !== undefined && !(rank > low && rank < high)) return false;
    }
    return true;
  };

  /* Whether, out from the run from `from` to `to` through the steps on a
     later pass, the piece reaches one read in place on the reference. */
  const anchored = (k: number, from: number, to: number) => {
    const piece = passes[k];
    for (const step of [-1, 1]) {
      for (let j = step < 0 ? from - 1 : to + 1; j >= 0 && j < piece.length; j += step) {
        if (piece[j] !== 1) continue;
        if (ranks[k][j] !== undefined) return true;
      }
    }
    return false;
  };

  /* Inside: a run of one lower pass with higher passes either side, until
     none is left - a run raised can leave its neighbour inside one. */
  passes.forEach((piece, k) => {
    for (let changed = true; changed; ) {
      changed = false;
      for (let from = 0; from < piece.length; ) {
        let to = from;
        while (to + 1 < piece.length && piece[to + 1] === piece[from]) to += 1;
        const left = piece[from - 1];
        const right = piece[to + 1];
        const l = ranks[k][from - 1];
        const r = ranks[k][to + 1];
        const backward = !!reverse[k][from - 1];
        if (
          left > piece[from] &&
          right > piece[from] &&
          l !== undefined &&
          r !== undefined &&
          backward === !!reverse[k][to + 1] &&
          (backward ? r < l : l < r) &&
          between(k, from, to, Math.min(l, r), Math.max(l, r)) &&
          anchored(k, from, to)
        ) {
          const pass = Math.min(left, right);
          for (let j = from; j <= to; j++) piece[j] = pass;
          changed = true;
        }
        from = to + 1;
      }
    }
  });

  /* At either end of a piece: ground read in place, as each piece's steps
     on the first pass reach along the reference - the run's own aside. */
  const inPlace = (piece: number, from: number, to: number) =>
    passes.map((steps, k) => {
      let low = Infinity;
      let high = -Infinity;
      if (paths[k] !== paths[piece]) return { low, high };
      steps.forEach((pass, j) => {
        const rank = ranks[k][j];
        if (pass !== 1 || rank === undefined) return;
        if (k === piece && j >= from && j <= to) return;
        low = Math.min(low, rank);
        high = Math.max(high, rank);
      });
      return { low, high };
    });
  passes.forEach((piece, k) => {
    for (const end of ["start", "end"] as const) {
      if (!piece.length || piece[end === "start" ? 0 : piece.length - 1] !== 1) continue;
      /* The run of first readings from the piece's end to the copy. */
      const step = end === "start" ? 1 : -1;
      let at = end === "start" ? 0 : piece.length - 1;
      while (at >= 0 && at < piece.length && piece[at] === 1) at += step;
      if (at < 0 || at >= piece.length) continue;
      const [from, to] = end === "start" ? [0, at - 1] : [at + 1, piece.length - 1];
      const copy = ranks[k][at];
      if (copy === undefined) continue;
      /* Before a copy read forwards, its near side is to the left; after
         it, to the right; read backwards, the other way. */
      const left = (end === "start") !== !!reverse[k][at];
      if (!between(k, from, to, left ? -Infinity : copy, left ? copy : Infinity)) continue;
      if (!anchored(k, from, to)) continue;
      const ground = inPlace(k, from, to);
      let inside = true;
      for (let j = from; j <= to; j++) {
        const rank = ranks[k][j];
        if (rank === undefined) continue;
        if (!ground.some(({ low, high }) => rank >= low && rank <= high)) inside = false;
      }
      if (!inside) continue;
      for (let j = from; j <= to; j++) piece[j] = piece[at];
    }
  });
}

/**
 * Where a lane jumps over the reference: from a node on it to the next one
 * it reads further along - inside the band, or outside it where the next
 * is a node the reference's path reads elsewhere. Read on the reference's
 * strand, so a walk against the reference says the same; a jump back
 * along it is a rearrangement, not a deletion, and is left out.
 */
function laneDeletions(
  lane: Lane,
  nodeById: Map<string, GraphNode>,
): LaneDeletion[] {
  const steps = lane.steps;
  const at = (i: number) => nodeById.get(steps[i].node);
  const known = (node: GraphNode | undefined): node is GraphNode =>
    !!node && (node.onReference || node.elsewhere !== undefined);
  const startOn = (node: GraphNode) =>
    node.onReference ? node.refStart : node.elsewhere!;
  const endOn = (node: GraphNode) =>
    node.onReference ? node.refEnd : node.elsewhere! + node.length;
  const joined = (i: number) => steps[i].segment === steps[i + 1].segment;
  const same = (i: number, j: number) =>
    j >= 0 && j < steps.length && steps[j].segment === steps[i].segment;
  /* Each step's stretch on one strand, within its piece: where it starts
     and ends in the walk. */
  const runFrom: number[] = [];
  const runTo: number[] = [];
  steps.forEach((step, i) => {
    runFrom[i] =
      i > 0 && joined(i - 1) && !steps[i - 1].reverse === !step.reverse
        ? runFrom[i - 1]
        : i;
  });
  for (let i = steps.length - 1; i >= 0; i--) {
    runTo[i] =
      i + 1 < steps.length && joined(i) && !steps[i + 1].reverse === !steps[i].reverse
        ? runTo[i + 1]
        : i;
  }
  /* Where the walk switches strand the two steps are the ends of an
     inverted stretch, not neighbours on the reference - TOY03#2 switches
     from v1, at the inversion's left end, to r3b, 41 bp to the right of it,
     having read all but the last 16 of them backwards. So what is skipped
     there is the reference from where the stretch before the switch ends
     to where the one after it starts, along it - in the direction the
     haplotype goes on across the switch, as the reference nodes either
     side of it say: see buildModel's strand runs. An allele at a stretch's
     end counts for the reference it stands in for: left out, InvEnd's X,
     read for D at an inversion's end, made D a deletion. */
  const placed = (node: GraphNode | undefined): node is GraphNode =>
    !!node && !node.untied;
  /* On the reference's path, here or where it reads it elsewhere. */
  const onPath = (node: GraphNode) =>
    node.onReference || node.elsewhere !== undefined;
  const from = (node: GraphNode) =>
    onPath(node) ? startOn(node) : node.refStart;
  const until = (node: GraphNode) =>
    onPath(node) ? endOn(node) : node.refEnd;
  /* Drawn in this band, rather than read where the reference reads it
     outside it. */
  const here = (node: GraphNode) => node.elsewhere === undefined;
  const acrossSwitch = (i: number): LaneDeletion | null => {
    let p = i;
    while (same(i, p) && !at(p)?.onReference) p -= 1;
    let q = i + 1;
    while (same(i, q) && !at(q)?.onReference) q += 1;
    const leaves = same(i, p) ? at(p) : undefined;
    const rejoins = same(i, q) ? at(q) : undefined;
    if (!leaves || !rejoins || leaves.refStart === rejoins.refStart) return null;
    const onward = rejoins.refStart > leaves.refStart;
    const before = [runFrom[i], i];
    const after = [i + 1, runTo[i + 1]];
    const [left, right] = onward ? [before, after] : [after, before];
    let low: GraphNode | undefined;
    let lowAt = -1;
    for (let j = left[0]; j <= left[1]; j++) {
      const node = at(j);
      if (placed(node) && (!low || until(node) > until(low))) {
        low = node;
        lowAt = j;
      }
    }
    let high: GraphNode | undefined;
    let highAt = -1;
    for (let j = right[0]; j <= right[1]; j++) {
      const node = at(j);
      if (placed(node) && (!high || from(node) < from(high))) {
        high = node;
        highAt = j;
      }
    }
    if (!low || !high || (!here(low) && !here(high))) return null;
    const bp = from(high) - until(low);
    if (bp <= 0) return null;
    return {
      left: here(low) ? low.x + low.length : null,
      right: here(high) ? high.x : null,
      refFrom: until(low),
      refTo: from(high),
      bp,
      step: here(high) ? highAt : lowAt,
      walk: [steps[i].node, steps[i + 1].node],
      open: !here(low) ? "left" : !here(high) ? "right" : null,
      forward: false,
      turn: i,
    };
  };
  const out: LaneDeletion[] = [];
  for (let i = 0; i + 1 < steps.length; i++) {
    if (!joined(i)) continue;
    /* On the pair's own strand - read backwards, b is before a. One way for
       the whole lane, an inversion's steps were read the wrong way round. */
    if (!steps[i].reverse !== !steps[i + 1].reverse) {
      const skipped = acrossSwitch(i);
      if (skipped) out.push(skipped);
      continue;
    }
    const a = at(i);
    const b = at(i + 1);
    if (!known(a) || !known(b)) continue;
    /* Both elsewhere: nothing of it is here. */
    if (!a.onReference && !b.onReference) continue;
    const forward = !steps[i].reverse;
    const [low, high] = forward ? [a, b] : [b, a];
    const bp = startOn(high) - endOn(low);
    if (bp <= 0) continue;
    out.push({
      left: low.onReference ? low.x + low.length : null,
      right: high.onReference ? high.x : null,
      refFrom: endOn(low),
      refTo: startOn(high),
      bp,
      step: a.onReference ? i : i + 1,
      walk: [a.id, b.id],
      open: !low.onReference ? "left" : !high.onReference ? "right" : null,
      forward,
    });
  }
  return out;
}

/** How many haplotypes the graph has, however many lanes this model draws. */
export const laneTotal = (model: PangenomeModel) =>
  model.laneCount ?? model.lanes.length;

/* ── Palette ───────────────────────────────────────────────────────────── */
/* The reference is the line every other haplotype is read against, so it
   gets the one colour nothing else is allowed near. */
export const REF_COLOR = "#30afff";

/**
 * A haplotype's own pastel, from its name: the same name gets the same
 * colour whatever else is loaded, in whatever order, in any session. Colours
 * used to be handed out from a list in the order haplotypes arrived, so
 * loading one more changed everybody's.
 *
 * The name is hashed (FNV-1a, then mixed so names a character apart land
 * far apart) and the hash picks the hue - leaving out the 25 degrees around
 * the reference's blue, so no haplotype is taken for it - and nudges the
 * saturation and lightness within a pastel's range, so two names of near
 * hues still differ. Light enough to read the letters' black chips on, dark
 * enough for the ivory hatching to show.
 */
export function pastelColor(name: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) {
    hash ^= name.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  hash >>>= 0;
  let hue = hash % 335;
  if (hue >= 188) hue += 25;
  const saturation = 45 + ((hash >>> 12) % 21);
  const lightness = 68 + ((hash >>> 20) % 11);
  return hslToHex(hue, saturation, lightness);
}

/** An HSL colour - degrees, per cent, per cent - as #rrggbb. */
function hslToHex(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100;
  const l = lightness / 100;
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + hue / 30) % 12;
    const value = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

const numericCompare = (a: string, b: string) =>
  String(a).localeCompare(String(b), undefined, { numeric: true });

/** `MHC-GRCh38#0#MHC[4073899-4074353]` -> its parts. */
const WALK_NAME = /^(.*?)#(\d+)#([^[\]]+?)(?:\[(\d+)-(\d+)\])?$/;

function parseWalkName(raw: RawPath, fallback: string) {
  const match = raw.name ? WALK_NAME.exec(raw.name) : null;
  if (match) {
    return {
      sample: raw.sample ?? match[1],
      haplotype: raw.haplotype ?? Number(match[2]),
      contig: raw.contig ?? match[3],
      start: match[4] !== undefined ? Number(match[4]) : null,
      end: match[5] !== undefined ? Number(match[5]) : null,
    };
  }
  return {
    sample: raw.sample ?? raw.name ?? fallback,
    haplotype: raw.haplotype ?? 0,
    contig: raw.contig ?? "?",
    start: null,
    end: null,
  };
}

/**
 * Builds the layout. Returns null when there is nothing to draw, which is the
 * normal answer for a tile that falls outside the part of the graph covered by
 * the queried haplotype.
 */
export function buildModel(queryResult: any): PangenomeModel | null {
  const result = queryResult?.result ?? queryResult;
  console.log(result);
  const rawNodes: Array<{ id: string; sequence?: string }> =
    result?.nodes ?? [];
  const rawPaths: RawPath[] = result?.paths ?? [];
  const rawEdges: RawEdge[] = result?.edges ?? [];
  if (!rawNodes.length) return null;

  const sequences = new Map<string, string>();
  rawNodes.forEach((n) => sequences.set(n.id, n.sequence ?? ""));
  /* Every node, and the copies walks are given of nodes they read again
     (see the lanes below); a copy's own id is `node~pass`. */
  const nodeList: Array<{ id: string; sequence?: string }> = [...rawNodes];
  const copyOf = new Map<string, string>();

  /* ── Lanes: stitch each haplotype's walks back together ──────────────── */
  interface Draft {
    sample: string;
    contig: string;
    haplotype: number;
    isReference: boolean;
    firstSeen: number;
    segments: Array<LaneSegment & { path?: string; reverse?: boolean[] }>;
  }

  const drafts = new Map<string, Draft>();

  /* The queried reference walk is the one flagged is_reference. A result
     without the flag falls back on its first walk, which is where
     gbz-base writes it. */
  const flaggedAt = rawPaths.findIndex((raw) => raw.is_reference === true);
  const queriedAt = flaggedAt >= 0 ? flaggedAt : rawPaths.length ? 0 : -1;
  const isQueried = (raw: RawPath, i: number) =>
    flaggedAt >= 0 ? raw.is_reference === true : i === 0;
  /** Which path a walk is on: its sample, haplotype and contig. */
  const pathKeyOf = (walk: {
    sample: string;
    haplotype: number;
    contig: string;
  }) => `${walk.sample}#${walk.haplotype}#${walk.contig}`;

  const referenceKey =
    queriedAt < 0
      ? null
      : pathKeyOf(parseWalkName(rawPaths[queriedAt], `walk-${queriedAt}`));

  rawPaths.forEach((raw, i) => {
    const parsed = parseWalkName(raw, `walk-${i}`);
    const isReference = isQueried(raw, i);
    const pathKey = pathKeyOf(parsed);
    /* The reference is the walk over the queried region, and only that.
       The same path can come back elsewhere through context - CHM13's own
       chr6 at 32,370,665, a repeat of 32,365,933 - and joined to the
       reference lane it was numbered as if it went on from there, 4.7 kb
       out. It is a walk like any haplotype's, placed by the graph. */
    const key =
      !isReference && pathKey === referenceKey
        ? `${pathKey}#elsewhere`
        : pathKey;

    let draft = drafts.get(key);
    if (!draft) {
      draft = {
        sample: parsed.sample,
        contig: parsed.contig,
        haplotype: parsed.haplotype,
        isReference,
        firstSeen: i,
        segments: [],
      };
      drafts.set(key, draft);
    }
    draft.isReference = draft.isReference || isReference;
    draft.segments.push({
      nodes: (raw.path ?? []).map((s) => s.id),
      start: parsed.start,
      end: parsed.end,
      path: raw.path_handle,
      reverse: (raw.path ?? []).map((s) => !!s.is_reverse),
    });
  });

  /* Where each node is along the reference's walk, in order: what says
     whether a pass of another walk is over ground its first pass read. */
  const referenceRank = new Map<string, number>();
  for (const draft of drafts.values()) {
    if (!draft.isReference) continue;
    const pieces = draft.segments
      .slice()
      .sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
    for (const piece of pieces) {
      for (const id of piece.nodes) {
        if (!referenceRank.has(id)) referenceRank.set(id, referenceRank.size);
      }
    }
  }

  const lanes: Lane[] = Array.from(drafts.entries())
    /* Reference first, then in the order the walks arrived. */
    .sort(([, a], [, b]) => {
      if (a.isReference !== b.isReference) return a.isReference ? -1 : 1;
      return a.firstSeen - b.firstSeen;
    })
    .map(([key, draft], index) => {
      /* Walks of one haplotype arrive out of order; genomic start restores it. */
      const sorted = draft.segments
        .slice()
        .sort((a, b) => (a.start ?? 0) - (b.start ?? 0))
        .filter((s) => s.nodes.length > 0);
      /* A walk that comes back over nodes it has already passed - a stretch
         the haplotype has twice in a row - reads them the
         second time as copies: the same bases, nodes of their own, so the
         second pass is laid out where it is in the haplotype, after the
         first, as the insertion it is, and the reference makes room for it.
         Laid over the first pass, as it was, the haplotype read as having
         two alleles at one place, and whatever it read between the passes
         could land as an alternative to the reference's next node: A B A C
         against the reference's A C put B in C's column, a substitution,
         where it is an insertion of B and A again. Copies are numbered by
         pass, not by haplotype, so haplotypes carrying the same
         duplication share them and line up. Passes are counted along the
         GBZ path, across the pieces the window cuts it into: zoomed in, the
         two passes of HG02074#2's 14 kb duplication at chr14:99,979,807 are
         pieces of their own, and counted per piece they were laid over each
         other where the wider view had the second as an insertion. A stretch
         read again on another GBZ path is left as it is: where that path
         lies against this one, the graph does not say. What a pass reads
         that the earlier ones did not is on that pass too: see
         wholePasses. */
      const passesOn = new Map<string, Map<string, number>>();
      const passOf = sorted.map((segment, k) => {
        const along = segment.path ?? `piece ${k}`;
        const passes = passesOn.get(along) ?? new Map<string, number>();
        passesOn.set(along, passes);
        return segment.nodes.map((id) => {
          const pass = (passes.get(id) ?? 0) + 1;
          passes.set(id, pass);
          return pass;
        });
      });
      if (!draft.isReference) {
        wholePasses(
          passOf,
          sorted.map((segment) => segment.nodes.map((id) => referenceRank.get(id))),
          sorted.map((segment) => segment.reverse ?? []),
          sorted.map((segment, k) => segment.path ?? `piece ${k}`),
        );
      }
      /* Each piece's steps' strands, for its steps below. */
      const strands: boolean[][] = [];
      /* No two readings of a node by one path one name, whatever the
         passes above made of them. */
      const named = new Map<string, Set<number>>();
      const segments = sorted.map(({ path, reverse, ...segment }, k) => {
        strands[k] = reverse ?? [];
        const along = path ?? `piece ${k}`;
        return {
          ...segment,
          contig: draft.contig,
          nodes: segment.nodes.map((id, j) => {
            const used = named.get(`${along}\t${id}`) ?? new Set<number>();
            named.set(`${along}\t${id}`, used);
            let pass = passOf[k][j];
            while (used.has(pass)) pass += 1;
            used.add(pass);
            if (pass === 1) return id;
            const copy = `${id}~${pass}`;
            if (!copyOf.has(copy)) {
              copyOf.set(copy, id);
              const sequence = sequences.get(id) ?? "";
              sequences.set(copy, sequence);
              nodeList.push({ id: copy, sequence });
            }
            return copy;
          }),
        };
      });
      /* Each walk carries its own start, so positions are counted from there
         rather than from the reference. A walk whose name had no coordinates
         continues from wherever the previous one ended. */
      const order: string[] = [];
      const steps: LaneStep[] = [];
      let cursor = segments[0]?.start ?? 0;
      segments.forEach((segment, segmentIndex) => {
        if (segment.start !== null) cursor = segment.start;
        segment.nodes.forEach((id, j) => {
          const length = (sequences.get(id) ?? "").length;
          order.push(id);
          steps.push({
            node: id,
            start: cursor,
            end: cursor + length,
            segment: segmentIndex,
            ...(strands[segmentIndex][j] ? { reverse: true } : {}),
          });
          cursor += length;
        });
      });

      const nodeSet = new Set(order);
      let bp = 0;
      nodeSet.forEach((id) => {
        bp += (sequences.get(id) ?? "").length;
      });
      const interval = steps.length
        ? { start: steps[0].start, end: steps[steps.length - 1].end }
        : null;
      return {
        key,
        label: `${draft.sample}#${draft.haplotype}`,
        sample: draft.sample,
        contig: draft.contig,
        haplotype: draft.haplotype,
        isReference: draft.isReference,
        color: draft.isReference
          ? REF_COLOR
          : pastelColor(`${draft.sample}#${draft.haplotype}`),
        index,
        segments,
        order,
        steps,
        nodeSet,
        bp,
        interval,
      };
    });

  const reference = lanes.find((l) => l.isReference) ?? null;

  /* ── Nodes: which lanes touch them ───────────────────────────────────── */
  const laneKeys = new Map<string, string[]>();
  nodeList.forEach((n) => laneKeys.set(n.id, []));

  /* The lanes are walked one after another, so a node already holds this
     lane exactly when this lane was the last to add itself. Asking that
     rather than searching the list keeps this linear: HPRC v2 has 392 lanes
     and a million and a half steps between them. */
  const lastLane = new Map<string, string>();
  lanes.forEach((lane) => {
    lane.order.forEach((id) => {
      const at = laneKeys.get(id);
      if (!at) return; // a step into a node the subgraph does not carry
      if (lastLane.get(id) !== lane.key) {
        lastLane.set(id, lane.key);
        at.push(lane.key);
      }
    });
  });

  /* ── Edges ───────────────────────────────────────────────────────────── */
  /* Found by where it starts and then where it ends, rather than by its key:
     every step of every haplotype asks, millions in a busy window, and
     building "from>to" for each was most of the time this took. The key is
     made once, with the edge. The insertion order the edges come out in is
     kept by the list. */
  const edgesFrom = new Map<string, Map<string, GraphEdge>>();
  const edgeList: GraphEdge[] = [];
  const touchEdge = (from: string, to: string) => {
    let out = edgesFrom.get(from);
    if (!out) {
      out = new Map();
      edgesFrom.set(from, out);
    }
    let edge = out.get(to);
    if (!edge) {
      edge = { key: `${from}>${to}`, from, to, lanes: [] };
      out.set(to, edge);
      edgeList.push(edge);
    }
    return edge;
  };

  /* Edges a walk turns over across - one end read on each strand, an
     inversion's ends - say only that the two are side by side, not which
     comes first, and the layout leaves them out; see the strand runs below.
     Taken as written, the end of an inverted stretch in a contig read
     backwards was tied to the wrong side of the stretch. Two nodes can be
     linked both ways, so only an edge nothing reads end to start. */
  const turns = new Set<GraphEdge>();
  const straight = new Set<GraphEdge>();
  rawEdges.forEach((e) => {
    /* A link read on the other strand at both ends is the same link read
       forwards the other way round - 118− → 863− is 863+ → 118+ - and the
       worker writes each link in one of its two forms. Taken as written it
       ran backwards: at chr6:70,700,000 it made a loop with the walk that
       really goes 863 → 118, and the layout cut that walk's step. A link
       reversed at one end only is an inversion, which is left as it is. */
    const [from, to] =
      e.from_is_reverse && e.to_is_reverse ? [e.to, e.from] : [e.from, e.to];
    if (sequences.has(from) && sequences.has(to)) {
      const edge = touchEdge(from, to);
      (!e.from_is_reverse !== !e.to_is_reverse ? turns : straight).add(edge);
    }
  });
  /* As for the nodes: the last lane to cross an edge is the only one it
     could already list. */
  const lastCrossed = new Map<GraphEdge, string>();
  lanes.forEach((lane) => {
    const steps = lane.steps;
    for (let i = 0; i + 1 < steps.length; i++) {
      const a = steps[i];
      const b = steps[i + 1];
      if (a.segment !== b.segment) continue;
      if (!sequences.has(a.node) || !sequences.has(b.node)) continue;
      /* On the reference's strand, as the links are: read backwards, b is
         before a. Taken as written, an inversion's steps ran against the
         reference, looping with its own. */
      const edge =
        a.reverse && b.reverse
          ? touchEdge(b.node, a.node)
          : touchEdge(a.node, b.node);
      (!a.reverse !== !b.reverse ? turns : straight).add(edge);
      if (lastCrossed.get(edge) !== lane.key) {
        lastCrossed.set(edge, lane.key);
        edge.lanes.push(lane.key);
      }
    }
  });
  const edges = edgeList;

  /* ── Columns: longest-path level, from the graph alone ────────────────
     Where a node is drawn is where the graph puts it against the
     reference: after everything it is reached from, the reference's own
     walk in order, and nothing else. Levels used to start from how far
     into some haplotype's walk a node was, which keeps nodes that no edge
     reaches off column 0 - but a count of steps is a property of what was
     fetched, not of the graph: the same allele came out 67 bp from where
     it joins the reference in one window, and over reference bases past
     where it leaves in another (the MHC's 2 kb insertion at 4,074,838-849,
     loaded straight there and panned to). What such a node is tied to is
     said below instead. */
  const ids = nodeList.map((n) => n.id);
  const level = new Map<string, number>();
  ids.forEach((id) => level.set(id, 0));

  const onReferenceWalk = reference?.nodeSet ?? new Set<string>();
  const referenceOrder = reference?.order ?? [];

  /* What a haplotype in pieces says about where they go. One piece ending
     off the reference and the next one starting off it is the haplotype
     going from the one to the other through sequence the window does not
     hold - the middle of an insertion longer than the window - so the
     second is laid out after the first, as one allele: from where the
     haplotype last left the reference to where it next rejoins it - which
     can be pieces away, a piece in the middle being the insertion alone
     (HG002#1 at chr6:32,340,254, in three). Only where that runs forward
     along the reference; a piece coming back earlier than the last one
     left is a rearrangement, and tying it would bend the reference to it.
     For laying out only - it is no edge of the graph's. */
  const referenceIndex = new Map<string, number>();
  referenceOrder.forEach((id, index) => {
    if (!referenceIndex.has(id)) referenceIndex.set(id, index);
  });
  /* Nodes the reference's own path reads outside this band, and where;
     see referenceElsewhere in subgraph.ts. Their place is there, so they
     tie nothing here: a haplotype that took a 5 kb deletion out of the
     window carried on into them, and laid out from where it left they
     were drawn as 5 kb of novel sequence, spelled against the wrong
     reference. Without their edges they are untied, and so is whatever
     only they tie, and the haplotype's bar is white past where it left. */
  const referenceAt: Record<string, number> = result?.referenceAt ?? {};
  const elsewhereAt = new Map<string, number>();
  for (const [id, at] of Object.entries(referenceAt)) {
    if (level.has(id) && !onReferenceWalk.has(id)) elsewhereAt.set(id, at);
  }
  /* A copy is where its walk reads it: right after the node before it.
     Read after a node the reference has outside this band, it is out there
     too, and so is the copy after it, the walk carrying on there; read after
     one in the band, it is an insertion here. Taken from its original, as
     this was, every copy of a node outside the band went outside with it: a
     query of B-C, on the reference's A B C D E, of a haplotype reading
     A B A C A D A E drew neither the A it reads between B and C nor the one
     after C, and the haplotype read as the reference across B|C. */
  for (const lane of lanes) {
    for (const segment of lane.segments) {
      for (let i = 1; i < segment.nodes.length; i++) {
        const id = segment.nodes[i];
        if (!copyOf.has(id) || onReferenceWalk.has(id)) continue;
        const at = elsewhereAt.get(segment.nodes[i - 1]);
        if (at !== undefined) elsewhereAt.set(id, at);
      }
    }
  }

  /* A walk going back into a stretch it has read before steps into a copy -
     X → A~2 - where the graph's link is X → A, which no walk here takes as
     it is. Laid out, that link tied X in front of the first pass. In a
     window holding both passes it closes a loop and is cut below, but
     zoomed in on where the second pass starts - HG02074#2 at
     chr14:99,965,778 - nothing cut it, and the reference made room there
     for what the wider view lays 14 kb on. */
  const original = (id: string) => copyOf.get(id) ?? id;
  const intoRepeat = new Set<string>();
  for (const edge of edges) {
    if (copyOf.has(edge.to)) {
      intoRepeat.add(`${original(edge.from)}>${original(edge.to)}`);
    }
  }

  const layoutEdges: Array<{ from: string; to: string }> = edges
    .filter(({ from, to }) => !elsewhereAt.has(from) && !elsewhereAt.has(to))
    .filter((edge) => edge.lanes.length > 0 || !intoRepeat.has(edge.key))
    .filter((edge) => !turns.has(edge) || straight.has(edge))
    .map(({ from, to }) => ({ from, to }));
  console.log(layoutEdges, lanes, sequences, copyOf, nodeList);
  for (const lane of lanes) {
    if (lane.isReference) continue;
    const pieces = lane.segments.map((segment) => segment.nodes);
    /* The strand each piece starts and ends on. */
    const strandOf: Array<{ first: boolean; last: boolean }> = [];
    for (const step of lane.steps) {
      const at = (strandOf[step.segment] ??= {
        first: !!step.reverse,
        last: !!step.reverse,
      });
      at.last = !!step.reverse;
    }
    /* Where the haplotype was last on the reference by the end of each
       piece, and where it is next on it from the start of each. */

    const lastOn: Array<number | undefined> = [];
    pieces.forEach((nodes, k) => {
      const own = [...nodes].reverse().find((id) => referenceIndex.has(id));

      lastOn[k] =
        own !== undefined
          ? referenceIndex.get(own)
          : k > 0
            ? lastOn[k - 1]
            : undefined;
    });

    const nextOn: Array<number | undefined> = [];
    for (let k = pieces.length - 1; k >= 0; k--) {
      const own = pieces[k].find((id) => referenceIndex.has(id));

      nextOn[k] =
        own !== undefined
          ? referenceIndex.get(own)
          : k + 1 < pieces.length
            ? nextOn[k + 1]
            : undefined;
    }

    for (let k = 0; k + 1 < pieces.length; k++) {
      const last = pieces[k][pieces[k].length - 1];
      const first = pieces[k + 1][0];
      if (onReferenceWalk.has(last) || onReferenceWalk.has(first)) continue;
      if (elsewhereAt.has(last) || elsewhereAt.has(first)) continue;
      if (!level.has(last) || !level.has(first)) continue;

      const leaves = lastOn[k];
      const rejoins = nextOn[k + 1];
      if (leaves === undefined || rejoins === undefined) continue;
      /* Read backwards, the haplotype goes on to the left, the next piece
         before this one; turning over across the gap, which way is not
         known. */
      const backward = strandOf[k]?.last;
      if (backward !== strandOf[k + 1]?.first) continue;
      if (backward ? leaves <= rejoins : leaves >= rejoins) continue;
      layoutEdges.push(
        backward ? { from: first, to: last } : { from: last, to: first },
      );
    }
  }

  /* Across a turn the walk has no edge for the layout (see turns), so its
     runs on either strand are tied end to start along the reference: an
     inversion after what is before it, an inverted copy as an insertion
     where it is read. Which way along the reference the haplotype goes on
     across the turn is read off the reference nodes it reads either side
     of it - not off which strand most of the window reads, which inside a
     long inversion is the inversion's, so the rule turned over with the
     window. For laying out only. */
  for (const lane of lanes) {
    if (lane.isReference) continue;
    const steps = lane.steps;
    for (let at = 0; at < steps.length; ) {
      const piece = steps[at].segment;
      let end = at;
      while (end < steps.length && steps[end].segment === piece) end += 1;
      /* The reference's order at the nearest step on it, at or before each
         step of the piece, and at or after it. */
      const before: Array<number | undefined> = [];
      const after: Array<number | undefined> = [];
      for (let i = at; i < end; i++) {
        before[i] =
          referenceIndex.get(steps[i].node) ??
          (i > at ? before[i - 1] : undefined);
      }
      for (let i = end - 1; i >= at; i--) {
        after[i] =
          referenceIndex.get(steps[i].node) ??
          (i + 1 < end ? after[i + 1] : undefined);
      }
      const runs: Array<{ from: number; to: number; reverse: boolean }> = [];
      for (let i = at; i < end; i++) {
        const reverse = !!steps[i].reverse;
        const last = runs[runs.length - 1];
        if (last && last.reverse === reverse) last.to = i + 1;
        else runs.push({ from: i, to: i + 1, reverse });
      }
      /* Where a run starts and ends along the reference: read backwards,
         its last step is its left end. */
      const runStart = (run: (typeof runs)[number]) =>
        steps[run.reverse ? run.to - 1 : run.from].node;
      const runEnd = (run: (typeof runs)[number]) =>
        steps[run.reverse ? run.from : run.to - 1].node;
      for (let k = 0; k + 1 < runs.length; k++) {
        const leaves = before[runs[k].to - 1];
        const rejoins = after[runs[k + 1].from];
        /* Where the reference says nothing - the walk turning in a run of
           copies, and leaving the window before it is back on the
           reference, as in the amylase cluster - onward, in the order the
           walk reads them. Left untied instead, the copies had nothing
           else to hold them, and three thousand nodes of HG02027#2 went
           undrawn. */
        const back =
          leaves !== undefined && rejoins !== undefined && rejoins < leaves;
        const [left, right] = back
          ? [runs[k + 1], runs[k]]
          : [runs[k], runs[k + 1]];
        const from = runEnd(left);
        const to = runStart(right);
        if (!level.has(from) || !level.has(to)) continue;
        if (elsewhereAt.has(from) || elsewhereAt.has(to)) continue;
        layoutEdges.push({ from, to });
      }
      at = end;
    }
  }

  const successors = new Map<string, string[]>();
  console.log(layoutEdges, lanes);
  for (const edge of layoutEdges) {
    if (!level.has(edge.from) || !level.has(edge.to)) continue;
    const out = successors.get(edge.from);
    if (out) out.push(edge.to);
    else successors.set(edge.from, [edge.to]);
  }

  /* Each node's arrows reference first, in the reference's order, for the
     search below. The reference's own order needs no arrows of its own: it
     is one walk, the one over the region asked for, and every step it
     takes is an edge. */
  const alongReference = (id: string) => referenceIndex.get(id) ?? Infinity;
  for (const list of successors.values()) {
    list.sort((a, b) => {
      const x = alongReference(a);
      const y = alongReference(b);
      return x === y ? 0 : x < y ? -1 : 1;
    });
  }

  /* Arrows that loop back - a repeat a haplotype reads more than once, its
     walk going C → B after B → C - leave its nodes no column: B would have
     to come both before and after C. Laid out around, the levels climbed
     until a cap stopped them, a site's alleles landed columns apart and an
     insertion lost its room. So they are left out of the layout, and only
     the layout: the walk still takes them, and the bars draw its second
     time round over the first.

     Found by a depth-first search that keeps the path it is on: an arrow
     into a node still on that path is one that loops back. It starts from
     the reference's nodes in their own order and follows the reference's
     arrows first, so what is cut is the arrow going back, never one of the
     reference's own. */
  const loopsBack = new Set<string>();
  {
    const state = new Map<string, "on" | "done">();
    for (const start of [...referenceOrder, ...ids]) {
      if (!level.has(start) || state.has(start)) continue;
      state.set(start, "on");
      const path = [{ id: start, next: 0 }];
      while (path.length) {
        const top = path[path.length - 1];
        const nexts = successors.get(top.id) ?? [];
        if (top.next === nexts.length) {
          state.set(top.id, "done");
          path.pop();
          continue;
        }
        const next = nexts[top.next++];
        const seen = state.get(next);
        if (seen === "on") loopsBack.add(`${top.id}>${next}`);
        else if (seen === undefined) {
          state.set(next, "on");
          path.push({ id: next, next: 0 });
        }
      }
    }
  }
  if (loopsBack.size) {
    for (const [from, nexts] of successors) {
      successors.set(
        from,
        nexts.filter((to) => !loopsBack.has(`${from}>${to}`)),
      );
    }
  }

  /* With nothing looping back every node has a place in an order where it
     comes after all that lead to it, and each one's level is one past the
     furthest of those - all of it in one pass, a node being placed only
     once all its arrows in have been counted. */
  const waiting = new Map<string, number>();
  for (const nexts of successors.values()) {
    for (const to of nexts) waiting.set(to, (waiting.get(to) ?? 0) + 1);
  }
  const ordered: string[] = ids.filter((id) => !waiting.has(id));
  for (let at = 0; at < ordered.length; at++) {
    const id = ordered[at];
    const from = level.get(id)!;
    for (const next of successors.get(id) ?? []) {
      if (level.get(next)! < from + 1) level.set(next, from + 1);
      const left = waiting.get(next)! - 1;
      waiting.set(next, left);
      if (left === 0) ordered.push(next);
    }
  }

  /* A node nothing on the reference leads to - a haplotype coming into the
     window off the reference, its way in outside it - is tied only to
     where it joins. Laid out as late as that allows, so it sits against
     the node it joins rather than wherever its own predecessors would have
     started it, which is nowhere: column 0. A node leaving the window off
     the reference needs nothing of the kind - the longest path already
     puts it just past where it leaves. */
  const reached = new Set<string>();
  const reach = [...onReferenceWalk].filter((id) => level.has(id));
  for (const id of reach) reached.add(id);
  while (reach.length) {
    for (const next of successors.get(reach.pop()!) ?? []) {
      if (reached.has(next)) continue;
      reached.add(next);
      reach.push(next);
    }
  }
  /* And what leads to the reference: with what it leads from, what is
     tied to it at all. A node tied to neither has no place against it in
     what was fetched - in a small window, HG002#1 at chr6:32,365,590 had a
     piece of itself from 180 kb on, joined only to its own nodes, which
     the longest path started at the window's left edge. */
  const leadsTo = new Set<string>();
  {
    const into = new Map<string, string[]>();
    for (const [from, nexts] of successors) {
      for (const to of nexts) {
        const list = into.get(to);
        if (list) list.push(from);
        else into.set(to, [from]);
      }
    }
    const back = [...onReferenceWalk].filter((id) => level.has(id));
    for (const id of back) leadsTo.add(id);
    while (back.length) {
      for (const from of into.get(back.pop()!) ?? []) {
        if (leadsTo.has(from)) continue;
        leadsTo.add(from);
        back.push(from);
      }
    }
  }
  const pullUp = (id: string) => {
    if (reached.has(id)) return false;
    const next = successors.get(id);
    if (!next?.length) return false;
    const latest = Math.min(...next.map((other) => level.get(other)!)) - 1;
    if (latest <= level.get(id)!) return false;
    level.set(id, latest);
    return true;
  };
  for (let at = ordered.length - 1; at >= 0; at--) pullUp(ordered[at]);

  const byLevel = new Map<number, string[]>();
  ids.forEach((id) => {
    const lv = level.get(id) ?? 0;
    const bucket = byLevel.get(lv);
    if (bucket) bucket.push(id);
    else byLevel.set(lv, [id]);
  });

  const refNodes = reference?.nodeSet ?? new Set<string>();

  /* The reference always takes row 0 and every alternative hangs below it.
     That is what lets a haplotype following the reference run dead straight:
     it never changes row, so it never has to curve. Ordering by traffic
     instead would keep the rows shallower, but it lets the reference itself
     get bumped down wherever it is the minority allele, and then the spine of
     the picture wanders. Alternatives are ranked by traffic among themselves. */
  const byRow = (a: string, b: string) => {
    const aRef = refNodes.has(a);
    const bRef = refNodes.has(b);
    if (aRef !== bRef) return aRef ? -1 : 1;
    const d = (laneKeys.get(b)?.length ?? 0) - (laneKeys.get(a)?.length ?? 0);
    if (d !== 0) return d;
    return numericCompare(a, b);
  };

  const columns: Column[] = [];
  const nodeById = new Map<string, GraphNode>();
  let rowCount = 1;

  /* Reference coordinates advance only where the reference actually walks, so
     a column it skips is an insertion point and keeps the running position.

     Counted from the reference's longest piece, not its first. The reference
     can come back in more than one piece, and one can be a stray copy of a
     stretch from far away - in the MHC, 80 bp of CHM13 from 51 kb before
     the window, which it has twice. Counting on from that one put every
     base of the window 51 kb out. The longest is the window itself, so the
     count is set to agree with its own start where it begins. */
  const levels = Array.from(byLevel.keys()).sort((a, b) => a - b);
  const main = longestPiece(reference);
  let referenceOrigin =
    reference?.segments.find((s) => s.start !== null)?.start ?? 0;
  if (main && main.start !== null && main.nodes.length) {
    const mainLevel = level.get(main.nodes[0]);
    let before = 0;
    for (const lv of levels) {
      if (lv === mainLevel) break;
      const onRef = (byLevel.get(lv) ?? []).find((id) => refNodes.has(id));
      if (onRef) before += (sequences.get(onRef) ?? "").length;
    }
    referenceOrigin = main.start - before;
  }
  let cursor = referenceOrigin;

  /* ── Where each node starts, in bases ────────────────────────────────
     Each node on its own: where the latest of what leads into it ends, and
     the reference's walk in order. A column used to give all its nodes one
     start, as wide as its widest node, and an allele standing in for more
     than one reference node could not then lie over them. In the MHC, TG in
     place of the reference's A, A - two nodes, since other haplotypes read
     C, A - took the first A's column 2 bp wide and left a base of nothing
     in the reference and in every bar reading C. Starting columns by bases
     fixed that one but not two alleles a step apart that start at
     different bases: at chr6:32,357,609 on the HPRC graph X stands in for
     B, the reference's 1 bp after P, and Z for P's second base, after Y -
     one column, so Z started where P ended, a base late, and pushed B on.
     Placed node by node, X lies over B and Z over P's second base, and the
     reference moves on only where an allele is longer than what it stands
     in for - the room an insertion takes. Columns stay, for what is an
     alternative to what: sites, the strip's rows, the tube map. */
  const predecessors = new Map<string, string[]>();
  for (const [from, nexts] of successors) {
    for (const to of nexts) {
      const into = predecessors.get(to);
      if (into) into.push(from);
      else predecessors.set(to, [from]);
    }
  }
  /* A node of no sequence still takes a base, as a column did. */
  const roomOf = (id: string) => Math.max(1, (sequences.get(id) ?? "").length);
  const startOf = new Map<string, number>();
  /* In column order, which is an order every edge runs forward in. */
  for (const lv of levels) {
    for (const id of byLevel.get(lv) ?? []) {
      let at = 0;
      for (const from of predecessors.get(id) ?? []) {
        at = Math.max(at, (startOf.get(from) ?? 0) + roomOf(from));
      }
      startOf.set(id, at);
    }
  }
  /* What nothing on the reference leads to, as late as where it joins
     allows - as its column was pulled up, and for the same reason. */
  for (let at = levels.length - 1; at >= 0; at--) {
    for (const id of byLevel.get(levels[at]) ?? []) {
      if (reached.has(id)) continue;
      let latest = Infinity;
      for (const next of successors.get(id) ?? []) {
        latest = Math.min(latest, (startOf.get(next) ?? 0) - roomOf(id));
      }
      if (latest !== Infinity && latest > startOf.get(id)!)
        startOf.set(id, latest);
    }
  }
  let totalBp = 0;
  for (const [id, start] of startOf)
    totalBp = Math.max(totalBp, start + roomOf(id));

  levels.forEach((lv, columnIndex) => {
    const nodeIds = (byLevel.get(lv) ?? []).sort(byRow);
    /* A column is as far as its nodes reach. */
    const x = Math.min(...nodeIds.map((id) => startOf.get(id) ?? 0));
    const width =
      Math.max(...nodeIds.map((id) => (startOf.get(id) ?? 0) + roomOf(id))) - x;

    const onRef = nodeIds.find((id) => refNodes.has(id));
    const refStart = cursor;
    const refEnd = onRef
      ? cursor + (sequences.get(onRef) ?? "").length
      : cursor;
    cursor = refEnd;

    /* Row 0 belongs to the reference and to nothing else. Where the
         reference walks straight past a site - an insertion, which it has no
         allele for - the alternatives would otherwise take row 0 and be drawn
         level with the reference elsewhere. Pushing them down by one keeps the
         rule true everywhere: anything below row 0 is an alternative, and an
         alternative is always below the reference. */
    const indent = onRef ? 0 : 1;

    nodeIds.forEach((id, position) => {
      const sequence = sequences.get(id) ?? "";
      nodeById.set(id, {
        id,
        sequence,
        length: sequence.length,
        column: columnIndex,
        x: startOf.get(id) ?? x,
        row: position + indent,
        lanes: laneKeys.get(id) ?? [],
        onReference: refNodes.has(id),
        refStart,
        refEnd,
        ...(reached.has(id) || leadsTo.has(id) ? {} : { untied: true }),
        ...(elsewhereAt.has(id) ? { elsewhere: elsewhereAt.get(id) } : {}),
        ...(copyOf.has(id) ? { copyOf: copyOf.get(id) } : {}),
      });
    });
    rowCount = Math.max(rowCount, nodeIds.length + indent);
    columns.push({ index: columnIndex, x, width, nodeIds });
  });

  const referenceInterval = reference
    ? {
        start: referenceOrigin,
        end: cursor,
      }
    : null;

  for (const lane of lanes) {
    if (!lane.isReference) lane.deletions = laneDeletions(lane, nodeById);
  }

  return {
    nodes: ids.map((id) => nodeById.get(id)!).filter(Boolean),
    nodeById,
    columns,
    lanes,
    edges,
    reference,
    totalBp,
    rowCount,
    referenceInterval,
    carriers: result?.carriers,
  };
}

/**
 * The model with each haplotype's contigs in one lane: what its row of the
 * linear view draws, one bar. A haplotype comes as a lane per contig, and
 * where two of its contigs read one place - HG02074#2's 061 and 045 over
 * chr14:99,966,113 on - its row was two bars, one a dupe of the other.
 * Joined, the bar draws one reading there and the cards list the rest as
 * the place's dupes. The contig with the most bases here goes first, so its
 * reading is the one drawn where they meet; each piece keeps its contig, for
 * the cards to say whose coordinates are whose. Every haplotype's lane is
 * keyed by its name, joined or not, so the view can match a bar to the
 * lanes a node lists - per contig - by name.
 */
const joinedByModel = new WeakMap<PangenomeModel, PangenomeModel>();
export function oneLanePerHaplotype(model: PangenomeModel): PangenomeModel {
  const known = joinedByModel.get(model);
  if (known) return known;
  const byLabel = new Map<string, Lane[]>();
  for (const lane of model.lanes) {
    if (lane.isReference) continue;
    const group = byLabel.get(lane.label);
    if (group) group.push(lane);
    else byLabel.set(lane.label, [lane]);
  }
  const lanes: Lane[] = [];
  for (const lane of model.lanes) {
    if (lane.isReference) {
      lanes.push(lane);
      continue;
    }
    const group = byLabel.get(lane.label);
    if (!group || group[0] !== lane) continue;
    const ordered = [...group].sort((a, b) => b.bp - a.bp || a.index - b.index);
    lanes.push(joinLanes(ordered));
  }
  const joined = { ...model, lanes };
  joinedByModel.set(model, joined);
  return joined;
}

/** A haplotype's lanes as one, the first given first: its pieces, its
    steps renumbered to them, its deletions to its steps. */
function joinLanes(lanes: Lane[]): Lane {
  const [main] = lanes;
  const segments: LaneSegment[] = [];
  const steps: LaneStep[] = [];
  const order: string[] = [];
  const deletions: LaneDeletion[] = [];
  const nodeSet = new Set<string>();
  let bp = 0;
  for (const lane of lanes) {
    const pieces = segments.length;
    const before = steps.length;
    for (const segment of lane.segments) {
      segments.push({ ...segment, contig: segment.contig ?? lane.contig });
    }
    for (const step of lane.steps)
      steps.push({ ...step, segment: step.segment + pieces });
    order.push(...lane.order);
    for (const deletion of lane.deletions ?? []) {
      deletions.push({ ...deletion, step: deletion.step + before });
    }
    lane.nodeSet.forEach((id) => nodeSet.add(id));
    bp += lane.bp;
  }
  return {
    ...main,
    key: main.label,
    segments,
    steps,
    order,
    nodeSet,
    bp,
    deletions,
  };
}

/**
 * The model without the nodes that have no place against the reference in
 * this band - the untied ones, among them those the reference's own path
 * reads outside it: what the tube map and the variants view are drawn
 * from. The bars leave such nodes out as they draw (see laneRaster); these
 * views lay out every node they are given, so they are given only the
 * placed ones. Left in, the tube map gave them boxes at the band's left
 * edge and ran a haplotype's tube back across the band to them, and the
 * variants view made a site of them there.
 *
 * A haplotype's walk is cut where it went through one, as where it leaves
 * the window, so nothing is joined across it; its deletions are carried
 * over to the steps that are left.
 */
const placedByModel = new WeakMap<PangenomeModel, PangenomeModel>();
export function placedModel(model: PangenomeModel): PangenomeModel {
  const known = placedByModel.get(model);
  if (known) return known;
  if (!model.nodes.some((node) => node.untied)) {
    placedByModel.set(model, model);
    return model;
  }
  /* The columns that still hold a node, numbered again, each as far as its
     nodes reach. */
  const nodeById = new Map<string, GraphNode>();
  const columns: Column[] = [];
  for (const column of model.columns) {
    const nodes = column.nodeIds
      .map((id) => model.nodeById.get(id))
      .filter((node): node is GraphNode => !!node && !node.untied);
    if (!nodes.length) continue;
    const index = columns.length;
    for (const node of nodes) nodeById.set(node.id, { ...node, column: index });
    const x = Math.min(...nodes.map((node) => node.x));
    columns.push({
      ...column,
      index,
      x,
      width: Math.max(...nodes.map((node) => node.x + node.length)) - x,
      nodeIds: nodes.map((node) => node.id),
    });
  }
  const lanes = model.lanes.map((lane): Lane => {
    if (lane.steps.every((step) => nodeById.has(step.node))) return lane;
    const steps: LaneStep[] = [];
    /* Where each step that is left went, for the deletions. */
    const moved = new Map<number, number>();
    let piece = -1;
    let walk = -1;
    let cut = true;
    lane.steps.forEach((step, i) => {
      if (!nodeById.has(step.node)) {
        cut = true;
        return;
      }
      if (cut || step.segment !== walk) piece += 1;
      cut = false;
      walk = step.segment;
      moved.set(i, steps.length);
      steps.push({ ...step, segment: piece });
    });
    const segments: LaneSegment[] = [];
    for (const step of steps) {
      const at = segments[step.segment];
      if (at) {
        at.nodes.push(step.node);
        at.end = step.end;
      } else {
        segments[step.segment] = {
          nodes: [step.node],
          start: step.start,
          end: step.end,
        };
      }
    }
    const order = steps.map((step) => step.node);
    const nodeSet = new Set(order);
    let bp = 0;
    nodeSet.forEach((id) => {
      bp += nodeById.get(id)?.length ?? 0;
    });
    return {
      ...lane,
      segments,
      order,
      steps,
      nodeSet,
      bp,
      interval: steps.length
        ? { start: steps[0].start, end: steps[steps.length - 1].end }
        : null,
      deletions: lane.deletions?.flatMap((deletion) => {
        const step = moved.get(deletion.step);
        return step === undefined ? [] : [{ ...deletion, step }];
      }),
    };
  });
  const out: PangenomeModel = {
    ...model,
    nodes: model.nodes.flatMap((node) => {
      const kept = nodeById.get(node.id);
      return kept ? [kept] : [];
    }),
    nodeById,
    columns,
    lanes,
    edges: model.edges.filter(
      (edge) => nodeById.has(edge.from) && nodeById.has(edge.to),
    ),
    reference: lanes.find((lane) => lane.isReference) ?? null,
  };
  placedByModel.set(model, out);
  return out;
}

/**
 * The same layout with every column as wide as its widest node, and every
 * node at its column's start: what the tube map is drawn from. A tube map is
 * a column at a time - a stack of boxes, and the tubes moving between one
 * column and the next - so a node there stays in its own column rather
 * than running on over the next, as it does in the linear view. Of the
 * placed nodes only; see placedModel. The lanes' deletions keep their
 * steps, but their `left` and `right` are the linear view's.
 */
const columnar = new WeakMap<PangenomeModel, PangenomeModel>();
export function columnarModel(model: PangenomeModel): PangenomeModel {
  const known = columnar.get(model);
  if (known) return known;
  const base = placedModel(model);
  let x = 0;
  const nodeById = new Map<string, GraphNode>();
  const columns: Column[] = base.columns.map((column) => {
    const width = Math.max(
      1,
      ...column.nodeIds.map((id) => base.nodeById.get(id)?.length ?? 0),
    );
    for (const id of column.nodeIds) {
      const node = base.nodeById.get(id);
      if (node) nodeById.set(id, { ...node, x });
    }
    const at = { ...column, x, width };
    x += width;
    return at;
  });
  const out: PangenomeModel = {
    ...base,
    nodes: base.nodes.map((node) => nodeById.get(node.id) ?? node),
    nodeById,
    columns,
    totalBp: x,
  };
  columnar.set(model, out);
  return out;
}

/** How a band converts between the reference and its own pixels. */
export interface BandAxis {
  /** Pixels per unit of layout. */
  scale: number;
  /** The place along the layout drawn at x = 0. */
  originX: number;
  /** Where a place along the layout is drawn. */
  px: (graphX: number) => number;
  /** Where a reference coordinate is drawn. */
  pxAtBp: (bp: number) => number | null;
  /** Which coordinate is drawn at a pixel of this band. */
  bpAtPx: (atPx: number) => number | null;
}

/**
 * Fit a band to the window it has to show.
 *
 * The window keeps the pixels it was given and the region it was asked
 * for, and between them those fix the scale; the runway either side is
 * drawn at the same scale and comes out however wide its own sites need.
 *
 * Lifted out of the drawing because the pan needs it too: two
 * neighbouring bands do not agree on how many pixels a base is worth, so
 * crossing from one to the other means asking each of them separately.
 *
 * Null when the window's bases are not in this graph, which leaves the
 * drawing to lay itself out.
 */
export function bandAxis(
  model: PangenomeModel,
  frame: DrawFrame | undefined,
): BandAxis | null {
  if (!frame) return null;
  const bandBp = frame.endBp - frame.startBp;
  if (!(bandBp > 0) || !(frame.width > 0)) return null;

  const anchors = referenceTicks(model);
  if (anchors.length < 2) return null;

  /* The band is three equal windows of the reference, so a slice of its
     pixels is the same slice of its bases. */
  const bpAtBandPx = (atPx: number) =>
    frame.startBp + (atPx / frame.width) * bandBp;

  const viewFrom = graphXAtBp(anchors, bpAtBandPx(frame.viewFromPx));
  const viewTo = graphXAtBp(anchors, bpAtBandPx(frame.viewToPx));
  if (viewFrom === null || viewTo === null || viewTo <= viewFrom) {
    return null;
  }

  const scale = (frame.viewToPx - frame.viewFromPx) / (viewTo - viewFrom);
  /* Put the window's first base at the window's own left edge. */
  const originX = viewFrom - frame.viewFromPx / scale;
  const px = (graphX: number) => (graphX - originX) * scale;

  return {
    scale,
    originX,
    px,
    pxAtBp: (bp) => {
      const at = graphXAtBp(anchors, bp);
      return at === null ? null : px(at);
    },
    bpAtPx: (atPx) => bpAtGraphX(anchors, originX + atPx / scale),
  };
}

/**
 * Maps linearized offsets back to haplotype coordinates along the reference
 * walk, so the ruler can be labelled with real positions. Only the reference
 * contributes ticks; a column it skips has no coordinate to show.
 */
/**
 * Where a reference coordinate falls along the layout.
 *
 * The two are not the same measure. A column is as wide as its widest
 * allele, so a site where a haplotype carries more sequence than the
 * reference takes room the reference spends no coordinate on, and the
 * layout runs ahead. Only the reference's own walk says where a
 * coordinate really is, and `referenceTicks` is that walk.
 *
 * Inside one reference node a base is a unit of layout, so a position
 * within it is that node's offset plus the remainder - which is what
 * finds the node a coordinate lands in as well as where in it. Null when
 * the coordinate is off the front of what was extracted.
 */
/**
 * Which coordinate is drawn at a place along the layout - the other
 * direction, and the one a pan offset needs.
 *
 * Inside a reference node a base is a unit of layout, so the two advance
 * together. Past the end of one they do not: the rest of that column is
 * room for a longer allele some haplotype carries, and the reference
 * spends no coordinate crossing it, so the map is flat there. An offset
 * landing in one of those comes back as the coordinate at its near edge.
 */
export function bpAtGraphX(
  anchors: Array<{ x: number; bp: number }>,
  graphX: number,
): number | null {
  if (!anchors.length) return null;
  /* Before the reference's first node, and after its last, there is
     nothing to say otherwise, so they run together. */
  if (graphX <= anchors[0].x) return anchors[0].bp + (graphX - anchors[0].x);
  let lo = 0;
  let hi = anchors.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (anchors[mid].x <= graphX) lo = mid;
    else hi = mid - 1;
  }
  const anchor = anchors[lo];
  const next = anchors[lo + 1];
  const advance = next ? next.bp - anchor.bp : Infinity;
  return anchor.bp + Math.min(graphX - anchor.x, advance);
}

export function graphXAtBp(
  anchors: Array<{ x: number; bp: number }>,
  bp: number,
): number | null {
  if (!anchors.length || bp < anchors[0].bp) return null;
  let lo = 0;
  let hi = anchors.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (anchors[mid].bp <= bp) lo = mid;
    else hi = mid - 1;
  }
  return anchors[lo].x + (bp - anchors[lo].bp);
}

export function referenceTicks(
  model: PangenomeModel,
): Array<{ x: number; bp: number }> {
  const known = ticksByModel.get(model);
  if (known) return known;
  const ref = model.reference;
  if (!ref) return [];

  /* Each piece of the reference at its own coordinates, rather than one
     count running on from the first: the reference can come back in pieces,
     and one can be a stray copy from far away (see `buildModel`). Where
     pieces disagree - a copy laid over the same place as the window but
     with coordinates 51 kb off - the longest wins, and a piece is kept only
     where it runs the same way as those already kept, so the anchors go up
     together in both the layout and the coordinate. */
  const pieces = new Map<number, Array<{ x: number; bp: number }>>();
  for (const step of ref.steps) {
    const node = model.nodeById.get(step.node);
    if (!node) continue;
    let piece = pieces.get(step.segment);
    if (!piece) pieces.set(step.segment, (piece = []));
    piece.push({ x: node.x, bp: step.start });
  }
  const spans = [...pieces.values()]
    .filter((ticks) => ticks.length)
    .map((ticks) => ({
      ticks,
      x0: Math.min(...ticks.map((t) => t.x)),
      x1: Math.max(...ticks.map((t) => t.x)),
      bp0: Math.min(...ticks.map((t) => t.bp)),
      bp1: Math.max(...ticks.map((t) => t.bp)),
    }))
    .sort((a, b) => b.bp1 - b.bp0 - (a.bp1 - a.bp0));
  const kept: typeof spans = [];
  for (const span of spans) {
    const fits = kept.every(
      (other) =>
        (span.bp1 < other.bp0 && span.x1 < other.x0) ||
        (span.bp0 > other.bp1 && span.x0 > other.x1),
    );
    if (fits) kept.push(span);
  }

  /* In coordinate order, and only while the layout moves on with it: a node
     the reference walks twice in a piece would otherwise send it back. */
  const ticks: Array<{ x: number; bp: number }> = [];
  for (const tick of kept
    .flatMap((span) => span.ticks)
    .sort((a, b) => a.bp - b.bp || a.x - b.x)) {
    const last = ticks[ticks.length - 1];
    if (last && (tick.x < last.x || tick.bp <= last.bp)) continue;
    ticks.push(tick);
  }
  ticksByModel.set(model, ticks);
  return ticks;
}
/* A model never changes once built, and the ruler and every axis ask. */
const ticksByModel = new WeakMap<
  PangenomeModel,
  Array<{ x: number; bp: number }>
>();

/** The reference's longest piece with coordinates, by bases. */
function longestPiece(lane: Lane | null): LaneSegment | null {
  let best: LaneSegment | null = null;
  for (const piece of lane?.segments ?? []) {
    if (piece.start === null || piece.end === null) continue;
    if (!best || piece.end - piece.start > best.end! - best.start!)
      best = piece;
  }
  return best;
}
