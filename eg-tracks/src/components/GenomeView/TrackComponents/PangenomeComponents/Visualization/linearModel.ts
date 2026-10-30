import type { Located } from "../../../../../getRemoteData/gbz/locate";
import type { Carriers } from "../../../../../getRemoteData/gbz/subgraph";
import { REF_COLOR, pastelColor } from "./pangenomeModel";
import { alignWalk } from "./alignment";
import type { Bubble, Graph, Part, Step, Walk, WalkAlignment } from "./alignment";

/* ══════════════════════════════════════════════════════════════════════════
   What the linear view draws: every haplotype aligned to the reference.

   The reference walk's own coordinates are the axis. A base of the band is
   drawn where its coordinate falls, and nothing moves it: an allele longer
   than what it stands in for does not push the reference along, as the
   column layout used to, so no other bar breaks for it. Its surplus is a
   mark that takes no room (alignment.ts, rule C).

   A haplotype reaches the band as pieces - the window cuts its walk where
   it leaves and resumes where it comes back, and a haplotype can come on
   several contigs. Each piece is aligned on its own (alignment.ts) and
   becomes a reading: anchors, bubbles, and parts placed in reference
   coordinates. A lane is one haplotype, its contigs joined, and its bar
   draws one reading at any place: the first along its main contig, the
   rest being the place's dupes, which the cards list.

   A run at a piece's end that reaches a node the reference reads outside
   the band is not sequence of the haplotype's own but the far side of a
   deletion that runs out of the band, and is drawn as that: white from the
   junction to the band's edge, with the size the reference's own position
   of that node gives. Only a run that reaches no such node is an open end.

   The graph strip is placed from the same readings. A reference node is
   at its coordinate; an allele node is where the first reading that takes
   it puts its bases - over the reference they stand in for, or at the
   mark where they have no room - and alternatives at one place take rows
   under the reference's in order of how many haplotypes carry them.
   ══════════════════════════════════════════════════════════════════════════ */

/** One step of a walk, in the haplotype's own coordinates. */
export interface LinearStep {
  node: string;
  start: number;
  end: number;
  reverse: boolean;
}

/** One piece of a haplotype's walk, as the window cut it. */
export interface Piece {
  /** Within its lane, in walk order: the main contig's pieces first, in
      their own order, then the other contigs'. */
  index: number;
  contig: string;
  /** Its own coordinates, from the walk's name. */
  start: number | null;
  end: number | null;
  steps: LinearStep[];
  /** The worker found it through its path's reverse sequence; it is
      written in the path's own direction either way. */
  backward: boolean;
}

export type PartKind = Part["kind"];

/** A part of a reading placed on the axis, in absolute reference bases. */
export interface PlacedPart {
  kind: PartKind;
  ref: number;
  /** Reference bases it covers; 0 for a mark. */
  len: number;
  /** The haplotype's bases it holds, as drawn, on the reference's strand. */
  seq?: string;
  /** Where those bases are in the haplotype's own coordinates, lowest
      first, and whether they run backwards there. */
  own?: { from: number; to: number; reverse: boolean };
  /** Which of the lane's readings, and the bubble in it: `[b]`, or
      `[b, k]` for the k-th bubble inside an inversion. */
  reading: number;
  bubble: number[];
  /** The nodes whose bases it holds, in walk order. */
  nodes: string[];
  /** Inside an inversion: drawn arrowed. */
  inverted?: boolean;
  side?: "left" | "right";
  /** A white standing for reference that runs out of the band at both
      ends: the reference from `refFrom` to `refTo`, which the haplotype
      has `instead` bases of its own in place of. See Reading.spanning. */
  span?: { refFrom: number; refTo: number; instead: number };
  /** A mark before a jump: the bases the walk reads between the junction
      and where it goes on. */
  jump?: Jump;
}

/** Where a reading's walk goes on past one of its ends: a jump along the
    reference the band cannot follow - back over what was read, or off to
    a node the reference reads behind the junction. The walk goes on at a
    node the reference reads at `to`, on the reverse strand or not;
    `before` when, in walk order, that is where the walk came from rather
    than where it goes. A jump the piece was cut at names the reading the
    walk goes on in. */
export interface Jump {
  side: "left" | "right";
  /** The junction: the reading's last reference base on that side. */
  ref: number;
  to: number;
  reverse: boolean;
  before: boolean;
  reading?: number;
}

/** A deletion whose far end is outside the band: the haplotype leaves the
    reference at `ref` for a node the reference reads at `refTo` (to the
    right) or arrives at `ref` from one it reads ending at `refFrom`. */
export interface OutOfBand {
  side: "left" | "right";
  /** The junction, where the white starts or ends inside the band. */
  ref: number;
  bp: number;
  refFrom: number;
  refTo: number;
  /** The node outside the band it goes to or comes from. */
  node: string;
  reading: number;
  /** The haplotype's own coordinate at the junction. */
  own: number;
  /** On the haplotype's bar: where the white stops short of the band's
      edge because another reading of the haplotype draws from there. */
  until?: number;
}

/** One piece aligned: what the bar, the walk rows and the cards read. */
export interface Reading {
  index: number;
  piece: number;
  contig: string;
  steps: LinearStep[];
  alignment: WalkAlignment;
  /** Whether anything of it is on the reference here. */
  anchored: boolean;
  /** Nothing of it on the reference here, but a node the reference reads
      before the band at one end and one it reads after at the other: the
      reading spans the band off the reference, its own bases in place of
      the reference's - a deletion or a replacement wider than the band.
      The bar shows the band white, with both sizes. */
  spanning: boolean;
  /** Whether the bar draws anything of it: anchored or spanning. The
      rest are scraps. */
  drawn: boolean;
  /** The anchored span, absolute, lowest first; the band, when spanning. */
  refFrom: number;
  refTo: number;
  /** Its own coordinates, lowest first. */
  ownFrom: number;
  ownTo: number;
  parts: PlacedPart[];
  outOfBand: OutOfBand[];
  /** Where the walk goes on past the reading's ends by a jump the band
      cannot follow; see Jump. */
  jumps: Jump[];
  /** Aligned flipped as a whole: drawn arrowed, own coordinates counting
      down along the reference. */
  reversed: boolean;
}

export interface LinearLane {
  /** `sample#haplotype`: one lane per haplotype, its contigs joined. */
  key: string;
  label: string;
  sample: string;
  haplotype: number;
  isReference: boolean;
  color: string;
  /** Vertical rank, the reference first. */
  index: number;
  /** The main contig first: the one with the most bases here. */
  contigs: string[];
  pieces: Piece[];
  readings: Reading[];
  /** The parts the bar draws, in reference order: each reading's, clipped
      to where no earlier reading of the lane is drawn. */
  drawn: PlacedPart[];
  outOfBand: OutOfBand[];
  /** Pieces with nothing on the reference here, which are not drawn. */
  scraps: number;
  /** Bases of the haplotype in the band. */
  bp: number;
  /** For a haplotype with no walk through the fetched nodes: what the
      search for it along the reference found (locate.ts). A lane with no
      pieces exists only to say so. */
  located?: Located;
}

/** A node as the strip draws it. */
export interface StripNode {
  id: string;
  sequence: string;
  length: number;
  onReference: boolean;
  /** Absolute reference coordinate, and the room it has there. A node
      with no room - inside a mark - has width 0 and `mark` set. */
  ref: number;
  width: number;
  mark: boolean;
  /** 0 for the reference's own row; alternatives below it. */
  row: number;
  /** Which lanes read it. */
  lanes: string[];
  /** The reading that placed it, for an allele: its index, and its number
      among the lane's drawn readings as the cards give it (from 1). */
  placedBy: { lane: string; reading: number; no: number } | null;
  /** Drawn on its reverse strand: the bar shows the node's bases reverse
      complemented, on the reference's strand. By the reference's walk, or
      by the reading that placed it - its step's strand, turned again for a
      reading aligned flipped as a whole and again inside an inversion. */
  reverse: boolean;
}

/** A node across one of another's ends, and the strand it is read on
    there. */
export interface Neighbour {
  id: string;
  reverse: boolean;
}

/** What a node links to among the fetched edges: `before`, the nodes
    into its start, and `after`, the nodes out of its end, both as read
    on the node's forward strand. */
export interface Links {
  before: Neighbour[];
  after: Neighbour[];
}

export interface LinearModel {
  contig: string;
  /** The axis: the reference walk's first base, and one past its last. */
  origin: number;
  end: number;
  reference: LinearLane;
  /** The reference walk as the aligner sees it, and where each step
      starts along it. */
  refSteps: Step[];
  refOffset: number[];
  nodes: Map<string, StripNode>;
  stripRows: number;
  lanes: LinearLane[];
  /** How many haplotypes the graph has, when `lanes` holds only some. */
  laneCount?: number;
  carriers?: Carriers;
  /** Node id -> where the reference reads it outside the band. */
  referenceAt: Record<string, number>;
  /** Node id -> its neighbours among the fetched edges, those to nodes no
      shown walk uses included. */
  links: Map<string, Links>;
  /** Every fetched node's length, those neighbours included. */
  lengths: Map<string, number>;
  graph: Graph;
}

/* ── Walk names ───────────────────────────────────────────────────────── */

/** `HG002#1#chr17[38975000-38984000]` -> its parts. */
const WALK_NAME = /^(.*?)#(\d+)#([^[\]]+?)(?:\[(\d+)-(\d+)\])?$/;

interface RawPath {
  name?: string;
  sample?: string;
  contig?: string;
  haplotype?: number;
  is_reference?: boolean;
  backward?: boolean;
  path?: Array<{ id: string; is_reverse?: boolean }>;
}

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

/* ── The model ────────────────────────────────────────────────────────── */

const models = new WeakMap<object, LinearModel | null>();

/** One model per fetched graph, shared by every row drawn from it. */
export function linearModelOf(queryResult: any): LinearModel | null {
  if (!queryResult || typeof queryResult !== "object") return null;
  if (!models.has(queryResult)) models.set(queryResult, buildLinearModel(queryResult));
  return models.get(queryResult) ?? null;
}

interface Draft {
  sample: string;
  contig: string;
  haplotype: number;
  isReference: boolean;
  firstSeen: number;
  pieces: Piece[];
}

export function buildLinearModel(queryResult: any): LinearModel | null {
  const result = queryResult?.result ?? queryResult;
  const rawNodes: Record<string, string> = result?.nodes ?? {};
  const rawPaths: RawPath[] = result?.paths ?? [];
  const referenceAt: Record<string, number> = result?.referenceAt ?? {};
  const located: Record<string, Located> = result?.located ?? {};
  const rawEdges: Record<string, RawLink[]> = result?.edges ?? {};
  const around: { edges?: Record<string, RawLink[]>; lengths?: Record<string, number> } = result?.around ?? {};
  const seq = new Map<string, string>(Object.entries(rawNodes));
  const lengths = new Map<string, number>();
  for (const [id, bases] of seq) lengths.set(id, bases.length);
  for (const [id, len] of Object.entries(around.lengths ?? {})) lengths.set(id, len);
  if (!seq.size) return null;
  const lenOf = (id: string) => (seq.get(id) ?? "").length;

  /* ── Walks into pieces, pieces into drafts: one per path ──────────── */
  const flaggedAt = rawPaths.findIndex((raw) => raw.is_reference === true);
  const isQueried = (raw: RawPath, i: number) =>
    flaggedAt >= 0 ? raw.is_reference === true : i === 0;
  const pathKeyOf = (walk: { sample: string; haplotype: number; contig: string }) =>
    `${walk.sample}#${walk.haplotype}#${walk.contig}`;
  const queriedAt = flaggedAt >= 0 ? flaggedAt : rawPaths.length ? 0 : -1;
  const referenceKey =
    queriedAt < 0 ? null : pathKeyOf(parseWalkName(rawPaths[queriedAt], `walk-${queriedAt}`));

  const drafts = new Map<string, Draft>();
  rawPaths.forEach((raw, i) => {
    const parsed = parseWalkName(raw, `walk-${i}`);
    const isReference = isQueried(raw, i);
    const pathKey = pathKeyOf(parsed);
    /* The reference is the walk over the queried region and only that; the
       same path can come back elsewhere through context, and that is a walk
       like any other. */
    const key = !isReference && pathKey === referenceKey ? `${pathKey}#elsewhere` : pathKey;
    let draft = drafts.get(key);
    if (!draft) {
      draft = { ...parsed, isReference, firstSeen: i, pieces: [] };
      drafts.set(key, draft);
    }
    draft.isReference = draft.isReference || isReference;
    draft.pieces.push({
      index: -1,
      contig: parsed.contig,
      start: parsed.start,
      end: parsed.end,
      backward: raw.backward === true,
      steps: (raw.path ?? []).map((s) => ({
        node: String(s.id),
        start: 0,
        end: 0,
        reverse: !!s.is_reverse,
      })),
    });
  });

  /* Pieces in genomic order, their steps counted from each piece's own
     start - a piece without one goes on from where the one before ended. */
  const settle = (draft: Draft) => {
    const pieces = draft.pieces
      .filter((piece) => piece.steps.length > 0)
      .sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
    let cursor = pieces[0]?.start ?? 0;
    pieces.forEach((piece, index) => {
      piece.index = index;
      if (piece.start !== null) cursor = piece.start;
      for (const step of piece.steps) {
        step.start = cursor;
        step.end = cursor + lenOf(step.node);
        cursor = step.end;
      }
    });
    draft.pieces = pieces;
  };
  for (const draft of drafts.values()) settle(draft);

  /* ── The axis: the reference's longest piece with coordinates ──────── */
  const referenceDraft = [...drafts.values()].find((draft) => draft.isReference);
  if (!referenceDraft) return null;
  let main: Piece | null = null;
  for (const piece of referenceDraft.pieces) {
    if (piece.start === null || piece.end === null) continue;
    if (!main || piece.end - piece.start > main.end! - main.start!) main = piece;
  }
  if (!main) main = referenceDraft.pieces[0] ?? null;
  if (!main) return null;
  const origin = main.start ?? 0;
  const refSteps: Step[] = main.steps.map((s) => ({ id: s.node, reverse: s.reverse }));
  const refOffset: number[] = [0];
  for (const s of refSteps) refOffset.push(refOffset[refOffset.length - 1] + lenOf(s.id));
  const end = origin + refOffset[refOffset.length - 1];
  const contig = referenceDraft.contig;
  const refWalk: Walk = {
    name: `${referenceDraft.sample}#${referenceDraft.haplotype}#${contig}[${origin}-${end}]`,
    key: `${referenceDraft.sample}#${referenceDraft.haplotype}`,
    steps: refSteps,
    isReference: true,
  };
  const graph: Graph = { seq, walks: [refWalk], reference: refWalk };
  /* Where the reference first reads each of its nodes, for the cuts below. */
  const refPos = new Map<string, number>();
  refSteps.forEach((s, k) => {
    if (!refPos.has(s.id)) refPos.set(s.id, origin + refOffset[k]);
  });

  /* ── Lanes: one per haplotype, contigs joined ─────────────────────── */
  const referenceLane: LinearLane = {
    key: refWalk.key,
    label: refWalk.key,
    sample: referenceDraft.sample,
    haplotype: referenceDraft.haplotype,
    isReference: true,
    color: REF_COLOR,
    index: 0,
    contigs: [contig],
    pieces: [main],
    readings: [],
    drawn: [],
    outOfBand: [],
    scraps: 0,
    bp: end - origin,
  };
  const byLabel = new Map<string, Draft[]>();
  for (const draft of [...drafts.values()].sort((a, b) => a.firstSeen - b.firstSeen)) {
    if (draft.isReference) continue;
    const label = `${draft.sample}#${draft.haplotype}`;
    const group = byLabel.get(label);
    if (group) group.push(draft);
    else byLabel.set(label, [draft]);
  }
  const lanes: LinearLane[] = [referenceLane];
  for (const [label, group] of byLabel) {
    const bpOf = (draft: Draft) =>
      draft.pieces.reduce(
        (n, piece) => n + piece.steps.reduce((m, step) => m + (step.end - step.start), 0),
        0,
      );
    /* The contig with the most bases here goes first: its reading is the
       one the bar draws where contigs meet. */
    const ordered = [...group].sort((a, b) => bpOf(b) - bpOf(a) || a.firstSeen - b.firstSeen);
    const pieces: Piece[] = [];
    for (const draft of ordered) {
      for (const piece of draft.pieces) pieces.push({ ...piece, index: pieces.length });
    }
    const lane: LinearLane = {
      key: label,
      label,
      sample: ordered[0].sample,
      haplotype: ordered[0].haplotype,
      isReference: false,
      color: pastelColor(label),
      index: lanes.length,
      contigs: ordered.map((draft) => draft.contig),
      pieces,
      readings: [],
      drawn: [],
      outOfBand: [],
      scraps: 0,
      bp: ordered.reduce((n, draft) => n + bpOf(draft), 0),
    };
    for (const piece of pieces) {
      /* Cut by where the reference reads each node, on the band's walk or
         elsewhere, so that a cut names the node the walk goes to first. */
      for (const run of cutAtJumps(piece.steps, (id) => referenceAt[id] ?? refPos.get(id), lenOf)) {
        const reading = readPiece(graph, refWalk, piece, run, lane.readings.length, origin, refOffset, referenceAt, refPos, lenOf);
        lane.readings.push(reading);
        if (!reading.drawn) lane.scraps += 1;
      }
    }
    lane.drawn = drawnParts(lane.readings);
    lane.outOfBand = outOfBandDrawn(lane.readings);
    lanes.push(lane);
  }

  /* A shown haplotype with no walk through the fetched nodes has a lane
     all the same, so its row can say what the search along the reference
     found; the fragment the search makes, when it finds one, is among the
     paths and gives the haplotype its readings as usual. */
  for (const [key, found] of Object.entries(located)) {
    const lane = lanes.find((candidate) => candidate.key === key);
    if (lane) {
      lane.located = found;
      continue;
    }
    const [sample, haplotype] = key.split("#");
    lanes.push({
      key,
      label: key,
      sample,
      haplotype: Number(haplotype) || 0,
      isReference: false,
      color: pastelColor(key),
      index: lanes.length,
      contigs: [],
      pieces: [],
      readings: [],
      drawn: [],
      outOfBand: [],
      scraps: 0,
      bp: 0,
      located: found,
    });
  }

  /* ── The strip ──────────────────────────────────────────────────────── */
  const { nodes, stripRows } = stripNodes(seq, refSteps, refOffset, origin, lanes);

  return {
    contig,
    origin,
    end,
    reference: referenceLane,
    refSteps,
    refOffset,
    nodes,
    stripRows,
    lanes,
    carriers: result?.carriers,
    referenceAt,
    links: linksOf(rawEdges, around.edges ?? {}),
    lengths,
    graph,
  };
}

/* ── Links ───────────────────────────────────────────────────────────── */

/** A fetched edge as the worker writes it, under the node it leaves. */
interface RawLink {
  to: string;
  from_is_reverse?: boolean;
  to_is_reverse?: boolean;
}

/**
 * Each node's neighbours from the fetched edges. An edge is listed once,
 * in one of its two forms, so each gives both its nodes a neighbour: for
 * F(fr) -> T(tr), F read forward has T after it when fr is false, and,
 * read backward, T(!tr) before it when fr is true; T likewise.
 */
function linksOf(...edgeSets: Array<Record<string, RawLink[]>>): Map<string, Links> {
  const links = new Map<string, Links>();
  const of = (id: string): Links => {
    let known = links.get(id);
    if (!known) links.set(id, (known = { before: [], after: [] }));
    return known;
  };
  const add = (list: Neighbour[], neighbour: Neighbour) => {
    if (!list.some((n) => n.id === neighbour.id && n.reverse === neighbour.reverse)) list.push(neighbour);
  };
  for (const [from, list] of edgeSets.flatMap((edges) => Object.entries(edges))) {
    for (const link of list) {
      const to = String(link.to);
      const fr = !!link.from_is_reverse;
      const tr = !!link.to_is_reverse;
      if (!fr) add(of(from).after, { id: to, reverse: tr });
      else add(of(from).before, { id: to, reverse: !tr });
      if (!tr) add(of(to).before, { id: from, reverse: fr });
      else add(of(to).after, { id: from, reverse: !fr });
    }
  }
  return links;
}

/* ── One piece aligned and placed ─────────────────────────────────────── */

/** A jump back along the reference shorter than this is left inside its
    reading, where the rule makes it an insertion: a node read again right
    after itself is a tiny tandem copy, not a second pass. */
const JUMP_BACK_BP = 20;

/** A piece's steps between two cuts, and the jumps the cuts were: where
    the walk goes on at the run's end, and where it came from at its
    start, each a node the reference reads and the strand it is read on. */
interface Run {
  steps: LinearStep[];
  jumpIn?: { to: number; reverse: boolean };
  jumpOut?: { to: number; reverse: boolean };
}

/**
 * A piece's steps cut into readings where the walk reads the reference
 * again: a tandem duplication's second pass, which starts where the first
 * did, or a hairpin's return, which reads the stretch back on the other
 * strand. Each pass is then aligned on its own, so each anchors in full;
 * left in one reading the second could not anchor at all, being out of
 * order, and hung off the first's end as an open end. A step reads again
 * when it overlaps, by more than JUMP_BACK_BP, the reference span the run
 * has read so far on either strand. An inversion inside a reading does
 * not: its nodes lie beyond the forward span, and a pass never overlaps
 * its own span, each node being next to the last. Nor does a jump off to
 * a stretch outside the spans, which readPiece places as a jump. A
 * re-reading on the other strand cuts at the first node of that strand's
 * run, so a hairpin's return is one reading from its turn, the nodes it
 * reads before reaching what was read included.
 */
function cutAtJumps(
  steps: LinearStep[],
  refAt: (id: string) => number | undefined,
  lenOf: (id: string) => number,
): Run[] {
  const runs: Run[] = [];
  let run: LinearStep[] = [];
  let jumpIn: Run["jumpIn"];
  /* The reference span read so far, forward steps' and reverse steps'. */
  const fresh = (): Array<[number, number]> => [
    [Infinity, -Infinity],
    [Infinity, -Infinity],
  ];
  let spans = fresh();
  const widen = (step: LinearStep, at: number) => {
    const span = spans[step.reverse ? 1 : 0];
    span[0] = Math.min(span[0], at);
    span[1] = Math.max(span[1], at + lenOf(step.node));
  };
  /* The strand of the last step the reference reads, where it sits in the
     run, and where the current run of one strand began: right after the
     last reference-read step of the other strand, the haplotype's own
     nodes between counted with the run whichever way they are read. */
  let lastStrand: boolean | null = null;
  let lastRead = -1;
  let strandStart = 0;
  for (const step of steps) {
    const at = refAt(step.node);
    if (at !== undefined) {
      if (lastStrand !== null && step.reverse !== lastStrand) strandStart = lastRead + 1;
      const len = lenOf(step.node);
      const [onForward, onReverse] = spans.map(([lo, hi]) => Math.min(at + len, hi) - Math.max(at, lo));
      const overlap = Math.max(onForward, onReverse);
      if (overlap > JUMP_BACK_BP && run.length) {
        /* Read again on the other strand - a hairpin's return - the whole
           strand run goes, from its first node; on the same strand - a
           tandem's second pass - the cut is here. */
        const otherStrand = step.reverse ? onForward > JUMP_BACK_BP : onReverse > JUMP_BACK_BP;
        const cutAt = otherStrand ? strandStart : run.length;
        const kept = run.slice(0, cutAt);
        const moved = run.slice(cutAt);
        const first = moved.find((s) => refAt(s.node) !== undefined);
        const jump = first ? { to: refAt(first.node)!, reverse: first.reverse } : { to: at, reverse: step.reverse };
        if (kept.length) {
          runs.push({ steps: kept, jumpIn, jumpOut: jump });
          jumpIn = jump;
        }
        run = moved;
        spans = fresh();
        lastStrand = null;
        lastRead = -1;
        moved.forEach((s, k) => {
          const there = refAt(s.node);
          if (there === undefined) return;
          widen(s, there);
          lastStrand = s.reverse;
          lastRead = k;
        });
        strandStart = 0;
      }
      widen(step, at);
      lastStrand = step.reverse;
      lastRead = run.length;
    }
    run.push(step);
  }
  if (run.length) runs.push({ steps: run, jumpIn });
  return runs;
}

/**
 * For a reading with nothing on the reference here: whether it spans the
 * band off the reference, between a node the reference reads before the
 * band and one it reads after, and what it holds between the two. Such a
 * reading arrives since the fetch follows each cut walk on to the next
 * node the reference reads (walkOn.ts): a haplotype that lacks the band's
 * reference, or has other sequence in its place, touches the band's
 * subgraph only through the context and used to be a scrap.
 */
function spanOf(
  steps: LinearStep[],
  origin: number,
  end: number,
  referenceAt: Record<string, number>,
  lenOf: (id: string) => number,
): { refFrom: number; refTo: number; instead: number; own: { from: number; to: number } } | null {
  /* The reference-read steps nearest the band on each side: a fragment
     made by the search along the reference can start with a stretch the
     haplotype reads on the reference before leaving it. */
  let left = -1;
  let leftEnd = -Infinity;
  let right = -1;
  let rightAt = Infinity;
  for (let k = 0; k < steps.length; k++) {
    const at = referenceAt[steps[k].node];
    if (at === undefined) continue;
    const to = at + lenOf(steps[k].node);
    if (to <= origin) {
      if (to > leftEnd) {
        leftEnd = to;
        left = k;
      }
    } else if (at >= end && at < rightAt) {
      rightAt = at;
      right = k;
    }
  }
  if (left < 0 || right < 0) return null;
  const lo = Math.min(left, right);
  const hi = Math.max(left, right);
  let instead = 0;
  for (let k = lo + 1; k < hi; k++) instead += lenOf(steps[k].node);
  return {
    refFrom: leftEnd,
    refTo: rightAt,
    instead,
    own: { from: steps[lo].end, to: steps[hi].start },
  };
}

function readPiece(
  graph: Graph,
  refWalk: Walk,
  piece: Piece,
  run: Run,
  index: number,
  origin: number,
  refOffset: number[],
  referenceAt: Record<string, number>,
  refPos: Map<string, number>,
  lenOf: (id: string) => number,
): Reading {
  const { steps } = run;
  /** Where the reference reads a node: on the band's walk, or elsewhere. */
  const positionOf = (node: string): number | undefined => referenceAt[node] ?? refPos.get(node);
  const walk: Walk = {
    name: `${piece.contig}[${piece.start ?? 0}-${piece.end ?? 0}]`,
    key: piece.contig,
    steps: steps.map((s) => ({ id: s.node, reverse: s.reverse })),
    isReference: false,
    ...(piece.backward ? { backward: true } : {}),
  };
  const alignment = alignWalk(graph, walk, refWalk);
  const own0 = steps[0]?.start ?? 0;
  const n = steps.length;
  const anchored = alignment.anchors.length > 0;
  const end = origin + refOffset[refOffset.length - 1];
  const spanned = anchored ? null : spanOf(steps, origin, end, referenceAt, lenOf);
  let refFrom = spanned ? origin : NaN;
  let refTo = spanned ? end : NaN;
  if (anchored) {
    const first = alignment.anchors[0][1];
    const last = alignment.anchors[alignment.anchors.length - 1][1];
    refFrom = origin + Math.min(refOffset[first], refOffset[last]);
    refTo =
      origin +
      Math.max(refOffset[first] + lenOf(refWalk.steps[first].id), refOffset[last] + lenOf(refWalk.steps[last].id));
  }
  const reading: Reading = {
    index,
    piece: piece.index,
    contig: piece.contig,
    steps,
    alignment,
    anchored,
    spanning: spanned !== null,
    drawn: anchored || spanned !== null,
    refFrom,
    refTo,
    ownFrom: own0,
    ownTo: steps[n - 1]?.end ?? own0,
    parts: [],
    outOfBand: [],
    jumps: [],
    reversed: alignment.reversed,
  };
  if (spanned) {
    reading.parts.push({
      kind: "white",
      ref: origin,
      len: end - origin,
      own: { ...spanned.own, reverse: false },
      reading: index,
      bubble: [],
      nodes: [],
      span: { refFrom: spanned.refFrom, refTo: spanned.refTo, instead: spanned.instead },
    });
    return reading;
  }
  if (!anchored) return reading;

  /* A step of the walk as aligned, by its index in the alignment's view of
     the walk - flipped as a whole where the piece was. */
  const stepAt = (k: number): LinearStep => steps[alignment.reversed ? n - 1 - k : k];

  /* Parts from a list of bubbles. `stepOf` says which step of the piece a
     bubble-local haplotype index is; `path` is the way down to the list. */
  const place = (bubbles: Bubble[], stepOf: (k: number) => LinearStep, path: number[]) => {
    bubbles.forEach((bubble, b) => {
      const hapLen = bubble.hapSeq.length;
      const ownRange = (from: number, to: number) => ({
        from: own0 + (bubble.flipped ? bubble.hapAt + (hapLen - to) : bubble.hapAt + from),
        to: own0 + (bubble.flipped ? bubble.hapAt + (hapLen - from) : bubble.hapAt + to),
        reverse: bubble.flipped,
      });
      /* The nodes whose bases fall in a range of the bubble's haplotype
         side, in the order the bubble reads them. */
      const nodesIn = (from: number, to: number) => {
        const out: string[] = [];
        let at = 0;
        for (let k = bubble.hap[0]; k < bubble.hap[1]; k++) {
          const step = stepOf(k);
          const len = lenOf(step.node);
          if (at < to && at + len > from) out.push(step.node);
          at += len;
        }
        return out;
      };
      const here = [...path, b];
      if (bubble.cls === "inversion" && bubble.inside) {
        const whole = bubble.parts[0];
        reading.parts.push({
          kind: "inverted",
          ref: origin + whole.ref,
          len: whole.len,
          seq: bubble.hapSeq,
          own: ownRange(0, hapLen),
          reading: index,
          bubble: here,
          nodes: nodesIn(0, hapLen),
        });
        /* The inside reads the bubble's haplotype side back to front. */
        const innerStepOf = (k: number) => stepOf(bubble.hap[1] - 1 - k);
        const before = reading.parts.length;
        place(bubble.inside, innerStepOf, here);
        for (let p = before; p < reading.parts.length; p++) reading.parts[p].inverted = true;
        return;
      }
      for (const part of bubble.parts) {
        if (part.kind === "open" && bubble.open) continue; // placed below, with the out-of-band check
        const seq = "seq" in part ? part.seq : undefined;
        reading.parts.push({
          kind: part.kind,
          ref: origin + part.ref,
          len: part.len,
          ...(seq !== undefined ? { seq } : {}),
          ...(part.hap ? { own: ownRange(part.hap[0], part.hap[1]) } : {}),
          reading: index,
          bubble: here,
          nodes: part.hap ? nodesIn(part.hap[0], part.hap[1]) : [],
          ...(part.kind === "open" ? { side: part.side } : {}),
        });
      }
      if (!bubble.open || bubble.open === "both") return;
      /* An open end. The run's steps, in the order they lead away from
         the junction. Where one of them is a node the reference reads -
         outside the band, or in it, read again - the walk goes on there:
         ahead, the run is the far side of a deletion running out of the
         band; behind, a jump back, which the band cannot follow, so the
         bases before it are a mark and the rest is left to the reading
         that reads them. */
      const steps: LinearStep[] = [];
      for (let k = bubble.hap[0]; k < bubble.hap[1]; k++) steps.push(stepOf(k));
      const away = bubble.open === "right" ? steps : [...steps].reverse();
      const junction = origin + bubble.refAt;
      /* In walk order, whether this end is where the walk came from. */
      const before = alignment.reversed ? bubble.open === "right" : bubble.open === "left";
      /* The haplotype's own bases between the junction and the jump: an
         insertion at the junction, before the walk leaves. */
      const markBefore = (count: number, jump?: Jump) => {
        const inserted = away.slice(0, count);
        const bases = inserted.reduce((n, s) => n + lenOf(s.node), 0);
        if (bases <= 0) return;
        const [from, to] = bubble.open === "right" ? [0, bases] : [hapLen - bases, hapLen];
        reading.parts.push({
          kind: "mark",
          ref: junction,
          len: bases,
          seq: bubble.hapSeq.slice(from, to),
          own: ownRange(from, to),
          reading: index,
          bubble: here,
          nodes: inserted.map((s) => s.node),
          ...(jump ? { jump } : {}),
        });
      };
      let outAt = -1;
      for (let k = 0; k < away.length; k++) {
        if (positionOf(away[k].node) !== undefined) {
          outAt = k;
          break;
        }
      }
      if (outAt >= 0) {
        const node = away[outAt].node;
        const at = positionOf(node)!;
        const far = bubble.open === "right" ? at : at + lenOf(node);
        const forward = bubble.open === "right" ? far >= junction : far <= junction;
        if (forward) {
          const bp = Math.abs(far - junction);
          /* Next to the junction: the walk simply goes on along the
             reference past the band, nothing skipped. */
          if (bp === 0) {
            markBefore(outAt);
            return;
          }
          reading.outOfBand.push({
            side: bubble.open,
            ref: junction,
            bp,
            refFrom: bubble.open === "right" ? junction : far,
            refTo: bubble.open === "right" ? far : junction,
            node,
            reading: index,
            own: bubble.open === "right" ? ownRange(0, 0).from : ownRange(hapLen, hapLen).from,
          });
          markBefore(outAt);
          return;
        }
        const jump: Jump = { side: bubble.open, ref: junction, to: at, reverse: away[outAt].reverse, before };
        reading.jumps.push(jump);
        markBefore(outAt, jump);
        return;
      }
      /* No node the reference reads in the run, but the piece was cut at
         this end: the walk goes on in the reading next to this one, and
         these are its bases before it leaves. */
      const cut = before ? run.jumpIn : run.jumpOut;
      if (cut) {
        const jump: Jump = {
          side: bubble.open,
          ref: junction,
          to: cut.to,
          reverse: cut.reverse,
          before,
          reading: before ? index - 1 : index + 1,
        };
        reading.jumps.push(jump);
        markBefore(away.length, jump);
        return;
      }
      /* A true open end: placed outward from the junction, no class. */
      if (hapLen > 0) {
        reading.parts.push({
          kind: "open",
          ref: junction,
          len: hapLen,
          seq: bubble.hapSeq,
          own: ownRange(0, hapLen),
          reading: index,
          bubble: here,
          nodes: steps.map((s) => s.node),
          side: bubble.open,
        });
      }
    });
  };
  place(alignment.bubbles, stepAt, []);
  /* A cut at an end the reading anchors right up to: no open run took it,
     so the jump itself is noted. */
  if (run.jumpIn && !reading.jumps.some((jump) => jump.before)) {
    const side = alignment.reversed ? "right" : "left";
    reading.jumps.push({
      side,
      ref: side === "left" ? refFrom : refTo,
      to: run.jumpIn.to,
      reverse: run.jumpIn.reverse,
      before: true,
      reading: index - 1,
    });
  }
  if (run.jumpOut && !reading.jumps.some((jump) => !jump.before)) {
    const side = alignment.reversed ? "left" : "right";
    reading.jumps.push({
      side,
      ref: side === "left" ? refFrom : refTo,
      to: run.jumpOut.to,
      reverse: run.jumpOut.reverse,
      before: false,
      reading: index + 1,
    });
  }
  /* The anchors themselves: each a whole node the haplotype reads as the
     reference does, drawn plain over its own coordinate. Most of a bar. */
  alignment.anchors.forEach(([ia, ib]) => {
    const step = stepAt(ia);
    reading.parts.push({
      kind: "match",
      ref: origin + refOffset[ib],
      len: lenOf(refWalk.steps[ib].id),
      own: { from: step.start, to: step.end, reverse: alignment.reversed },
      reading: index,
      bubble: [],
      nodes: [step.node],
    });
  });
  reading.parts.sort((a, b) => a.ref - b.ref || a.len - b.len);
  return reading;
}

/* ── What the bar draws of a lane's readings ─────────────────────────── */

/**
 * Each reading's parts clipped to where no earlier reading of the lane is
 * drawn: a lane's readings are in walk order, its main contig's first, so
 * where two cover the same reference the first is the one drawn and the
 * rest are dupes. An open end's stub shows only over reference no reading
 * of the haplotype reads at all, earlier or later: HG002#2's first reading
 * at chr17:38,975,000 ends at 38,982,866 and goes on 95 bp off the
 * reference, where its next reading reads the reference in place.
 */
function drawnParts(readings: Reading[]): PlacedPart[] {
  const claimed: Array<[number, number]> = [];
  const spans: Array<[number, number]> = readings
    .filter((reading) => reading.drawn)
    .map((reading) => [reading.refFrom, reading.refTo]);
  const out: PlacedPart[] = [];
  const free = (from: number, to: number, against: Array<[number, number]>): Array<[number, number]> => {
    let gaps: Array<[number, number]> = [[from, to]];
    for (const [a, b] of against) {
      const next: Array<[number, number]> = [];
      for (const [x, y] of gaps) {
        if (b <= x || a >= y) next.push([x, y]);
        else {
          if (a > x) next.push([x, a]);
          if (b < y) next.push([b, y]);
        }
      }
      gaps = next;
    }
    return gaps;
  };
  for (const reading of readings) {
    if (!reading.drawn) continue;
    for (const part of reading.parts) {
      if (part.len === 0 || part.kind === "mark") {
        /* A mark is drawn unless it falls strictly inside what another
           reading already draws. */
        if (!claimed.some(([a, b]) => part.ref > a && part.ref < b)) out.push(part);
        continue;
      }
      const span: [number, number] =
        part.kind === "open" && part.side === "left"
          ? [part.ref - part.len, part.ref]
          : [part.ref, part.ref + part.len];
      for (const [x, y] of free(span[0], span[1], part.kind === "open" ? spans : claimed)) {
        if (x === span[0] && y === span[1]) {
          out.push(part);
          continue;
        }
        /* Part of it: the same part, cut to what is free. Its bases are
           cut with it where they are drawn one to a reference base - an
           open stub's too, which runs left to right from its far end on
           the left and from the junction on the right - and so is where
           they are in the haplotype's own coordinates, which count down
           along the bar where they run backwards. */
        const offset = x - span[0];
        const len = y - x;
        const cut: PlacedPart = { ...part, ref: part.kind === "open" && part.side === "left" ? y : x, len };
        if (part.seq !== undefined) cut.seq = part.seq.slice(offset, offset + len);
        if (part.own) {
          cut.own = part.own.reverse
            ? { from: part.own.to - offset - len, to: part.own.to - offset, reverse: true }
            : { from: part.own.from + offset, to: part.own.from + offset + len, reverse: false };
        }
        out.push(cut);
      }
    }
    /* The reading's anchored span is now spoken for, as is any open stub. */
    claimed.push([reading.refFrom, reading.refTo]);
  }
  return out.sort((a, b) => a.ref - b.ref || a.len - b.len);
}

/**
 * The deletions running out of the band that a lane's bar draws: each
 * reading's, cut where another reading of the haplotype reads the
 * reference - over such a place the bar draws that reading, as it draws
 * the first reading of any place - and dropped where that is right at the
 * junction. The walk rows draw each reading's own, uncut.
 */
function outOfBandDrawn(readings: Reading[]): OutOfBand[] {
  const spans = readings
    .filter((reading) => reading.drawn)
    .map((reading) => ({ from: reading.refFrom, to: reading.refTo, index: reading.index }));
  const out: OutOfBand[] = [];
  /* Two readings leaving at one junction the same way - dupes of one
     place - draw one white there: the first's. */
  const taken = new Set<string>();
  for (const reading of readings) {
    for (const white of reading.outOfBand) {
      const others = spans.filter((span) => span.index !== reading.index);
      const at = `${white.side}:${white.ref}`;
      if (taken.has(at)) continue;
      if (white.side === "right") {
        if (others.some(({ from, to }) => from <= white.ref && white.ref < to)) continue;
        const next = others.filter(({ from }) => from > white.ref).map(({ from }) => from);
        out.push(next.length ? { ...white, until: Math.min(...next) } : white);
      } else {
        if (others.some(({ from, to }) => from < white.ref && white.ref <= to)) continue;
        const previous = others.filter(({ to }) => to < white.ref).map(({ to }) => to);
        out.push(previous.length ? { ...white, until: Math.max(...previous) } : white);
      }
      taken.add(at);
    }
  }
  return out;
}

/* ── The strip ───────────────────────────────────────────────────────── */

function stripNodes(
  seq: Map<string, string>,
  refSteps: Step[],
  refOffset: number[],
  origin: number,
  lanes: LinearLane[],
): { nodes: Map<string, StripNode>; stripRows: number } {
  const nodes = new Map<string, StripNode>();
  const lanesOf = new Map<string, string[]>();
  for (const lane of lanes) {
    const seen = new Set<string>();
    for (const piece of lane.pieces) {
      for (const step of piece.steps) {
        if (seen.has(step.node)) continue;
        seen.add(step.node);
        const list = lanesOf.get(step.node);
        if (list) list.push(lane.key);
        else lanesOf.set(step.node, [lane.key]);
      }
    }
  }
  /* The reference's own nodes, at their coordinates. */
  refSteps.forEach((step, k) => {
    if (nodes.has(step.id)) return;
    const sequence = seq.get(step.id) ?? "";
    nodes.set(step.id, {
      id: step.id,
      sequence,
      length: sequence.length,
      onReference: true,
      ref: origin + refOffset[k],
      width: sequence.length,
      mark: false,
      row: 0,
      lanes: lanesOf.get(step.id) ?? [],
      placedBy: null,
      reverse: step.reverse,
    });
  });
  /* Every other node by the first reading that takes it, over the bases
     of the part it is in: a node spanning two parts reaches across both. */
  const reach = new Map<
    string,
    { from: number; to: number; mark: boolean; reverse: boolean; by: { lane: string; reading: number; no: number } }
  >();
  for (const lane of lanes) {
    if (lane.isReference) continue;
    let no = 0;
    for (const reading of lane.readings) {
      if (!reading.drawn) continue;
      no += 1;
      /* The strand the reading reads each node on, at its first visit. */
      const strand = new Map<string, boolean>();
      for (const step of reading.steps) if (!strand.has(step.node)) strand.set(step.node, step.reverse);
      for (const part of reading.parts) {
        if (part.kind === "white" || part.kind === "inverted" || !part.nodes.length) continue;
        /* As drawn: the bar shows every base on the reference's strand. */
        const drawnReverse = (id: string) => (strand.get(id) ?? false) !== reading.reversed !== !!part.inverted;
        /* Where each node's bases fall along the part. */
        let at = 0;
        for (const id of part.nodes) {
          if (nodes.has(id)) {
            at += (seq.get(id) ?? "").length;
            continue;
          }
          const len = (seq.get(id) ?? "").length;
          const from = at;
          const to = at + len;
          at = to;
          let lo: number;
          let hi: number;
          let mark = false;
          if (part.kind === "mark") {
            lo = hi = part.ref;
            mark = true;
          } else if (part.kind === "open") {
            lo = part.side === "left" ? part.ref - (part.len - from) : part.ref + from;
            hi = lo + len;
          } else {
            /* Over the reference it replaces, as far as the part's room
               goes; any base past it is at the mark after the room. */
            lo = part.ref + Math.min(from, part.len);
            hi = part.ref + Math.min(to, part.len);
            if (to > part.len) mark = true;
          }
          const known = reach.get(id);
          if (known) {
            if (known.by.lane === lane.key && known.by.reading === reading.index) {
              known.from = Math.min(known.from, lo);
              known.to = Math.max(known.to, hi);
              known.mark = known.mark || mark;
            }
            continue;
          }
          reach.set(id, {
            from: lo,
            to: hi,
            mark,
            reverse: drawnReverse(id),
            by: { lane: lane.key, reading: reading.index, no },
          });
        }
      }
    }
  }
  const alleles: StripNode[] = [];
  for (const [id, placed] of reach) {
    const sequence = seq.get(id) ?? "";
    const node: StripNode = {
      id,
      sequence,
      length: sequence.length,
      onReference: false,
      ref: placed.from,
      width: Math.max(0, placed.to - placed.from),
      mark: placed.mark && placed.to - placed.from < sequence.length,
      row: 1,
      lanes: lanesOf.get(id) ?? [],
      placedBy: placed.by,
      reverse: placed.reverse,
    };
    nodes.set(id, node);
    alleles.push(node);
  }
  /* Rows under the reference: the most carried first, each in the first
     row with room for it. A mark takes a base's width of a row, and the
     marks at one junction share it: an insertion of hundreds of nodes
     is one glyph there, as it is one mark on the bar. */
  alleles.sort((a, b) => b.lanes.length - a.lanes.length || a.ref - b.ref);
  const rowEnd: Array<Array<[number, number]>> = [];
  const rowMarks: Array<Set<number>> = [];
  for (const node of alleles) {
    const from = node.ref;
    const to = node.ref + Math.max(1, node.width);
    const glyph = node.width === 0;
    let row = 0;
    for (;;) {
      if (glyph && rowMarks[row]?.has(from)) break;
      const taken = rowEnd[row] ?? [];
      if (!taken.some(([a, b]) => from < b && to > a)) break;
      row += 1;
    }
    (rowEnd[row] ??= []).push([from, to]);
    if (glyph) (rowMarks[row] ??= new Set()).add(from);
    node.row = row + 1;
  }
  return { nodes, stripRows: rowEnd.length + 1 };
}
