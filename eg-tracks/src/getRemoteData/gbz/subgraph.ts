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
  return query.haplotypes ? keepHaplotypes(json, query.haplotypes) : json;
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
        paths.push({ path: walk, len, pathHandle, fragmentStart, exit });
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
    const value: JsonPath = {
      name,
      path: info.path.map((handle) => ({
        id: String(nodeId(handle)),
        is_reverse: isReverse(handle),
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
  for (let id = 0; id < infos.length; id++) {
    if (id === refId) continue;
    const info = infos[id];
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
    edges: json.edges.filter((edge) => used.has(edge.from) && used.has(edge.to)),
    paths,
  };
}
