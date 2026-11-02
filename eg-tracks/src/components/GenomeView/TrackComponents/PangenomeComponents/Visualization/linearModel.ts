import type { Located } from "../../../../../getRemoteData/gbz/locate";
import type { Carriers, JsonStop } from "../../../../../getRemoteData/gbz/subgraph";
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
   several contigs. Each piece is aligned whole, on its own (alignment.ts;
   gbz-base's `query --cigar` aligns it the same way) and becomes a
   reading: anchors, bubbles, and parts placed in reference coordinates.
   A lane is one haplotype, its contigs joined, and its bar draws one
   reading at any place: the first along its main contig.

   A duplication is read off the walk alone (PLAN-duplications.md in
   eg3/claude-memory): a stretch whose nodes the walk has read before is a
   copy, tandem when it repeats the steps right before it, dispersed
   otherwise. The one-piece alignment draws a copy where the walk has it,
   as an insertion or in place of other reference; each copy is also
   aligned on its own, as a reading is, which lines it up on its original:
   its walk row (Copy, copiesOf). Nothing compares bases.

   A run at a piece's end that reaches a node the reference reads outside
   the band is not sequence of the haplotype's own but the far side of a
   deletion that runs out of the band, and is drawn as that: white from the
   junction to the band's edge, with the size the reference's own position
   of that node gives. Only a run that reaches no such node is an open end,
   and an open end is missing data, not an allele: the walk leaves the
   reference there and, in the graph, never comes back, so nothing says
   what reference it replaces. The bar stops at the junction and draws
   nothing past it (OpenEnd).

   The same readings set the strand each node is drawn on, and a card
   reads a node's neighbours against it. The reference's walk sets it for
   the reference's nodes; the first reading that draws a node sets it for
   any other (nodesDrawn).
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
  /** Why the walk stops short of the reference at its start and its end,
      in its own direction, where the fetch followed it (walkOn.ts). */
  ends?: { head?: JsonStop; tail?: JsonStop };
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
    node the reference reads, on the reverse strand or not; `before` when,
    in walk order, that is where the walk came from rather than where it
    goes. `to` is where the walk is there: where it reaches the node it
    goes on at (its start, read forward; its end, read backwards), or where
    it left the node it came from (its end, read forward; its start, read
    backwards). A jump the piece was cut at names the reading the walk goes
    on in. */
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

/**
 * Where a reading stops short of the reference with nothing after it: its
 * walk leaves the reference at the junction and, in the graph, never comes
 * back - the run past the junction holds no node the reference reads, and
 * the fetch followed it as far as it goes. Not an allele, since nothing
 * says what reference it replaces: missing data. The bar stops at the
 * junction and draws nothing past it; the card says where the walk goes
 * and why it was not followed further. vg deconstruct does the same: a
 * haplotype whose path does not cross a site from its start to its end
 * has no allele there.
 */
export interface OpenEnd {
  side: "left" | "right";
  /** The junction: where the reading's last reference base on that side
      ends (right) or its first starts (left). */
  ref: number;
  /** The reference node the walk leaves the reference by. */
  from: string;
  /** The run's first node, the one the walk goes into from `from`, with
      the strand it is drawn on. */
  into: { id: string; reverse: boolean } | null;
  /** The run: its bases, its nodes in order away from the junction, and
      where they are in the haplotype's own coordinates. */
  bases: number;
  nodes: string[];
  own: { from: number; to: number; reverse: boolean };
  reading: number;
  /** Which end of the walk, in its own direction, the run is at. */
  at: "start" | "end";
  /** Why it was not followed further, when the fetch followed it: "end",
      its path in the graph starts or ends there - `more` when the
      haplotype has another fragment of the contig beyond, the graph build
      having left out the stretch between; "cap", `bp` more bases walked
      past the run without meeting the reference. */
  stop?: JsonStop;
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
  /** Where it stops short of the reference for good; see OpenEnd. */
  openEnds: OpenEnd[];
  /** Aligned flipped as a whole: drawn arrowed, own coordinates counting
      down along the reference. */
  reversed: boolean;
}

/**
 * A stretch of a haplotype's walk that reads again nodes the walk has
 * read before: the graph's only sign of a duplication. Aligned on its own
 * against the band's walk, as a reading is (so its parts' `reading` is its
 * index among the lane's copies), it lines up on its original: its walk
 * row, drawn only for a dispersed copy whose original is on the band.
 */
export interface Copy extends Reading {
  /** Its steps in its piece: [from, to). */
  at: [number, number];
  /** Tandem: its steps repeat the steps right before it in its piece, in
      order with the same strands, or reversed with every strand flipped
      (inverted). Dispersed: anything else lies between it and the stretch
      it copies - reference, or bases of the haplotype's own. */
  kind: "tandem" | "dispersed";
  inverted: boolean;
  /** How many times the haplotype has the stretch, the original counted:
      the ×n. A tandem copy counts its run of tandem copies; a dispersed
      one every copy of its original. */
  times: number;
  /** The first copy of its run of tandem copies, or itself: one pointer
      per group. */
  group: number;
  /** What its reference nodes' first visits cover on the band's walk;
      null when every one of them is read only elsewhere by the
      reference. */
  original: [number, number] | null;
  /** Where the bar draws its bases: the reference they cover, or the
      point they are inserted at (len 0). Null where the bar draws none. */
  bar: { ref: number; len: number } | null;
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
  /** One per piece, in the pieces' order. */
  readings: Reading[];
  /** Its copies, in walk order (copiesOf). */
  copies: Copy[];
  /** The parts the bar draws, in reference order: each reading's, clipped
      to where no earlier reading of the lane is drawn; a mark cut to the
      bases of the haplotype's own where it held a copy's. */
  drawn: PlacedPart[];
  outOfBand: OutOfBand[];
  /** The open ends the bar shows: each reading's, where no other reading
      of the haplotype reads the reference past the junction. */
  openEnds: OpenEnd[];
  /** Pieces with nothing on the reference here, which are not drawn. */
  scraps: number;
  /** Bases of the haplotype in the band. */
  bp: number;
  /** For a haplotype with no walk through the fetched nodes: what the
      search for it along the reference found (locate.ts). A lane with no
      pieces exists only to say so. */
  located?: Located;
}

/** A node as the cards read it: whether the reference walks it here, and
    which way the bars draw it. */
export interface LinearNode {
  id: string;
  onReference: boolean;
  /** Drawn on its reverse strand: the bar shows the node's bases reverse
      complemented, on the reference's strand. By the reference's walk, or
      by the first reading that draws it - its step's strand, turned again
      for a reading aligned flipped as a whole and again inside an
      inversion. */
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
  /** Node id -> the node as the cards read it: the reference's nodes, and
      every other node a drawn reading holds. */
  nodes: Map<string, LinearNode>;
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
  ends?: { head?: JsonStop; tail?: JsonStop };
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
      ...(raw.ends ? { ends: raw.ends } : {}),
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
    copies: [],
    drawn: [],
    outOfBand: [],
    openEnds: [],
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
      copies: [],
      drawn: [],
      outOfBand: [],
      openEnds: [],
      scraps: 0,
      bp: ordered.reduce((n, draft) => n + bpOf(draft), 0),
    };
    for (const piece of pieces) {
      const reading = readPiece(graph, refWalk, piece, { steps: piece.steps }, lane.readings.length, origin, refOffset, referenceAt, refPos, lenOf);
      lane.readings.push(reading);
      if (!reading.drawn) lane.scraps += 1;
    }
    /* The bar's parts place each copy on the bar; a mark cut to its own
       bases then changes them. */
    lane.drawn = drawnParts(lane.readings);
    lane.copies = copiesOf(lane, (run, index) => readPiece(graph, refWalk, pieces[run.piece!], run, index, origin, refOffset, referenceAt, refPos, lenOf), referenceAt, refPos, lenOf);
    cutMarks(lane);
    lane.drawn = drawnParts(lane.readings);
    lane.outOfBand = outOfBandDrawn(lane.readings);
    lane.openEnds = openEndsDrawn(lane.readings);
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
      copies: [],
      drawn: [],
      outOfBand: [],
      openEnds: [],
      scraps: 0,
      bp: 0,
      located: found,
    });
  }

  /* ── Which way each node is drawn, for the cards ───────────────────── */
  const nodes = nodesDrawn(refSteps, lanes);

  return {
    contig,
    origin,
    end,
    reference: referenceLane,
    refSteps,
    refOffset,
    nodes,
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

/** A piece's steps as one reading, or a copy's steps cut out of its
    piece, with the jumps at the cut: where the walk goes on at the run's
    end, at the first step after it that reads the reference, and where it
    came from at its start, the last such step before it; each the
    reference base the walk is at there (where it reaches the one, where
    it left the other: a node's start or end by the strand it is read on)
    and that strand. */
interface Run {
  steps: LinearStep[];
  /** For a copy: which piece, and its steps in it. */
  piece?: number;
  at?: [number, number];
  /** `reading`: which of the lane's readings the walk goes on in, when
      one is known. */
  jumpIn?: { to: number; reverse: boolean; reading?: number };
  jumpOut?: { to: number; reverse: boolean; reading?: number };
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
    openEnds: [],
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
        /* Where the walk is on the far side: where it left the node it
           came from, or reaches the node it goes on at, by the strand it
           reads it on. */
        const reverse = away[outAt].reverse;
        const to = before === reverse ? at : at + lenOf(node);
        const jump: Jump = { side: bubble.open, ref: junction, to, reverse, before };
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
          ...(cut.reading !== undefined ? { reading: cut.reading } : {}),
        };
        reading.jumps.push(jump);
        markBefore(away.length, jump);
        return;
      }
      /* A true open end: missing data. The walk leaves the reference at
         the junction and, in the graph, never comes back, so the run says
         nothing of what reference it replaces: nothing of it is drawn and
         the bar stops at the junction (OpenEnd). With no cut at this end,
         the run is at the piece's own start or end, and why the fetch
         stopped following it there is the piece's. */
      if (hapLen > 0) {
        const anchorAt = bubble.open === "right" ? bubble.ref[0] - 1 : bubble.ref[1];
        const first = away[0];
        const stop = before ? piece.ends?.head : piece.ends?.tail;
        reading.openEnds.push({
          side: bubble.open,
          ref: junction,
          from: refWalk.steps[anchorAt]?.id ?? "",
          /* As drawn: on the reference's strand, the step's own turned
             where the reading is aligned flipped as a whole. */
          into: first ? { id: first.node, reverse: first.reverse !== alignment.reversed } : null,
          bases: hapLen,
          nodes: away.map((s) => s.node),
          own: ownRange(0, hapLen),
          reading: index,
          at: before ? "start" : "end",
          ...(stop ? { stop } : {}),
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
      ...(run.jumpIn.reading !== undefined ? { reading: run.jumpIn.reading } : {}),
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
      ...(run.jumpOut.reading !== undefined ? { reading: run.jumpOut.reading } : {}),
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

/* ── Copies ───────────────────────────────────────────────────────────── */

/** The kinds that take room on the reference. */
const ROOMY = new Set<PlacedPart["kind"]>(["match", "mismatch", "replaced", "inverted"]);

/** A stretch of the haplotype's own coordinates, [from, to). */
type OwnRange = [number, number];

/** What is left of one range outside the others, in order. */
function without(of: OwnRange, cut: OwnRange[]): OwnRange[] {
  let kept: OwnRange[] = [of];
  for (const [a, b] of cut) {
    const next: OwnRange[] = [];
    for (const [x, y] of kept) {
      if (b <= x || a >= y) next.push([x, y]);
      else {
        if (a > x) next.push([x, a]);
        if (b < y) next.push([b, y]);
      }
    }
    kept = next;
  }
  return kept;
}

/** The own coordinates a run of steps covers, lowest first. */
function ownOf(steps: LinearStep[]): OwnRange {
  let from = Infinity;
  let to = -Infinity;
  for (const step of steps) {
    from = Math.min(from, step.start);
    to = Math.max(to, step.end);
  }
  return [from, to];
}

/**
 * A lane's copies (PLAN-duplications.md). In the lane's walk order, its
 * pieces in order, a reference node - one the band's walk reads, or one
 * the reference reads elsewhere - is read again when its id was read
 * before. A copy is a maximal run of steps whose reference steps are all
 * read again, on one strand and in the reference's order along it: nodes
 * of the haplotype's own may lie inside it (a base that differs from the
 * original), but not at its ends, and so may a reference node read for the
 * first time that lies in place between the two steps read again either
 * side of it (the copy carries the reference's base where the original
 * carried another, the original having read something of its own there
 * between the node read again before it and the one after); a node out
 * of that order ends it, as does
 * a node repeating inside it (the walk jumping back once more: the next
 * copy), a change of strand, and the piece's end. It is
 * tandem when the steps right before it in the piece are its own, in
 * order with the same strands, or reversed with every strand flipped
 * (inverted); consecutive tandem copies of one stretch are one group.
 * Each copy is aligned on its own by "read", as a reading is, which lines
 * it up on its original; its jumps name the reference steps either side
 * of it, in the piece's reading. Nothing compares bases.
 */
function copiesOf(
  lane: LinearLane,
  read: (run: Run, index: number) => Reading,
  referenceAt: Record<string, number>,
  refPos: Map<string, number>,
  lenOf: (id: string) => number,
): Copy[] {
  const isRef = (id: string) => refPos.has(id) || referenceAt[id] !== undefined;
  const positionOf = (id: string): number => referenceAt[id] ?? refPos.get(id)!;
  /* Each reference node's first visit: its piece, its step and its strand. */
  const seen = new Map<string, { piece: number; k: number; reverse: boolean }>();
  /** Whether the original covered the place between two nodes read again
      with something of its own: their first visits are in one piece, with
      nodes between them none of which is the band's reference (nodes of
      the haplotype's own, or nodes the reference reads only outside the
      band: the alt allele the copy has the reference's base for). Asked
      only where the copy reads reference for the first time between the
      two, so that a stretch the original deleted, or jumped over, is not
      bridged into a copy by nodes read again at both ends (jump's
      HG02698#1: piece 0 reads 318-375, then nodes 1 kb on; piece 2, read
      backwards, reads the 1 kb between for the first time). */
  const covered = (last: string, next: string): boolean => {
    const a = seen.get(last)!;
    const b = seen.get(next)!;
    if (a.piece !== b.piece) return false;
    const original = lane.pieces[a.piece].steps;
    let something = false;
    for (let m = Math.min(a.k, b.k) + 1; m < Math.max(a.k, b.k); m++) {
      if (refPos.has(original[m].node)) return false;
      something = true;
    }
    return something;
  };
  const runs: Array<{ piece: number; at: [number, number]; kind: Copy["kind"]; inverted: boolean }> = [];
  for (const piece of lane.pieces) {
    const steps = piece.steps;
    const again = steps.map((step, k) => {
      if (!isRef(step.node)) return false;
      const was = seen.has(step.node);
      if (!was) seen.set(step.node, { piece: piece.index, k, reverse: step.reverse });
      return was;
    });
    for (let i = 0; i < steps.length; ) {
      if (!again[i]) {
        i += 1;
        continue;
      }
      /* The run reads one strand, in the reference's order along it: its
         next step read again must lie past the last on that strand, with
         any reference node read for the first time between them in place,
         between the two. */
      const strand = steps[i].reverse;
      const inRun = new Set<string>();
      let last = i;
      let lastAt = positionOf(steps[i].node);
      const ahead = (pos: number) => (strand ? pos < lastAt : pos > lastAt);
      for (let j = i; j < steps.length; j++) {
        const id = steps[j].node;
        if (inRun.has(id)) break;
        if (!isRef(id)) {
          inRun.add(id);
          continue;
        }
        if (steps[j].reverse !== strand) break;
        if (again[j]) {
          if (j > i && !ahead(positionOf(id))) break;
          /* The first-time nodes since the last step read again lie
             between the two, where the original covered the place with
             something of its own; or the run ends at the last. */
          let placed = true;
          let firstTime = false;
          for (let k = last + 1; k < j && placed; k++) {
            const at = isRef(steps[k].node) ? positionOf(steps[k].node) : null;
            if (at === null) continue;
            firstTime = true;
            if (!(ahead(at) && (strand ? at > positionOf(id) : at < positionOf(id)))) placed = false;
          }
          if (!placed || (firstTime && !covered(steps[last].node, id))) break;
          for (let k = last + 1; k <= j; k++) inRun.add(steps[k].node);
          last = j;
          lastAt = positionOf(id);
          continue;
        }
        /* A reference node read for the first time: kept only if a step
           read again follows it in place (checked when that step comes). */
        if (!ahead(positionOf(id))) break;
      }
      const at: [number, number] = [i, last + 1];
      const k = at[1] - at[0];
      const own = steps.slice(at[0], at[1]);
      const before = at[0] >= k ? steps.slice(at[0] - k, at[0]) : [];
      const forward = before.length === k && before.every((s, m) => s.node === own[m].node && s.reverse === own[m].reverse);
      const flipped = before.length === k && before.every((s, m) => s.node === own[k - 1 - m].node && s.reverse !== own[k - 1 - m].reverse);
      /* Inverted: its steps read again are on the other strand from their
         first visits. */
      const inverted = strand !== seen.get(steps[i].node)!.reverse;
      runs.push({ piece: piece.index, at, kind: forward || flipped ? "tandem" : "dispersed", inverted });
      i = last + 1;
    }
  }

  const copies: Copy[] = runs.map((run, index) => {
    const piece = lane.pieces[run.piece];
    const steps = piece.steps.slice(run.at[0], run.at[1]);
    /* The reference steps either side of it, where the walk left the one
       and reaches the other, for its row's cards. */
    let before: LinearStep | undefined;
    for (let k = run.at[0] - 1; k >= 0 && !before; k--) if (isRef(piece.steps[k].node)) before = piece.steps[k];
    let after: LinearStep | undefined;
    for (let k = run.at[1]; k < piece.steps.length && !after; k++) if (isRef(piece.steps[k].node)) after = piece.steps[k];
    const reading = read(
      {
        steps,
        piece: run.piece,
        at: run.at,
        ...(before ? { jumpIn: { to: positionOf(before.node) + (before.reverse ? 0 : lenOf(before.node)), reverse: before.reverse, reading: run.piece } } : {}),
        ...(after ? { jumpOut: { to: positionOf(after.node) + (after.reverse ? lenOf(after.node) : 0), reverse: after.reverse, reading: run.piece } } : {}),
      },
      index,
    );
    /* Its original: what its reference nodes' first visits cover on the
       band's walk; none when every one is read only elsewhere. */
    let lo = Infinity;
    let hi = -Infinity;
    for (const step of steps) {
      const at = refPos.get(step.node);
      if (at === undefined) continue;
      lo = Math.min(lo, at);
      hi = Math.max(hi, at + lenOf(step.node));
    }
    const original: Copy["original"] = lo < hi ? [lo, hi] : null;
    /* Where the bar draws its bases: the bar's parts of the piece's
       reading over its own coordinates. */
    const [ownFrom, ownTo] = ownOf(steps);
    const over = lane.drawn.filter((part) => part.reading === run.piece && part.own && part.own.from < ownTo && ownFrom < part.own.to);
    const roomy = over.filter((part) => ROOMY.has(part.kind));
    let bar: Copy["bar"] = null;
    if (roomy.length) {
      const ref = Math.min(...roomy.map((part) => part.ref));
      bar = { ref, len: Math.max(...roomy.map((part) => part.ref + part.len)) - ref };
    } else {
      const mark = over.find((part) => part.kind === "mark");
      if (mark) bar = { ref: mark.ref, len: 0 };
    }
    return {
      ...reading,
      index,
      at: run.at,
      kind: run.kind,
      inverted: run.inverted,
      times: 2,
      group: index,
      original,
      bar,
      /* Its row: a dispersed copy lined up on its original. */
      drawn: reading.drawn && !reading.spanning && original !== null && run.kind === "dispersed",
    };
  });

  /* Groups: tandem copies back to back in one piece, of the same nodes
     either way round. Times: a tandem copy's group, a dispersed copy's
     every copy of its original. */
  const ids = (copy: Copy) => copy.steps.map((step) => step.node);
  const sameNodes = (a: Copy, b: Copy) => {
    const x = ids(a);
    const y = ids(b);
    return x.length === y.length && (x.every((id, m) => id === y[m]) || x.every((id, m) => id === y[y.length - 1 - m]));
  };
  for (let m = 1; m < copies.length; m++) {
    const prev = copies[m - 1];
    const cur = copies[m];
    if (cur.kind === "tandem" && prev.kind === "tandem" && cur.piece === prev.piece && cur.at[0] === prev.at[1] && sameNodes(prev, cur)) cur.group = prev.group;
  }
  const groupSize = new Map<number, number>();
  for (const copy of copies) groupSize.set(copy.group, (groupSize.get(copy.group) ?? 0) + 1);
  const overlapping = (copy: Copy) =>
    copies.filter((other) => other.original && copy.original && other.original[0] < copy.original[1] && copy.original[0] < other.original[1]).length;
  for (const copy of copies) copy.times = 1 + (copy.kind === "tandem" ? groupSize.get(copy.group)! : copy.original ? overlapping(copy) : 1);
  return copies;
}

/**
 * A mark holding a copy's bases is cut to the bases of the haplotype's
 * own in it: its length, its bases and its nodes (the user, 2026-11-02:
 * the mark above the bar says "+5" for 5 bases of its own beside a copy
 * that the pointer below stands for). A mark that is copy alone keeps
 * its number: the copy is an insertion, and the mark says so.
 */
function cutMarks(lane: LinearLane): void {
  for (const reading of lane.readings) {
    const cut = lane.copies.filter((copy) => copy.piece === reading.piece).map((copy) => ownOf(copy.steps));
    if (!cut.length) continue;
    const steps = lane.pieces[reading.piece].steps;
    reading.parts = reading.parts.flatMap((part): PlacedPart[] => {
      if (part.kind !== "mark" || !part.own) return [part];
      const own = part.own;
      const kept = without([own.from, own.to], cut);
      const len = kept.reduce((n, [a, b]) => n + b - a, 0);
      if (len === own.to - own.from || len === 0) return [part];
      /* Its bases are drawn on the reference's strand: for a mark read
         backwards, the walk's last base first. */
      const slices = own.reverse ? [...kept].reverse().map(([a, b]) => [own.to - b, own.to - a]) : kept.map(([a, b]) => [a - own.from, b - own.from]);
      const seq = part.seq !== undefined ? slices.map(([a, b]) => part.seq!.slice(a, b)).join("") : undefined;
      const nodes = steps.filter((step) => kept.some(([a, b]) => step.start < b && a < step.end)).map((step) => step.node);
      return [
        {
          ...part,
          len,
          ...(seq !== undefined ? { seq } : {}),
          own: { from: kept[0][0], to: kept[kept.length - 1][1], reverse: own.reverse },
          nodes,
        },
      ];
    });
  }
}

/* ── What the bar draws of a lane's readings ─────────────────────────── */

/**
 * Each reading's parts clipped to where no earlier reading of the lane is
 * drawn: a lane's readings are in walk order, its main contig's first, so
 * where two cover the same reference the first is the one drawn and the
 * rest are dupes.
 */
function drawnParts(readings: Reading[]): PlacedPart[] {
  const claimed: Array<[number, number]> = [];
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
      const span: [number, number] = [part.ref, part.ref + part.len];
      for (const [x, y] of free(span[0], span[1], claimed)) {
        if (x === span[0] && y === span[1]) {
          out.push(part);
          continue;
        }
        /* Part of it: the same part, cut to what is free. Its bases are
           cut with it where they are drawn one to a reference base, and so
           is where they are in the haplotype's own coordinates, which count
           down along the bar where they run backwards. */
        const offset = x - span[0];
        const len = y - x;
        const cut: PlacedPart = { ...part, ref: x, len };
        if (part.seq !== undefined) cut.seq = part.seq.slice(offset, offset + len);
        if (part.own) {
          cut.own = part.own.reverse
            ? { from: part.own.to - offset - len, to: part.own.to - offset, reverse: true }
            : { from: part.own.from + offset, to: part.own.from + offset + len, reverse: false };
        }
        out.push(cut);
      }
    }
    /* The reading's anchored span is now spoken for. */
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

/**
 * The open ends a lane's bar shows: each reading's, unless another reading
 * of the haplotype reads the reference past the junction - there the bar
 * draws that reading, as it draws the first reading of any place. The walk
 * rows show each reading's own.
 */
function openEndsDrawn(readings: Reading[]): OpenEnd[] {
  const spans = readings
    .filter((reading) => reading.drawn)
    .map((reading) => ({ from: reading.refFrom, to: reading.refTo, index: reading.index }));
  const out: OpenEnd[] = [];
  for (const reading of readings) {
    for (const end of reading.openEnds) {
      const others = spans.filter((span) => span.index !== reading.index);
      const covered =
        end.side === "right"
          ? others.some(({ from, to }) => from <= end.ref && end.ref < to)
          : others.some(({ from, to }) => from < end.ref && end.ref <= to);
      if (!covered) out.push(end);
    }
  }
  return out;
}

/* ── A placed part, read back ─────────────────────────────────────────── */

/** The bubble a part came from: `[b]` among its reading's bubbles, or
    `[b, k]`, the k-th inside the inversion b. Null for an anchor's match
    and a span's white, which come from no bubble. */
export function bubbleOf(reading: Reading, path: number[]): Bubble | null {
  if (!path.length) return null;
  const bubble = reading.alignment.bubbles[path[0]];
  return (path.length > 1 ? bubble?.inside?.[path[1]] : bubble) ?? null;
}

/** Whether a part is drawn arrowed, as read on the other strand: an
    inverted span or a part inside one, or any part of a reading read
    backwards as a whole; both at once cancel. The rule barRaster.ts draws
    by. */
export function drawnArrowed(part: PlacedPart, reading: Reading | undefined): boolean {
  const inverted = part.kind === "inverted" || !!part.inverted;
  return inverted !== !!reading?.reversed;
}

/* ── Which way each node is drawn ────────────────────────────────────── */

/**
 * The reference's nodes, each by its walk where it first reads it, then
 * every other node by the first reading that draws it, in the lanes'
 * order: the strand a card reads the node's neighbours against.
 */
function nodesDrawn(refSteps: Step[], lanes: LinearLane[]): Map<string, LinearNode> {
  const nodes = new Map<string, LinearNode>();
  for (const step of refSteps) {
    if (!nodes.has(step.id)) nodes.set(step.id, { id: step.id, onReference: true, reverse: step.reverse });
  }
  for (const lane of lanes) {
    if (lane.isReference) continue;
    for (const reading of lane.readings) {
      if (!reading.drawn) continue;
      /* The strand the reading reads each node on, at its first visit. */
      const strand = new Map<string, boolean>();
      for (const step of reading.steps) if (!strand.has(step.node)) strand.set(step.node, step.reverse);
      for (const part of reading.parts) {
        if (part.kind === "white" || part.kind === "inverted") continue;
        for (const id of part.nodes) {
          if (nodes.has(id)) continue;
          /* As drawn: the bar shows every base on the reference's strand. */
          const reverse = (strand.get(id) ?? false) !== reading.reversed !== !!part.inverted;
          nodes.set(id, { id, onReference: false, reverse });
        }
      }
    }
  }
  return nodes;
}
