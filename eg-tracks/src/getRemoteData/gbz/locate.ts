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
   Finding each shown haplotype's path across the window along the
   reference.

   A haplotype that lacks the band's reference, or has other sequence in
   its place, passes through none of the window's nodes, and unless some
   edge within the context happens to lead to a node on its path it is not
   extracted at all: its lane is empty, which is also what no data looks
   like. One that reads the window only as copies, stretches of its own
   that read this reference from elsewhere in its sequence, is extracted,
   but what it has here in place is not. Every node's record lists its
   sampled visits - one visit in a hundred along each path, and each
   path's last - with the path they belong to, so a haplotype can be
   looked for along the reference: outward from the window, a stretch at
   a time on each side, reading each node's record for a visit of one of
   its paths. From each visit found, nearest first, its path is followed
   toward the window - forward through LF from the left, backward through
   its inverse from the right - and on to the first node the reference
   reads past the window. A path that turns back, as a copy's does at a
   hairpin, or ends, or runs past the limit, is given up, and the next
   visit tried. Cut to the last reference node before it leaves the
   reference, what crossed is a fragment of the shape the walk-on makes:
   for a haplotype already here, the same walk seen from its visit, which
   merges away; for one that was absent, the lane's one reading, white
   across the band with the reference it lacks and its own bases in place.

   The search stops at a cap either side. What was searched and what was
   found is reported per haplotype, so a lane left empty can say so. The
   stretches searched in vain, the visits found and the visits that led
   nowhere are kept per source, so a pan reads each stretch once.
   ══════════════════════════════════════════════════════════════════════════ */

/** What the search found for one haplotype. */
export interface Located {
  /** found: a fragment was made from a sampled visit. notSeen: no visit
      in the stretch searched. lost: visits were found, but none of their
      paths could be followed to the reference past the window. */
  state: "found" | "notSeen" | "lost";
  /** The reference searched, contig coordinates. */
  from: number;
  to: number;
  /** The visit followed - for lost, the nearest tried: where the reference
      reads that node, and which side of the window it is on. */
  seenAt?: number;
  side?: "left" | "right";
  /** For lost: why that path could not be followed across. */
  reason?: "contig ends" | "limit" | "turns back";
}

/** The search goes this much further out each round, each side. */
const SEARCH_STEP_BP = 2_000;
/** How far it goes either side before giving up. */
export const SEARCH_CAP_BP = 100_000;
/** A path followed toward the window that falls this far back behind the
    furthest reference position it reached is turning back - a hairpin's
    return - and is given up; an inversion inside a path reads backward
    for less than this. */
const TURN_BACK_BP = 10_000;

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
  /** Followed before and led nowhere. */
  failed?: boolean;
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
 * window, and makes a fragment of each one whose path crosses it, with
 * the nodes walked added through `addNode`. Returns what was found per
 * haplotype, the fragments, and where the reference reads each reference
 * node in them.
 */
export function locateHaplotypes(
  ctx: Context,
  keys: string[],
  addNode: (id: number) => void,
  capBp = SEARCH_CAP_BP,
): { located: Map<string, Located>; fragments: PathInfo[]; referenceAt: Map<number, number> } {
  const { source, reference, window } = ctx;
  const located = new Map<string, Located>();
  const fragments: PathInfo[] = [];
  const referenceAt = new Map<number, number>();
  interface Target {
    handles: Set<number>;
    searched: Searched;
    /** The nearest visit that led nowhere, and why, for the report. */
    nearestFailure?: { visit: Visit; side: "left" | "right"; reason: Located["reason"] };
  }
  const targets = new Map<string, Target>();
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

      /* The visits in this stretch: what earlier searches found, and what
         is read now for the rest. */
      const visits = new Map<string, Visit[]>();
      const toScan = new Map<string, Set<number>>();
      for (const [key, target] of targets) {
        const known = target.searched.seen.filter((visit) => visit.at >= a && visit.at < b);
        if (known.length) visits.set(key, known);
        else if (!isClear(target.searched.clear, a, b)) toScan.set(key, target.handles);
      }
      if (toScan.size) {
        const found = new Map<string, Visit[]>();
        enumerateReference(ctx, a, b, (_id, record, at, pos) => {
          for (const anchor of record.pathAnchors) {
            const handle = Math.floor(anchor.seqId / 2);
            for (const [key, handles] of toScan) {
              if (!handles.has(handle)) continue;
              const list = found.get(key);
              const visit = { at, node: pos.node, anchor };
              if (list) list.push(visit);
              else found.set(key, [visit]);
            }
          }
        });
        for (const key of toScan.keys()) {
          const { searched } = targets.get(key)!;
          const list = found.get(key);
          if (list) {
            searched.seen.push(...list);
            searched.seen.sort((p, q) => p.at - q.at);
            visits.set(key, list);
          } else {
            addCovered(searched.clear, a, b);
          }
        }
      }
      if (side === "left") leftDone = winFrom - a;
      else rightDone = b - winTo;

      /* Each visit followed, the nearest the window first, until one
         crosses it. */
      for (const [key, list] of visits) {
        const target = targets.get(key)!;
        const ordered = list
          .filter((visit) => !visit.failed)
          .sort((p, q) => (side === "left" ? q.at - p.at : p.at - q.at));
        for (const visit of ordered) {
          const outcome = cross(ctx, visit, side, addNode, fragments, referenceAt);
          if (outcome.state === "found") {
            targets.delete(key);
            located.set(key, { ...outcome, from: winFrom - leftDone, to: winTo + rightDone });
            break;
          }
          visit.failed = true;
          if (!target.nearestFailure) target.nearestFailure = { visit, side, reason: outcome.reason };
        }
      }
    }
    reach += SEARCH_STEP_BP;
  }
  for (const [key, target] of targets) {
    const failure = target.nearestFailure;
    located.set(
      key,
      failure
        ? {
            state: "lost",
            from: winFrom - leftDone,
            to: winTo + rightDone,
            seenAt: failure.visit.at,
            side: failure.side,
            reason: failure.reason,
          }
        : { state: "notSeen", from: winFrom - leftDone, to: winTo + rightDone },
    );
  }
  return { located, fragments, referenceAt };
}

/**
 * From a visit found on one side of the window, follows the haplotype's
 * path toward the window and on to the first node the reference reads
 * past it, and makes a fragment of the nodes walked, cut to the last
 * reference node before the path leaves the reference. A path that turns
 * back, ends, or runs past the limit before crossing makes nothing.
 */
function cross(
  ctx: Context,
  visit: Visit,
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
  let furthest = forward ? -Infinity : Infinity;
  let pos: Pos | null = { node: visit.node, offset: visit.anchor.nodeOffset };
  let outcome: "crossed" | "limit" | "contig ends" | "turns back" = "contig ends";
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
      /* Reading the reference away from the window again: turning back. */
      if (forward ? at + record.sequenceLength < furthest - TURN_BACK_BP : at > furthest + TURN_BACK_BP) {
        outcome = "turns back";
        break;
      }
      furthest = forward ? Math.max(furthest, at + record.sequenceLength) : Math.min(furthest, at);
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
    return { state: "lost", seenAt: visit.at, side, reason: outcome };
  }

  /* Cut to one node before the path leaves the reference or enters the
     window's walk, whichever comes first: the approach along the reference
     from the visit says nothing the band does not know. */
  const onReference = (handle: number) =>
    ctx.onWalk.has(nodeId(handle)) || readAt(ctx, nodeId(handle)) !== undefined;
  const leaves = handles.findIndex((handle) => !onReference(handle));
  const enters = handles.findIndex((handle) => ctx.onWalk.has(nodeId(handle)));
  const firsts = [leaves, enters].filter((k) => k >= 0);
  const keepFrom = firsts.length ? Math.max(0, Math.min(...firsts) - 1) : 0;
  const walked = handles.slice(keepFrom);
  const walkedAt = positions.slice(keepFrom);
  const dropped = handles.slice(0, keepFrom).reduce((n, handle) => n + lenOf(handle), 0);
  const len = walked.reduce((n, handle) => n + lenOf(handle), 0);

  /* The fragment in its sequence's order, placed from the visit: `prefix`
     is the bases of the fragment before the anchored node along its
     sequence, negative where the node was cut away before it. */
  const seqId = visit.anchor.seqId;
  const anchorLen = lenOf(visit.node);
  const prefix = forward ? -dropped : len + dropped - anchorLen;
  const info: PathInfo = {
    path: forward ? walked : [...walked].reverse(),
    len,
    pathHandle: Math.floor(seqId / 2),
    fragmentStart: fragmentStartFrom(seqId, visit.anchor.bpOffset, prefix, anchorLen, len),
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
  return { state: "found", seenAt: visit.at, side };
}
