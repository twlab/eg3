import { useMemo } from "react";
import type { PangenomeModel } from "./pangenomeModel";
import { referenceTicks } from "./pangenomeModel";

/* ══════════════════════════════════════════════════════════════════════════
   One ruler for all three views.

   Marks fall on round numbers of bases rather than wherever a node happens to
   begin, so the spacing is regular and a position can be read off by eye:

       |  I  I  I  I  I  I  I  I  I  |  I  I  I  I  I  I  I  I  I  |
       4,073,900                      4,074,000

   Nine minor marks between each pair of labelled ones, so a minor is a tenth
   of whatever the major step works out to be - the same decimal habit a paper
   ruler has.

   Each view lays its columns out differently - the tube map and the node graph
   put a gap between them, the linear view does not - so a view says where a
   graph position lands and this decides what to draw.
   ══════════════════════════════════════════════════════════════════════════ */

/** How much room a labelled mark wants, so labels never collide. */
const MAJOR_TARGET_PX = 110;
const MINORS_PER_MAJOR = 10;
/** Minor marks closer together than this are a smudge, so none are drawn. */
const MINOR_MIN_PX = 4;
/** Room a label needs before the next, so none overlap where marks crowd. */
const LABEL_MIN_GAP = 64;

export interface RulerTick {
  x: number;
  bp: number;
  major: boolean;
}

/** A round step: 1, 2 or 5 times a power of ten, whichever fits the room. */
function roundStep(bpPerMajor: number): number {
  const power = 10 ** Math.floor(Math.log10(Math.max(1, bpPerMajor)));
  for (const multiple of [1, 2, 5, 10]) {
    if (power * multiple >= bpPerMajor) return power * multiple;
  }
  return power * 10;
}

/**
 * Where to put the marks.
 *
 * The reference's own coordinates are what the labels report, and the model
 * knows those at every reference node. Between two of them a base is a base,
 * so a position inside a node is that node's start plus the offset - which is
 * what lets a mark land on a round number rather than on a node boundary.
 */
export function rulerTicks(
  model: PangenomeModel,
  pxAt: (graphX: number) => number | null,
  pxPerBase: number,
): RulerTick[] {
  const anchors = referenceTicks(model);
  if (anchors.length < 2) return [];

  const first = anchors[0];
  const last = anchors[anchors.length - 1];
  const spanBp = last.bp - first.bp;
  if (spanBp <= 0) return [];

  const major = roundStep(MAJOR_TARGET_PX / Math.max(pxPerBase, 0.0001));

  /* Where a reference coordinate sits along the layout. Anchors ascend in
     both, so one walk covers every mark. */
  let at = 0;
  const graphXOf = (bp: number): number | null => {
    while (at + 1 < anchors.length && anchors[at + 1].bp <= bp) at += 1;
    while (at > 0 && anchors[at].bp > bp) at -= 1;
    const anchor = anchors[at];
    if (bp < anchor.bp) return null;
    /* Past the room this anchor's node has before the next: a jump in the
       reference - a stray piece of it from far away, laid out beside the
       window - where no base of the reference is drawn. Counting on from
       the anchor spread the jump's round numbers across the drawing. */
    const next = anchors[at + 1];
    if (next && bp - anchor.bp >= next.x - anchor.x) return null;
    return anchor.x + (bp - anchor.bp);
  };

  /* Majors land on round numbers, which is what makes a label worth
     reading. Between two of them the minors are spaced evenly across the
     pixels rather than by coordinate: the axis is graph position, and an
     alternate allele takes room without advancing the reference at all, so
     dividing the coordinate would bunch the marks up wherever the
     haplotypes disagree. Nine even marks per block instead. */
  const majors: RulerTick[] = [];
  const start = Math.ceil(first.bp / major) * major;
  for (let bp = start; bp <= last.bp; bp += major) {
    const graphX = graphXOf(bp);
    if (graphX === null) continue;
    const x = pxAt(graphX);
    if (x === null) continue;
    majors.push({ x, bp, major: true });
  }

  const ticks: RulerTick[] = [];
  for (let i = 0; i < majors.length; i++) {
    ticks.push(majors[i]);
    const next = majors[i + 1];
    /* Not across a jump in the reference: the marks between would name
       coordinates that are not drawn. */
    if (!next || next.bp - majors[i].bp !== major) continue;
    const step = (next.x - majors[i].x) / MINORS_PER_MAJOR;
    if (step < MINOR_MIN_PX) continue;
    for (let n = 1; n < MINORS_PER_MAJOR; n++) {
      ticks.push({
        x: majors[i].x + step * n,
        bp: majors[i].bp + (major / MINORS_PER_MAJOR) * n,
        major: false,
      });
    }
  }
  return ticks;
}

interface RulerProps {
  ticks: RulerTick[];
  /** Baseline the marks hang from. */
  height: number;
  /** Where the rule itself runs, so it spans the drawing rather than the data. */
  from: number;
  to: number;
}

export default function Ruler({ ticks, height, from, to }: RulerProps) {
  /* Labels are drawn after the marks so a long number is never cut into by
     the mark beside it. Where marks crowd - the tube map's gaps spread some
     apart and leave others close - a label that would run into the one
     before it is left off, and its mark stays. */
  const majors = useMemo(() => {
    const labelled: RulerTick[] = [];
    let reach = -Infinity;
    for (const tick of ticks) {
      if (!tick.major || tick.x < reach) continue;
      labelled.push(tick);
      reach = tick.x + LABEL_MIN_GAP;
    }
    return labelled;
  }, [ticks]);

  return (
    <g className="pgv-ruler">
      <line x1={from} x2={to} y1={height - 0.5} y2={height - 0.5} />
      {ticks.map((tick) => (
        <line
          key={`t${tick.major ? "M" : "m"}${Math.round(tick.x * 100)}`}
          className={tick.major ? "pgv-tick-major" : "pgv-tick-minor"}
          x1={tick.x}
          x2={tick.x}
          y1={tick.major ? height - 9 : height - 4}
          y2={height}
        />
      ))}
      {majors.map((tick) => (
        <text key={`l${tick.bp}`} x={tick.x + 3} y={height - 10}>
          {tick.bp.toLocaleString()}
        </text>
      ))}
    </g>
  );
}
