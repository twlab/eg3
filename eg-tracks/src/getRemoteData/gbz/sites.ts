/* ══════════════════════════════════════════════════════════════════════════
   Sites of the graph: pairs of anchors, their clusters, and whether a
   stretch is sealed (PLAN-merge.md in eg3/claude-memory, 2026-11-03).

   Rule D keys a site by the anchor before and the anchor after a walk
   reads with a bubble between. Where walks differ over one stretch of
   reference but anchor different nodes, the pairs overlap, and the place
   is one site to the graph: a snarl (Paten et al. 2018; vg deconstruct's
   record), the smallest pair of nodes every walk through the stretch
   enters and leaves by. The merge finds it: overlapping pairs join into
   a cluster, and a cluster whose outer anchors seal the stretch - every
   way in through the one, every way out through the other, nothing
   between linked outside - is one merged site. A cluster that does not
   seal (the band cut inside it, or an edge out) stays as its pairs.

   Nothing here reads bases: the pairs come from the pointer's pass over
   the walks, the seal from the graph's edges.
   ══════════════════════════════════════════════════════════════════════════ */

/** A pair of anchors by reference step index. */
export interface Pair {
  k0: number;
  k1: number;
}

/** A cluster of pairs overlapping on the reference, with its outer anchors. */
export interface Cluster {
  k0: number;
  k1: number;
  pairs: Pair[];
}

/**
 * Pairs joined by overlap on the reference. A pair's stretch is the
 * reference between its anchors; two stretches overlap when they share a
 * base, or when one is an insertion site (no base) lying strictly inside
 * the other. Two insertion sites at one place are one pair. Pairs that
 * only touch at an anchor are not joined: that anchor is a node both read,
 * the boundary between two sites. `pos[k]` is the reference coordinate of
 * step k's first base.
 */
export function clustersOf(pairs: Pair[], pos: number[]): Cluster[] {
  void pos;
  const distinct = new Map<string, Pair>();
  for (const p of pairs) distinct.set(`${p.k0}>${p.k1}`, p);
  const list = [...distinct.values()].sort((a, b) => a.k0 - b.k0 || a.k1 - b.k1);
  /* Two pairs are one site unless the node between them is anchored by
     both: their open spans of reference steps, (k0, k1), must not meet.
     An anchor of the one lying strictly inside the other's span is a
     node that other walk skips, so no boundary; two insertion sites at
     one place are one pair; an insertion site right after a pair's exit
     touches it at that anchor only and stays apart. */
  const overlap = (a: Pair, b: Pair) => Math.max(a.k0, b.k0) < Math.min(a.k1, b.k1);
  const clusters: Cluster[] = [];
  for (const p of list) {
    const joined = clusters.filter((c) => c.pairs.some((q) => overlap(p, q)));
    if (!joined.length) {
      clusters.push({ k0: p.k0, k1: p.k1, pairs: [p] });
      continue;
    }
    const into = joined[0];
    for (const other of joined.slice(1)) {
      into.pairs.push(...other.pairs);
      clusters.splice(clusters.indexOf(other), 1);
    }
    into.pairs.push(p);
    into.k0 = Math.min(...into.pairs.map((q) => q.k0));
    into.k1 = Math.max(...into.pairs.map((q) => q.k1));
  }
  return clusters.sort((a, b) => a.k0 - b.k0);
}

/** An oriented node, "id+" or "id-". */
export type Handle = string;
export const handleOf = (id: string, reverse: boolean): Handle => `${id}${reverse ? "-" : "+"}`;
export const flipHandle = (h: Handle): Handle => `${h.slice(0, -1)}${h.endsWith("+") ? "-" : "+"}`;
export const nodeOfHandle = (h: Handle) => h.slice(0, -1);

/** The graph's edges over oriented nodes, both strands. */
export interface Adjacency {
  out: Map<Handle, Set<Handle>>;
  inn: Map<Handle, Set<Handle>>;
}

/** Adjacency from the worker's edge lists (a link `from -> to` under the
    node it leaves, with each end's strand), both strands of each. */
export function adjacencyOf(edges: Record<string, Array<{ to: string; from_is_reverse?: boolean; to_is_reverse?: boolean }>>): Adjacency {
  const out = new Map<Handle, Set<Handle>>();
  const inn = new Map<Handle, Set<Handle>>();
  const link = (a: Handle, b: Handle) => {
    if (!out.has(a)) out.set(a, new Set());
    if (!inn.has(b)) inn.set(b, new Set());
    out.get(a)!.add(b);
    inn.get(b)!.add(a);
  };
  for (const [from, list] of Object.entries(edges)) {
    for (const e of list) {
      link(handleOf(from, !!e.from_is_reverse), handleOf(String(e.to), !!e.to_is_reverse));
      link(handleOf(String(e.to), !e.to_is_reverse), handleOf(from, !e.from_is_reverse));
    }
  }
  return { out, inn };
}

/**
 * Whether the stretch from the entrance to the exit is sealed in the
 * graph: going forward from the entrance's inner side, without passing
 * the exit, reaches a set of nodes that the exit closes; none of them is
 * entered from outside or leaves to outside; nothing reaches the
 * entrance again or the exit's far side; and going backward from the exit
 * without passing the entrance reaches the same set, so every node inside
 * leads to the exit and the exit is not bypassed. A superbubble (Onodera
 * et al. 2013), vg's ultrabubble: a snarl with no cycle and no tip.
 * Returns the interior node ids when sealed, null when not.
 */
export function sealedInterior(adj: Adjacency, entrance: Handle, exit: Handle): Set<string> | null {
  const seen = new Set<Handle>([entrance]);
  const stack = [entrance];
  while (stack.length) {
    const v = stack.pop()!;
    if (v === exit) continue;
    for (const w of adj.out.get(v) ?? []) {
      if (w === entrance || w === flipHandle(entrance) || w === flipHandle(exit)) return null;
      if (!seen.has(w)) {
        seen.add(w);
        stack.push(w);
      }
    }
  }
  if (!seen.has(exit)) return null;
  for (const v of seen) {
    if (v === entrance || v === exit) continue;
    for (const u of adj.inn.get(v) ?? []) if (!seen.has(u)) return null;
    for (const w of adj.out.get(v) ?? []) if (!seen.has(w)) return null;
  }
  for (const u of adj.inn.get(exit) ?? []) if (!seen.has(u)) return null;
  if (!sameBackward(adj, entrance, exit, seen)) return null;
  const interior = new Set<string>();
  for (const v of seen) if (v !== entrance && v !== exit) interior.add(nodeOfHandle(v));
  return interior;
}

/** The nodes reached backward from the exit, not through the entrance,
    are exactly the nodes reached forward: the superbubble's second half. */
function sameBackward(adj: Adjacency, entrance: Handle, exit: Handle, forward: Set<Handle>): boolean {
  const back = new Set<Handle>([exit]);
  const stack = [exit];
  while (stack.length) {
    const v = stack.pop()!;
    if (v === entrance) continue;
    for (const u of adj.inn.get(v) ?? []) {
      if (!forward.has(u)) return false;
      if (!back.has(u)) {
        back.add(u);
        stack.push(u);
      }
    }
  }
  return back.size === forward.size;
}

/**
 * The band keeps only the edges between its own nodes, so a stretch can
 * look sealed in the band and leak in the whole graph. With the graph's
 * own records at hand - `successors(id, reverse)` giving the node ids an
 * oriented node leads to, null where the record is not known - every
 * interior node's edges on both strands, the entrance's inner side and
 * the exit's inner side are checked against the whole graph.
 */
export function leaksInGraph(
  interior: Set<string>,
  entrance: { id: string; reverse: boolean },
  exit: { id: string; reverse: boolean },
  successors: (id: string, reverse: boolean) => string[] | null,
): boolean {
  const inside = (id: string) => interior.has(id) || id === entrance.id || id === exit.id;
  const check = (id: string, reverse: boolean) => {
    const next = successors(id, reverse);
    if (next === null) return true;
    return next.some((n) => !inside(n));
  };
  if (check(entrance.id, entrance.reverse)) return true;
  if (check(exit.id, !exit.reverse)) return true;
  for (const id of interior) if (check(id, false) || check(id, true)) return true;
  return false;
}
