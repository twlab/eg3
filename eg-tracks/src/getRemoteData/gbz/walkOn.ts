import { encodeNode, ENDMARKER, isReverse, nodeId } from "./codec";
import type { PathAnchor, Pos } from "./codec";
import type { GbzRecord } from "./record";
import type { GbzPath, GbzSource, RecordCache } from "./store";
import type { PathInfo } from "./subgraph";

/* ══════════════════════════════════════════════════════════════════════════
   Walking a cut walk on to the reference.

   The context stops every walk a few bases past the window's nodes, so a
   haplotype that is in the middle of its own sequence there - an insertion
   longer than the context, a jump along the reference - arrives cut, and
   the bar can say no more of that end than "goes off here". Here each cut
   end of a shown haplotype's walk is followed along its own path, forward
   through the record's LF and backward through its inverse, until a node
   the reference reads, and that node is kept as the end: the allele then
   arrives whole, with the reference node it rejoins at, and `referenceAt`
   says where that node is. A walk whose contig ends is kept to the end. One
   that finds no reference node within the limits is left as the context
   cut it.

   Which nodes the reference reads: those on its walk through the window;
   those on a short stretch of its path either side, enumerated from the
   reference index; and, for a rejoin farther off, any node whose record
   carries one of the reference's own sampled anchors, which names its
   position outright. An anchor is met only on one visit in a hundred, so
   by then the walk has overshot the rejoin; the reference is enumerated
   back over what was walked, and the end cut at the first node it reads.

   Fragments of one path are then made one where they meet: the GBWT holds
   every path both ways round, and a hairpin's turn reads the same each
   way, so it is stitched twice; and a walk followed on can reach the next
   fragment of its own path, a tandem duplication's second pass.
   ══════════════════════════════════════════════════════════════════════════ */

/** The reference enumerated this far either side of the window before any
    walk is followed, so the usual short allele ends at once. */
const REFERENCE_REACH_BP = 5_000;

/** The most an end is followed, in the haplotype's own bases and in nodes.
    An end that meets no reference node within this is left as the context
    cut it. */
export const MAX_WALK_ON_BP = 100_000;
export const MAX_WALK_ON_NODES = 3_000;

/** Two fragments of one path at most this far apart are joined by walking
    the gap between them. */
const GAP_JOIN_BP = 2_000;

/** When an end is placed by one of the reference's anchors, the reference
    is enumerated back over the stretch walked and this much more: the walk
    may have rejoined, left and rejoined again before the anchor, with a
    deletion between that makes the reference's stretch the longer. */
export const ANCHOR_SLACK_BP = 10_000;

/* ── The reference's path, enumerated ──────────────────────────────── */

/** What has been enumerated of a reference path, kept per source across
    queries so that a pan reads each stretch once. */
interface ReferenceCover {
  /** Contig intervals enumerated: disjoint, ascending. */
  covered: Array<[number, number]>;
  /** Node id -> the contig positions the reference reads it at. */
  at: Map<number, number[]>;
}

const covers = new WeakMap<GbzSource, Map<number, ReferenceCover>>();

function coverOf(source: GbzSource, handle: number): ReferenceCover {
  let perPath = covers.get(source);
  if (!perPath) covers.set(source, (perPath = new Map()));
  let cover = perPath.get(handle);
  if (!cover) perPath.set(handle, (cover = { covered: [], at: new Map() }));
  return cover;
}

/** The parts of `from..to` not yet covered. */
function gaps(
  covered: Array<[number, number]>,
  from: number,
  to: number,
): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  let at = from;
  for (const [a, b] of covered) {
    if (b <= at) continue;
    if (a >= to) break;
    if (a > at) out.push([at, a]);
    at = Math.max(at, b);
  }
  if (at < to) out.push([at, to]);
  return out;
}

export function addCovered(covered: Array<[number, number]>, a: number, b: number): void {
  if (b <= a) return;
  let lo = a;
  let hi = b;
  const apart: Array<[number, number]> = [];
  for (const [x, y] of covered) {
    if (y < lo || x > hi) apart.push([x, y]);
    else {
      lo = Math.min(lo, x);
      hi = Math.max(hi, y);
    }
  }
  apart.push([lo, hi]);
  apart.sort((p, q) => p[0] - q[0]);
  covered.splice(0, covered.length, ...apart);
}

export interface Context {
  cache: RecordCache;
  source: GbzSource;
  reference: GbzPath;
  cover: ReferenceCover;
  /** The nodes of the reference's walk through the window. */
  onWalk: Set<number>;
  /** The queried interval, contig coordinates. */
  window: [number, number];
}

/** The reference's cover and the window's walk: what the walk-on and the
    search for absent haplotypes (locate.ts) share. */
export function makeContext(
  cache: RecordCache,
  source: GbzSource,
  reference: GbzPath,
  walk: PathInfo,
  window: [number, number],
): Context {
  return {
    cache,
    source,
    reference,
    cover: coverOf(source, reference.handle),
    onWalk: new Set(walk.path.map(nodeId)),
    window,
  };
}

/**
 * Enumerates the reference's path over `from..to`, contig coordinates,
 * from the last indexed position before it, skipping what is covered.
 * With `visit`, every node of the stretch is read, covered or not, and
 * handed over with its record and position; a visit returning true stops
 * the walk.
 */
export function enumerateReference(
  ctx: Context,
  from: number,
  to: number,
  visit?: (id: number, record: GbzRecord, at: number, pos: Pos) => boolean | void,
): void {
  const { reference, cover } = ctx;
  from = Math.max(from, reference.fragment);
  if (to <= from) return;
  const stretches: Array<[number, number]> = visit ? [[from, to]] : gaps(cover.covered, from, to);
  for (const [a, b] of stretches) {
    const indexed = ctx.source.indexedPosition(reference.handle, a - reference.fragment);
    if (!indexed) return;
    let offset = indexed.pathOffset;
    const start = reference.fragment + offset;
    let pos: Pos | null = { node: indexed.node, offset: indexed.offset };
    let stopped = false;
    while (pos && reference.fragment + offset < b) {
      const record = ctx.cache.get(pos.node);
      if (!record) break;
      const at = reference.fragment + offset;
      const id = nodeId(pos.node);
      const seen = cover.at.get(id);
      if (!seen) cover.at.set(id, [at]);
      else if (!seen.includes(at)) seen.push(at);
      offset += record.sequenceLength;
      stopped = visit?.(id, record, at, pos) === true;
      const next = record.lf(pos.offset);
      pos = next && next.node !== ENDMARKER ? next : null;
      if (stopped) break;
    }
    addCovered(cover.covered, start, reference.fragment + offset);
    if (stopped) return;
  }
}

/** Where the reference reads a node, if enumerated: of several visits, the
    one nearest the window. */
export function readAt(ctx: Context, id: number): number | undefined {
  const visits = ctx.cover.at.get(id);
  if (!visits) return undefined;
  const [from, to] = ctx.window;
  let best = visits[0];
  let nearest = Infinity;
  for (const at of visits) {
    const distance = at < from ? from - at : at >= to ? at - to : 0;
    if (distance < nearest) {
      best = at;
      nearest = distance;
    }
  }
  return best;
}

/* ── Along a sequence, either way ──────────────────────────────────── */

const flip = (handle: number): number => encodeNode(nodeId(handle), !isReverse(handle));

/** The position after `pos` on its sequence, or null where it ends. */
export function after(cache: RecordCache, pos: Pos): Pos | null {
  const next = cache.get(pos.node)?.lf(pos.offset) ?? null;
  return next && next.node !== ENDMARKER ? next : null;
}

/**
 * The position before `pos` on its sequence, or null where it starts. The
 * graph lists every edge both ways round, so the record of the node's other
 * orientation names the predecessors, as their other orientations; the one
 * whose walk leads to `pos` is found by LF's inverse.
 */
export function before(cache: RecordCache, pos: Pos): Pos | null {
  const other = cache.get(flip(pos.node));
  if (!other) return null;
  for (const successor of other.successors()) {
    const node = flip(successor);
    const offset = cache.get(node)?.inverseLf(pos);
    if (offset !== null && offset !== undefined) return { node, offset };
  }
  return null;
}

/** One end followed on: the handles in the order walked, their positions,
    and why the walk stopped. */
interface Tail {
  handles: number[];
  positions: Pos[];
  bp: number;
  stop: "walk" | "reference" | "end" | "cap";
  /** Where the reference reads the last node, when it is a reference node
      off the window's walk. */
  at?: number;
}

function follow(ctx: Context, from: Pos | null, forward: boolean): Tail {
  const handles: number[] = [];
  const positions: Pos[] = [];
  let bp = 0;
  let pos = from;
  while (pos) {
    const record = ctx.cache.get(pos.node);
    if (!record) break;
    handles.push(pos.node);
    positions.push(pos);
    bp += record.sequenceLength;
    const id = nodeId(pos.node);
    if (ctx.onWalk.has(id)) return { handles, positions, bp, stop: "walk" };
    const at = readAt(ctx, id);
    if (at !== undefined) return { handles, positions, bp, stop: "reference", at };
    const anchor = record.pathAnchors.find(
      (a) => Math.floor(a.seqId / 2) === ctx.reference.handle,
    );
    if (anchor) {
      return placeByAnchor(ctx, { handles, positions, bp, stop: "reference" }, anchor, forward);
    }
    if (bp >= MAX_WALK_ON_BP || handles.length >= MAX_WALK_ON_NODES) {
      return { handles, positions, bp, stop: "cap" };
    }
    pos = forward ? after(ctx.cache, pos) : before(ctx.cache, pos);
  }
  return { handles, positions, bp, stop: "end" };
}

/**
 * The walk has reached a node that one of the reference's own anchors
 * places, at `anchor.bpOffset` along the reference: a reference node beyond
 * the stretch enumerated. The walk may have been on the reference for a
 * while, so the reference is enumerated back over what was walked, and the
 * tail cut at the first node it reads.
 */
function placeByAnchor(ctx: Context, tail: Tail, anchor: PathAnchor, forward: boolean): Tail {
  const at = ctx.reference.fragment + anchor.bpOffset;
  const last = tail.handles[tail.handles.length - 1];
  const len = ctx.cache.get(last)?.sequenceLength ?? 0;
  /* The reference's forward sequence anchors in the record of the
     orientation it reads the node in, so an even sequence id says the
     reference runs the way this walk's sequence does here. The walk runs
     that way forward and the other way backward; where it runs the
     reference's way, the rejoin lies below the anchor, else above. */
  const referenceWay = anchor.seqId % 2 === 0;
  const up = referenceWay === forward;
  const slack = tail.bp + ANCHOR_SLACK_BP;
  enumerateReference(ctx, up ? at - slack : at, up ? at + len : at + len + slack);
  for (let k = 0; k < tail.handles.length; k++) {
    const read = readAt(ctx, nodeId(tail.handles[k]));
    if (read === undefined) continue;
    const handles = tail.handles.slice(0, k + 1);
    const positions = tail.positions.slice(0, k + 1);
    const bp = handles.reduce((n, h) => n + (ctx.cache.get(h)?.sequenceLength ?? 0), 0);
    return { handles, positions, bp, stop: "reference", at: read };
  }
  /* The reference could not be enumerated here (unindexed): the anchored
     node itself, placed by its anchor. */
  return { ...tail, at };
}

/* ── Fragments of one path made one ─────────────────────────────────── */

/** A walk's handles in its path's forward order - see toJson. */
const forwardOrder = (info: PathInfo): number[] =>
  info.backward ? info.path.map(flip).reverse() : info.path;

/** How a gap between two fragments of one path is walked to join them. */
export interface GapWalk {
  cache: RecordCache;
  addNode: (id: number) => void;
  /** The widest gap walked, in bases. */
  maxGap: number;
}

/**
 * The nodes of a path over the `bp` bases after a fragment's end, in the
 * path's forward order, by following the fragment's sequence - on from
 * its exit, or back from its start where it was stitched from the
 * reverse sequence. Null when the sequence ends first or the bases do not
 * come out even.
 */
function walkGap(info: PathInfo, bp: number, cache: RecordCache): number[] | null {
  const onward = !info.backward;
  let pos = onward ? info.exit : before(cache, info.start);
  const out: number[] = [];
  let walked = 0;
  while (pos && walked < bp) {
    const record = cache.get(pos.node);
    if (!record) return null;
    out.push(onward ? pos.node : flip(pos.node));
    walked += record.sequenceLength;
    pos = onward ? after(cache, pos) : before(cache, pos);
  }
  return walked === bp ? out : null;
}

/**
 * Fragments of one path that cover the same stretch of it, or - once
 * followed on - meet or overlap, made one. A fragment inside another is
 * dropped: a hairpin's turn stitched from both orientations, or a scrap a
 * longer walk has been followed through. Two that meet are joined, in the
 * path's forward order, the overlap - the node the first stopped at -
 * taken once. With `gapWalk`, two a short gap apart are joined too, by
 * walking the gap along the path: the fetch cuts a walk at the subgraph's
 * edge, and a walk that steps out for a few nodes and back in - a
 * hairpin's turn just past the context - arrives as two fragments. The
 * joined walk's `start` is then no longer its position.
 */
export function mergeFragments(
  paths: PathInfo[],
  keep: PathInfo,
  lenOf: (handle: number) => number,
  join: boolean,
  gapWalk?: GapWalk,
): PathInfo[] {
  const groups = new Map<number, PathInfo[]>();
  for (const info of paths) {
    if (info === keep || info.pathHandle === null || info.fragmentStart === null) continue;
    const group = groups.get(info.pathHandle);
    if (group) group.push(info);
    else groups.set(info.pathHandle, [info]);
  }
  const dropped = new Set<PathInfo>();
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => a.fragmentStart! - b.fragmentStart! || b.len - a.len);
    let current = group[0];
    for (let k = 1; k < group.length; k++) {
      const next = group[k];
      const end = current.fragmentStart! + current.len;
      if (next.fragmentStart! + next.len <= end) {
        dropped.add(next);
        continue;
      }
      const overlap = end - next.fragmentStart!;
      if (!join || overlap < -(gapWalk?.maxGap ?? 0)) {
        current = next;
        continue;
      }
      const a = forwardOrder(current);
      const b = forwardOrder(next);
      let between: number[] = [];
      if (overlap < 0) {
        /* A gap: walked along the path, and it must come out at the next
           fragment's first node. */
        const walked = gapWalk ? walkGap(current, -overlap, gapWalk.cache) : null;
        const landing = walked ? walkGap(current, -overlap + lenOf(b[0]), gapWalk!.cache) : null;
        if (!walked || !landing || nodeId(landing[landing.length - 1]) !== nodeId(b[0])) {
          current = next;
          continue;
        }
        between = walked;
        for (const handle of between) gapWalk!.addNode(nodeId(handle));
      }
      let shared = 0;
      let bp = 0;
      while (bp < overlap && shared < b.length) bp += lenOf(b[shared++]);
      const same =
        bp === Math.max(0, overlap) &&
        shared <= a.length &&
        b.slice(0, shared).every((h, i) => h === a[a.length - shared + i]);
      if (!same) {
        current = next;
        continue;
      }
      current.path = [...a, ...between, ...b.slice(shared)];
      current.backward = false;
      current.len += next.len - overlap;
      current.exit = next.backward ? null : next.exit;
      dropped.add(next);
    }
  }
  return dropped.size ? paths.filter((info) => !dropped.has(info)) : paths;
}

/* ── The step ───────────────────────────────────────────────────────── */

/**
 * Follows every cut end of the walks `extend` picks on to the reference,
 * adding the nodes walked to `records` through `addNode` and lengthening
 * the walks in place; then makes one of fragments that meet. Returns where
 * the reference reads each node a walk was followed to, or ends at, off
 * the window's walk.
 */
export function walkOn(
  extracted: { paths: PathInfo[]; refId: number | null },
  records: Map<number, GbzRecord>,
  cache: RecordCache,
  source: GbzSource,
  reference: GbzPath,
  window: [number, number],
  addNode: (id: number) => void,
  extend: (info: PathInfo) => boolean,
): Map<number, number> {
  const referenceAt = new Map<number, number>();
  if (extracted.refId === null) return referenceAt;
  const walk = extracted.paths[extracted.refId];
  const ctx = makeContext(cache, source, reference, walk, window);
  enumerateReference(ctx, window[0] - REFERENCE_REACH_BP, window[1] + REFERENCE_REACH_BP);
  const lenOf = (handle: number) =>
    records.get(handle)?.sequenceLength ?? cache.get(handle)?.sequenceLength ?? 0;

  /* A stretch stitched twice is followed once. */
  let paths = mergeFragments(extracted.paths, walk, lenOf, false);

  for (const info of paths) {
    if (info === walk || !extend(info)) continue;

    /* The end the walk leaves by. */
    const lastId = nodeId(info.path[info.path.length - 1]);
    if (!ctx.onWalk.has(lastId)) {
      const at = readAt(ctx, lastId);
      if (at !== undefined) referenceAt.set(lastId, at);
      else if (info.exit) {
        const tail = follow(ctx, info.exit, true);
        if (tail.stop !== "cap" && tail.handles.length) {
          for (const handle of tail.handles) addNode(nodeId(handle));
          info.path.push(...tail.handles);
          info.len += tail.bp;
          if (info.backward && info.fragmentStart !== null) info.fragmentStart -= tail.bp;
          info.exit = after(cache, tail.positions[tail.positions.length - 1]);
          if (tail.at !== undefined) {
            referenceAt.set(nodeId(tail.handles[tail.handles.length - 1]), tail.at);
          }
        }
      }
    }

    /* The end it comes in by. */
    const firstId = nodeId(info.path[0]);
    if (!ctx.onWalk.has(firstId)) {
      const at = readAt(ctx, firstId);
      if (at !== undefined) referenceAt.set(firstId, at);
      else {
        const head = follow(ctx, before(cache, info.start), false);
        if (head.stop !== "cap" && head.handles.length) {
          for (const handle of head.handles) addNode(nodeId(handle));
          info.path.unshift(...[...head.handles].reverse());
          info.len += head.bp;
          if (!info.backward && info.fragmentStart !== null) info.fragmentStart -= head.bp;
          info.start = head.positions[head.positions.length - 1];
          if (head.at !== undefined) {
            referenceAt.set(nodeId(head.handles[head.handles.length - 1]), head.at);
          }
        }
      }
    }
  }

  paths = mergeFragments(paths, walk, lenOf, true, { cache, addNode, maxGap: GAP_JOIN_BP });
  extracted.refId = paths.indexOf(walk);
  extracted.paths = paths;
  return referenceAt;
}

/** Where the reference reads each of `ids` off the window's walk, as far
    as it has been enumerated: for every node the fetch holds, once the
    walks have been followed and joined. */
export function referenceReads(ctx: Context, ids: Iterable<number>): Map<number, number> {
  const out = new Map<number, number>();
  for (const id of ids) {
    if (ctx.onWalk.has(id)) continue;
    const at = readAt(ctx, id);
    if (at !== undefined) out.set(id, at);
  }
  return out;
}
