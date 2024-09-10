import React, { createRef, memo } from "react";
import { useEffect, useRef, useState } from "react";
// import worker_script from '../../Worker/worker';

import _ from "lodash";
import { SequenceSegment } from "../../../models/AlignmentStringUtils";
import AnnotationArrows from "../commonComponents/annotation/AnnotationArrows";
import { Sequence } from "./Sequence";
import { ViewExpansion } from "../../../models/RegionExpander";

import OpenInterval from "../../../models/OpenInterval";
import Feature from "../../../models/Feature";
import AlignmentRecord from "../../../models/AlignmentRecord";

import { AlignmentSegment } from "../../../models/AlignmentSegment";

import ToolTipGenomealign from "../commonComponents/hover-and-tooltip/toolTipGenomealign";
import { TrackProps } from "../../../models/trackModels/trackProps";
import { GapText } from "./MultiAlignmentViewCalculator";
const worker = new Worker(new URL("./genomeAlignWorker.ts", import.meta.url), {
  type: "module",
});

interface WorkerData {
  genomeName: string;
  queryGenomeName: string;
  result: Array<any>; // Adjust the type according to the structure of your records
  visWidth: number;
  loci: { [key: string]: Feature[] | any };
  visRegion: { [key: string]: Feature[] | any };
  viewWindowRegion: { [key: string]: Feature[] | any };
  viewMode: string;
  viewWindow: { [key: string]: any };
  xDist: number;
}
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
// const FINE_MODE_HEIGHT = 80;
const ALIGN_TRACK_MARGIN = 20; // The margin on top and bottom of alignment block
// const ROUGH_MODE_HEIGHT = 80;
const RECT_HEIGHT = 15;
const TICK_MARGIN = 1;
const FONT_SIZE = 10;
// const PRIMARY_COLOR = 'darkblue';
// const QUERY_COLOR = '#B8008A';
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

// multiAlignCal defaults
// const MIN_GAP_DRAW_WIDTH = 3;

const GenomeAlign: React.FC<TrackProps> = memo(function GenomeAlign({
  bpToPx,
  side,
  trackData2,
  visData,
  trackIdx,
  handleDelete,
  id,
}) {
  let start, end;
  let result;
  let trackType;
  let loci;
  if (Object.keys(trackData2!).length > 0) {
    [start, end] = trackData2!.location.split(":");

    result = trackData2![`${id}`].fetchData;
    trackType = trackData2![`${id}`].trackType;
    loci = trackData2![`${id}`].loci;
    start = Number(start);
    end = Number(end);
  }

  //useRef to store data between states without re render the component
  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates

  const [rightTrackGenes, setRightTrack] = useState<Array<any>>([]);

  const [leftTrackGenes, setLeftTrack] = useState<Array<any>>([]);
  const view = useRef(0);
  const newTrackWidth = useRef(visData);

  // We will do MultiAlignmentViewCalculator here for rough mode

  function fetchGenomeData() {
    let startPos;
    startPos = start;

    if (result === undefined || result.length === 0) {
      return;
    }

    // let newCoord = visData!.visRegion.getContextCoordinates();
    // let newNav = visData!.visRegion.getNavigationContext();

    // let newCoordWindow = visData!.viewWindowRegion.getContextCoordinates();
    // let newNavWindow = visData!.viewWindowRegion.getNavigationContext();

    // let newWorkerData: WorkerData = {
    //   genomeName: trackData2!.genomeName,
    //   viewMode: " ",
    //   queryGenomeName: trackData2!.queryGenomeName,
    //   result: result,
    //   loci,
    //   xDist: trackData2!.xDist,
    //   visRegion: {
    //     name: newNav.getName(),
    //     featureArray: newNav.getFeatures(),
    //     start: newCoord.start,
    //     end: newCoord.end,
    //   },
    //   viewWindowRegion: {
    //     name: newNav.getName(),
    //     featureArray: newNavWindow.getFeatures(),
    //     start: newCoordWindow.start,
    //     end: newCoordWindow.end,
    //   },
    //   visWidth: visData!.visWidth,
    //   viewWindow: {
    //     start: visData!.viewWindow.start,
    //     end: visData!.viewWindow.end,
    //   },
    // };
    let tmpObj;
    let svgElements;
    //FINEMODE __________________________________________________________________________________________________________________________________________________________
    //step  1 check bp and get the gaps
    if (bpToPx! <= 10) {
      const drawData = result.drawData as PlacedAlignment[];

      svgElements = drawData.map(renderFineAlignment);
      const drawGapText = result.drawGapText as GapText[];
      svgElements.push(...drawGapText.map(renderGapText));
      tmpObj = { svgElements, drawData, result };
      if (trackData2!.side === "right") {
        setRightTrack(new Array<any>(tmpObj));
      } else {
        setLeftTrack(new Array<any>(tmpObj));
      }

      view.current = trackData2!.xDist;

      newTrackWidth.current = result.primaryVisData;
      console.log(
        view.current,
        newTrackWidth.current,
        view.current! - newTrackWidth.current!.viewWindow.start
      );
      //  find the gap for primary genome in bp
      // newWorkerData["viewMode"] = "fineMode";
      // worker.postMessage(newWorkerData);

      // worker.onmessage = (event) => {
      //   let drawDataArr = event.data.drawDataArr;

      //   newTrackWidth.current = drawDataArr[0].primaryVisData;

      //   let drawData = drawDataArr[0].drawData;

      //   svgElements = drawData.map((placement, index) =>
      //     renderFineAlignment(placement, index)
      //   );
      //   const drawGapText = drawDataArr[0].drawGapText;
      //   svgElements.push(...drawGapText.map(renderGapText));
      //   tmpObj = { svgElements, drawDataArr };

      //   if (trackData2!.side === "right") {
      //     setRightTrack(new Array<any>(tmpObj));
      //   } else {
      //     setLeftTrack(new Array<any>(tmpObj));
      //   }
      //   view.current = event.data.xDist;
      // };
    }

    //ROUGHMODE __________________________________________________________________________________________________________________________________________________________
    //step 1
    else {
      newWorkerData["viewMode"] = "roughMode";
      worker.postMessage(newWorkerData);

      worker.onmessage = (event) => {
        let drawDataArr = event.data.drawDataArr;

        let drawData = drawDataArr[0].drawData;

        svgElements = drawData.map((placement) =>
          renderRoughAlignment(placement, false, 80)
        );
        newTrackWidth.current = drawDataArr[0].primaryVisData;
        const arrows = renderRoughStrand("+", 0, visData!.viewWindow, false);
        svgElements.push(arrows);
        const primaryViewWindow = drawDataArr[0].primaryVisData.viewWindow;

        const strand = drawDataArr[0].plotStrand;
        const height = 80;
        const primaryArrows = renderRoughStrand(
          strand,
          height - RECT_HEIGHT,
          primaryViewWindow,
          true
        );
        svgElements.push(primaryArrows);
        tmpObj = { svgElements, drawDataArr };
        if (trackData2!.side === "right") {
          setRightTrack(new Array<any>(tmpObj));
        } else {
          setLeftTrack(new Array<any>(tmpObj));
        }
        view.current = event.data.xDist;
      };
    }
  }

  //fineMode FUNCTIONS ______s____________________________________________________________________________________________________________________________________________________

  function renderGapText(gap: { [key: string]: any }, i: number) {
    const { height, primaryColor, queryColor } = DEFAULT_OPTIONS;
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

  function renderFineAlignment(placement: PlacedAlignment, i: number) {
    const { height, primaryColor, queryColor } = DEFAULT_OPTIONS;
    const { targetXSpan, targetSegments, querySegments } = placement;
    const [xStart, xEnd] = targetXSpan;
    const targetSequence = placement.visiblePart.getTargetSequence();
    const querySequence = placement.visiblePart.getQuerySequence();
    const baseWidth = targetXSpan.getLength() / targetSequence.length;
    const targetLocus = placement.visiblePart.getLocus().toString();
    const queryLocus = placement.visiblePart.getQueryLocus().toString();
    return (
      <React.Fragment key={i}>
        {renderSequenceSegments(
          targetLocus,
          targetSequence,
          targetSegments!,
          ALIGN_TRACK_MARGIN,
          primaryColor,
          false
        )}
        {renderAlignTicks()}
        {renderSequenceSegments(
          queryLocus,
          querySequence,
          querySegments!,
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
      segments: PlacedSequenceSegment[],
      y: number,
      color: string,
      isQuery: boolean
    ) {
      const nonGaps = segments.filter((segment) => !segment.isGap);
      const rects = nonGaps.map((segment, i) => (
        <rect
          key={i}
          x={segment.xSpan.start}
          y={y}
          width={segment.xSpan.getLength()}
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
          isToRight={!(isQuery && placement.record.getIsReverseStrandQuery())}
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
  function renderRoughStrand(
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
  function renderRoughAlignment(
    placement: { [key: string]: any },
    plotReverse: boolean,
    roughHeight: number
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
      const targetGenome = trackData2!.genomeName;
      const queryGenome = trackData2!.queryGenomeName;
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

  useEffect(() => {
    fetchGenomeData();
    // having two prop changes here side and data will cause JSON5 try to run twice causing an error because its already parsed
  }, [trackData2]);
  // use absolute for tooltip and hover element so the position will stack ontop of the track which will display on the right position
  // absolute element will affect each other position so you need those element to all have absolute
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          position: "relative",
        }}
      >
        <svg
          width={`${newTrackWidth.current!.visWidth}px`}
          height={"250"}
          style={{
            position: "absolute",
            right:
              side === "left"
                ? `${view.current! - newTrackWidth.current!.viewWindow.start}px`
                : "",
            left:
              side === "right"
                ? `${
                    -view.current! - newTrackWidth.current!.viewWindow.start
                  }px`
                : "",
          }}
        >
          {view.current <= 0
            ? rightTrackGenes.map(
                (drawData) =>
                  // index <= rightTrackGenes.length - 1 ?
                  drawData["svgElements"]
                //  : (
                //   <div style={{ display: 'flex', width: windowWidth }}>
                //     ....LOADING
                //   </div>
                // )
              )
            : leftTrackGenes.map(
                (drawData) =>
                  // index <= rightTrackGenes.length - 1 ?
                  drawData["svgElements"].map((svgData) => svgData)
                //  : (
                //   <div style={{ display: 'flex', width: windowWidth }}>
                //     ....LOADING
                //   </div>
                // )
              )}
        </svg>
        <div
          style={{
            position: "absolute",
            right:
              side === "left"
                ? `${view.current! - newTrackWidth.current!.viewWindow.start}px`
                : "",
            left:
              side === "right"
                ? `${
                    -view.current! - newTrackWidth.current!.viewWindow.start
                  }px`
                : "",
          }}
        >
          {/* {bpToPx! <= 10
            ? view.current <= 0
              ? rightTrackGenes.map(
                  (drawData) =>
                    // index <= rightTrackGenes.length - 1 ?
                    drawData["drawData"].map((drawDataArr, index) => (
                      <ToolTipGenomealign
                        key={"genomeAlignRight" + `${trackIdx}`}
                        trackType={trackType}
                        data={drawDataArr}
                        windowWidth={newTrackWidth.current!.visWidth}
                        side={"right"}
                        height={DEFAULT_OPTIONS.height}
                      />
                    ))
                  //  : (
                  //   <div style={{ display: 'flex', width: windowWidth }}>
                  //     ....LOADING
                  //   </div>
                  // )
                )
              : leftTrackGenes.map(
                  (drawData) =>
                    // index <= rightTrackGenes.length - 1 ?
                    drawData["drawData"].map((drawDataArr) => (
                      <ToolTipGenomealign
                        key={"genomealignLeft" + `${trackIdx}`}
                        trackType={trackType}
                        data={drawDataArr}
                        windowWidth={newTrackWidth.current!.visWidth}
                        side={"left"}
                        height={DEFAULT_OPTIONS.height}
                      />
                    ))
                  //  : (
                  //   <div style={{ display: 'flex', width: windowWidth }}>
                  //     ....LOADING
                  //   </div>
                  // )
                )
            : " "} */}
        </div>
      </div>
      {/* <button
        style={{ display: "flex", position: "relative" }}
        onClick={() => handleDelete(trackIdx)}
      >
        Delete
      </button> */}
    </div>
  );
});
export default memo(GenomeAlign);
