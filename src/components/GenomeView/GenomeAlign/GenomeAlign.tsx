import React, { createRef, memo } from "react";
import { useEffect, useRef, useState } from "react";
// import worker_script from '../../Worker/worker';
import JSON5 from "json5";
import _ from "lodash";

import { SequenceSegment } from "../../../models/AlignmentStringUtils";
import { FeatureSegment } from "../../../models/FeatureSegment";
import ChromosomeInterval from "../../../models/ChromosomeInterval";
import AnnotationArrows from "../commonComponents/annotation/AnnotationArrows";
import { Sequence } from "./Sequence";
import toolTipGenomealign from "../commonComponents/hover/toolTipGenomealign";
import { ViewExpansion } from "../../../models/RegionExpander";
import { NavContextBuilder } from "../../../models/NavContextBuilder";
import LinearDrawingModel from "../../../models/LinearDrawingModel";
import DisplayedRegionModel from "../../../models/DisplayedRegionModel";
import OpenInterval from "../../../models/OpenInterval";
import Feature from "../../../models/Feature";
import AlignmentRecord from "../../../models/AlignmentRecord";
import NavigationContext from "../../../models/NavigationContext";
import { AlignmentSegment } from "../../../models/AlignmentSegment";

const worker = new Worker(new URL("./genomealigngWorker.ts", import.meta.url), {
  type: "module",
});

interface WorkerData {
  genomeName: string;
  queryGenomeName: string;
  result: Array<any>; // Adjust the type according to the structure of your records
  visWidth: number;

  visRegion: { [key: string]: Feature[] | any };
  viewWindowRegion: { [key: string]: Feature[] | any };

  viewWindow: { [key: string]: any };
}
interface RecordsObj {
  query: string;
  records: AlignmentRecord[];
  isBigChain?: boolean;
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
interface GenomeAlignProps {
  bpRegionSize?: number;
  bpToPx?: number;
  trackData?: { [key: string]: any }; // Replace with the actual type
  side?: string;
  windowWidth?: number;
  totalSize?: number;
  trackData2?: { [key: string]: any }; // Replace with the actual type
  dragXDist?: number;
  featureArray?: any;
  chrIndex?: number;
  genomeName?: string;
  visData?: ViewExpansion;
}

// multiAlignCal defaults
const MARGIN = 5;
// const MIN_GAP_DRAW_WIDTH = 3;
const MERGE_PIXEL_DISTANCE = 200;
const MIN_MERGE_DRAW_WIDTH = 5;

const GenomeAlign: React.FC<GenomeAlignProps> = memo(function GenomeAlign({
  bpToPx,
  side,
  trackData2,
  visData,
}) {
  let start, end;

  let result;
  if (Object.keys(trackData2!).length > 0) {
    [start, end] = trackData2!.location.split(":");

    result = trackData2!.genomealignResult;
  } else {
  }

  start = Number(start);
  end = Number(end);
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
    if (result === undefined) {
      return;
    }
    // This is for rough mode  and fine for compare genome alignment track where we parse data after fetch
    //step 0 AlignSourceWorker
    let records: AlignmentRecord[] = [];
    for (const record of result) {
      let data = JSON5.parse("{" + record[3] + "}");
      // if (options.isRoughMode) {

      // }
      record[3] = data;
      records.push(new AlignmentRecord(record));
    }
    let oldRecordsArray: Array<RecordsObj> = [];
    oldRecordsArray.push({
      query: trackData2!.queryGenomeName,
      records: records,
      isBigChain: false,
    });

    //FINEMODE __________________________________________________________________________________________________________________________________________________________
    //step  1 check bp and get the gaps
    if (bpToPx! <= 10) {
      //  find the gap for primary genome in bp

      let newCoord = visData!.visRegion.getContextCoordinates();
      let newNav = visData!.visRegion.getNavigationContext();

      let newCoordWindow = visData!.viewWindowRegion.getContextCoordinates();
      let newNavWindow = visData!.viewWindowRegion.getNavigationContext();

      let newWorkerData: WorkerData = {
        genomeName: trackData2!.genomeName,
        queryGenomeName: trackData2!.queryGenomeName,
        result: result,

        visRegion: {
          name: newNav.getName(),
          featureArray: newNav.getFeatures(),
          start: newCoord.start,
          end: newCoord.end,
        },
        viewWindowRegion: {
          name: newNav.getName(),
          featureArray: newNavWindow.getFeatures(),
          start: newCoordWindow.start,
          end: newCoordWindow.end,
        },
        visWidth: visData!.visWidth,
        viewWindow: {
          start: visData!.viewWindow.start,
          end: visData!.viewWindow.end,
        },
      };

      worker.postMessage(newWorkerData);

      worker.onmessage = (event) => {
        let drawDataArr = event.data;
        console.log(drawDataArr);
        newTrackWidth.current = drawDataArr[0].primaryVisData;

        let drawData = drawDataArr[0].drawData;
        console.log(drawData);
        let svgElements = drawData.map((placement, index) =>
          renderFineAlignment(placement, index)
        );
        const drawGapText = drawDataArr[0].drawGapText;
        svgElements.push(...drawGapText.map(renderGapText));
        if (trackData2!.side === "right") {
          setRightTrack([...svgElements]);
        } else {
          setLeftTrack([...svgElements]);
        }
      };
    }

    //ROUGHMODE __________________________________________________________________________________________________________________________________________________________
    //step 1
    else {
      let alignmentData: { [key: string]: any } = oldRecordsArray.reduce(
        (multiAlign, records) => ({
          ...multiAlign,
          [records.query]: alignRough(records.query, records.records, visData!),
        }),
        {}
      );
      let alignment: { [key: string]: any } = Object.values(alignmentData)[0];

      let svgElements = alignment.drawData.map((placement) =>
        renderRoughAlignment(placement, false, 80)
      );
      const arrows = renderRoughStrand("+", 0, visData!.viewWindow, false);
      svgElements.push(arrows);
      const primaryViewWindow = alignment.primaryVisData.viewWindow;
      const strand = alignment.plotStrand;
      const height = 80;
      const primaryArrows = renderRoughStrand(
        strand,
        height - RECT_HEIGHT,
        primaryViewWindow,
        true
      );
      svgElements.push(primaryArrows);
      if (trackData2!.side === "right") {
        setRightTrack([...svgElements]);
      } else {
        setLeftTrack([...svgElements]);
      }
      svgElements;
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
  function renderFineAlignment(placement: any, i: number) {
    const { height, primaryColor, queryColor } = DEFAULT_OPTIONS;
    const {
      xStart,
      xEnd,
      targetSequence,
      querySequence,
      baseWidth,
      targetLocus,
      queryLocus,
      nonGapTargetData,
      nonGapQueryData,
    } = placement;

    return (
      <React.Fragment key={i}>
        {renderSequenceSegments(
          targetLocus,
          targetSequence,
          nonGapTargetData,
          ALIGN_TRACK_MARGIN,
          primaryColor,
          false
        )}
        {renderAlignTicks()}
        {renderSequenceSegments(
          queryLocus,
          querySequence,
          nonGapQueryData,
          height - RECT_HEIGHT - ALIGN_TRACK_MARGIN,
          queryColor,
          true
        )}
      </React.Fragment>
    );

    function renderAlignTicks() {
      const ticks: Array<any> = [];
      let x = xStart;
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
      segments: Array<any>,
      y: number,
      color: string,
      isQuery: boolean
    ) {
      const rects = segments.map((segment, i) => (
        <rect
          key={i}
          x={segment.segXSpanStart}
          y={y}
          width={segment.segLength}
          height={RECT_HEIGHT}
          fill={color}
          onClick={() => console.log("You clicked on " + locus)}
        />
      ));
      const letters = segments.map((segment, i) => (
        <Sequence
          key={i}
          sequence={sequence.substr(segment.index, segment.segLength)}
          xSpan={new OpenInterval(segment.segXSpanStart, segment.segXSpanEnd)}
          y={y}
          isDrawBackground={false}
          height={RECT_HEIGHT}
        />
      ));
      const arrows = segments.map((segment, i) => (
        <AnnotationArrows
          key={i}
          startX={segment.segXSpanStart}
          endX={segment.segXSpanEnd}
          y={y}
          height={RECT_HEIGHT}
          opacity={0.75}
          isToRight={isQuery}
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
    viewWindow: OpenInterval,
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
  function alignRough(
    query: string,
    alignmentRecords: AlignmentRecord[],
    visData: ViewExpansion
  ) {
    const { visRegion, visWidth } = visData;
    const drawModel = new LinearDrawingModel(visRegion, visWidth);
    const mergeDistance = drawModel.xWidthToBases(MERGE_PIXEL_DISTANCE);

    // Count how many bases are in positive strand and how many of them are in negative strand.
    // More in negative strand (<0) => plotStrand = "-".
    const aggregateStrandsNumber = alignmentRecords.reduce(
      (aggregateStrand, record) =>
        aggregateStrand +
        (record.getIsReverseStrandQuery()
          ? -1 * record.getLength()
          : record.getLength()),
      0
    );
    const plotStrand = aggregateStrandsNumber < 0 ? "-" : "+";

    const placedRecords = computeContextLocations(alignmentRecords, visData!);
    // First, merge the alignments by query genome coordinates
    let queryLocusMerges = ChromosomeInterval.mergeAdvanced(
      // Note that the third parameter gets query loci
      placedRecords,
      mergeDistance,
      (placement) => placement.visiblePart.getQueryLocus()
    );

    // Sort so we place the largest query loci first in the next step
    queryLocusMerges = queryLocusMerges.sort(
      (a, b) => b.locus.getLength() - a.locus.getLength()
    );

    const intervalPlacer = new IntervalPlacer(MARGIN);
    const drawData: Array<any> = [];
    for (const merge of queryLocusMerges) {
      const mergeLocus = merge.locus;
      const placementsInMerge = merge.sources; // Placements that made the merged locus
      const mergeDrawWidth = drawModel.basesToXWidth(mergeLocus.getLength());
      const halfDrawWidth = 0.5 * mergeDrawWidth;
      if (mergeDrawWidth < MIN_MERGE_DRAW_WIDTH) {
        continue;
      }

      // Find the center of the primary segments, and try to center the merged query locus there too.
      const drawCenter = computeCentroid(
        placementsInMerge.map((segment) => segment.targetXSpan)
      );
      const targetXStart = Math.min(
        ...placementsInMerge.map((segment) => segment.targetXSpan.start)
      );
      const targetEnd = Math.max(
        ...placementsInMerge.map((segment) => segment.targetXSpan.end)
      );
      const mergeTargetXSpan = new OpenInterval(targetXStart, targetEnd);
      const preferredStart = drawCenter - halfDrawWidth;
      const preferredEnd = drawCenter + halfDrawWidth;
      // Place it so it doesn't overlap other segments
      const mergeXSpan = intervalPlacer.place(
        new OpenInterval(preferredStart, preferredEnd)
      );

      // Put the actual secondary/query genome segments in the placed merged query locus from above
      const queryLoci = placementsInMerge.map(
        (placement) => placement.record.queryLocus
      );
      const isReverse = plotStrand === "-" ? true : false;
      const lociXSpans = placeInternalLoci(
        mergeLocus,
        queryLoci,
        mergeXSpan,
        isReverse,
        drawModel
      );
      for (let i = 0; i < queryLoci.length; i++) {
        placementsInMerge[i].queryXSpan = lociXSpans[i];
      }

      drawData.push({
        queryFeature: new Feature(" ", mergeLocus, plotStrand),
        targetXSpan: mergeTargetXSpan,
        queryXSpan: mergeXSpan,
        segments: placementsInMerge,
      });
    }

    return {
      isFineMode: false,
      primaryVisData: visData,
      drawData,
      plotStrand,
      primaryGenome: trackData2!.genomeName,
      queryGenome: query,
      basesPerPixel: drawModel.xWidthToBases(1),
    };
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
    placement: PlacedMergedAlignment,
    plotReverse: boolean,
    roughHeight: number
  ) {
    const { queryFeature, queryXSpan, segments, targetXSpan } = placement;
    const queryRectTopY = roughHeight - RECT_HEIGHT;
    const targetGenomeRect = (
      <rect
        x={targetXSpan.start}
        y={0}
        width={targetXSpan.getLength()}
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
        width={queryXSpan.getLength()}
        height={RECT_HEIGHT}
        fill={DEFAULT_OPTIONS.queryColor}
        // tslint:disable-next-line:jsx-no-lambda
        // onClick={() => console.log("You clicked on " + queryFeature.getLocus().toString())}
      />
    );

    const estimatedLabelWidth = queryFeature.toString().length * FONT_SIZE;
    let label;
    if (estimatedLabelWidth < queryXSpan.getLength()) {
      label = (
        <text
          x={0.5 * (queryXSpan.start + queryXSpan.end)}
          y={queryRectTopY + 0.5 * RECT_HEIGHT}
          dominantBaseline="middle"
          textAnchor="middle"
          fill="white"
          fontSize={12}
        >
          {queryFeature.getLocus().toString()}
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
                segment.record.getLocus() +
                " --- " +
                queryGenome +
                ":" +
                segment.record.queryLocus.toString()
            )
          }
        />
      );
    });

    return (
      <React.Fragment key={queryFeature.getLocus().toString()}>
        {targetGenomeRect}
        {queryGenomeRect}
        {label}
        {ensureMaxListLength(curvePaths, MAX_POLYGONS)}
      </React.Fragment>
    );
  }
  function computeContextLocations(
    records: AlignmentRecord[],
    visData: ViewExpansion
  ): PlacedAlignment[] {
    const { visRegion, visWidth } = visData;
    return placeFeatures(records, visRegion, visWidth).map((placement) => {
      return {
        record: placement.feature as AlignmentRecord,
        visiblePart: AlignmentSegment.fromFeatureSegment(placement.visiblePart),
        contextSpan: placement.contextLocation,
        targetXSpan: placement.xSpan,
        queryXSpan: null,
      };
    });
  }
  function placeFeatures(
    features: Feature[],
    viewRegion: DisplayedRegionModel,
    width: number,
    useCenter: boolean = false
  ) {
    const drawModel = new LinearDrawingModel(viewRegion, width);
    const viewRegionBounds = viewRegion.getContextCoordinates();
    const navContext = viewRegion.getNavigationContext();

    const placements: Array<any> = [];

    for (const feature of features) {
      for (let contextLocation of feature.computeNavContextCoordinates(
        navContext
      )) {
        contextLocation = contextLocation.getOverlap(viewRegionBounds)!; // Clamp the location to view region
        if (contextLocation) {
          const xSpan = useCenter
            ? drawModel.baseSpanToXCenter(contextLocation)
            : drawModel.baseSpanToXSpan(contextLocation);
          const { visiblePart, isReverse } = locatePlacement(
            feature,
            navContext,
            contextLocation
          );
          placements.push({
            feature,
            visiblePart,
            contextLocation,
            xSpan,
            isReverse,
          });
        }
      }
    }

    return placements;
  }

  function locatePlacement(
    feature: Feature,
    navContext: NavigationContext,
    contextLocation: OpenInterval
  ) {
    // First, get the genomic coordinates of the context location, i.e. the "context locus"
    const contextFeatureCoord = navContext.convertBaseToFeatureCoordinate(
      contextLocation.start
    );
    const placedBase = contextFeatureCoord.getLocus().start;
    const isReverse = contextFeatureCoord.feature.getIsReverseStrand();

    // We have a base number, but it could be the end or the beginning of the context locus.
    let contextLocusStart;
    if (isReverse) {
      // placedBase is the end base number of the context locus.  Convert to the start.
      contextLocusStart = placedBase - contextLocation.getLength() + 1;
    } else {
      contextLocusStart = placedBase;
    }

    // Now, we can compare the context location locus to the feature's locus.
    const distFromFeatureLocus = contextLocusStart - feature.getLocus().start;
    const relativeStart = Math.max(0, distFromFeatureLocus);
    return {
      visiblePart: new FeatureSegment(
        feature,
        relativeStart,
        relativeStart + contextLocation.getLength()
      ),
      isReverse,
    };
  }

  function computeCentroid(intervals: Array<{ [key: string]: any }>) {
    const numerator = _.sumBy(
      intervals,
      (interval) =>
        0.5 * (interval.end - interval.start) * (interval.start + interval.end)
    );
    const denominator = _.sumBy(
      intervals,
      (interval) => interval.end - interval.start
    );

    return numerator / denominator;
  }

  function placeInternalLoci(
    parentLocus: ChromosomeInterval,
    internalLoci: ChromosomeInterval[],
    parentXSpan: OpenInterval,
    drawReverse: boolean,
    drawModel: LinearDrawingModel
  ) {
    const xSpans: Array<any> = [];
    if (drawReverse) {
      // place segments from right to left if drawReverse
      for (const locus of internalLoci) {
        const distanceFromParent = locus.start - parentLocus.start;
        const xDistanceFromParent = drawModel.basesToXWidth(distanceFromParent);
        const locusXEnd = parentXSpan.end - xDistanceFromParent;
        const xWidth = drawModel.basesToXWidth(locus.getLength());
        const xEnd = locusXEnd < parentXSpan.end ? locusXEnd : parentXSpan.end;
        const xStart =
          locusXEnd - xWidth > parentXSpan.start
            ? locusXEnd - xWidth
            : parentXSpan.start;
        xSpans.push(new OpenInterval(xStart, xEnd));
      }
    } else {
      for (const locus of internalLoci) {
        const distanceFromParent = locus.start - parentLocus.start;
        const xDistanceFromParent = drawModel.basesToXWidth(distanceFromParent);
        const locusXStart = parentXSpan.start + xDistanceFromParent;
        const xWidth = drawModel.basesToXWidth(locus.getLength());
        const xStart =
          locusXStart > parentXSpan.start ? locusXStart : parentXSpan.start;
        const xEnd =
          locusXStart + xWidth < parentXSpan.end
            ? locusXStart + xWidth
            : parentXSpan.end;
        xSpans.push(new OpenInterval(xStart, xEnd));
      }
    }
    return xSpans;
  }
  class IntervalPlacer {
    public leftExtent: number;
    public rightExtent: number;
    public margin: number;
    private _placements: OpenInterval[];

    constructor(margin = 0) {
      this.leftExtent = Infinity;
      this.rightExtent = -Infinity;
      this.margin = margin;
      this._placements = [];
    }

    place(preferredLocation: OpenInterval) {
      let finalLocation = preferredLocation;
      if (
        this._placements.some(
          (placement) => placement.getOverlap(preferredLocation) != null
        )
      ) {
        const center = 0.5 * (preferredLocation.start + preferredLocation.end);
        const isInsertLeft =
          Math.abs(center - this.leftExtent) <
          Math.abs(center - this.rightExtent);
        finalLocation = isInsertLeft
          ? new OpenInterval(
              this.leftExtent - preferredLocation.getLength(),
              this.leftExtent
            )
          : new OpenInterval(
              this.rightExtent,
              this.rightExtent + preferredLocation.getLength()
            );
      }

      this._placements.push(finalLocation);
      if (finalLocation.start < this.leftExtent) {
        this.leftExtent = finalLocation.start - this.margin;
      }
      if (finalLocation.end > this.rightExtent) {
        this.rightExtent = finalLocation.end + this.margin;
      }

      return finalLocation;
    }

    retrievePlacements() {
      return this._placements;
    }
  }
  useEffect(() => {
    console.log("triger left ", trackData2);
    fetchGenomeData();
    view.current = trackData2!.xDist;
    // having two prop changes here side and data will cause JSON5 try to run twice causing an error because its already parsed
  }, [trackData2]);
  // use absolute for tooltip and hover element so the position will stack ontop of the track which will display on the right position
  // absolute element will affect each other position so you need those element to all have absolute
  return (
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
          overflow: "visible",

          position: "absolute",
          right:
            side === "left"
              ? `${view.current! - newTrackWidth.current!.viewWindow.start}px`
              : "",
          left:
            side === "right"
              ? `${-view.current! - newTrackWidth.current!.viewWindow.start}px`
              : "",
        }}
      >
        {side === "right"
          ? rightTrackGenes.map(
              (item) =>
                // index <= rightTrackGenes.length - 1 ?

                item

              //  : (
              //   <div style={{ display: 'flex', width: windowWidth }}>
              //     ....LOADING
              //   </div>
              // )
            )
          : leftTrackGenes.map(
              (item) =>
                // index <= rightTrackGenes.length - 1 ?

                item

              //  : (
              //   <div style={{ display: 'flex', width: windowWidth }}>
              //     ....LOADING
              //   </div>
              // )
            )}
      </svg>

      {/* {side === "right" ? (
        <div
          key={"genomealignRight"}
          style={{
            opacity: 0.5,

            position: "absolute",
            left: `${-view.current!}px`,
          }}
        >
          {rightTrackGenes.map((item, index) => (
            <ToolTipGenomealign
              key={index}
              data={rightTrackGenes[index]}
              windowWidth={windowWidth}
              trackIdx={index}
              side={"right"}
            />
          ))}
        </div>
      ) : (
        <div
          key={"genomealignLeft"}
          style={{
            opacity: 0.5,
            display: "flex",
            position: "absolute",
            right: `${view.current!}px`,
          }}
        >
          {leftTrackGenes.map((item, index) => (
            <ToolTipGenomealign
              key={leftTrackGenes.length - index - 1}
              data={leftTrackGenes[leftTrackGenes.length - index - 1]}
              windowWidth={windowWidth}
              trackIdx={leftTrackGenes.length - index - 1}
              side={"left"}
            />
          ))}
        </div>
      )} */}
    </div>
  );
});
export default memo(GenomeAlign);
