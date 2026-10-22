import {
  edgeIsCanonical,
  encodeNode,
  ENDMARKER,
  isReverse,
  nodeId,
  pathIsCanonical,
} from "./codec";
import type { Pos } from "./codec";
import { GbzRecord } from "./record";
import { RecordCache } from "./store";
import type { GbzPath, GbzSource } from "./store";

/* ══════════════════════════════════════════════════════════════════════════
   Interval query against a GBZ-base database, ported from gbz-base's
   subgraph.rs (`path_pos_from_db` -> `around_interval` -> `extract_paths`
   -> `write_json`).

   The shape of the result matches `query --format json` so it can be diffed
   against the Rust tool, and so the existing views can consume it unchanged.
   ══════════════════════════════════════════════════════════════════════════ */

export interface IntervalQuery {
  sample: string;
  contig: string;
  haplotype?: number;
  /** Half-open, in haplotype coordinates. */
  start: number;
  end: number;
  context?: number;
  /** Only these haplotypes' walks, as `sample#haplotype` keys - with the
      reference's, always. Absent, every walk through the region. */
  haplotypes?: string[];
}

export interface JsonNode {
  id: string;
  sequence: string;
}

export interface JsonEdge {
  from: string;
  from_is_reverse: boolean;
  to: string;
  to_is_reverse: boolean;
}

export interface JsonPath {
  name: string;
  path: Array<{ id: string; is_reverse: boolean }>;
  is_reference: boolean;
  path_handle?: string;
  sample?: string;
  contig?: string;
  haplotype?: number;
  fragment_start?: number;
  length: number;
  interval?: { start: number; end: number };
}

export interface SubgraphJson {
  nodes: JsonNode[];
  edges: JsonEdge[];
  paths: JsonPath[];
  /** How common each node and allele is in the whole pangenome. */
  carriers?: Carriers;
  /** Node id -> where on the reference its own path reads that node,
      for nodes it reads only outside the queried walk; see
      referenceElsewhere. */
  referenceAt?: Record<string, number>;
}

/* ── Carriers ──────────────────────────────────────────────────────────
   How many haplotypes in the whole pangenome take a node or an allele, not
   just the few asked for. Every walk through the window is extracted
   anyway - keepHaplotypes only drops them afterwards - so counting them
   first is one pass over walks already in memory. */
export interface Carriers {
  /** Haplotypes with a walk in the window. */
  total: number;
  /** Node id -> how many of them visit it. */
  nodes: Record<string, number>;
  /** alleleKey -> how many of them take that allele. */
  alleles: Record<string, number>;
}

/**
 * An allele as the nodes a walk takes through it: the reference node it
 * leaves from, the nodes off the reference walk, and the reference node it
 * rejoins at - so a deletion is just the two reference nodes it jumps
 * between. The same either way round, since a walk can run against the
 * reference.
 */
export function alleleKey(ids: string[]): string {
  const forward = ids.join(">");
  const backward = [...ids].reverse().join(">");
  return forward < backward ? forward : backward;
}

/* ── Node sides ────────────────────────────────────────────────────────
   A node has a left and a right end. Which end a handle enters by depends on
   its orientation, and the context search walks in terms of ends rather than
   handles. Left is 0 and Right is 1, matching the Rust enum's ordering, which
   the priority queue's tie-breaking depends on. */
const LEFT = 0;
const RIGHT = 1;

const sideStart = (reverse: boolean) => (reverse ? RIGHT : LEFT);
const sideEnd = (reverse: boolean) => (reverse ? LEFT : RIGHT);
const flipSide = (side: number) => (side === LEFT ? RIGHT : LEFT);
/** Orientation of the handle whose *start* is this side. */
const asStart = (side: number) => side !== LEFT;
/** Orientation of the handle whose *end* is this side. */
const asEnd = (side: number) => side === LEFT;

interface Active {
  distance: number;
  node: number;
  side: number;
}

/** Orders by distance, then node, then side - the Rust tuple ordering. */
function activeIsLess(a: Active, b: Active): boolean {
  if (a.distance !== b.distance) return a.distance < b.distance;
  if (a.node !== b.node) return a.node < b.node;
  return a.side < b.side;
}

/** Binary min-heap, standing in for Rust's `BinaryHeap<Reverse<...>>`. */
class MinHeap {
  private readonly items: Active[] = [];

  get size(): number {
    return this.items.length;
  }

  push(item: Active): void {
    this.items.push(item);
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!activeIsLess(this.items[i], this.items[parent])) break;
      [this.items[i], this.items[parent]] = [this.items[parent], this.items[i]];
      i = parent;
    }
  }

  pop(): Active | undefined {
    if (this.items.length === 0) return undefined;
    const top = this.items[0];
    const last = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = last;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = left + 1;
        let smallest = i;
        if (
          left < this.items.length &&
          activeIsLess(this.items[left], this.items[smallest])
        )
          smallest = left;
        if (
          right < this.items.length &&
          activeIsLess(this.items[right], this.items[smallest])
        )
          smallest = right;
        if (smallest === i) break;
        [this.items[i], this.items[smallest]] = [
          this.items[smallest],
          this.items[i],
        ];
        i = smallest;
      }
    }
    return top;
  }
}

/** A walk recovered from the subgraph. */
interface PathInfo {
  path: number[];
  len: number;
  pathHandle: number | null;
  fragmentStart: number | null;
  /* Stitched from its path's reverse sequence - an odd sequence id: the
     path read backwards. See toJson. */
  backward: boolean;
  /* Where the sequence leaves the subgraph after the walk's last node, if it
     leaves rather than ends. A walk that met no anchor inside the subgraph
     follows its sequence on from here to one. */
  exit: Pos | null;
}

export function queryInterval(
  source: GbzSource,
  query: IntervalQuery,
): SubgraphJson {
  const cache = new RecordCache(source);
  const context = query.context ?? 0;
  const haplotype = query.haplotype ?? 0;
  const length = query.end - query.start;
  console.log(source, query);
  if (length <= 0) throw new Error("Interval length must be greater than 0");

  /* ── find nearest indexed position to query start of the reference genome Start ─────────────── */
  const path = source.findPath(
    query.sample,
    query.contig,
    haplotype,
    query.start,
  );
  if (!path) {
    throw new Error(
      `Cannot find a path covering ${query.sample}#${haplotype}#${query.contig}@${query.start}`,
    );
  }
  if (!path.isIndexed) {
    throw new Error(
      `Path ${query.sample}#${haplotype}#${query.contig} is not indexed`,
    );
  }

  const queryOffset = query.start - path.fragment;
  const anchor = source.indexedPosition(path.handle, queryOffset);
  if (!anchor) throw new Error("Path has not been indexed for random access");

  /* walk from start of nearest index start to the query position. */
  const records = new Map<number, GbzRecord>();
  const addNode = (id: number) => {
    const forward = encodeNode(id, false);
    if (records.has(forward)) return;
    const fw = cache.get(forward);
    const rv = cache.get(encodeNode(id, true));
    if (!fw || !rv) throw new Error(`The graph does not contain node ${id}`);
    records.set(fw.handle, fw);
    records.set(rv.handle, rv);
  };

  let pathOffset = anchor.pathOffset;
  let pos: Pos = { node: anchor.node, offset: anchor.offset };
  let nodeOffset: number | null = null;
  let startPos: Pos | null = null;
  for (;;) {
    addNode(nodeId(pos.node));
    const record = records.get(pos.node)!;
    if (pathOffset + record.sequenceLength > queryOffset) {
      nodeOffset = queryOffset - pathOffset;
      startPos = pos;
      break;
    }
    pathOffset += record.sequenceLength;
    const next = record.lf(pos.offset);
    if (!next) break;
    pos = next;
  }
  if (nodeOffset === null || startPos === null) {
    throw new Error(`Path does not contain offset ${queryOffset}`);
  }
  const refStart = { seqOffset: queryOffset, pos: startPos, nodeOffset };

  /* ── starting at ref query start node position, walk till query end 
  add all nodes that we pass and the paths passes through those nodes  ── */
  const active = new MinHeap();
  {
    let walk = startPos;
    let offset = nodeOffset;
    let remaining = length;
    for (;;) {
      const id = nodeId(walk.node);
      const reverse = isReverse(walk.node);
      addNode(id);
      const record = records.get(walk.node)!;
      if (offset >= record.sequenceLength) {
        throw new Error(
          `Offset ${offset} in node ${id} of length ${record.sequenceLength}`,
        );
      }

      active.push({ distance: offset, node: id, side: sideStart(reverse) });
      const endSide = sideEnd(reverse);
      const distanceToNext = record.sequenceLength - offset;
      if (remaining <= distanceToNext) {
        const endDistance =
          remaining === distanceToNext ? 0 : distanceToNext - remaining - 1;
        active.push({ distance: endDistance, node: id, side: endSide });
        break;
      }
      active.push({ distance: 0, node: id, side: endSide });

      const next = record.lf(walk.offset);
      if (!next) break;
      walk = next;
      offset = 0;
      remaining -= distanceToNext;
    }
  }

  insertContext(records, active, context, addNode);

  /* ── Recover the walks through the subgraph ──────────────────────── */
  const extracted = extractPaths(records, refStart);
  /* for alt paths, if we didn't find an anchor,
   because we indexed alt path every 100 nodes so chance a ref query interval might not cover an anchor,
   for the alt paths without anchors, we walk their 
  path until we find one to identify it and calculate its actual bp interval location*/
  nameWalksPastEdge(extracted.paths, cache);

  const json = writeJson(source, records, extracted, path, refStart);
  const kept = query.haplotypes ? keepHaplotypes(json, query.haplotypes) : json;
  return {
    ...kept,
    carriers: countCarriers(json, kept),
    referenceAt: referenceElsewhere(json, kept),
  };
}

/**
 * Where on the reference each node of `kept` sits, for the nodes the
 * reference's own path reads only outside the queried walk.
 *
 * The context reaches those through other haplotypes' links: a deletion
 * jumps from the window straight to where it rejoins, kilobases on, and
 * that is one step. The reference's walk through them comes back with
 * everything else, so where they are is known - CHM13's chr6 at 32,370,696
 * from a window at 32,365,651 - and taken from `all`, before
 * keepHaplotypes drops the reference's walks other than the queried one.
 */
function referenceElsewhere(
  all: SubgraphJson,
  kept: SubgraphJson,
): Record<string, number> {
  const queried = all.paths.find((path) => path.is_reference);
  if (!queried) return {};
  const onQueried = new Set(queried.path.map((step) => step.id));
  const wanted = new Set(kept.nodes.map((node) => node.id));
  const lengthOf = new Map(all.nodes.map((node) => [node.id, node.sequence.length]));
  const out: Record<string, number> = {};
  for (const walk of all.paths) {
    if (walk === queried || !walk.interval) continue;
    if (
      walk.sample !== queried.sample ||
      walk.haplotype !== queried.haplotype ||
      walk.contig !== queried.contig
    ) {
      continue;
    }
    /* In its path's own direction - see toJson - so counted on from its
       start. */
    let prefix = 0;
    for (const step of walk.path) {
      const length = lengthOf.get(step.id) ?? 0;
      const at = walk.interval.start + prefix;
      prefix += length;
      if (onQueried.has(step.id) || !wanted.has(step.id)) continue;
      if (!(step.id in out)) out[step.id] = at;
    }
  }
  return out;
}

/**
 * How many haplotypes - over every walk in `all` - take each node and each
 * allele of `kept`: the nodes it holds, and the alleles its walks take.
 * An allele is a walk leaving the reference walk and coming back to it, or
 * jumping between two reference nodes the reference does not walk between
 * (see alleleKey).
 */
function countCarriers(all: SubgraphJson, kept: SubgraphJson): Carriers {
  const reference = all.paths.find((path) => path.is_reference);
  const refIndex = new Map<string, number>();
  reference?.path.forEach((step, index) => {
    if (!refIndex.has(step.id)) refIndex.set(step.id, index);
  });

  /* Each allele a walk takes, handed to `take` as the ids it runs through
     - only those leaving from a node `from` admits, so a walk costs a
     lookup a step and builds no key for an allele nobody asked about. */
  const eachAllele = (
    path: JsonPath,
    from: (id: string) => boolean,
    take: (walk: string[]) => void,
  ) => {
    const steps = path.path;
    for (let i = 0; i + 1 < steps.length; i++) {
      const here = refIndex.get(steps[i].id);
      if (here === undefined) continue;
      const next = refIndex.get(steps[i + 1].id);
      if (next !== undefined) {
        /* Two reference nodes the reference does not walk between. */
        if (Math.abs(next - here) !== 1 && from(steps[i].id)) {
          take([steps[i].id, steps[i + 1].id]);
        }
        continue;
      }
      /* Off the reference walk, to where it comes back. */
      let back = i + 1;
      while (back < steps.length && !refIndex.has(steps[back].id)) back += 1;
      if (back < steps.length && from(steps[i].id)) {
        take(steps.slice(i, back + 1).map((step) => step.id));
      }
      i = back - 1;
    }
  };

  /* What is counted: the kept nodes, and the alleles the kept walks take -
     with the nodes those start or end at, the only places a walk can
     leave from to take one. */
  type Tally = { count: number; last: number };
  const nodeTallies = new Map<string, Tally>();
  for (const node of kept.nodes)
    nodeTallies.set(node.id, { count: 0, last: -1 });
  const alleleTallies = new Map<string, Tally>();
  const ends = new Set<string>();
  for (const path of kept.paths) {
    eachAllele(
      path,
      () => true,
      (walk) => {
        alleleTallies.set(alleleKey(walk), { count: 0, last: -1 });
        ends.add(walk[0]);
        ends.add(walk[walk.length - 1]);
      },
    );
  }

  /* A haplotype's walks read together, so it counts once for anything it
     reaches more than once: whatever it last counted is marked with it. */
  const byHaplotype = new Map<string, JsonPath[]>();
  for (const path of all.paths) {
    const key = haplotypeKey(path);
    const walks = byHaplotype.get(key);
    if (walks) walks.push(path);
    else byHaplotype.set(key, [path]);
  }
  let haplotype = 0;
  const tally = (entry: Tally | undefined) => {
    if (!entry || entry.last === haplotype) return;
    entry.last = haplotype;
    entry.count += 1;
  };
  for (const walks of byHaplotype.values()) {
    for (const path of walks) {
      for (const step of path.path) tally(nodeTallies.get(step.id));
      eachAllele(
        path,
        (id) => ends.has(id),
        (walk) => tally(alleleTallies.get(alleleKey(walk))),
      );
    }
    haplotype += 1;
  }

  const counts = (tallies: Map<string, Tally>) => {
    const out: Record<string, number> = {};
    for (const [key, entry] of tallies) out[key] = entry.count;
    return out;
  };
  return {
    total: byHaplotype.size,
    nodes: counts(nodeTallies),
    alleles: counts(alleleTallies),
  };
}

/**
 * Grows the subgraph outwards from the seeded node ends until `context` bp
 * are covered, dropping anything that was collected but not reached.
 */
function insertContext(
  records: Map<number, GbzRecord>,
  active: MinHeap,
  context: number,
  addNode: (id: number) => void,
): void {
  const visited = new Set<number>();
  const key = (node: number, side: number) => node * 2 + side;
  const toRemove = new Set<number>();
  for (const handle of records.keys()) toRemove.add(nodeId(handle));

  while (active.size > 0) {
    const { distance, node, side } = active.pop()!;
    if (visited.has(key(node, side))) continue;
    visited.add(key(node, side));
    toRemove.delete(node);
    addNode(node);

    // The other end of this node is one traversal away.
    const otherSide = flipSide(side);
    if (!visited.has(key(node, otherSide))) {
      const record = records.get(encodeNode(node, asStart(side)))!;
      const next = distance + record.sequenceLength - 1;
      if (next <= context) {
        active.push({ distance: next, node, side: otherSide });
      }
    }

    // Neighbours across this end are 1 bp away.
    const record = records.get(encodeNode(node, asEnd(side)))!;
    const next = distance + 1;
    if (next <= context) {
      for (const successor of record.successors()) {
        const id = nodeId(successor);
        const successorSide = sideStart(isReverse(successor));
        if (!visited.has(key(id, successorSide))) {
          active.push({ distance: next, node: id, side: successorSide });
        }
      }
    }
  }

  for (const id of toRemove) {
    records.delete(encodeNode(id, false));
    records.delete(encodeNode(id, true));
  }
}

/**
 * Where a walk starts on its path, from an anchor found `prefix` bp into it.
 *
 * Offsets are stored in forward-path coordinates, so a walk running forward
 * along the path sees them grow and one running backward sees them shrink:
 *
 *   forward:  bp(step i) = fragmentStart + prefix(i)
 *   reverse:  bp(step i) = fragmentStart + len - prefix(i) - nodeLen(i)
 *
 * Solving each for fragmentStart gives the two cases. `prefix` may run past
 * `len`: an anchor found by following the sequence on past the subgraph lies
 * after the walk, and both equations hold for it unchanged. Mirrors
 * `fragment_start_from_anchor` in gbz-base.
 */
function fragmentStartFrom(
  seqId: number,
  bpOffset: number,
  prefix: number,
  nodeLen: number,
  len: number,
): number {
  return seqId % 2 === 0
    ? Math.max(0, bpOffset - prefix)
    : Math.max(0, bpOffset + prefix + nodeLen - len);
}

/* The most records a walk is followed through past the subgraph's edge. The
   next anchor is at most ANCHOR_INTERVAL - 1 visits away, so this has to be at
   least the interval - the two are equal, and checking this many consecutive
   visits always covers one. Mirrors WALK_ON_LIMIT in gbz-base. */
const WALK_ON_LIMIT = 100;

/**
 * Names walks that met no anchor inside the subgraph, after gbz-base's
 * `name_walks_from_db`.
 *
 * Only one visit in every ANCHOR_INTERVAL along a sequence carries an anchor,
 * so a walk through a few nodes can cross none. Its sequence does not stop at
 * the edge of the subgraph, though: following it on through records read from
 * the database reaches an anchor within a few more nodes. The distance walked
 * to get there goes into the prefix, not into the walk, so the walk itself is
 * unchanged and the projection is the one an anchor inside it would use.
 *
 * A walk that reaches the end of its sequence first stays anonymous. A
 * database built with the last visit of every sequence anchored has none.
 */
function nameWalksPastEdge(paths: PathInfo[], cache: RecordCache): void {
  for (const info of paths) {
    if (info.pathHandle !== null || !info.exit) continue;
    let pos: Pos | null = info.exit;
    let extra = 0;
    for (let step = 0; step < WALK_ON_LIMIT && pos; step++) {
      const record = cache.get(pos.node);
      if (!record) break;
      const nodeLen = record.sequenceLength;
      const anchor = record.anchorAt(pos.offset);
      if (anchor) {
        info.pathHandle = Math.floor(anchor.seqId / 2);
        info.backward = anchor.seqId % 2 === 1;
        info.fragmentStart = fragmentStartFrom(
          anchor.seqId,
          anchor.bpOffset,
          info.len + extra,
          nodeLen,
          info.len,
        );
        break;
      }
      extra += nodeLen;
      const next = record.lf(pos.offset);
      pos = next && next.node !== ENDMARKER ? next : null;
    }
  }
}

/**
 * Stitches the GBWT positions in the subgraph back into walks. Every position
 * with no predecessor inside the subgraph starts one; following successors
 * from there recovers a haplotype's traversal of this window.
 */
function extractPaths(
  records: Map<number, GbzRecord>,
  refStart: { pos: Pos; nodeOffset: number; seqOffset: number },
): { paths: PathInfo[]; refId: number | null; refOffset: number | null } {
  const successors = new Map<
    number,
    Array<{ pos: Pos; hasPredecessor: boolean }>
  >();
  for (const [handle, record] of records) {
    successors.set(
      handle,
      record.decompress().map((pos) => ({ pos, hasPredecessor: false })),
    );
  }

  for (const entries of successors.values()) {
    for (const { pos } of entries) {
      const target = successors.get(pos.node);
      if (target && pos.offset < target.length) {
        target[pos.offset].hasPredecessor = true;
      }
    }
  }

  const nextPos = (pos: Pos): Pos | null => {
    const entries = successors.get(pos.node);
    if (!entries || pos.offset >= entries.length) return null;
    const next = entries[pos.offset].pos;
    if (next.node === ENDMARKER || !successors.has(next.node)) return null;
    return next;
  };

  const paths: PathInfo[] = [];
  let refId: number | null = null;
  let refOffset: number | null = null;

  /* Insertion order of `records` is the order handles were added, but the
     Rust side iterates a BTreeMap. Sort so the walks come out in the same
     order and the JSON can be compared directly. */
  const handles = [...successors.keys()].sort((a, b) => a - b);

  for (const handle of handles) {
    const entries = successors.get(handle)!;
    for (let offset = 0; offset < entries.length; offset++) {
      if (entries[offset].hasPredecessor) continue;

      let current: Pos | null = { node: handle, offset };
      let isRef = false;
      const walk: number[] = [];
      let len = 0;

      /* The walk is one GBWT sequence, so a single anchor anywhere on it names
         the whole walk. Only sampled occurrences carry one, so take the first
         we meet and remember where it sat: `prefix` is the bp of the walk
         before that node, `nodeLen` the length of the node itself. */
      let anchorSeqId: number | null = null;
      let anchorBp = 0;
      let anchorPrefix = 0;
      let anchorNodeLen = 0;
      let exit: Pos | null = null;

      while (current) {
        const record = records.get(current.node)!;
        const nodeLen = record.sequenceLength;
        if (anchorSeqId === null) {
          const found = record.anchorAt(current.offset);
          if (found) {
            anchorSeqId = found.seqId;
            anchorBp = found.bpOffset;
            anchorPrefix = len;
            anchorNodeLen = nodeLen;
          }
        }
        if (
          current.node === refStart.pos.node &&
          current.offset === refStart.pos.offset
        ) {
          refId = paths.length;
          refOffset = walk.length;
          isRef = true;
        }
        walk.push(current.node);
        len += nodeLen;
        const next = nextPos(current);
        if (!next) {
          /* Where the sequence goes after this node, if it goes on out of the
             subgraph rather than ending. */
          const raw = successors.get(current.node)?.[current.offset]?.pos;
          if (raw && raw.node !== ENDMARKER) exit = raw;
        }
        current = next;
      }

      /* Project the anchor back to the start of the fragment. A walk through
         fewer nodes than the sampling interval can miss every anchor; it keeps
         `exit`, and nameWalksPastEdge follows its sequence on to one. */
      let pathHandle: number | null = null;
      let fragmentStart: number | null = null;
      if (anchorSeqId !== null) {
        pathHandle = Math.floor(anchorSeqId / 2);
        fragmentStart = fragmentStartFrom(
          anchorSeqId,
          anchorBp,
          anchorPrefix,
          anchorNodeLen,
          len,
        );
      }

      if (isRef || pathIsCanonical(walk)) {
        paths.push({
          path: walk,
          len,
          pathHandle,
          fragmentStart,
          backward: anchorSeqId !== null && anchorSeqId % 2 === 1,
          exit,
        });
      }
    }
  }

  return { paths, refId, refOffset };
}

function writeJson(
  source: GbzSource,
  records: Map<number, GbzRecord>,
  extracted: {
    paths: PathInfo[];
    refId: number | null;
    refOffset: number | null;
  },
  refPath: GbzPath,
  refStart: { pos: Pos; nodeOffset: number; seqOffset: number },
): SubgraphJson {
  const handles = [...records.keys()].sort((a, b) => a - b);

  const nodes: JsonNode[] = [];
  for (const handle of handles) {
    if (isReverse(handle)) continue;
    nodes.push({
      id: String(nodeId(handle)),
      sequence: records.get(handle)!.sequence,
    });
  }

  const edges: JsonEdge[] = [];
  for (const handle of handles) {
    for (const successor of records.get(handle)!.successors()) {
      if (records.has(successor) && edgeIsCanonical(handle, successor)) {
        edges.push({
          from: String(nodeId(handle)),
          from_is_reverse: isReverse(handle),
          to: String(nodeId(successor)),
          to_is_reverse: isReverse(successor),
        });
      }
    }
  }

  /* Path names, resolved once per distinct handle. */
  const names = new Map<number, GbzPath>();
  for (const info of extracted.paths) {
    if (info.pathHandle !== null && !names.has(info.pathHandle)) {
      const named = source.getPath(info.pathHandle);
      if (named) names.set(info.pathHandle, named);
    }
  }

  const { paths: infos, refId, refOffset } = extracted;

  /* The reference walk's interval is the query interval grown to whole nodes;
     it is recovered by measuring back from the query position to the start of
     the walk. */
  let refInterval: { start: number; end: number } | null = null;
  if (refId !== null && refOffset !== null) {
    const info = infos[refId];
    let back = refStart.nodeOffset;
    for (let i = 0; i < refOffset; i++) {
      back += records.get(info.path[i])!.sequenceLength;
    }
    const start = refStart.seqOffset - back;
    refInterval = { start, end: start + info.len };
  }

  const toJson = (
    info: PathInfo,
    id: number,
    name: string,
    fragment: number,
  ): JsonPath => {
    /* In its own path's direction - the haplotype's. Every path is in the
       GBWT both ways round, and the walk kept is the canonical one (see
       pathIsCanonical), which for a walk on the reverse strand at both ends
       is its path read backwards. Given that way, with its path's
       coordinates, it counted up along a stretch its contig runs down, and
       read forwards: a contig read backwards, or the middle of an inversion
       - HG002#1 at chr14:54,815,000, where a wider window has it on the
       reverse strand. Not as gbz-base's `query` writes it, for these. */
    const steps = info.backward ? [...info.path].reverse() : info.path;
    const value: JsonPath = {
      name,
      path: steps.map((handle) => ({
        id: String(nodeId(handle)),
        is_reverse: isReverse(handle) !== info.backward,
      })),
      is_reference: id === refId,
      length: info.len,
    };
    if (info.pathHandle !== null) value.path_handle = String(info.pathHandle);
    const named =
      info.pathHandle !== null ? names.get(info.pathHandle) : undefined;
    const meta = named ?? (id === refId ? refPath : undefined);
    if (meta) {
      value.sample = meta.sample;
      value.contig = meta.contig;
      value.haplotype = meta.haplotype;
    }
    if (info.fragmentStart !== null) value.fragment_start = info.fragmentStart;

    if (id === refId && refInterval) {
      value.interval = {
        start: refPath.fragment + refInterval.start,
        end: refPath.fragment + refInterval.end,
      };
    } else if (info.fragmentStart !== null) {
      value.interval = {
        start: fragment + info.fragmentStart,
        end: fragment + info.fragmentStart + info.len,
      };
    }
    return value;
  };

  /* Field order follows the Rust writer: name, path, then the added fields. */
  const paths: JsonPath[] = [];
  if (refId !== null && refInterval) {
    const info = infos[refId];
    const start = refPath.fragment + refInterval.start;
    const end = refPath.fragment + refInterval.end;
    paths.push(
      toJson(
        info,
        refId,
        `${refPath.sample}#${refPath.haplotype}#${refPath.contig}[${start}-${end}]`,
        refPath.fragment,
      ),
    );
  }

  /* The counter advances on every non-reference walk, named or not, matching
     the `haplotype += 1` at the end of the Rust loop. Incrementing it only for
     anonymous walks numbers them differently as soon as a named walk precedes
     one, which the dense encoding hid because walks were almost never
     anonymous. */
  let anonymousHaplotype = 1;
  /* A walk that reads the same backwards - a hairpin's turn, u+ u-, cut
     down to its two steps by the window's edge - is canonical both ways
     round, and the GBWT gives it twice: the same stretch of its path, once
     from each orientation. Kept once; twice, the bar read it as a dupe. */
  const kept = new Set<string>();
  for (let id = 0; id < infos.length; id++) {
    if (id === refId) continue;
    const info = infos[id];
    if (info.pathHandle !== null && info.fragmentStart !== null) {
      const key = `${info.pathHandle}:${info.fragmentStart}:${info.len}`;
      if (kept.has(key)) {
        anonymousHaplotype += 1;
        continue;
      }
      kept.add(key);
    }
    const named =
      info.pathHandle !== null ? names.get(info.pathHandle) : undefined;
    let name: string;
    let fragment = 0;
    if (named && info.fragmentStart !== null) {
      fragment = named.fragment;
      const start = fragment + info.fragmentStart;
      name = `${named.sample}#${named.haplotype}#${named.contig}[${start}-${start + info.len}]`;
    } else if (info.fragmentStart !== null) {
      const start = info.fragmentStart;
      name = `unknown#${anonymousHaplotype}#${refPath.contig}[${start}-${start + info.len}]`;
    } else {
      name = `unknown#${anonymousHaplotype}#${refPath.contig}[0-${info.len}]`;
    }
    paths.push(toJson(info, id, name, fragment));
    anonymousHaplotype += 1;
  }

  return { nodes, edges, paths };
}

/** A walk's haplotype as `sample#haplotype`, from its fields or its name. */
export function haplotypeKey(path: JsonPath): string {
  if (path.sample !== undefined && path.haplotype !== undefined) {
    return `${path.sample}#${path.haplotype}`;
  }
  const [sample, haplotype] = path.name.split("#");
  return `${sample}#${haplotype ?? 0}`;
}

/**
 * The subgraph with only the walks of `haplotypes` - `sample#haplotype`
 * keys - and the reference's walk, and only the nodes and edges those walks
 * use: a node only an unpicked haplotype reads is not part of what was
 * asked for.
 */
export function keepHaplotypes(
  json: SubgraphJson,
  haplotypes: Iterable<string>,
): SubgraphJson {
  const wanted = new Set(haplotypes);
  const paths = json.paths.filter(
    (path) => path.is_reference || wanted.has(haplotypeKey(path)),
  );
  const used = new Set<string>();
  for (const path of paths) {
    for (const step of path.path) used.add(step.id);
  }
  return {
    nodes: json.nodes.filter((node) => used.has(node.id)),
    edges: json.edges.filter(
      (edge) => used.has(edge.from) && used.has(edge.to),
    ),
    paths,
  };
}
