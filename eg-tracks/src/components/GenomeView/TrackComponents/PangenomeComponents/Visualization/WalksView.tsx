import { memo } from "react";
import { bandAxis, deletionSize } from "./pangenomeModel";
import type { DrawFrame, Lane, PangenomeModel } from "./pangenomeModel";
import type { RasterNode } from "./laneRaster";
import { walkRows } from "./walkRows";
import type { WalkReading, WalkRows } from "./walkRows";

/* ══════════════════════════════════════════════════════════════════════════
   One haplotype's walk, "Show walks": its readings of the reference stacked
   a row each - what it reads first on the top row, every copy under it -
   with a line for each step the walk takes from one reading to the next.
   See walkRows.ts for what a reading is.

   The rows are drawn by LinearPathView, as bars are, in place of the
   haplotype's one bar: a row is painted, pointed at and opened as a bar
   is, at every zoom, so its cards are a bar's - with what the reading adds,
   from here. What this draws is what lies between the rows: their names,
   the walk's lines from one reading to the next, a copy's alleles with no
   room, where the walk leaves, and the pieces with no place.
   ══════════════════════════════════════════════════════════════════════════ */

/** A row's bar, and the room above it - where its name and the walk's lines
    between rows go. */
export const WALK_ROW_H = 24;
const ROW_GAP = 12;
const FOOT = 6;
/* Small and grey, as a deletion's size in a bar: it says where the row is,
   and is not a mark of the haplotype's own. */
const NAME_FONT = 10;
const MARK_FONT = 9;
const NAME_INK = "#4b5563";
const LINE_INK = "#333333";
const MARK_INK = "#4b5563";
/* The ground the rows are drawn on (pgv-canvas), round each label: a line
   between rows runs through the room the labels are in, and struck through
   a name could not be read - zoomed out it ran under 4 of HG002#2's 8 on
   chr17 at 38.95 Mb. */
const HALO = "#f6f8fc";
const haloStyle = {
  paintOrder: "stroke",
  stroke: HALO,
  strokeWidth: 3,
  strokeLinejoin: "round",
} as const;
/* Between two labels in a row's room. */
const LABEL_GAP = 3;

/** Where a row's bar is drawn, from the top of the walk. */
export const walkRowTop = (row: number) => ROW_GAP + row * (WALK_ROW_H + ROW_GAP);

/* How wide a label is set, to keep labels off each other: measured in the
   face the drawing's text is in (pgv-shell). */
const LABEL_FACE =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
let measurer: CanvasRenderingContext2D | null | undefined;
const labelWidth = (text: string, size: number) => {
  if (measurer === undefined) {
    measurer =
      typeof document === "undefined"
        ? null
        : document.createElement("canvas").getContext("2d");
  }
  if (!measurer) return text.length * size * 0.6;
  measurer.font = `${size}px ${LABEL_FACE}`;
  return measurer.measureText(text).width;
};

/** The haplotype a model drawn as one track row holds. */
const laneOf = (model: PangenomeModel) => model.lanes.find((lane) => !lane.isReference);

/** Whether this band's walks are drawn: wherever it has the haplotype and an
    axis to draw it along - or, where the band holds too little of the
    reference to fit one, a frame to draw it on, as LinearPathView falls
    back to. */
export function walksShown(model: PangenomeModel, frame: DrawFrame | undefined): boolean {
  if (!laneOf(model)) return false;
  if (bandAxis(model, frame)) return true;
  return !!frame && frame.endBp > frame.startBp && frame.width > 0;
}

/** How many rows the walks take: one per row of readings, and one per piece
    with nothing on the reference here, which says where it is instead. */
const rowCount = (model: PangenomeModel) => {
  const lane = laneOf(model);
  if (!lane) return 1;
  const walks = walkRows(model, lane);
  return Math.max(1, walks.rows.length + walks.unplaced.length);
};

/** How tall the walks are, for the track to make room. */
export function walksHeight(model: PangenomeModel): number {
  return walkRowTop(rowCount(model)) - ROW_GAP + FOOT;
}

const ordinal = (n: number) => {
  const tens = n % 100;
  const suffix =
    tens >= 11 && tens <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n.toLocaleString()}${suffix}`;
};
const plural = (n: number, word: string) =>
  `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;
const ownRange = (from: number, to: number) =>
  `own ${from.toLocaleString()}–${to.toLocaleString()}`;

/** A row's name: what it reads first, or a copy's own stretch. */
export function walkRowName(walks: WalkRows, row: number): string {
  const readings = walks.rows[row] ?? [];
  if (row === 0) return walks.inPlace ? "in place" : "read first";
  return ownRange(
    Math.min(...readings.map((r) => r.ownFrom)),
    Math.max(...readings.map((r) => r.ownTo)),
  );
}

/** A reading, as a card names it. */
const readingName = (walks: WalkRows, index: number) => {
  const reading = walks.readings[index];
  return reading.row === 0 ? walkRowName(walks, 0) : `row ${reading.row}`;
};

/** The reading of a row a visit of it is part of: by its piece of the walk
    and where it is in the haplotype. */
const readingOfVisit = (
  walks: WalkRows,
  row: number,
  visit: Pick<RasterNode, "piece" | "start">,
) =>
  walks.rows[row]?.find(
    (r) => r.segment === visit.piece && visit.start >= r.ownFrom && visit.start <= r.ownTo,
  );

/** How the walk leaves the region after a reading, as a card says it. */
const leaveLine = (reading: WalkReading) =>
  reading.out
    ? `the walk goes on ${deletionSize(reading.out.bp)} further along the reference, past this region: a deletion`
    : "the walk leaves this region where this reading ends";

/** Which reading a row's reading is, as a card says it. */
const readingLine = (walks: WalkRows, row: number, reading: WalkReading) =>
  `${reading.copy ? "a copy" : row === 0 ? walkRowName(walks, 0) : "read first"}, read ${
    reading.reverse ? "backwards" : "forward"
  } · ${row === 0 ? ownRange(reading.ownFrom, reading.ownTo) : `row ${row} (${walkRowName(walks, row)})`}`;

/**
 * What a node's card on a walk's row says besides what a bar's does: which
 * reading the node is in, every time the haplotype reads it here, and - for
 * a copy's allele drawn over what it replaces - what it stands in for.
 */
export function walkVisitLines(
  walks: WalkRows,
  row: number,
  visit: Pick<RasterNode, "id" | "piece" | "start">,
): string[] {
  const reading = readingOfVisit(walks, row, visit);
  if (!reading) return [];
  const index = walks.readings.indexOf(reading);
  const reads = walks.readsOf.get(visit.id) ?? [];
  const nth = reads.indexOf(index) + 1;
  const standIn = visit.id.includes("@walk") ? walks.model.nodeById.get(visit.id) : undefined;
  return [
    readingLine(walks, row, reading),
    reading.copy
      ? "bases this haplotype has read before"
      : "bases this haplotype reads here first",
    ...(reads.length > 1 && nth > 0
      ? [
          `this place read ${ordinal(nth)} of ${reads.length} times here: ${reads
            .map((k) => readingName(walks, k))
            .join(" · ")}`,
        ]
      : []),
    ...(standIn
      ? [
          `an allele of this copy, ${plural(standIn.length, "base")}, for ${(
            standIn.refEnd - standIn.refStart
          ).toLocaleString()} bp of reference`,
        ]
      : []),
    ...(reading.leaves ? [leaveLine(reading)] : []),
  ];
}

/**
 * What a section's card on a walk's row says besides what a bar's does: the
 * readings of the row there - for a copy, which reading read these places
 * first, and every reading of them here - a copy's alleles with no room
 * there, which a closer zoom marks, and where the walk leaves.
 */
export function walkSectionLines(
  walks: WalkRows,
  row: number,
  visits: RasterNode[],
  section: { left: number; right: number },
  px: (graphX: number) => number,
): string[] {
  const readings = [
    ...new Set(
      visits
        .map((visit) => readingOfVisit(walks, row, visit))
        .filter((r): r is WalkReading => !!r),
    ),
  ];
  /* A copy's place no reading read before was passed over by a deletion in
     one - which makes it read before all the same; see walkRows. */
  const firsts = new Set<number>();
  const all = new Set<number>();
  let passed = 0;
  for (const visit of visits) {
    if (!visit.onReference) continue;
    const reading = readingOfVisit(walks, row, visit);
    if (!reading) continue;
    const reads = walks.readsOf.get(visit.id) ?? [];
    reads.forEach((k) => all.add(k));
    if (!reading.copy) continue;
    if (reads.length && reads[0] !== walks.readings.indexOf(reading)) firsts.add(reads[0]);
    else passed++;
  }
  const marks = readings.flatMap((r) =>
    r.marks.filter((mark) => px(mark.x) >= section.left && px(mark.x) < section.right),
  );
  const leaving = readings.find((r) => {
    if (!r.leaves) return false;
    const x = px(r.reverse ? r.xLo : r.xHi);
    return x >= section.left - 0.5 && x <= section.right + 0.5;
  });
  return [
    ...readings.map((r) => readingLine(walks, row, r)),
    ...(firsts.size || passed
      ? [
          `bases ${walks.rowLanes[row]?.label ?? "this haplotype"} has read before: ${[
            firsts.size
              ? `first read by ${[...firsts]
                  .sort((a, b) => a - b)
                  .map((k) => {
                    const r = walks.readings[k];
                    return `${readingName(walks, k)} (${ownRange(r.ownFrom, r.ownTo)})`;
                  })
                  .join("; ")}`
              : "",
            passed ? `${plural(passed, "node")} passed over by a deletion in an earlier reading` : "",
          ]
            .filter(Boolean)
            .join(" · ")}`,
        ]
      : []),
    ...(all.size > 1
      ? [
          `this place is read ${all.size} times here: ${[...all]
            .sort((a, b) => a - b)
            .map((k) => readingName(walks, k))
            .join(" · ")}`,
        ]
      : []),
    ...(marks.length
      ? [
          `${plural(marks.length, "allele")} of this copy with no room where it is drawn: ${marks
            .map((mark) =>
              mark.replaces
                ? `${mark.bp.toLocaleString()} bp for ${mark.replaces.toLocaleString()}`
                : `+${mark.bp.toLocaleString()}`,
            )
            .join(", ")}`,
        ]
      : []),
    ...(leaving ? [leaveLine(leaving)] : []),
  ];
}

interface WalksViewProps {
  /** The haplotype whose walk it is. */
  lane: Lane;
  walks: WalkRows;
  /** The axis the rows are drawn along; see LinearPathView. */
  px: (graphX: number) => number;
  width: number;
  height: number;
  /** Where the window starts in the band: the rows' names are written there. */
  viewFromPx: number;
  /** Zoomed out, a row is read a section at a time, and a copy's alleles
      with no room are left to the section's card. */
  bySection: boolean;
}

function WalksView({ lane, walks, px, width, height, viewFromPx, bySection }: WalksViewProps) {
  const rowName = (row: number) => walkRowName(walks, row);
  /* Where the walk goes into a reading and out of it, along the band. */
  const xIn = (r: WalkReading) => px(r.reverse ? r.xHi : r.xLo);
  const xOut = (r: WalkReading) => px(r.reverse ? r.xLo : r.xHi);
  const middle = (r: WalkReading) => walkRowTop(r.row) + WALK_ROW_H / 2;

  /* The walk from one reading to the next: out of the one the way the walk
     goes, along the room beside its row, and into the next from the side
     the walk enters it, so no line runs across a bar. Into a row above or
     below that it runs on into, straight there; within one row, over it. */
  const lines: Array<{ d: string; key: string }> = [];
  walks.readings.forEach((r, k) => {
    const p = walks.readings[k - 1];
    if (!p || r.entry === "start" || r.inline || p.inline) return;
    let xa = xOut(p);
    let xb = xIn(r);
    const ya = middle(p);
    const yb = middle(r);
    let d: string;
    if (r.entry === "continues") {
      const nudge = r.reverse ? -3 : 3;
      xa += nudge;
      xb += nudge;
      d =
        r.row > p.row
          ? `M ${xa} ${ya + WALK_ROW_H / 2} L ${xb} ${yb - WALK_ROW_H / 2 - 1}`
          : `M ${xa} ${ya - WALK_ROW_H / 2} L ${xb} ${yb + WALK_ROW_H / 2 + 1}`;
    } else if (r.row === p.row) {
      const lift = ya - WALK_ROW_H / 2 - 5;
      d = `M ${xa} ${ya - WALK_ROW_H / 2} V ${lift} H ${xb} V ${yb - WALK_ROW_H / 2 - 1}`;
    } else {
      const outward = p.reverse ? -1 : 1;
      const inward = r.reverse ? -1 : 1;
      const toward = Math.sign(xb - xa) === outward;
      const below = r.row > p.row || !toward;
      const channel = below
        ? ya + WALK_ROW_H / 2 + ROW_GAP / 2
        : ya - WALK_ROW_H / 2 - ROW_GAP / 2;
      const x1 = xa + outward * 8;
      const x2 = xb - inward * 8;
      d = `M ${xa} ${ya} H ${x1} V ${channel} H ${x2} V ${yb} H ${xb + (inward > 0 ? -1 : 1)}`;
    }
    lines.push({ d, key: `${k}` });
  });

  const markerId = `pgv-walk-arrow-${lane.key.replace(/[^\w-]/g, "")}`;
  const nameX = viewFromPx + 4;

  /* The labels in the room above each row - its name, where the walk leaves,
     the size of a copy's allele with no room - each drawn only where it
     runs into none drawn before it, as a deletion's size is drawn only where
     it fits: zoomed out, chr17's copies at 38.95 Mb put 50 pairs of them on
     each other. The name first, then where the walk leaves, then the sizes,
     left to right. Zoomed out the sizes are left to the card: a pixel there
     is tens of bases, and a scatter of them is what the bars leave to theirs. */
  interface Label {
    key: string;
    x: number;
    y: number;
    text: string;
    size: number;
    anchor: "start" | "end";
  }
  const names: Label[] = [];
  const placedLabels: Label[] = [];
  const ticks: Array<{ key: string; x: number; row: number }> = [];
  walks.rows.forEach((row, r) => {
    const taken: Array<[number, number]> = [];
    const fits = (from: number, to: number) =>
      taken.every(([a, b]) => to + LABEL_GAP <= a || from >= b + LABEL_GAP);
    const name = rowName(r);
    names.push({ key: `name ${r}`, x: nameX, y: walkRowTop(r) - 3, text: name, size: NAME_FONT, anchor: "start" });
    taken.push([nameX, nameX + labelWidth(name, NAME_FONT)]);
    const wanted: Array<Label & { from: number; to: number }> = [];
    for (const reading of row) {
      /* A jump on along the reference out of the region says itself, as a
         bar's does: its size, in the white it leaves - see walkRows. */
      if (!reading.leaves || reading.out) continue;
      const x = xOut(reading);
      if (!(x > 0 && x < width)) continue;
      const w = labelWidth("leaves here", NAME_FONT);
      const from = reading.reverse ? x - 2 - w : x + 2;
      wanted.push({
        key: `leaves ${walks.readings.indexOf(reading)}`,
        x: reading.reverse ? x - 2 : x + 2,
        y: walkRowTop(r) - 3,
        text: "leaves here",
        size: NAME_FONT,
        anchor: reading.reverse ? "end" : "start",
        from,
        to: from + w,
      });
    }
    const leaves = wanted.length;
    if (!bySection) {
      row.forEach((reading) =>
        reading.marks.forEach((mark, m) => {
          const x = px(mark.x);
          const key = `mark ${walks.readings.indexOf(reading)} ${m}`;
          ticks.push({ key, x, row: r });
          const text = mark.replaces
            ? `${mark.bp.toLocaleString()} bp for ${mark.replaces.toLocaleString()}`
            : `+${mark.bp.toLocaleString()}`;
          wanted.push({
            key,
            x: x + 2,
            y: walkRowTop(r) - 3,
            text,
            size: MARK_FONT,
            anchor: "start",
            from: x + 2,
            to: x + 2 + labelWidth(text, MARK_FONT),
          });
        }),
      );
    }
    const byX = (a: { from: number }, b: { from: number }) => a.from - b.from;
    for (const label of [...wanted.slice(0, leaves).sort(byX), ...wanted.slice(leaves).sort(byX)]) {
      if (!fits(label.from, label.to)) continue;
      taken.push([label.from, label.to]);
      placedLabels.push(label);
    }
  });

  return (
    <svg className="pgv-svg pgv-over" width={width} height={height}>
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={LINE_INK} />
        </marker>
      </defs>
      {lines.map(({ d, key }) => (
        <path
          key={key}
          d={d}
          fill="none"
          stroke={LINE_INK}
          strokeWidth={1.2}
          strokeLinejoin="round"
          markerEnd={`url(#${markerId})`}
        />
      ))}
      {/* A copy's alleles with no room where the copy is drawn: a line
          through its row where they go in - closer in than a section at a
          time; zoomed out its card lists them. */}
      {ticks.map(({ key, x, row }) => (
        <line
          key={key}
          x1={x}
          x2={x}
          y1={walkRowTop(row)}
          y2={walkRowTop(row) + WALK_ROW_H}
          stroke={MARK_INK}
          strokeWidth={1.5}
        />
      ))}
      {[...names, ...placedLabels].map((label) => (
        <text
          key={label.key}
          x={label.x}
          y={label.y}
          fontSize={label.size}
          fill={label.size === MARK_FONT ? MARK_INK : NAME_INK}
          textAnchor={label.anchor}
          style={haloStyle}
        >
          {label.text}
        </text>
      ))}
      {/* A piece with nothing on the reference here has no place along it:
          its row says where it is in the haplotype instead. */}
      {walks.unplaced.map((piece, k) => {
        const row = walks.rows.length + k;
        const contig = lane.segments[piece.segment]?.contig ?? lane.contig;
        return (
          <g key={`unplaced ${k}`}>
            <text x={nameX} y={walkRowTop(row) - 3} fontSize={NAME_FONT} fill={NAME_INK}>
              {ownRange(piece.ownFrom, piece.ownTo)}
            </text>
            <text
              x={nameX}
              y={walkRowTop(row) + WALK_ROW_H / 2 + 4}
              fontSize={NAME_FONT}
              fill={NAME_INK}
            >
              {`${contig}: nothing on the reference here - position unknown`}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default memo(WalksView);
