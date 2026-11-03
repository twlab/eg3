/* ══════════════════════════════════════════════════════════════════════════
   The pointer: one pass over a walk's steps along a reference walk.

   The rule the linear view places every row by (PLAN-rows.md in
   eg3/claude-memory, 2026-11-03; rowAlign.ts has the full statement), kept
   here, apart from the drawing, so that the worker can run the same pass:
   rule D's versions at a site are tallied from the same bubbles the
   rows are drawn from (subgraph.ts, countCarriers).

   The pointer `p` is the next reference step not yet placed. A step whose
   node the reference reads at or after `p`, on the reference's strand, is
   an anchor: the pending steps before it close as a bubble over the
   reference from `p` to the anchor, `p` moves past it. Such a step on the
   other strand starts an inverted run, taken as far as its steps read the
   reference backwards (rule 2); the run's steps read back to front and
   flipped are a forward walk over the reference it covers, laid out by
   the same pass with `inversions` off. Every other step is pending.
   ══════════════════════════════════════════════════════════════════════════ */

/** The reference walk as the pointer reads it: its steps, and for each
    node id every index of the walk that reads it, ascending. */
export interface PointerAxis {
  steps: Array<{ id: string; reverse: boolean }>;
  indexes: Map<string, number[]>;
}

/** What the pointer needs of a step: its node, and whether the walk reads
    it on the other strand. */
export interface PointerStep {
  node: string;
  reverse: boolean;
}

export type Piece<S extends PointerStep> =
  | { kind: "anchor"; step: S; k: number }
  | { kind: "bubble"; pending: S[]; ref: [number, number] }
  | { kind: "inverted"; steps: S[]; ref: [number, number] };

export interface Laid<S extends PointerStep> {
  /** Pending steps before the first anchor or inverted run. */
  head: S[];
  pieces: Piece<S>[];
  /** Pending steps after the last. */
  tail: S[];
}

/** The index map of a reference walk. */
export function axisOf(steps: Array<{ id: string; reverse: boolean }>): PointerAxis {
  const indexes = new Map<string, number[]>();
  steps.forEach((s, k) => {
    const list = indexes.get(s.id);
    if (list) list.push(k);
    else indexes.set(s.id, [k]);
  });
  return { steps, indexes };
}

/** The first index at or after `from` and before `to` where the reference
    walk reads the node, or -1. */
export function indexAtOrAfter(axis: PointerAxis, id: string, from: number, to: number): number {
  const list = axis.indexes.get(id);
  if (!list) return -1;
  for (const k of list) if (k >= from && k < to) return k;
  return -1;
}

/** The greatest index in [from, before) where the reference walk reads
    the node, or -1: the next node of an inverted run, which goes down. */
export function indexBelow(axis: PointerAxis, id: string, from: number, before: number): number {
  const list = axis.indexes.get(id);
  if (!list) return -1;
  let best = -1;
  for (const k of list) if (k >= from && k < before) best = k;
  return best;
}

/** One pass of the pointer over `steps`, over the reference steps
    [refFrom, refTo). A bubble piece is pushed only where there is
    something to close: pending steps, or reference between the pointer
    and the anchor. Two anchors in a row with neither read the reference
    straight across. */
export function layOut<S extends PointerStep>(axis: PointerAxis, steps: S[], refFrom: number, refTo: number, inversions: boolean): Laid<S> {
  let p = refFrom;
  let pending: S[] = [];
  const pieces: Piece<S>[] = [];
  let head: S[] = [];
  let placed = false;
  const closeBubble = (k: number) => {
    if (!placed) head = pending;
    else if (pending.length || k > p) pieces.push({ kind: "bubble", pending, ref: [p, k] });
    pending = [];
    placed = true;
  };
  let i = 0;
  while (i < steps.length) {
    const s = steps[i];
    const k = indexAtOrAfter(axis, s.node, p, refTo);
    if (k < 0) {
      pending.push(s);
      i += 1;
      continue;
    }
    if (s.reverse === axis.steps[k].reverse) {
      closeBubble(k);
      pieces.push({ kind: "anchor", step: s, k });
      p = k + 1;
      i += 1;
      continue;
    }
    if (!inversions) {
      pending.push(s);
      i += 1;
      continue;
    }
    let last = k;
    let lastAt = i;
    for (let t = i + 1; t < steps.length; t++) {
      const kt = indexBelow(axis, steps[t].node, p, last);
      if (kt < 0) {
        /* A node the reference reads only at or above the run's last node
           ends the run; one it does not read here lies inside it. */
        if (indexAtOrAfter(axis, steps[t].node, p, refTo) >= 0) break;
        continue;
      }
      if (steps[t].reverse === axis.steps[kt].reverse) break;
      last = kt;
      lastAt = t;
    }
    closeBubble(last);
    pieces.push({ kind: "inverted", steps: steps.slice(i, lastAt + 1), ref: [last, k + 1] });
    p = k + 1;
    i = lastAt + 1;
  }
  if (!placed) head = pending;
  return { head, pieces, tail: placed ? pending : [] };
}

/** An inverted run's steps as the reference sees them: back to front,
    each on the other strand. */
export function flipRun<S extends PointerStep>(run: S[]): S[] {
  return [...run].reverse().map((s) => ({ ...s, reverse: !s.reverse }));
}

/** Every bubble of a walk, with the anchor before and the anchor after
    (PLAN-bubble-sites.md): `k0` and `k1` are the two anchors' reference
    step indexes, `version` the pending steps between them (none for a
    deletion), on the reference's strand (flipped inside an inverted
    run). `anchors` are every reference step the walk anchors. Both
    levels of the layout are read: the walk's own, and the inside of each
    inverted run. An insertion site is the case k1 = k0 + 1. */
export function siteReads<S extends PointerStep>(axis: PointerAxis, steps: S[]): { anchors: Set<number>; anchorAt: Map<number, number>; bubbles: Array<{ k0: number; k1: number; version: S[] }> } {
  const anchors = new Set<number>();
  /* Reference step -> the walk's step index anchoring it, at the walk's own
     level (inside an inverted run the steps are flipped, so none). */
  const anchorAt = new Map<number, number>();
  const bubbles: Array<{ k0: number; k1: number; version: S[] }> = [];
  const read = (laid: Laid<S>, own: boolean) => {
    for (const piece of laid.pieces) {
      if (piece.kind === "anchor") {
        anchors.add(piece.k);
        if (own) anchorAt.set(piece.k, steps.indexOf(piece.step));
      } else if (piece.kind === "bubble") bubbles.push({ k0: piece.ref[0] - 1, k1: piece.ref[1], version: piece.pending });
      else read(layOut(axis, flipRun(piece.steps), piece.ref[0], piece.ref[1], false), false);
    }
  };
  read(layOut(axis, steps, 0, axis.steps.length, true), true);
  return { anchors, anchorAt, bubbles };
}

/** How a walk's reads stand to a site: "own", it reads the site's own
    pair of anchors with a bubble between; "others", it has a bubble over
    the stretch with other anchors; "straight", it anchors every reference
    step from the one anchor to the other; "none", it does not reach. */
export function readsSite(reads: { anchors: Set<number>; bubbles: Array<{ k0: number; k1: number }> }, k0: number, k1: number): "own" | "straight" | "others" | "none" {
  if (reads.bubbles.some((b) => b.k0 === k0 && b.k1 === k1)) return "own";
  if (reads.bubbles.some((b) => b.k0 < k1 && b.k1 > k0)) return "others";
  for (let k = k0; k <= k1; k++) if (!reads.anchors.has(k)) return "none";
  return "straight";
}
