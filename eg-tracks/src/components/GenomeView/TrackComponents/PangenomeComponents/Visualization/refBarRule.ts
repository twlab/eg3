import { binBpAt } from "./bins";
import { CELL_BP, RATE_MIN_BP } from "./barTiers";
import { sequenceSize } from "./nodeDetail";
import { reverseComplement } from "./alignment";

/* ══════════════════════════════════════════════════════════════════════════
   The ref bar: what the graph's own row draws in the linear view.

   The reference's walk, node by node, as the bars under it are drawn to
   it: a slate bar over the band, a light line where one node ends and the
   next begins (a node break), the reference's letters while a base has
   room for one. Where the nodes get too small for a line at every break -
   a variant site makes two breaks a base apart, and near a pixel a base a
   line at each turned the bar into a barcode - a break keeps its line
   only where the breaks either side of it are LINE_GAP_PX or more away,
   and the bins that hold the rest (the bars' own grid, bins.ts) get a
   stripe in the middle half of the bar, shaded by how many breaks the
   kilobase has: the same 1 kb cells the bars' greys are measured over
   (barTiers.ts), lighter the busier, as if the lines had run together.
   Every rule here reads the reference walk alone, which every band has,
   so the bar says how much the whole pangenome varies here: a break is
   where any haplotype in the graph leaves or rejoins the reference, not
   only those shown. PLAN-zoomed-out.md, section 7; decided 2026-11-03.

   This file is the rule; RefBar.tsx paints it. Kept apart so the test
   harness can run the rule in node on a saved band and compare it with an
   independent predictor (claude-memory/testing/tools/refBarPredict.ts).
   ══════════════════════════════════════════════════════════════════════════ */

/** A break gets its own line only where the breaks either side of it are
    this many CSS pixels away or more. */
export const LINE_GAP_PX = 2;
/** Where the stripe's shades start, in node breaks per kb: under 30,
    30-100, 100-300, 300 or more. */
export const BREAKS_PER_KB: readonly number[] = [30, 100, 300];
/** The bar's own slate, a break's line, and the stripe's four shades,
    lighter the busier. */
export const REF_INK = "#5b6b8c";
export const LINE_INK = "#c3cbdc";
export const STRIPE_INKS: readonly string[] = ["#76839f", "#96a2bb", "#b8c1d3", "#dfe4ee"];
/** The stripe takes the middle half of the bar. */
export const STRIPE_OF_BAR: readonly [number, number] = [0.25, 0.75];
/** Below this a letter is a smudge, so none is drawn (as BarCanvas.tsx). */
export const SEQUENCE_MIN_SIZE = 4;
/** The most of the bar's height a letter may take (as BarCanvas.tsx). */
export const LETTER_OF_BAR = 0.7;

/** What the rule reads of a band: the reference walk's steps, where each
    starts along it (refOffset[k], from the band's first base; one more
    entry for its end), and the bases of each node. */
export interface RefWalk {
  origin: number;
  end: number;
  refSteps: ReadonlyArray<{ id: string; reverse: boolean }>;
  refOffset: ReadonlyArray<number>;
  graph: { seq: ReadonlyMap<string, string> };
}

/** A stretch of the reference in a shade: a bin holding a break with no
    line, cut to the band. */
export interface RefStripe {
  from: number;
  to: number;
  cls: number;
}

/** A cell the stripes' shades are measured over: CELL_BP of the
    chromosome on the bins' grid, cut to the band, or one bin where bins
    are wider than that. `breaks` are all its node breaks, lined or not;
    its rate is breaks per kb over at least RATE_MIN_BP bases. */
export interface RefCell {
  from: number;
  to: number;
  breaks: number;
  rate: number;
  cls: number;
}

/** The ref bar at one zoom, in reference coordinates. */
export interface RefBarDrawing {
  /** The band the bar covers. */
  origin: number;
  end: number;
  binBp: number;
  cellBp: number;
  /** Each break that has its line: the first base of the node that
      starts there. */
  lines: number[];
  /** The bins holding a break without a line, in order. */
  stripes: RefStripe[];
  /** The cells those stripes are shaded by, in order. */
  cells: RefCell[];
  /** Whether the reference's letters are drawn: while a base is at least
      SEQUENCE_MIN_SIZE / 0.6 pixels wide, as the bars' letters are. */
  letters: boolean;
  /** How big a letter is drawn, in CSS pixels, when `letters`. */
  letterSize: number;
}

/** The shade a rate of node breaks per kb takes: 0 to 3. */
export function breakClass(rate: number): number {
  let cls = 0;
  for (const line of BREAKS_PER_KB) if (rate >= line) cls += 1;
  return cls;
}

/** Whether the reference's letters are drawn at `scale` pixels a base, and
    how big: the bars' rule (BarCanvas.tsx), capped by the row's height. */
export function refLetters(scale: number, height: number): { letters: boolean; letterSize: number } {
  const size = Math.min(sequenceSize(scale), height * LETTER_OF_BAR);
  return { letters: size >= SEQUENCE_MIN_SIZE, letterSize: size };
}

/** Where every node break is: the first base of each step but the first,
    along the reference, in order. A step of no bases makes no break. */
export function breaksOf(walk: RefWalk): number[] {
  const out: number[] = [];
  for (let k = 1; k < walk.refSteps.length; k++) {
    const at = walk.origin + walk.refOffset[k];
    if (walk.refOffset[k + 1] > walk.refOffset[k] && at < walk.end) out.push(at);
  }
  return out;
}

/**
 * The ref bar as the rule gives it at `scale` pixels a base, for a bar
 * `height` CSS pixels tall.
 *
 * Which breaks get a line depends only on how far apart they are, so the
 * drawing is the same wherever the band sits on the screen.
 */
export function refBarOf(walk: RefWalk, scale: number, height: number): RefBarDrawing {
  const breaks = breaksOf(walk);
  const binBp = binBpAt(scale);
  const cellBp = Math.max(CELL_BP, binBp);
  const lines: number[] = [];
  const crowded: number[] = [];
  for (let i = 0; i < breaks.length; i++) {
    const before = i === 0 || (breaks[i] - breaks[i - 1]) * scale >= LINE_GAP_PX;
    const after = i === breaks.length - 1 || (breaks[i + 1] - breaks[i]) * scale >= LINE_GAP_PX;
    (before && after ? lines : crowded).push(breaks[i]);
  }
  /* The cells the shades are measured over: every break counts in its
     cell, lined or not. */
  const counts = new Map<number, number>();
  for (const at of breaks) {
    const cell = Math.floor(at / cellBp);
    counts.set(cell, (counts.get(cell) ?? 0) + 1);
  }
  const cellOf = new Map<number, RefCell>();
  const cellAt = (cell: number): RefCell => {
    let known = cellOf.get(cell);
    if (!known) {
      const from = Math.max(walk.origin, cell * cellBp);
      const to = Math.min(walk.end, (cell + 1) * cellBp);
      const n = counts.get(cell) ?? 0;
      const rate = (n * 1000) / Math.max(RATE_MIN_BP, to - from);
      cellOf.set(cell, (known = { from, to, breaks: n, rate, cls: breakClass(rate) }));
    }
    return known;
  };
  const stripes: RefStripe[] = [];
  let lastBin = -1;
  for (const at of crowded) {
    const bin = Math.floor(at / binBp);
    if (bin === lastBin) continue;
    lastBin = bin;
    const cell = cellAt(Math.floor((bin * binBp) / cellBp));
    stripes.push({ from: Math.max(walk.origin, bin * binBp), to: Math.min(walk.end, (bin + 1) * binBp), cls: cell.cls });
  }
  const cells = [...cellOf.values()].sort((a, b) => a.from - b.from);
  return { origin: walk.origin, end: walk.end, binBp, cellBp, lines, stripes, cells, ...refLetters(scale, height) };
}

/** The reference's bases over [from, to), as the bar shows them: each
    node's on the reference's strand. */
export function refBases(walk: RefWalk, from: number, to: number): string {
  let out = "";
  for (let k = 0; k < walk.refSteps.length && out.length < to - from; k++) {
    const start = walk.origin + walk.refOffset[k];
    const end = walk.origin + walk.refOffset[k + 1];
    if (end <= from || start >= to) continue;
    const step = walk.refSteps[k];
    const raw = walk.graph.seq.get(step.id) ?? "";
    const shown = step.reverse ? reverseComplement(raw) : raw;
    out += shown.slice(Math.max(0, from - start), Math.min(shown.length, to - start));
  }
  return out;
}

/** The step of the reference walk that holds base `bp`, or -1 outside
    the band. The first of two steps at one place, where a step has no
    bases. */
export function refStepAt(walk: RefWalk, bp: number): number {
  if (bp < walk.origin || bp >= walk.end) return -1;
  const at = bp - walk.origin;
  let lo = 0;
  let hi = walk.refSteps.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (walk.refOffset[mid] <= at) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** The steps of the reference walk with a base in [from, to): the first
    and one past the last, or null when none. */
export function refStepsIn(walk: RefWalk, from: number, to: number): [number, number] | null {
  const lo = Math.max(from, walk.origin);
  const hi = Math.min(to, walk.end);
  if (hi <= lo) return null;
  const first = refStepAt(walk, lo);
  let last = refStepAt(walk, hi - 1);
  if (first < 0 || last < 0) return null;
  /* A step of no bases at `lo` is before the first with one there. */
  let a = first;
  while (a < last && walk.refOffset[a + 1] <= lo - walk.origin) a++;
  return [a, last + 1];
}
