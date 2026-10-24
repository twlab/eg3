import { memo, useMemo } from "react";
import LaneCanvas from "./LaneCanvas";
import type { LaneHover } from "./LaneCanvas";
import { rasteriseLane } from "./laneRaster";
import { bandAxis } from "./pangenomeModel";
import type { DrawFrame, GraphNode, PangenomeModel } from "./pangenomeModel";
import { BAR_NODE_BASES_PER_PX } from "./LinearPathView";
import type { HoverTarget } from "./LinearPathView";
import { sequenceSize } from "./nodeDetail";
import { walkRows } from "./walkRows";
import type { WalkReading } from "./walkRows";

/* ══════════════════════════════════════════════════════════════════════════
   One haplotype's walk, "Show walks": its readings of the reference stacked
   a row each - what it reads first on the top row, every copy under it -
   with a line for each step the walk takes from one reading to the next.
   See walkRows.ts for what a reading is.

   Each row is painted as a bar is (LaneCanvas, from its own raster), so a
   row reads as the bar does: the same colour, /// where it is off the
   reference, letters where they fit, arrows where it is read backwards.
   Only zoomed in to where a bar is read node by node - past that the bar
   is drawn as it always is.
   ══════════════════════════════════════════════════════════════════════════ */

/** A row's bar, and the room above it - where its name and the walk's lines
    between rows go. */
const ROW_H = 24;
const ROW_GAP = 12;
const FOOT = 6;
/* Small and grey, as a deletion's size in a bar: it says where the row is,
   and is not a mark of the haplotype's own. */
const NAME_FONT = 10;
const NAME_INK = "#4b5563";
const LINE_INK = "#333333";
const MARK_INK = "#4b5563";
/* As LinearPathView: below this a letter is a smudge. */
const SEQUENCE_MIN_SIZE = 4;
const SECTION_PX = 16;

const rowTop = (row: number) => ROW_GAP + row * (ROW_H + ROW_GAP);

/** The haplotype a model drawn as one track row holds. */
const laneOf = (model: PangenomeModel) => model.lanes.find((lane) => !lane.isReference);

/** Where the rows are drawn along the band: its axis - or, where the band
    holds too little of the reference to fit one (a window inside one long
    reference node), the band's own bases to its pixels, as LinearPathView
    falls back to. */
function walkAxis(model: PangenomeModel, frame: DrawFrame | undefined) {
  const axis = bandAxis(model, frame);
  if (axis) return { scale: axis.scale, px: axis.px };
  if (!frame || !(frame.endBp > frame.startBp) || !(frame.width > 0)) return null;
  const scale = frame.width / (frame.endBp - frame.startBp);
  return { scale, px: (graphX: number) => graphX * scale };
}

/** Whether this band's walks are drawn: zoomed in to where a bar is read
    node by node. */
export function walksShown(model: PangenomeModel, frame: DrawFrame | undefined): boolean {
  const axis = walkAxis(model, frame);
  return !!laneOf(model) && !!axis && 1 / axis.scale < BAR_NODE_BASES_PER_PX;
}

/** How tall the walks are, for the track to make room. */
export function walksHeight(model: PangenomeModel): number {
  const lane = laneOf(model);
  const rows = lane ? walkRows(model, lane).rows.length : 1;
  return rowTop(rows) - ROW_GAP + FOOT;
}

const ordinal = (n: number) => {
  const tens = n % 100;
  const suffix =
    tens >= 11 && tens <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n.toLocaleString()}${suffix}`;
};

interface WalksViewProps {
  /** The band's model, its lanes cut down to the one haplotype. */
  model: PangenomeModel;
  frame: DrawFrame;
  onHover: (target: HoverTarget | null) => void;
  /** See LinearPathView. */
  sectionAltBp?: number;
}

function WalksView({ model, frame, onHover, sectionAltBp = 0 }: WalksViewProps) {
  const lane = laneOf(model);
  const axis = useMemo(() => walkAxis(model, frame), [model, frame]);
  const walks = useMemo(() => (lane ? walkRows(model, lane) : null), [model, lane]);
  const width = frame.width;

  const rasters = useMemo(
    () =>
      walks && axis
        ? walks.rowLanes.map((rowLane) => rasteriseLane(rowLane, walks.model, axis.px, width))
        : [],
    [walks, axis, width],
  );

  /* Zoomed out of the letters, a row is hatched a section at a time as the
     bars are - the same sections, from the same nodes; see LinearPathView. */
  const sections = useMemo(() => {
    if (!axis || sequenceSize(axis.scale) >= SEQUENCE_MIN_SIZE) return undefined;
    const placed = model.nodes
      .filter((node) => !node.untied)
      .map((node) => ({ left: axis.px(node.x), right: axis.px(node.x + node.length) }))
      .sort((a, b) => a.left - b.left || a.right - b.right);
    const out: Array<{ left: number; right: number }> = [];
    let open: { left: number; right: number } | null = null;
    for (const { left, right } of placed) {
      if (open && (left < open.right - 0.5 || open.right - open.left < SECTION_PX)) {
        open.right = Math.max(open.right, right);
        continue;
      }
      open = { left, right };
      out.push(open);
    }
    return out;
  }, [model, axis]);

  if (!lane || !walks || !axis) return null;
  const height = walksHeight(model);
  const px = axis.px;
  const referenceContig = model.reference?.contig ?? "";
  const contigOf = (reading: WalkReading) =>
    lane.segments[reading.segment]?.contig ?? lane.contig;
  const rowName = (row: number) => {
    const readings = walks.rows[row];
    if (row === 0) return walks.inPlace ? "in place" : "read first";
    const from = Math.min(...readings.map((r) => r.ownFrom));
    const to = Math.max(...readings.map((r) => r.ownTo));
    return `own ${from.toLocaleString()}–${to.toLocaleString()}`;
  };
  /* Where the walk goes into a reading and out of it, along the band. */
  const xIn = (r: WalkReading) => px(r.reverse ? r.xHi : r.xLo);
  const xOut = (r: WalkReading) => px(r.reverse ? r.xLo : r.xHi);
  const middle = (r: WalkReading) => rowTop(r.row) + ROW_H / 2;

  const hoverOn = (row: number, hover: LaneHover | null) => {
    if (!hover) {
      onHover(null);
      return;
    }
    const readings = walks.rows[row];
    const reading =
      readings.find((r) => hover.bp >= r.ownFrom && hover.bp <= r.ownTo) ?? readings[0];
    const index = walks.readings.indexOf(reading);
    const reads = walks.readsOf.get(hover.nodeId) ?? [];
    const nth = reads.indexOf(index) + 1;
    const standIn: GraphNode | undefined = hover.nodeId.includes("@walk")
      ? walks.model.nodeById.get(hover.nodeId)
      : undefined;
    onHover({
      x: hover.x,
      y: hover.y,
      title: `${lane.label} · ${row === 0 ? rowName(0) : reading.copy ? "a copy" : "read first"}`,
      lines: [
        `own ${reading.ownFrom.toLocaleString()}–${reading.ownTo.toLocaleString()} on ${contigOf(reading)}, read ${reading.reverse ? "backwards" : "forward"}`,
        `${referenceContig}:${reading.lo.toLocaleString()}–${reading.hi.toLocaleString()} on the reference`,
        reading.copy ? "bases this haplotype has read before" : "bases this haplotype reads here first",
        ...(reads.length > 1 && nth > 0
          ? [`this node read ${ordinal(nth)} of ${reads.length} times here`]
          : []),
        ...(standIn
          ? [
              `an allele of this copy, ${standIn.length} bp, for ${(
                standIn.refEnd - standIn.refStart
              ).toLocaleString()} bp of reference`,
            ]
          : hover.lines),
      ],
      zoom: hover.zoom,
    });
  };

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
          ? `M ${xa} ${ya + ROW_H / 2} L ${xb} ${yb - ROW_H / 2 - 1}`
          : `M ${xa} ${ya - ROW_H / 2} L ${xb} ${yb + ROW_H / 2 + 1}`;
    } else if (r.row === p.row) {
      const lift = ya - ROW_H / 2 - 5;
      d = `M ${xa} ${ya - ROW_H / 2} V ${lift} H ${xb} V ${yb - ROW_H / 2 - 1}`;
    } else {
      const outward = p.reverse ? -1 : 1;
      const inward = r.reverse ? -1 : 1;
      const toward = Math.sign(xb - xa) === outward;
      const below = r.row > p.row || !toward;
      const channel = below ? ya + ROW_H / 2 + ROW_GAP / 2 : ya - ROW_H / 2 - ROW_GAP / 2;
      const x1 = xa + outward * 8;
      const x2 = xb - inward * 8;
      d = `M ${xa} ${ya} H ${x1} V ${channel} H ${x2} V ${yb} H ${xb + (inward > 0 ? -1 : 1)}`;
    }
    lines.push({ d, key: `${k}` });
  });

  const markerId = `pgv-walk-arrow-${lane.key.replace(/[^\w-]/g, "")}`;
  const nameX = frame.viewFromPx + 4;

  return (
    <div className="pgv-linear" style={{ width, height }}>
      {walks.rowLanes.map((rowLane, row) => (
        <div
          key={rowLane.key}
          className="pgv-lane-slot"
          style={{ top: rowTop(row), height: ROW_H }}
        >
          <LaneCanvas
            raster={rasters[row]}
            width={width}
            height={ROW_H}
            barH={ROW_H}
            color={lane.color}
            contig={contigOf(walks.rows[row][0])}
            isReference={false}
            spellReference={false}
            dim={false}
            sections={sections}
            sectionAltBp={sectionAltBp}
            onHover={(hover) => hoverOn(row, hover)}
            onPick={() => {}}
          />
        </div>
      ))}
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
        {walks.rows.map((_, row) => (
          <text
            key={`name ${row}`}
            x={nameX}
            y={rowTop(row) - 3}
            fontSize={NAME_FONT}
            fill={NAME_INK}
          >
            {rowName(row)}
          </text>
        ))}
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
            through its row where they go in, and how many bases. */}
        {walks.readings.flatMap((r, k) =>
          r.marks.map((mark, m) => {
            const x = px(mark.x);
            const top = rowTop(r.row);
            return (
              <g key={`mark ${k} ${m}`}>
                <line x1={x} x2={x} y1={top} y2={top + ROW_H} stroke={MARK_INK} strokeWidth={1.5} />
                <text x={x + 2} y={top - 3} fontSize={9} fill={MARK_INK}>
                  {mark.replaces
                    ? `${mark.bp.toLocaleString()} bp for ${mark.replaces.toLocaleString()}`
                    : `+${mark.bp.toLocaleString()}`}
                </text>
              </g>
            );
          }),
        )}
        {/* Where the walk goes on outside this region - its piece of the walk
            ends there, or it goes on through nodes placed elsewhere. Just
            past the reading's end, in the room above the row, so it sits on
            neither the next bar in the row nor the row's name. */}
        {walks.readings.map((r, k) => {
          if (!r.leaves) return null;
          const x = xOut(r);
          if (!(x > 0 && x < width)) return null;
          return (
            <text
              key={`leaves ${k}`}
              x={x + (r.reverse ? -2 : 2)}
              y={rowTop(r.row) - 3}
              fontSize={NAME_FONT}
              fill={NAME_INK}
              textAnchor={r.reverse ? "end" : "start"}
            >
              leaves here
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default memo(WalksView);
