//fineMode FUNCTIONS ______s____________________________________________________________________________________________________________________________________________________

import { Feature } from "@gmod/bbi";
import React from "react";
import AlignmentRecord from "../../../models/AlignmentRecord";
import { AlignmentSegment } from "../../../models/AlignmentSegment";
import { SequenceSegment } from "../../../models/AlignmentStringUtils";
import OpenInterval from "../../../models/OpenInterval";
import AnnotationArrows from "../commonComponents/annotation/AnnotationArrows";
import { Sequence } from "./Sequence";

export const DEFAULT_OPTIONS = {
  height: 80,
  primaryColor: "darkblue",
  queryColor: "#B8008A",
};
interface QueryGenomePiece {
  queryFeature: Feature;
  queryXSpan: OpenInterval;
}

export interface PlacedMergedAlignment extends QueryGenomePiece {
  segments: PlacedAlignment[];
  targetXSpan: OpenInterval;
}

const ALIGN_TRACK_MARGIN = 20;

const RECT_HEIGHT = 15;
const TICK_MARGIN = 1;
const FONT_SIZE = 10;

const MAX_POLYGONS = 500;
export interface PlacedSequenceSegment extends SequenceSegment {
  xSpan: OpenInterval;
}
export interface PlacedAlignment {
  record: AlignmentRecord;
  visiblePart: AlignmentSegment;
  contextSpan: OpenInterval;
  targetXSpan: OpenInterval;
  queryXSpan: OpenInterval | null;
  targetSegments?: PlacedSequenceSegment[]; // These only present in fine mode
  querySegments?: PlacedSequenceSegment[];
}
export function renderGapText(
  gap: { [key: string]: any },
  i: number,
  options: { [key: string]: any }
) {
  const { height, primaryColor, queryColor } = options;
  const placementTargetGap = gap.targetGapText;
  const placementQueryGap = gap.queryGapText;
  const placementGapX =
    (gap.targetTextXSpan.start + gap.targetTextXSpan.end) / 2;
  const queryPlacementGapX =
    (gap.queryTextXSpan.start + gap.queryTextXSpan.end) / 2;
  const shiftTargetText = gap.shiftTarget;
  const shiftQueryText = gap.shiftQuery;
  const targetY = shiftTargetText
    ? ALIGN_TRACK_MARGIN - 10
    : ALIGN_TRACK_MARGIN + 5;
  const targetTickY = shiftTargetText
    ? ALIGN_TRACK_MARGIN - 5
    : ALIGN_TRACK_MARGIN + 5;
  const queryY = shiftQueryText
    ? height - ALIGN_TRACK_MARGIN + 10
    : height - ALIGN_TRACK_MARGIN - 5;
  const queryTickY = shiftQueryText
    ? height - ALIGN_TRACK_MARGIN + 5
    : height - ALIGN_TRACK_MARGIN - 5;

  return (
    <React.Fragment key={"gap " + i}>
      {renderLine(
        gap.targetXSpan.start,
        ALIGN_TRACK_MARGIN,
        gap.targetTextXSpan.start,
        targetTickY,
        primaryColor
      )}
      {renderText(placementTargetGap, placementGapX, targetY, primaryColor)}
      {renderLine(
        gap.targetXSpan.end,
        ALIGN_TRACK_MARGIN,
        gap.targetTextXSpan.end,
        targetTickY,
        primaryColor
      )}

      {renderLine(
        gap.queryXSpan.start,
        height - ALIGN_TRACK_MARGIN,
        gap.queryTextXSpan.start,
        queryTickY,
        queryColor
      )}
      {renderText(placementQueryGap, queryPlacementGapX, queryY, queryColor)}
      {renderLine(
        gap.queryXSpan.end,
        height - ALIGN_TRACK_MARGIN,
        gap.queryTextXSpan.end,
        queryTickY,
        queryColor
      )}
    </React.Fragment>
  );

  function renderText(text: string, x: number, y: number, color: string) {
    return (
      <text
        x={x}
        y={y}
        dominantBaseline="middle"
        style={{ textAnchor: "middle", fill: color, fontSize: 10 }}
      >
        {text}
      </text>
    );
  }

  function renderLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string
  ) {
    return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} />;
  }
}

export function renderFineAlignment(
  placement: any,
  i: number,
  options: { [key: string]: any }
) {
  const { height, primaryColor, queryColor } = options;
  const { targetXSpan } = placement;
  const xStart = targetXSpan.start;
  const xEnd = targetXSpan.end;
  const targetSequence = placement.targetSequence;
  const querySequence = placement.querySequence;
  const baseWidth = placement.baseWidth;
  const targetLocus = placement.targetLocus;
  const queryLocus = placement.queryLocus;
  const nonGapsTarget = placement.nonGapsTarget;
  const nonGapsQuery = placement.nonGapsQuery;
  return (
    <React.Fragment key={i}>
      {renderSequenceSegments(
        targetLocus,
        targetSequence,
        nonGapsTarget,
        ALIGN_TRACK_MARGIN,
        primaryColor,
        false
      )}
      {renderAlignTicks()}
      {renderSequenceSegments(
        queryLocus,
        querySequence,
        nonGapsQuery,
        height - RECT_HEIGHT - ALIGN_TRACK_MARGIN,
        queryColor,
        true
      )}
    </React.Fragment>
  );

  function renderAlignTicks() {
    const ticks: Array<any> = [];
    let x = targetXSpan.start;

    for (i = 0; i < targetSequence.length; i++) {
      if (
        targetSequence.charAt(i).toUpperCase() ===
        querySequence.charAt(i).toUpperCase()
      ) {
        ticks.push(
          <line
            key={i}
            x1={x + baseWidth / 2}
            y1={ALIGN_TRACK_MARGIN + RECT_HEIGHT + TICK_MARGIN}
            x2={x + baseWidth / 2}
            y2={height - ALIGN_TRACK_MARGIN - RECT_HEIGHT - TICK_MARGIN}
            stroke="black"
            strokeOpacity={0.7}
          />
        );
      }
      x += baseWidth;
    }
    return ticks;
  }

  function renderSequenceSegments(
    locus: string,
    sequence: string,
    nonGaps: any,
    y: number,
    color: string,
    isQuery: boolean
  ) {
    const rects = nonGaps.map((segment, i) => (
      <rect
        key={i}
        x={segment.xSpan.start}
        y={y}
        width={segment.xSpan.end - segment.xSpan.start}
        height={RECT_HEIGHT}
        fill={color}
        onClick={() => console.log("You clicked on " + locus)}
      />
    ));
    const letters = nonGaps.map((segment, i) => (
      <Sequence
        key={i}
        sequence={sequence.substr(segment.index, segment.length)}
        xSpan={segment.xSpan}
        y={y}
        isDrawBackground={false}
        height={RECT_HEIGHT}
      />
    ));
    const arrows = nonGaps.map((segment, i) => (
      <AnnotationArrows
        key={i}
        startX={segment.xSpan.start}
        endX={segment.xSpan.end}
        y={y}
        height={RECT_HEIGHT}
        opacity={0.75}
        isToRight={!(isQuery && placement.isReverseStrandQuery)}
        color="white"
        separation={baseWidth}
      />
    ));

    return (
      <React.Fragment>
        <line
          x1={xStart + baseWidth / 4}
          y1={y + 0.5 * RECT_HEIGHT}
          x2={xEnd}
          y2={y + 0.5 * RECT_HEIGHT}
          stroke={color}
          strokeDasharray={baseWidth / 2}
        />
        {rects}
        {arrows}
        {letters}
      </React.Fragment>
    );
  }
}

//ROUGHMODEFUNCTIONS __________________________________________________________________________________________________________________________________________________________
//ROUGHMODEFUNCTIONS __________________________________________________________________________________________________________________________________________________________
//ROUGHMODEFUNCTIONS __________________________________________________________________________________________________________________________________________________________
export function renderRoughStrand(
  strand: string,
  topY: number,
  viewWindow: { [key: string]: any },
  isPrimary: boolean
) {
  const plotReverse = strand === "-" ? true : false;
  return (
    <AnnotationArrows
      key={"roughArrow" + viewWindow.start + isPrimary}
      startX={viewWindow.start}
      endX={viewWindow.end}
      y={topY}
      height={RECT_HEIGHT}
      opacity={0.75}
      isToRight={!plotReverse}
      color="white"
      separation={0}
    />
  );
}
function ensureMaxListLength(list, limit: number) {
  if (list.length <= limit) {
    return list;
  }

  const selectedItems: Array<any> = [];
  for (let i = 0; i < limit; i++) {
    const fractionIterated = i / limit;
    const selectedIndex = Math.ceil(fractionIterated * list.length);
    selectedItems.push(list[selectedIndex]);
  }
  return selectedItems;
}
export function renderRoughAlignment(
  placement: { [key: string]: any },
  plotReverse: boolean,
  roughHeight: number,
  targetGenome,
  queryGenome
) {
  const targetXSpan: { [key: string]: any } = placement.targetXSpan;
  const segments: Array<{ [key: string]: any }> = placement.segments;
  const queryXSpan: { [key: string]: any } = placement.queryXSpan;
  const queryFeature: { [key: string]: any } = placement.queryFeature;
  const queryRectTopY = roughHeight - RECT_HEIGHT;

  const targetGenomeRect = (
    <rect
      x={targetXSpan.start}
      y={0}
      width={targetXSpan.end - targetXSpan.start}
      height={RECT_HEIGHT}
      fill={DEFAULT_OPTIONS.primaryColor}
      // tslint:disable-next-line:jsx-no-lambda
      // onClick={() =>
      //   console.log("You clicked on " + queryFeature.getLocus().toString())
      // }
    />
  );
  const queryGenomeRect = (
    <rect
      x={queryXSpan.start}
      y={queryRectTopY}
      width={queryXSpan.end - queryXSpan.start}
      height={RECT_HEIGHT}
      fill={DEFAULT_OPTIONS.queryColor}
      // tslint:disable-next-line:jsx-no-lambda
      // onClick={() => console.log("You clicked on " + queryFeature.getLocus().toString())}
    />
  );

  const estimatedLabelWidth = queryFeature.toString().length * FONT_SIZE;
  let label;
  if (estimatedLabelWidth < queryXSpan.end - queryXSpan.start) {
    label = (
      <text
        x={0.5 * (queryXSpan.start + queryXSpan.end)}
        y={queryRectTopY + 0.5 * RECT_HEIGHT}
        dominantBaseline="middle"
        textAnchor="middle"
        fill="white"
        fontSize={12}
      >
        {`${queryFeature.locus.chr}:${queryFeature.locus.start}-${queryFeature.locus.end}`}
      </text>
    );
  }

  const curvePaths = segments.map((segment, i) => {
    const x0 = Math.floor(segment.targetXSpan.start);
    const y0 = RECT_HEIGHT;
    const x1 =
      (!plotReverse && segment.record.queryStrand === "-") ||
      (plotReverse && segment.record.queryStrand === "+")
        ? Math.ceil(segment.queryXSpan!.end)
        : Math.floor(segment.queryXSpan!.start);
    const y1 = queryRectTopY;
    const x2 =
      (!plotReverse && segment.record.queryStrand === "-") ||
      (plotReverse && segment.record.queryStrand === "+")
        ? Math.floor(segment.queryXSpan!.start)
        : Math.ceil(segment.queryXSpan!.end);
    // const y2 = queryRectTopY;

    const x3 = segment.targetXSpan.end;
    // const targetGenome = trackData!.genomeName;
    // const queryGenome = trackData!.queryGenomeName;
    const y3 = RECT_HEIGHT;
    const yhalf = (RECT_HEIGHT + queryRectTopY) / 2;
    const d_string = `M ${x0} ${y0} 
        C ${x0} ${yhalf}, ${x1} ${yhalf},${x1},${y1} 
        H ${x2} 
        C ${x2} ${yhalf}, ${x3} ${yhalf}, ${x3},${y3}
        Z`;

    return (
      <path
        key={i}
        d={d_string}
        fill={DEFAULT_OPTIONS.queryColor}
        fillOpacity={0.5}
        // tslint:disable-next-line:jsx-no-lambda
        onClick={() =>
          console.log(
            targetGenome +
              ":" +
              `${segment.record.locus.chr}:${segment.record.locus.start}-${segment.record.locus.end}` +
              " --- " +
              queryGenome +
              ":" +
              `${segment.record.queryLocus.chr}:${segment.record.queryLocus.start}-${segment.record.queryLocus.end}`
          )
        }
      />
    );
  });

  return (
    <React.Fragment
      key={`${queryFeature.locus.chr}:${queryFeature.locus.start}-${queryFeature.locus.end}`}
    >
      {targetGenomeRect}

      {queryGenomeRect}
      {label}
      {ensureMaxListLength(curvePaths, MAX_POLYGONS)}
    </React.Fragment>
  );
}
