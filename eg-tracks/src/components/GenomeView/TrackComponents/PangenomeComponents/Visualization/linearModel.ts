import type { Located } from "../../../../../getRemoteData/gbz/locate";
import type { Carriers, JsonStop } from "../../../../../getRemoteData/gbz/subgraph";
import { REF_COLOR, pastelColor } from "./pangenomeModel";
import type { Graph, Step, Walk } from "./alignment";
import { placeRow } from "./rowAlign";
import { addNestedMarks, versionSeqOf } from "./nestedMarks";
import type { Jump, OpenEnd, OutOfBand, PlacedPart, RefAxis, RowBubble, RowStep } from "./rowAlign";

export type { Jump, OpenEnd, OutOfBand, PlacedPart, RowBubble, RowStep } from "./rowAlign";
export type { CountOver, NestedAt, NestedMark, NestedVersion } from "./nestedMarks";

/* ══════════════════════════════════════════════════════════════════════════
   What the linear view draws: every walk of every shown haplotype, each a
   row, placed on the reference walk's own coordinates.

   The fetch (getRemoteData/gbz) gives the band's reference walk and, for
   each shown haplotype, its walks through the band's nodes exactly as the
   GBWT lists them: one per path fragment, named with its own coordinates
   (`SAMPLE#HAP#CONTIG[start-end]`), its steps each a node read on the
   reference's strand or the other. Nothing is joined or cut here. A walk
   is one row; a haplotype with the band three times has three rows, and
   that is how a duplication shows. Each row is placed by one pointer
   along the reference (rowAlign.ts; PLAN-rows.md in eg3/claude-memory):
   plain where it reads the reference, letters where a base differs, white
   where it lacks reference, a mark where it has bases the reference does
   not, arrows where it reads the reference on the other strand, a cap and
   missing data where it leaves the reference for good.

   The reference walk's own coordinates are the axis. A base of the band is
   drawn where its coordinate falls, and nothing moves it: an allele longer
   than what it stands in for does not push the reference along, so no
   other row breaks for it. Its surplus is a mark that takes no room.
   ══════════════════════════════════════════════════════════════════════════ */

/** One walk of a haplotype, placed: a row. */
export interface Row {
  /** Its place among the lane's rows. */
  index: number;
  contig: string;
  /** The walk's name as the fetch gave it. */
  name: string;
  steps: RowStep[];
  /** Its own coordinates, lowest first. */
  ownFrom: number;
  ownTo: number;
  /** The reference it covers, lowest first; null for a span. */
  anchored: [number, number] | null;
  /** Nothing of it placed, but a node the reference reads before the band
      at one end and one it reads after at the other: the row is white
      over the band, with both sizes. */
  spanning: boolean;
  /** One inverted run over the whole row: a flipped pass, the walk reads
      the reference on the other strand from end to end (PLAN-rows.md 7). */
  flipped: boolean;
  /** Which pass of the haplotype this row is. */
  pass: RowPass;
  /** The array (walk) this row comes from, as its index among the lane's
      walks: the group (PLAN-rows.md 7). */
  group: number;
  /** The row's place in its group: 0 for the walk's first pass, then one
      per turn back the pointer's tail made into a further row. */
  passInGroup: number;
  parts: PlacedPart[];
  bubbles: RowBubble[];
  outOfBand: OutOfBand[];
  openEnds: OpenEnd[];
  jumps: Jump[];
}

/** A row as one pass of its haplotype through the expanded region view
    (PLAN-rows.md 7): its number among the lane's rows; the haplotype's
    own bases between it and the previous and the next pass of the same
    contig, null when there is none or it is another contig; and the bases
    of seam passes, walks that draw no row, lying in the gap before it. */
export interface RowPass {
  n: number;
  of: number;
  prevGap: number | null;
  nextGap: number | null;
  seamBp: number;
}

export interface LinearLane {
  /** `sample#haplotype`: one lane per haplotype, its contigs together. */
  key: string;
  label: string;
  sample: string;
  haplotype: number;
  isReference: boolean;
  color: string;
  /** Vertical rank, the reference first. */
  index: number;
  /** In the order they first appear. */
  contigs: string[];
  /** One per walk drawn, in own order, contigs in their order. */
  rows: Row[];
  /** Walks of the haplotype through the band's nodes that draw no row:
      they read none of the band's reference walk and do not span it. */
  undrawn: number;
  /** Bases of the haplotype in the band. */
  bp: number;
  /** For a haplotype with no walk through the fetched nodes: what the
      search for it along the reference found (locate.ts). A lane with no
      rows exists only to say so. */
  located?: Located;
}

/** A node as the cards read it: whether the reference walks it here, and
    which way the rows draw it. */
export interface LinearNode {
  id: string;
  onReference: boolean;
  /** Drawn on its reverse strand: the row shows the node's bases reverse
      complemented, on the reference's strand. By the reference's walk, or
      by the first row that draws it. */
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
  /** The reference walk, and where each step starts along it. */
  refSteps: Step[];
  refOffset: number[];
  /** Node id -> the node as the cards read it: the reference's nodes, and
      every other node a row holds. */
  nodes: Map<string, LinearNode>;
  lanes: LinearLane[];
  /** How many haplotypes the graph has, when `lanes` holds only some. */
  laneCount?: number;
  /** Every lane on screen, when `lanes` holds only one track's: for the
      cards that speak of the other lanes (VisualizationContainer). */
  allLanes?: LinearLane[];
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
  haplotype?: number;
  contig?: string;
  is_reference?: boolean;
  path?: Array<{ id: string | number; is_reverse?: boolean }>;
  ends?: { head?: JsonStop; tail?: JsonStop };
}

function parseWalkName(raw: RawPath, fallback: string) {
  const name = String(raw.name ?? fallback);
  const match = WALK_NAME.exec(name);
  const sample = raw.sample ?? (match ? match[1] : name);
  const haplotype = raw.haplotype ?? (match ? Number(match[2]) : 0);
  const contig = raw.contig ?? (match ? match[3] : "");
  const start = match && match[4] !== undefined ? Number(match[4]) : null;
  const end = match && match[5] !== undefined ? Number(match[5]) : null;
  return { name, sample, haplotype, contig, start, end };
}

/* ── The model ────────────────────────────────────────────────────────── */

const models = new WeakMap<object, LinearModel | null>();

/** The model of a fetch, built once per result object. */
export function linearModelOf(queryResult: any): LinearModel | null {
  if (!queryResult || typeof queryResult !== "object") return null;
  if (!models.has(queryResult)) models.set(queryResult, buildLinearModel(queryResult));
  return models.get(queryResult) ?? null;
}

interface RawWalk {
  name: string;
  sample: string;
  haplotype: number;
  contig: string;
  start: number;
  /** The walk's own end as its name gives it; null when the name has none. */
  end: number | null;
  steps: RowStep[];
  ends?: { head?: JsonStop; tail?: JsonStop };
  firstSeen: number;
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

  /* ── The reference walk: the axis ──────────────────────────────────── */
  const flaggedAt = rawPaths.findIndex((raw) => raw.is_reference === true);
  const refIndex = flaggedAt >= 0 ? flaggedAt : rawPaths.length ? 0 : -1;
  if (refIndex < 0) return null;
  const refRaw = rawPaths[refIndex];
  const refName = parseWalkName(refRaw, `walk-${refIndex}`);
  const refSteps: Step[] = (refRaw.path ?? []).map((s) => ({ id: String(s.id), reverse: !!s.is_reverse }));
  if (!refSteps.length) return null;
  const origin = refName.start ?? 0;
  const refOffset: number[] = [0];
  for (const s of refSteps) refOffset.push(refOffset[refOffset.length - 1] + lenOf(s.id));
  const end = origin + refOffset[refOffset.length - 1];
  const contig = refName.contig;
  const refWalk: Walk = { name: refName.name, key: `${refName.sample}#${refName.haplotype}`, steps: refSteps, isReference: true };
  const graph: Graph = { seq, walks: [refWalk], reference: refWalk };
  const indexes = new Map<string, number[]>();
  refSteps.forEach((s, k) => {
    const list = indexes.get(s.id);
    if (list) list.push(k);
    else indexes.set(s.id, [k]);
  });
  const axis: RefAxis = { steps: refSteps, pos: refOffset.map((offset) => origin + offset), indexes, elsewhere: referenceAt };

  /* ── Every other walk, by haplotype ────────────────────────────────── */
  const byLabel = new Map<string, RawWalk[]>();
  rawPaths.forEach((raw, i) => {
    if (i === refIndex) return;
    const parsed = parseWalkName(raw, `walk-${i}`);
    let cursor = parsed.start ?? 0;
    const steps: RowStep[] = (raw.path ?? []).map((s) => {
      const node = String(s.id);
      const step = { node, start: cursor, end: cursor + lenOf(node), reverse: !!s.is_reverse };
      cursor = step.end;
      return step;
    });
    if (!steps.length) return;
    const label = `${parsed.sample}#${parsed.haplotype}`;
    const walk: RawWalk = {
      name: parsed.name,
      sample: parsed.sample,
      haplotype: parsed.haplotype,
      contig: parsed.contig,
      start: parsed.start ?? 0,
      end: parsed.end,
      steps,
      ...(raw.ends ? { ends: raw.ends } : {}),
      firstSeen: i,
    };
    const list = byLabel.get(label);
    if (list) list.push(walk);
    else byLabel.set(label, [walk]);
  });

  const referenceLane: LinearLane = {
    key: refWalk.key,
    label: refWalk.key,
    sample: refName.sample,
    haplotype: refName.haplotype,
    isReference: true,
    color: REF_COLOR,
    index: 0,
    contigs: [contig],
    rows: [],
    undrawn: 0,
    bp: end - origin,
  };
  const lanes: LinearLane[] = [referenceLane];
  for (const [label, walks] of byLabel) {
    /* Contigs in the order they first appear; within one, by own start. */
    const contigs: string[] = [];
    for (const walk of walks) if (!contigs.includes(walk.contig)) contigs.push(walk.contig);
    const ordered = [...walks].sort((a, b) => contigs.indexOf(a.contig) - contigs.indexOf(b.contig) || a.start - b.start || a.firstSeen - b.firstSeen);
    const rows: Row[] = [];
    const seams: Array<{ contig: string; from: number; to: number }> = [];
    let undrawn = 0;
    let group = 0;
    for (const walk of ordered) {
      let steps = walk.steps;
      let placed = placeRow(graph, axis, steps, origin, end, walk.ends);
      if (!placed.anchored && !placed.spanning) {
        undrawn += 1;
        /* Its extent from its name: a merged band can hold a clipped
           sequence for a node of a walk it draws nothing of. */
        seams.push({ contig: walk.contig, from: walk.start, to: walk.end ?? walk.steps[walk.steps.length - 1].end });
        continue;
      }
      /* The array is the group. Its first pass is the row the pointer
         placed; where the tail turns back over reference of the expanded
         region view, the tail is laid out by the same pointer as a further
         row of the group, and so on while a tail remains (PLAN-rows.md 7). */
      let passInGroup = 0;
      for (;;) {
        const { tail, ...placement } = placed;
        const inverted = placement.parts.filter((part) => part.kind === "inverted");
        rows.push({
          index: rows.length,
          contig: walk.contig,
          name: walk.name,
          steps,
          ownFrom: steps[0].start,
          ownTo: steps[steps.length - 1].end,
          flipped: !!placement.anchored && inverted.length === 1 && inverted[0].ref === placement.anchored[0] && inverted[0].ref + inverted[0].len === placement.anchored[1],
          pass: { n: rows.length + 1, of: 0, prevGap: null, nextGap: null, seamBp: 0 },
          group,
          passInGroup,
          ...placement,
        });
        if (!tail) break;
        steps = tail;
        passInGroup += 1;
        placed = placeRow(graph, axis, steps, origin, end, walk.ends?.tail ? { tail: walk.ends.tail } : undefined);
        if (!placed.anchored && !placed.spanning) break;
      }
      group += 1;
    }
    /* The passes (PLAN-rows.md 7): consecutive rows of one contig, the
       haplotype's own bases between them, the seam passes in the gap. */
    rows.forEach((row, i) => {
      const prev = i > 0 && rows[i - 1].contig === row.contig ? rows[i - 1] : null;
      const next = i + 1 < rows.length && rows[i + 1].contig === row.contig ? rows[i + 1] : null;
      const seamBp = prev ? seams.filter((s) => s.contig === row.contig && s.from >= prev.ownTo && s.to <= row.ownFrom).reduce((n, s) => n + (s.to - s.from), 0) : 0;
      row.pass = { n: i + 1, of: rows.length, prevGap: prev ? row.ownFrom - prev.ownTo : null, nextGap: next ? next.ownFrom - row.ownTo : null, seamBp };
    });
    lanes.push({
      key: label,
      label,
      sample: walks[0].sample,
      haplotype: walks[0].haplotype,
      isReference: false,
      color: pastelColor(label),
      index: lanes.length,
      contigs,
      rows,
      undrawn,
      bp: walks.reduce((n, walk) => n + walk.steps.reduce((m, step) => m + (step.end - step.start), 0), 0),
    });
  }

  /* A shown haplotype with no walk through the fetched nodes has a lane
     all the same, so its row can say what the search along the reference
     found; the fragment the search makes, when it finds one, is among the
     paths and gives the haplotype its row as usual. */
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
      rows: [],
      undrawn: 0,
      bp: 0,
      located: found,
    });
  }

  /* Rule D: the marks at junctions with more than one version among the
     haplotypes, each way of counting (nestedMarks.ts). */
  const carriers: Carriers | undefined = result?.carriers;
  addNestedMarks(lanes, axis, versionSeqOf(seq, carriers?.versionNodes), carriers, refName.sample);

  return {
    contig,
    origin,
    end,
    reference: referenceLane,
    refSteps,
    refOffset,
    nodes: nodesDrawn(refSteps, lanes),
    lanes,
    carriers,
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
  const seen = new Set<string>();
  for (const edges of edgeSets) {
    for (const [from, list] of Object.entries(edges)) {
      for (const link of list) {
        const fr = !!link.from_is_reverse;
        const tr = !!link.to_is_reverse;
        const key = `${from}${fr ? "-" : "+"}>${link.to}${tr ? "-" : "+"}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (fr) of(from).before.push({ id: link.to, reverse: !tr });
        else of(from).after.push({ id: link.to, reverse: tr });
        if (tr) of(link.to).after.push({ id: from, reverse: !fr });
        else of(link.to).before.push({ id: from, reverse: fr });
      }
    }
  }
  return links;
}

/* ── Which way each node is drawn ───────────────────────────────────── */

/** The reference's nodes by its walk; every other node by the first row
    that draws it: its part's strand, as drawn on the reference's. */
function nodesDrawn(refSteps: Step[], lanes: LinearLane[]): Map<string, LinearNode> {
  const nodes = new Map<string, LinearNode>();
  for (const step of refSteps) {
    if (!nodes.has(step.id)) nodes.set(step.id, { id: step.id, onReference: true, reverse: step.reverse });
  }
  for (const lane of lanes) {
    for (const row of lane.rows) {
      const strand = new Map<string, boolean>();
      for (const step of row.steps) if (!strand.has(step.node)) strand.set(step.node, step.reverse);
      for (const part of row.parts) {
        for (const id of part.nodes) {
          if (nodes.has(id)) continue;
          /* As drawn: the step's own strand, turned again inside an
             inverted run. */
          nodes.set(id, { id, onReference: false, reverse: (strand.get(id) ?? false) !== !!part.inverted });
        }
      }
    }
  }
  return nodes;
}
