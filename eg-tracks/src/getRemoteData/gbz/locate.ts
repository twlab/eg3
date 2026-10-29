import { fragmentStartFrom, nodeId } from "./codec";
import type { PathAnchor, Pos } from "./codec";
import { pathsOf } from "./bounds";
import type { GbzSource } from "./store";
import type { PathInfo } from "./subgraph";
import {
  ANCHOR_SLACK_BP,
  MAX_WALK_ON_BP,
  MAX_WALK_ON_NODES,
  addCovered,
  after,
  before,
  enumerateReference,
  readAt,
} from "./walkOn";
import type { Context } from "./walkOn";

/* ══════════════════════════════════════════════════════════════════════════
   Finding a shown haplotype that has no walk through the fetched nodes.

   A haplotype that lacks the band's reference, or has other sequence in
   its place, passes through none of the window's nodes, and unless some
   edge within the context happens to lead to a node on its path it is not
   extracted at all: its lane is empty, which is also what no data looks
   like. Every node's record lists its sampled visits - one visit in a
   hundred along each path, and each path's last - with the path they
   belong to, so the haplotype can be looked for along the reference:
   outward from the window, a stretch at a time on each side, reading
   each node's record for a visit of one of its paths. From the visit
   found nearest the window its path is followed toward the window -
   forward through LF from the left, backward through its inverse from
   the right - and on to the first node the reference reads past the
   window. Cut to the last reference node before it leaves the reference,
   that is a fragment of the shape the walk-on makes, and the lane draws
   it: white across the band, the reference it lacks and its own bases in
   place of it.

   The search stops at a cap either side. What was searched and what was
   found is reported per haplotype, so a lane left empty can say so. The
   stretches searched in vain and the visits found are kept per source, so
   a pan reads each stretch once.
   ══════════════════════════════════════════════════════════════════════════ */

/** What the search found for one haplotype. */
export interface Located {
  /** found: a fragment was made from a sampled visit. notSeen: no visit
      in the stretch searched. lost: a visit was found, but its path could
      not be followed to the reference past the window. */
  state: "found" | "notSeen" | "lost";
  /** The reference searched, contig coordinates. */
  from: number;
  to: number;
  /** The visit followed: where the reference reads that node, and which
      side of the window it is on. */
  seenAt?: number;
  side?: "left" | "right";
  /** For lost: why. */
  reason?: "contig ends" | "limit";
}

/** The search goes this much further out each round, each side. */
const SEARCH_STEP_BP = 2_000;
/** How far it goes either side before giving up. */
export const SEARCH_CAP_BP = 100_000;

/* ── Per source: each haplotype's paths, and what was searched ───────── */

const handleLists = new WeakMap<GbzSource, Map<string, Set<number>>>();

/** The path handles of a haplotype, by `sample#haplotype`: a haplotype in
    several contigs has several. */
function handlesOf(source: GbzSource, key: string): Set<number> {
  let lists = handleLists.get(source);
  if (!lists) {
    lists = new Map();
    for (const path of pathsOf(source)) {
      const of = `${path.sample}#${path.haplotype}`;
      const set = lists.get(of);
      if (set) set.add(path.handle);
      else lists.set(of, new Set([path.handle]));
    }
    handleLists.set(source, lists);
  }
  return lists.get(key) ?? new Set();
}

interface Visit {
  /** Where the reference reads the node. */
  at: number;
  /** The reference's handle for it; the visit is in that record. */
  node: number;
  anchor: PathAnchor;
}

/** What earlier searches found for a haplotype along one reference path. */
interface Searched {
  /** Stretches with no visit: disjoint, ascending. */
  clear: Array<[number, number]>;
  /** Visits found, ascending by `at`. */
  seen: Visit[];
}

const searches = new WeakMap<GbzSource, Map<string, Searched>>();

function searchedFor(source: GbzSource, referenceHandle: number, key: string): Searched {
  let perSource = searches.get(source);
  if (!perSource) searches.set(source, (perSource = new Map()));
  const id = `${referenceHandle}:${key}`;
  let searched = perSource.get(id);
  if (!searched) perSource.set(id, (searched = { clear: [], seen: [] }));
  return searched;
}

const isClear = (clear: Array<[number, number]>, a: number, b: number): boolean =>
  clear.some(([x, y]) => x <= a && b <= y);

/* ── The search ─────────────────────────────────────────────────────── */

/**
 * Looks for each haplotype in `keys` along the reference, outward from the
 * window, and makes a fragment of each one found, with the nodes walked
 * added through `addNode`. Returns what was found per haplotype, the
 * fragments, and where the reference reads each reference node in them.
 */
export function locateAbsent(
  ctx: Context,
  keys: string[],
  addNode: (id: number) => void,
  capBp = SEARCH_CAP_BP,
): { located: Map<string, Located>; fragments: PathInfo[]; referenceAt: Map<number, number> } {
  const { source, reference, window } = ctx;
  const located = new Map<string, Located>();
  const fragments: PathInfo[] = [];
  const referenceAt = new Map<number, number>();
  const targets = new Map<string, { handles: Set<number>; searched: Searched }>();
  for (const key of keys) {
    const handles = handlesOf(source, key);
    if (handles.size) {
      targets.set(key, { handles, searched: searchedFor(source, reference.handle, key) });
    }
  }
  const [winFrom, winTo] = window;
  let leftDone = 0;
  let rightDone = 0;
  let reach = 0;
  while (targets.size && reach < capBp) {
    for (const side of ["left", "right"] as const) {
      if (!targets.size) break;
      const a = side === "left" ? Math.max(reference.fragment, winFrom - reach - SEARCH_STEP_BP) : winTo + reach;
      const b = side === "left" ? winFrom - reach : winTo + reach + SEARCH_STEP_BP;
      if (b <= a) continue;

      /* What earlier searches know of this stretch, and what is left to read. */
      const hits = new Map<string, Visit>();
      const toScan = new Map<string, Set<number>>();
      for (const [key, target] of targets) {
        const known = target.searched.seen.filter((visit) => visit.at >= a && visit.at < b);
        if (known.length) hits.set(key, side === "left" ? known[known.length - 1] : known[0]);
        else if (!isClear(target.searched.clear, a, b)) toScan.set(key, target.handles);
      }
      if (toScan.size) {
        enumerateReference(ctx, a, b, (_id, record, at, pos) => {
          for (const anchor of record.pathAnchors) {
            const handle = Math.floor(anchor.seqId / 2);
            for (const [key, handles] of toScan) {
              if (!handles.has(handle)) continue;
              const hit = hits.get(key);
              /* The visit nearest the window: to the left the last met, to
                 the right the first. */
              if (!hit || (side === "left" ? at > hit.at : at < hit.at)) {
                hits.set(key, { at, node: pos.node, anchor });
              }
            }
          }
          return side === "right" && [...toScan.keys()].every((key) => hits.has(key));
        });
        for (const key of toScan.keys()) {
          const { searched } = targets.get(key)!;
          const hit = hits.get(key);
          if (hit) {
            searched.seen.push(hit);
            searched.seen.sort((p, q) => p.at - q.at);
          } else {
            addCovered(searched.clear, a, b);
          }
        }
      }
      if (side === "left") leftDone = winFrom - a;
      else rightDone = b - winTo;

      for (const [key, hit] of hits) {
        targets.delete(key);
        const outcome = cross(ctx, hit, side, addNode, fragments, referenceAt);
        located.set(key, { ...outcome, from: winFrom - leftDone, to: winTo + rightDone });
      }
    }
    reach += SEARCH_STEP_BP;
  }
  for (const key of targets.keys()) {
    located.set(key, { state: "notSeen", from: winFrom - leftDone, to: winTo + rightDone });
  }
  return { located, fragments, referenceAt };
}

/**
 * From a visit found on one side of the window, follows the haplotype's
 * path toward the window and on to the first node the reference reads
 * past it, and makes a fragment of the nodes walked, cut to the last
 * reference node before the path leaves the reference.
 */
function cross(
  ctx: Context,
  hit: Visit,
  side: "left" | "right",
  addNode: (id: number) => void,
  fragments: PathInfo[],
  referenceAt: Map<number, number>,
): Omit<Located, "from" | "to"> {
  const { cache, reference, window } = ctx;
  const forward = side === "left";
  const lenOf = (handle: number) => cache.get(handle)?.sequenceLength ?? 0;
  /** Whether a node the reference reads at `at` lies past the window. */
  const past = (at: number, len: number) => (forward ? at >= window[1] : at + len <= window[0]);

  const handles: number[] = [];
  const positions: Pos[] = [];
  let bp = 0;
  let pos: Pos | null = { node: hit.node, offset: hit.anchor.nodeOffset };
  let outcome: "crossed" | "limit" | "contig ends" = "contig ends";
  while (pos) {
    const record = cache.get(pos.node);
    if (!record) break;
    handles.push(pos.node);
    positions.push(pos);
    bp += record.sequenceLength;
    const id = nodeId(pos.node);
    const at = readAt(ctx, id);
    if (at !== undefined) {
      if (past(at, record.sequenceLength)) {
        outcome = "crossed";
        break;
      }
    } else {
      /* A reference node beyond what is enumerated names itself by one of
         the reference's anchors; the path may then have been on the
         reference past the window for a while, so the reference is
         enumerated round the anchor and the walk cut at the first node it
         reads there. */
      const anchor = record.pathAnchors.find((a) => Math.floor(a.seqId / 2) === reference.handle);
      if (anchor) {
        const there = reference.fragment + anchor.bpOffset;
        const slack = bp + ANCHOR_SLACK_BP;
        enumerateReference(ctx, there - slack, there + record.sequenceLength + slack);
        const first = handles.findIndex((handle) => {
          const read = readAt(ctx, nodeId(handle));
          return read !== undefined && past(read, lenOf(handle));
        });
        if (first >= 0) {
          handles.length = first + 1;
          positions.length = first + 1;
          outcome = "crossed";
          break;
        }
      }
    }
    if (bp >= MAX_WALK_ON_BP || handles.length >= MAX_WALK_ON_NODES) {
      outcome = "limit";
      break;
    }
    pos = forward ? after(cache, pos) : before(cache, pos);
  }
  if (outcome !== "crossed") {
    return { state: "lost", seenAt: hit.at, side, reason: outcome };
  }

  /* Cut to the last reference node before the path leaves the reference. */
  const onReference = (handle: number) =>
    ctx.onWalk.has(nodeId(handle)) || readAt(ctx, nodeId(handle)) !== undefined;
  const leaves = handles.findIndex((handle) => !onReference(handle));
  const keepFrom = leaves > 0 ? leaves - 1 : 0;
  const walked = handles.slice(keepFrom);
  const walkedAt = positions.slice(keepFrom);
  const dropped = handles.slice(0, keepFrom).reduce((n, handle) => n + lenOf(handle), 0);
  const len = walked.reduce((n, handle) => n + lenOf(handle), 0);

  /* The fragment in its sequence's order, placed from the visit: `prefix`
     is the bases of the fragment before the anchored node along its
     sequence, negative where the node was cut away before it. */
  const seqId = hit.anchor.seqId;
  const anchorLen = lenOf(hit.node);
  const prefix = forward ? -dropped : len + dropped - anchorLen;
  const info: PathInfo = {
    path: forward ? walked : [...walked].reverse(),
    len,
    pathHandle: Math.floor(seqId / 2),
    fragmentStart: fragmentStartFrom(seqId, hit.anchor.bpOffset, prefix, anchorLen, len),
    backward: seqId % 2 === 1,
    start: forward ? walkedAt[0] : walkedAt[walkedAt.length - 1],
    exit: after(cache, forward ? walkedAt[walkedAt.length - 1] : walkedAt[0]),
  };
  for (const handle of walked) {
    const id = nodeId(handle);
    addNode(id);
    const at = readAt(ctx, id);
    if (at !== undefined && !ctx.onWalk.has(id)) referenceAt.set(id, at);
  }
  fragments.push(info);
  return { state: "found", seenAt: hit.at, side };
}
