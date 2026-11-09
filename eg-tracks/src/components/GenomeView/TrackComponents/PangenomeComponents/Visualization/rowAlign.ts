import { alignDiverging, placeClosed, stepSeq } from "./alignment";
import type { Aligned, BrowserClass, Graph, Part, Step } from "./alignment";
import type { JsonStop } from "../../../../../getRemoteData/gbz/subgraph";
import { flipRun, layOut } from "../../../../../getRemoteData/gbz/pointer";
import type { NestedMark } from "./nestedMarks";

export { layOut };

/* ══════════════════════════════════════════════════════════════════════════
   One walk placed on the reference: the rule the linear view draws by.

   PLAN-rows.md in eg3/claude-memory (2026-11-03). A walk is one fragment
   of a haplotype's path as the GBWT lists it: a linear stretch of the
   haplotype's own sequence, step by step, each step a node read on the
   reference's strand or the other. It is placed by one pass over its
   steps with one pointer `p` into the band's reference walk - the next
   reference step not yet placed - and a list of steps still pending:

   1. A step whose node the reference walk reads at or after `p`, on the
      reference's strand, is an anchor: drawn plain at that place. First
      the bubble closes: the reference from `p` to the anchor is its
      reference side, the pending steps' bases its haplotype side (rule 3).
      Then `p` moves past the anchor and the pending list empties. Where
      the reference reads the node more than once, the first place at or
      after `p`.
   2. Such a step on the other strand starts an inverted run: it and the
      steps after it, as long as every step among them that the reference
      reads at or after `p` is on the other strand and earlier along the
      reference than the one before it; steps the reference does not read
      may lie between. The run covers the reference from its last node to
      its first, drawn arrowed: read on the other strand. Inside it, the
      run's steps read back to front with every strand flipped are a
      forward walk over that reference, placed by rules 1 and 3 (no run
      inside a run: such a step is pending). Then `p` moves past the run's
      first node.
   3. Every other step is pending: a node the reference does not read, or
      one it reads only before `p` (the walk has turned back: a second
      pass, a tandem or inverted repeat) or only outside the band. Its
      bases, as the haplotype reads them, are the haplotype's own at the
      next anchor, where gbz-base's rule (alignment.ts: alignDiverging,
      placeClosed) says what the bubble is: a deletion (white), an
      insertion (a mark, taking no room), a substitution (letters), a
      deletion-insertion (letters on hatching, the surplus a mark or a
      white). A part's card names each node it holds and, for a node the
      reference reads elsewhere, where.
   4. The head and the tail, pending steps with no anchor to close on,
      from the junction outward: the first node the reference reads beyond
      the band on that side makes a deletion running out of the band
      (OutOfBand: white to the band's edge, the steps before it a mark);
      the first it reads behind the junction a jump (the walk turns back:
      the steps before it a mark, and the card says where it goes on; the
      rest is not drawn, being another pass over reference drawn already);
      none an open end (OpenEnd: missing data, a cap at the junction).
   5. A walk with no anchor and no inverted run spans the band when it has
      a node the reference reads before the band at one end and one after
      at the other (a white over the band with both sizes); any other such
      walk draws no row.

   What the pointer changes against gbz-base, which anchors by a weighted
   longest common subsequence: the pointer anchors every shared node it
   meets in order. The two agree wherever the walk reads the reference's
   nodes in order, which is nearly always (testing/tools/checkBrowser.ts).
   ══════════════════════════════════════════════════════════════════════════ */

/** One step of a walk, in the haplotype's own coordinates. */
export interface RowStep {
  node: string;
  start: number;
  end: number;
  reverse: boolean;
}

/** The band's reference walk as the rule reads it. */
export interface RefAxis {
  steps: Step[];
  /** Absolute reference coordinate of each step's first base, and one
      more for the end. */
  pos: number[];
  /** Node id -> every index of the walk that reads it, ascending. */
  indexes: Map<string, number[]>;
  /** Node id -> where the reference reads it outside the band. */
  elsewhere: Record<string, number>;
}

export type PartKind = Part["kind"];

/** A part of a row placed on the axis, in absolute reference bases. */
export interface PlacedPart {
  kind: PartKind;
  ref: number;
  /** Reference bases it covers; for a mark, its inserted bases. */
  len: number;
  /** The haplotype's bases it holds, as drawn, on the reference's strand. */
  seq?: string;
  /** Where those bases are in the haplotype's own coordinates, lowest
      first, and whether they run backwards there. */
  own?: { from: number; to: number; reverse: boolean };
  /** The nodes whose bases it holds, in the order the walk reads them. */
  nodes: string[];
  /** The bubble it came from, as an index into the row's bubbles; null
      for an anchor, a mark at an end, a span. */
  bubble: number | null;
  /** Inside an inverted run: drawn arrowed. */
  inverted?: boolean;
  /** A white standing for reference that runs out of the band at both
      ends (a span): the reference from `refFrom` to `refTo`, which the
      haplotype has `instead` bases of its own in place of. */
  span?: { refFrom: number; refTo: number; instead: number };
  /** A mark at an end before the walk turns back. */
  jump?: Jump;
  /** A mark at an insertion site with two or more versions among the
      haplotypes in the band: rule D (nestedMarks.ts). */
  nested?: NestedMark;
}

/** A bubble as the cards read it: what gbz-base's rule made of it. */
export interface RowBubble {
  cls: BrowserClass;
  /** Its reference side, absolute, and its two sides' bases. */
  refAt: number;
  refLen: number;
  hapSeq: string;
  refSeq: string;
  /** gbz-base's alignment of the two sides; null for an inverted run. */
  aligned: Aligned | null;
  /** The steps of the walk in it, [from, to). */
  steps: [number, number];
  /** Inside an inverted run: its bases are taken on the flipped strand. */
  inverted: boolean;
  /** An inverted run: the bubbles inside it, as indexes. */
  inside?: number[];
}

/** Where a walk's end turns back along the reference: the walk goes on
    at a node the reference reads behind the junction. `to` is where the
    walk is there: where it reaches the node (its end, going on); where it
    left it (its start, coming from). */
export interface Jump {
  side: "left" | "right";
  ref: number;
  to: number;
  reverse: boolean;
  /** This end is where the walk came from. */
  before: boolean;
}

/** A deletion whose far end is outside the band: the haplotype leaves the
    reference at `ref` for a node the reference reads at `refTo` (to the
    right) or arrives at `ref` from one it reads ending at `refFrom`. */
export interface OutOfBand {
  side: "left" | "right";
  ref: number;
  bp: number;
  refFrom: number;
  refTo: number;
  /** The node outside the band it goes to or comes from. */
  node: string;
  /** The haplotype's own coordinate at the junction. */
  own: number;
}

/** Where a row stops short of the reference with nothing after it: the
    walk leaves the reference at the junction and, in the graph, never
    comes back. Not an allele: missing data. */
export interface OpenEnd {
  side: "left" | "right";
  ref: number;
  /** The reference node the walk leaves the reference by. */
  from: string;
  /** The run's first node, the one the walk goes into. */
  into: { id: string; reverse: boolean } | null;
  bases: number;
  nodes: string[];
  own: { from: number; to: number; reverse: boolean };
  /** Which end of the walk, in its own direction, the run is at. */
  at: "start" | "end";
  /** Why the fetch stopped following it (walkOn.ts). */
  stop?: JsonStop;
}

export interface RowPlacement {
  /** The reference the row covers, lowest first; null for a span. */
  anchored: [number, number] | null;
  /** The tail's steps from the first reference node of the expanded region
      view that the walk turns back to (rule 4's jump): the walk goes on
      over reference this row already covers, so the model lays these out
      as a further row of the same group (PLAN-rows.md 7). Absent when the
      tail holds no such node: then the jump stays a note. */
  tail?: RowStep[];
  spanning: boolean;
  parts: PlacedPart[];
  bubbles: RowBubble[];
  outOfBand: OutOfBand[];
  openEnds: OpenEnd[];
  jumps: Jump[];
}

/* ── A walk placed ───────────────────────────────────────────────────── */

/* The pointer's pass itself is getRemoteData/gbz/pointer.ts (layOut),
   shared with the worker, which tallies rule D's versions from the same
   bubbles the rows are drawn from. */

const reachedAt = (at: number, s: RowStep) => (s.reverse ? at + (s.end - s.start) : at);
const leftAt = (at: number, s: RowStep) => (s.reverse ? at : at + (s.end - s.start));

/**
 * A walk placed on the reference by the rule above. `origin` and `end`
 * are the band's; `ends` is why the fetch stopped following each end
 * short of the reference, in the walk's own direction (walkOn.ts).
 */
export function placeRow(
  graph: Graph,
  axis: RefAxis,
  steps: RowStep[],
  origin: number,
  end: number,
  ends?: { head?: JsonStop; tail?: JsonStop },
): RowPlacement {
  const parts: PlacedPart[] = [];
  const bubbles: RowBubble[] = [];
  const outOfBand: OutOfBand[] = [];
  const openEnds: OpenEnd[] = [];
  const jumps: Jump[] = [];
  let tail: RowStep[] | undefined;
  const lenOf = (s: RowStep) => s.end - s.start;
  const seqOf = (s: RowStep) => stepSeq(graph, { id: s.node, reverse: s.reverse });
  /** Where the reference reads a node, anywhere: on the band's walk (its
      first base there) or outside the band. */
  const positionOf = (id: string): number | undefined => {
    const here = axis.indexes.get(id);
    return here ? axis.pos[here[0]] : axis.elsewhere[id];
  };
  const laid = layOut(axis, steps, 0, axis.steps.length, true);

  if (!laid.pieces.length) {
    /* Spanning: nodes the reference reads before and after the band,
       none placed in it. */
    let left = -1;
    let leftEnd = -Infinity;
    let right = -1;
    let rightAt = Infinity;
    steps.forEach((s, k) => {
      const at = axis.elsewhere[s.node];
      if (at === undefined) return;
      if (at + lenOf(s) <= origin && at + lenOf(s) > leftEnd) {
        leftEnd = at + lenOf(s);
        left = k;
      } else if (at >= end && at < rightAt) {
        rightAt = at;
        right = k;
      }
    });
    if (left < 0 || right < 0) return { anchored: null, spanning: false, parts, bubbles, outOfBand, openEnds, jumps };
    const lo = Math.min(left, right);
    const hi = Math.max(left, right);
    let instead = 0;
    for (let k = lo + 1; k < hi; k++) instead += lenOf(steps[k]);
    parts.push({
      kind: "white",
      ref: origin,
      len: end - origin,
      own: { from: steps[lo].end, to: steps[hi].start, reverse: false },
      nodes: [],
      bubble: null,
      span: { refFrom: leftEnd, refTo: rightAt, instead },
    });
    return { anchored: null, spanning: true, parts, bubbles, outOfBand, openEnds, jumps };
  }

  /* The own coordinates of a range [a, b) of bases along a list of steps
     read in order, or, inside an inverted run, back to front. */
  const ownRange = (list: RowStep[], a: number, b: number, flipped: boolean) => {
    if (!list.length) return { from: 0, to: 0, reverse: flipped };
    if (!flipped) return { from: list[0].start + a, to: list[0].start + b, reverse: false };
    const last = list[list.length - 1].end;
    return { from: last - b, to: last - a, reverse: true };
  };
  /* The nodes whose bases fall in [a, b) of the bases along `list`. */
  const nodesIn = (list: RowStep[], a: number, b: number): string[] => {
    const out: string[] = [];
    let at = 0;
    for (const s of list) {
      const len = lenOf(s);
      if (at < b && at + len > a) out.push(s.node);
      at += len;
    }
    return out;
  };
  const indexOf = (s: RowStep) => steps.indexOf(s);

  /* A bubble: the pending steps' bases, as the haplotype reads them on
     the strand the bubble is placed on, against the reference from p to
     k; gbz-base's rule says what it is. `list` is the pending steps in the
     order they are read on that strand. */
  const bubble = (list: RowStep[], refIdx: [number, number], flipped: boolean): void => {
    const hapSeq = list.map(seqOf).join("");
    let refSeq = "";
    for (let k = refIdx[0]; k < refIdx[1]; k++) refSeq += stepSeq(graph, axis.steps[k]);
    if (!hapSeq.length && !refSeq.length) return;
    const aligned = alignDiverging(hapSeq, refSeq);
    const refAt = axis.pos[refIdx[0]];
    const index = bubbles.length;
    /* The steps' indexes in the walk, lowest first. */
    const idx = list.map(indexOf).filter((i) => i >= 0);
    bubbles.push({
      cls: aligned.cls,
      refAt,
      refLen: refSeq.length,
      hapSeq,
      refSeq,
      aligned,
      steps: idx.length ? [Math.min(...idx), Math.max(...idx) + 1] : [0, 0],
      inverted: flipped,
    });
    for (const part of placeClosed(aligned, 0, hapSeq)) {
      const placed: PlacedPart = {
        kind: part.kind,
        ref: refAt + part.ref,
        len: part.len,
        ...("seq" in part ? { seq: part.seq } : {}),
        ...(part.hap ? { own: ownRange(list, part.hap[0], part.hap[1], flipped) } : {}),
        nodes: part.hap ? nodesIn(list, part.hap[0], part.hap[1]) : [],
        bubble: index,
        ...(flipped ? { inverted: true } : {}),
      };
      parts.push(placed);
    }
  };
  const anchor = (step: RowStep, k: number, flipped: boolean) => {
    parts.push({
      kind: "match",
      ref: axis.pos[k],
      len: axis.pos[k + 1] - axis.pos[k],
      own: { from: step.start, to: step.end, reverse: flipped },
      nodes: [step.node],
      bubble: null,
      ...(flipped ? { inverted: true } : {}),
    });
  };
  for (const piece of laid.pieces) {
    if (piece.kind === "anchor") anchor(piece.step, piece.k, false);
    else if (piece.kind === "bubble") bubble(piece.pending, piece.ref, false);
    else {
      const from = axis.pos[piece.ref[0]];
      const to = axis.pos[piece.ref[1]];
      const run = piece.steps;
      /* The run read back to front on the other strand is a forward walk
         over the reference it covers: placed by the same rule. */
      const flipped: RowStep[] = flipRun(run);
      const index = bubbles.length;
      const idx = run.map(indexOf);
      bubbles.push({
        cls: "inversion",
        refAt: from,
        refLen: to - from,
        hapSeq: flipped.map(seqOf).join(""),
        refSeq: axis.steps.slice(piece.ref[0], piece.ref[1]).map((s) => stepSeq(graph, s)).join(""),
        aligned: null,
        steps: [Math.min(...idx), Math.max(...idx) + 1],
        inverted: false,
        inside: [],
      });
      parts.push({
        kind: "inverted",
        ref: from,
        len: to - from,
        seq: bubbles[index].hapSeq,
        own: { from: run[0].start, to: run[run.length - 1].end, reverse: true },
        nodes: run.map((s) => s.node),
        bubble: index,
      });
      const inner = layOut(axis, flipped, piece.ref[0], piece.ref[1], false);
      const before = bubbles.length;
      for (const one of inner.pieces) {
        if (one.kind === "anchor") anchor(one.step, one.k, true);
        else if (one.kind === "bubble") bubble(one.pending, one.ref, true);
      }
      bubbles[index].inside = bubbles.slice(before).map((_, n) => before + n);
      /* Inner bubbles' steps, by the walk's own indexes rather than the
         flipped list's. */
      for (let b = before; b < bubbles.length; b++) {
        const [a, z] = bubbles[b].steps;
        const own = flipped.slice(a, z).map((s) => run.indexOf(run.find((r) => r.start === s.start)!) + idx[0]);
        if (own.length) bubbles[b].steps = [Math.min(...own), Math.max(...own) + 1];
      }
    }
  }

  /* The head and the tail: pending steps with no anchor to close on. */
  const lows = laid.pieces.flatMap((piece) => (piece.kind === "anchor" ? [piece.k] : piece.kind === "inverted" ? [piece.ref[0]] : []));
  const highs = laid.pieces.flatMap((piece) => (piece.kind === "anchor" ? [piece.k + 1] : piece.kind === "inverted" ? [piece.ref[1]] : []));
  const lowK = Math.min(...lows);
  const highK = Math.max(...highs);
  const anchoredFrom = axis.pos[lowK];
  const anchoredTo = axis.pos[highK];
  const endRun = (run: RowStep[], side: "left" | "right") => {
    if (!run.length) return;
    const junction = side === "left" ? anchoredFrom : anchoredTo;
    const away = side === "right" ? run : [...run].reverse();
    const mark = (count: number, jump?: Jump) => {
      const taken = away.slice(0, count);
      const bases = taken.reduce((n, s) => n + lenOf(s), 0);
      if (bases <= 0) return;
      const list = side === "right" ? taken : [...taken].reverse();
      parts.push({
        kind: "mark",
        ref: junction,
        len: bases,
        seq: list.map(seqOf).join(""),
        own: { from: list[0].start, to: list[list.length - 1].end, reverse: false },
        nodes: list.map((s) => s.node),
        bubble: null,
        ...(jump ? { jump } : {}),
      });
    };
    const out = away.findIndex((s) => positionOf(s.node) !== undefined);
    if (out >= 0) {
      const s = away[out];
      const at = positionOf(s.node)!;
      const far = side === "right" ? at : at + lenOf(s);
      const ahead = side === "right" ? far >= junction : far <= junction;
      if (ahead) {
        const bp = Math.abs(far - junction);
        if (bp > 0) {
          outOfBand.push({
            side,
            ref: junction,
            bp,
            refFrom: side === "right" ? junction : far,
            refTo: side === "right" ? far : junction,
            node: s.node,
            own: side === "right" ? away[0].start : away[0].end,
          });
        }
        mark(out);
        return;
      }
      const jump: Jump = { side, ref: junction, to: side === "right" ? reachedAt(at, s) : leftAt(at, s), reverse: s.reverse, before: side === "left" };
      jumps.push(jump);
      mark(out, jump);
      if (side === "right" && axis.indexes.has(s.node)) tail = run.slice(out);
      return;
    }
    const bases = run.reduce((n, s) => n + lenOf(s), 0);
    if (bases <= 0) return;
    const first = away[0];
    const list = side === "right" ? run : run;
    openEnds.push({
      side,
      ref: junction,
      from: side === "right" ? axis.steps[highK - 1]?.id ?? "" : axis.steps[lowK]?.id ?? "",
      into: { id: first.node, reverse: first.reverse },
      bases,
      nodes: away.map((s) => s.node),
      own: { from: list[0].start, to: list[list.length - 1].end, reverse: false },
      at: side === "left" ? "start" : "end",
      ...(side === "left" ? (ends?.head ? { stop: ends.head } : {}) : ends?.tail ? { stop: ends.tail } : {}),
    });
  };
  endRun(laid.head, "left");
  endRun(laid.tail, "right");
  parts.sort((a, b) => a.ref - b.ref || a.len - b.len);
  return { anchored: [anchoredFrom, anchoredTo], spanning: false, parts, bubbles, outOfBand, openEnds, jumps, ...(tail ? { tail } : {}) };
}
