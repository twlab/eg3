import React, { createRef, memo } from "react";
import { useEffect, useRef, useState } from "react";
// import worker_script from '../../Worker/worker';
import JSON5 from "json5";
import _ from "lodash";

import {
  AlignmentIterator,
  SequenceSegment,
} from "../../../models/AlignmentStringUtils";
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
import { placements } from "@popperjs/core";

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
const MAX_FINE_MODE_BASES_PER_PIXEL = 10;
const MARGIN = 5;
// const MIN_GAP_DRAW_WIDTH = 3;
const MIN_GAP_LENGTH = 0.99;
const MERGE_PIXEL_DISTANCE = 200;
const MIN_MERGE_DRAW_WIDTH = 5;

const GenomeAlign: React.FC<GenomeAlignProps> = memo(function GenomeAlign({
  bpRegionSize,
  bpToPx,
  trackData,
  side,
  windowWidth = 0,
  totalSize = 0,
  trackData2,
  dragXDist,
  featureArray,
  chrIndex,
  genomeName,
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

    let drawData: Array<any> = [];
    let oldRecordsArray: Array<RecordsObj> = [];
    oldRecordsArray.push({
      query: trackData2!.queryGenomeName,
      records: records,
      isBigChain: false,
    });

    //FINEMODE __________________________________________________________________________________________________________________________________________________________
    //step  1 check bp and get the gaps
    if (bpToPx! <= 10) {
      //step 2
      // refineRecordArray - find all the gaps for the data
      //
      // figured out how to get those data inside of _computeContextLocations
      const { newRecordsArray, allGaps, placementsArr } =
        refineRecordsArray(oldRecordsArray);
      console.log(newRecordsArray, allGaps);
      const primaryVisData = calculatePrimaryVis(allGaps, visData!);
      console.log(primaryVisData, visData!);
      let cumulativeGapBases = setGaps(allGaps);
      console.log(allGaps, cumulativeGapBases, placementsArr);
      console.log(visData);
      //step 3
      // calcualtePrimaryVis:  below are sub functions
      // find out how much gap spaces are needed to be added with index

      // build function:  add the gaps to the feature genome:

      let alignmentDatas = newRecordsArray.reduce(
        (multiAlign, records) => ({
          ...multiAlign,
          [records.query]: alignFine(
            records.query,
            records.records,
            visData!,
            primaryVisData,
            allGaps
          ),
        }),
        {}
      );

      const drawDataArr: Array<{ [key: string]: any }> =
        Object.values(alignmentDatas);

      newTrackWidth.current = drawDataArr[0].primaryVisData;
      let drawData = drawDataArr[0].drawData;
      console.log(drawDataArr[0]);
      let svgElements = drawData.map((placement, index) =>
        renderFineAlignment(placement, index)
      );
      const drawGapText = drawDataArr[0].drawGapText;
      console.log(drawGapText);
      svgElements.push(...drawGapText.map(renderGapText));
      if (trackData2!.side === "right") {
        setRightTrack([...svgElements]);
      } else {
        setLeftTrack([...svgElements]);
      }
      svgElements;
    }

    //ROUGHMODE __________________________________________________________________________________________________________________________________________________________
    //step 1
    else {
      //step 2 ._computeContextLocations ->   placeFeature(): get x base interval converted to pixels
      // creating the alignmentRecords
      let placedRecords = computeContextLocations2(
        oldRecordsArray[0].records,
        visData!
      );

      //step 3 get mergeDistance
      const mergeDistance = MERGE_PIXEL_DISTANCE * bpToPx!;

      // step 4 Count how many bases are in positive strand and how many of them are in negative strand.
      // More in negative strand (<0) => plotStrand = "-".
      let negative = 0;
      let positive = 0;
      for (let item of result) {
        if (item[3].genomealign.strand === "-") {
          negative += item[3].genomealign.stop - item[3].genomealign.start;
        } else {
          positive += item[3].genomealign.stop - item[3].genomealign.start;
        }
      }

      const aggregateStrandsNumber = result.reduce(
        (aggregateStrand, record) =>
          aggregateStrand +
          (record[3].genomealign.strand === "-"
            ? -1 * (record[3].genomealign.stop - record[3].genomealign.start)
            : record[3].genomealign.stop - record[3].genomealign.start),
        0
      );

      const plotStrand = aggregateStrandsNumber < 0 ? "-" : "+";

      //step 5 mergeAdvanced merge the alignments by query genome coordinates
      // in eg2 placedRecord, MergeDistance, and individial value of placedRecord (AlignmentRecord)
      // placedRecord (AlignmentRecord) -> visiblePart: has relative start and end -> alignmentSegment class ->
      // -> getQueryLocus() => returns new ChromosomeInterval(
      //   queryLocus.chr,
      //   queryStrand === "+"
      //     ? queryLocus.start + this.relativeStart
      //     : Math.max(0, queryLocus.end - this.relativeEnd),
      //   queryStrand === "+"
      //     ? Math.min(queryLocus.start + this.relativeEnd, queryLocus.end)
      //     : queryLocus.end - this.relativeStart
      // );
      // relative start is the diff of the viewRegion genomic coord start - the primary genomic coord start
      // query locus is the non primary genome genomic interval and we add the relative start that we got
      // from the primary genome so that it all aligns.

      const groupedByChromosome = _.groupBy(
        placedRecords,
        (obj) => obj.visiblePart.chr
      );

      //iteratee(a) == chromosomeinterval
      const merged: Array<any> = [];
      for (const chrName in groupedByChromosome) {
        const objectsForChromosome = groupedByChromosome[chrName];
        objectsForChromosome.sort(
          (a, b) => a.visiblePart.start - b.visiblePart.start
        );

        const loci = objectsForChromosome.map(
          (item, index) => item.visiblePart
        );

        // Merge loci for this chromosome
        let mergeStartIndex = 0;
        while (mergeStartIndex < loci.length) {
          // Initialize a new merged locus

          const mergedStart = loci[mergeStartIndex].start;
          let mergedEnd = loci[mergeStartIndex].end;
          let mergeEndIndex = mergeStartIndex + 1;

          // Find the end of the merged locus
          while (mergeEndIndex < loci.length) {
            const start = loci[mergeEndIndex].start;
            const end = loci[mergeEndIndex].end;
            // Found the end: this locus is far enough from the current merged locus
            if (start - mergedEnd > mergeDistance) {
              break;
              // else this record should be merged into the current locus
            } else if (end > mergedEnd) {
              // Update the end of the merged locus if necessary
              mergedEnd = end;
            }
            mergeEndIndex++;
          }

          // Push a new merged locus
          merged.push({
            locus: { chrName, mergedStart, mergedEnd },
            sources: objectsForChromosome.slice(mergeStartIndex, mergeEndIndex),
          });
          mergeStartIndex = mergeEndIndex;
        }
      }
      let queryLocusMerges = [...merged];

      // for (let item of queryLocusMerges) {
      //   console.log(item, item.locus.mergedEnd - item.locus.mergedStart);
      // }

      //step 6
      // Sort so we place the largest query loci first in the next ste
      queryLocusMerges = queryLocusMerges.sort(
        (a, b) =>
          b.locus.mergedEnd -
          b.locus.mergedStart -
          (a.locus.mergedEnd - a.locus.mergedStart)
      );

      //step 7
      const intervalPlacer = new IntervalPlacer(MARGIN);

      for (const merge of queryLocusMerges) {
        const mergeLocus = merge.locus;

        const placementsInMerge = merge.sources; // Placements that made the merged locus
        const mergeDrawWidth =
          (mergeLocus.mergedEnd - mergeLocus.mergedStart) / bpToPx!;
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
        const mergeTargetXSpan = { targetXStart, targetEnd };

        const preferredStart = drawCenter - halfDrawWidth;
        const preferredEnd = drawCenter + halfDrawWidth;
        // Place it so it doesn't overlap other segments
        console.log(preferredStart, preferredEnd, "wtf");
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
          isReverse
        );
        for (let i = 0; i < queryLoci.length; i++) {
          placementsInMerge[i].queryXSpan = lociXSpans[i];
        }

        drawData.push({
          queryFeature: { name: undefined, mergeLocus, plotStrand },
          targetXSpan: mergeTargetXSpan,
          queryXSpan: mergeXSpan,
          segments: placementsInMerge,
        });
      }
      let svgElements = drawData.map((placement) =>
        renderRoughAlignment(placement, false, 80)
      );

      if (trackData2!.side === "right") {
        setRightTrack([...svgElements]);
      } else {
        setLeftTrack([...svgElements]);
      }
      svgElements;
    }
  }
  function calculatePrimaryVis(
    allGaps: Array<any>,
    oldVisData: ViewExpansion
  ): ViewExpansion {
    // Calculate primary visData that have all the primary gaps from different alignemnts insertions.
    const { visRegion, viewWindow, viewWindowRegion } = oldVisData;
    const oldNavContext = visRegion.getNavigationContext();
    const navContextBuilder = new NavContextBuilder(oldNavContext);
    navContextBuilder.setGaps(allGaps);
    const newNavContext = navContextBuilder.build();
    // Calculate new DisplayedRegionModel and LinearDrawingModel from the new nav context

    const newVisRegion = convertOldVisRegion(visRegion);
    const newViewWindowRegion = convertOldVisRegion(viewWindowRegion);
    const newPixelsPerBase =
      viewWindow.getLength() / newViewWindowRegion.getWidth();
    const newVisWidth = newVisRegion.getWidth() * newPixelsPerBase;
    const newDrawModel = new LinearDrawingModel(newVisRegion, newVisWidth);
    const newViewWindow = newDrawModel.baseSpanToXSpan(
      newViewWindowRegion.getContextCoordinates()
    );
    console.log({
      windowWith: viewWindow.getLength(),
      newthreeWidth: newVisWidth,
      oldBpWidth: visRegion.getWidth(),
      newBpWidth: newVisRegion.getWidth(),
      oldBpViewWidth: viewWindowRegion.getWidth(),
      newBpViewWidth: newViewWindowRegion.getWidth(),
      viewWindow: newViewWindow,
    });
    return {
      visRegion: newVisRegion,
      visWidth: newVisWidth,
      viewWindowRegion: newViewWindowRegion,
      viewWindow: newViewWindow,
    };

    function convertOldVisRegion(visRegion: DisplayedRegionModel) {
      const [contextStart, contextEnd] = visRegion.getContextCoordinates();
      return new DisplayedRegionModel(
        newNavContext,
        navContextBuilder.convertOldCoordinates(contextStart),
        navContextBuilder.convertOldCoordinates(contextEnd)
      );
    }
  }
  //fineMode FUNCTIONS ______s____________________________________________________________________________________________________________________________________________________

  function alignFine(
    query: string,
    records: AlignmentRecord[],
    oldVisData: ViewExpansion,
    visData: ViewExpansion,
    allGaps: Array<any>
  ) {
    // There's a lot of steps, so bear with me...
    const { visRegion, visWidth } = visData;
    // drawModel is derived from visData:
    const drawModel = new LinearDrawingModel(visRegion, visWidth);
    // const minGapLength = drawModel.xWidthToBases(MIN_GAP_DRAW_WIDTH);
    const minGapLength = MIN_GAP_LENGTH;

    // Calculate context coordinates of the records and gaps within.
    // calculate navContext and placements using oldVisData so small gaps won't seperate different features:
    const navContext = oldVisData.visRegion.getNavigationContext();
    const placements = computeContextLocations2(records, oldVisData);
    // const primaryGaps = this._getPrimaryGenomeGaps(placements, minGapLength);
    const navContextBuilder = new NavContextBuilder(navContext);
    navContextBuilder.setGaps(allGaps); // Use allGaps instead of primaryGaps here so gaps between placements were also included here.
    // With the draw model, we can set x spans for each placed alignment
    // Adjust contextSpan and xSpan in placements using visData:
    for (const placement of placements) {
      const oldContextSpan = placement.contextSpan;
      const visiblePart = placement.visiblePart;
      const newContextSpan = new OpenInterval(
        navContextBuilder.convertOldCoordinates(oldContextSpan.start),
        navContextBuilder.convertOldCoordinates(oldContextSpan.end)
      );

      const xSpan = drawModel.baseSpanToXSpan(newContextSpan);
      const targetSeq = visiblePart.getTargetSequence();
      const querySeq = visiblePart.getQuerySequence();

      console.log({
        oldVisData,
        xSpan,
        visData,
        oldContextSpan,
        newContextSpan,
        newDrawModel: drawModel.baseSpanToXSpan(newContextSpan),
      });
      console.log(
        "______________________________________________________________________________________________________________________________________________________________________________________________________________________________"
      );
      placement.contextSpan = newContextSpan;
      placement.targetXSpan = xSpan;
      placement.queryXSpan = xSpan;
      placement.targetSegments = placeSequenceSegments(
        targetSeq,
        minGapLength,
        xSpan.start,
        drawModel
      );
      placement.querySegments = placeSequenceSegments(
        querySeq,
        minGapLength,
        xSpan.start,
        drawModel
      );
    }
    const drawGapTexts: Array<any> = [];
    const targetIntervalPlacer = new IntervalPlacer(MARGIN);
    const queryIntervalPlacer = new IntervalPlacer(MARGIN);
    for (let i = 1; i < placements.length; i++) {
      const lastPlacement = placements[i - 1];
      const placement = placements[i];
      const lastXEnd = lastPlacement.targetXSpan.end;
      const xStart = placement.targetXSpan.start;
      const lastTargetChr = lastPlacement.record.locus.chr;
      const lastTargetEnd = lastPlacement.record.locus.end;
      const lastQueryChr = lastPlacement.record.queryLocus.chr;
      const lastStrand = lastPlacement.record.queryStrand;
      const lastQueryEnd =
        lastStrand === "+"
          ? lastPlacement.record.queryLocus.end
          : lastPlacement.record.queryLocus.start;
      const targetChr = placement.record.locus.chr;
      const targetStart = placement.record.locus.start;
      const queryChr = placement.record.queryLocus.chr;
      const queryStrand = placement.record.queryStrand;
      const queryStart =
        queryStrand === "+"
          ? placement.record.queryLocus.start
          : placement.record.queryLocus.end;
      let placementQueryGap: string;
      if (lastQueryChr === queryChr) {
        if (lastStrand === "+" && queryStrand === "+") {
          placementQueryGap = queryStart >= lastQueryEnd ? "" : "overlap ";
          placementQueryGap += niceBpCount(Math.abs(queryStart - lastQueryEnd));
        } else if (lastStrand === "-" && queryStrand === "-") {
          placementQueryGap = lastQueryEnd >= queryStart ? "" : "overlap ";
          placementQueryGap += niceBpCount(Math.abs(lastQueryEnd - queryStart));
        } else {
          placementQueryGap = "reverse direction";
        }
      } else {
        placementQueryGap = "not connected";
      }
      const placementGapX = (lastXEnd + xStart) / 2;
      const queryPlacementGapX =
        (lastPlacement.queryXSpan!.end + placement.queryXSpan!.start) / 2;
      const placementTargetGap =
        lastTargetChr === targetChr
          ? niceBpCount(targetStart - lastTargetEnd)
          : "not connected";

      const targetTextWidth = placementTargetGap.length * 5; // use font size 10...
      const halfTargetTextWidth = 0.5 * targetTextWidth;
      const preferredTargetStart = placementGapX - halfTargetTextWidth;
      const preferredTargetEnd = placementGapX + halfTargetTextWidth;
      // shift text position only if the width of text is bigger than the gap size:
      const shiftTargetTxt =
        preferredTargetStart <= lastXEnd || preferredTargetEnd >= xStart;
      if (lastXEnd < xStart) {
        console.log(lastXEnd, xStart, preferredTargetStart, preferredTargetEnd);
      }
      const targetGapTextXSpan = shiftTargetTxt
        ? targetIntervalPlacer.place(
            new OpenInterval(preferredTargetStart, preferredTargetEnd)
          )
        : new OpenInterval(preferredTargetStart, preferredTargetEnd);
      const targetGapXSpan = new OpenInterval(lastXEnd, xStart);

      const queryTextWidth = placementQueryGap.length * 5; // use font size 10...
      const halfQueryTextWidth = 0.5 * queryTextWidth;
      const preferredQueryStart = queryPlacementGapX - halfQueryTextWidth;
      const preferredQueryEnd = queryPlacementGapX + halfQueryTextWidth;
      // shift text position only if the width of text is bigger than the gap size:
      const shiftQueryTxt =
        preferredQueryStart <= lastPlacement.queryXSpan!.end ||
        preferredQueryEnd >= placement.queryXSpan!.start;
      const queryGapTextXSpan = shiftQueryTxt
        ? queryIntervalPlacer.place(
            new OpenInterval(preferredQueryStart, preferredQueryEnd)
          )
        : new OpenInterval(preferredQueryStart, preferredQueryEnd);
      const queryGapXSpan = new OpenInterval(
        lastPlacement.queryXSpan!.end,
        placement.queryXSpan!.start
      );
      drawGapTexts.push({
        targetGapText: placementTargetGap,
        targetXSpan: targetGapXSpan,
        targetTextXSpan: targetGapTextXSpan,
        queryGapText: placementQueryGap,
        queryXSpan: queryGapXSpan,
        queryTextXSpan: queryGapTextXSpan,
        shiftTarget: shiftTargetTxt,
        shiftQuery: shiftQueryTxt,
      });
    }
    // Finally, using the x coordinates, construct the query nav context

    return {
      isFineMode: true,
      primaryVisData: visData,
      drawData: placements,
      drawGapText: drawGapTexts,
      primaryGenome: trackData2!.genomeName,
      queryGenome: query,
      basesPerPixel: drawModel.xWidthToBases(1),
      navContextBuilder,
    };
  }
  function placeSequenceSegments(
    sequence: string,
    minGapLength: number,
    startX: number,
    drawModel: LinearDrawingModel
  ) {
    const segments = segmentSequence(sequence, minGapLength);
    segments.sort((a, b) => a.index - b.index);
    let x = startX;
    for (const segment of segments) {
      const bases = segment.isGap
        ? segment.length
        : countBases(sequence.substr(segment.index, segment.length));
      const xSpanLength = drawModel.basesToXWidth(bases);
      (segment as PlacedSequenceSegment).xSpan = new OpenInterval(
        x,
        x + xSpanLength
      );
      x += xSpanLength;
    }
    return segments as PlacedSequenceSegment[];
  }
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
  function countBases(sequence: string): number {
    return _.sumBy(sequence, (char) => (char === "-" ? 0 : 1));
  }
  function setGaps(gaps: Array<any>) {
    gaps.sort((a, b) => a.contextBase - b.contextBase);
    let cumulativeGapBases: Array<any> = [];
    let sum = 0;
    for (const gap of gaps) {
      cumulativeGapBases.push(sum);
      sum += gap.length;
    }
    cumulativeGapBases.push(sum);
    return cumulativeGapBases;
  }

  function convertOldVisRegion(
    gap: any,
    cumulativeGapBases: any,
    bpLength: number
  ) {
    return {
      start: convertOldCoordinates(start - bpLength, gap, cumulativeGapBases),
      end: convertOldCoordinates(end + bpLength, gap, cumulativeGapBases),
    };
  }
  function convertOldCoordinates(
    base: number,
    gaps: any,
    cumulativeGapBases: any
  ): number {
    const index = _.sortedIndexBy(gaps, { contextBase: base }, "contextBase");

    const gapBases = cumulativeGapBases[index] || 0; // Out-of-bounds index can happen if there are no gaps.

    return base + gapBases;
  }
  function build(gaps: Array<any>) {
    const baseFeatures = featureArray.getFeatures();

    const indexForFeature = new Map();
    for (let i = 0; i < baseFeatures!.length; i++) {
      indexForFeature.set(baseFeatures![i], i);
    }

    const resultFeatures: Array<any> = [];
    let prevSplitIndex = -1;
    let prevSplitBase = 0;
    let featureToSplit;
    let indexToSplit;
    let splitBase;
    let testarray: Array<any> = [];
    for (const gap of gaps) {
      let currplacement = gap.placement[0];
      for (const feat of baseFeatures) {
        if (feat.name === currplacement.record.locus.chr) {
          const featureCoordinate = new FeatureSegment(
            feat,
            gap.contextBase,
            gap.contextBase + 1
          );
          featureToSplit = featureCoordinate.feature;
          indexToSplit = indexForFeature.get(featureToSplit);
          splitBase = featureCoordinate.relativeStart;

          break;
        }
      }

      resultFeatures.push(
        ...baseFeatures.slice(prevSplitIndex + 1, indexToSplit)
      ); // Might push nothing
      if (indexToSplit === prevSplitIndex && prevSplitBase > 0) {
        // We're splitting the same feature again.  Due to sorting, this split lies within the last feature of
        // resultFeatures.  Remove it.

        resultFeatures.pop();
      }

      // const featureCoordinate = new FeatureSegment();
      // const featureToSplit = featureCoordinate.feature;
      // const indexToSplit = indexForFeature.get(featureToSplit);
      // const splitBase = featureCoordinate.relativeStart;
      // resultFeatures.push(
      //   ...baseFeatures.slice(prevSplitIndex + 1, indexToSplit)
      // ); // Might push nothing
      // if (indexToSplit === prevSplitIndex && prevSplitBase > 0) {
      //   // We're splitting the same feature again.  Due to sorting, this split lies within the last feature of
      //   // resultFeatures.  Remove it.
      //   resultFeatures.pop();
      // }
      // prevSplitBase = prevSplitBase > splitBase ? 0 : prevSplitBase;

      const leftLocus = new FeatureSegment(
        featureToSplit,
        prevSplitBase,
        splitBase
      ).getLocus();

      const rightLocus = new FeatureSegment(
        featureToSplit,
        splitBase
      ).getLocus();

      if (leftLocus.getLength() > 0) {
        resultFeatures.push({
          name: featureToSplit.name,
          locus: leftLocus,
          strand: "",
        });
      }

      let tmpCountGap = makeGap(gap.length, `${niceBpCount(gap.length)} gap`);
      testarray.push(tmpCountGap);

      resultFeatures.push(tmpCountGap);
      if (rightLocus.getLength() > 0) {
        resultFeatures.push({
          name: featureToSplit.name,
          locus: rightLocus,
          strand: "",
        });
      }
      prevSplitIndex = indexToSplit;
      prevSplitBase = splitBase;
    }

    resultFeatures.push(...baseFeatures.slice(prevSplitIndex + 1));
    return { name: trackData2!.genomeName, resultFeatures };
  }

  function makeGap(length: number, name = "Gap") {
    let tmpChrInt = new ChromosomeInterval("", 0, Math.round(length));

    return { name, chromosomeInterval: tmpChrInt };
  }
  function niceBpCount(bases: number, useMinus = false) {
    const rounded = bases >= 1000 ? Math.floor(bases) : Math.round(bases);
    if (rounded >= 750000) {
      return `${(rounded / 1000000).toFixed(1)} Mb`;
    } else if (rounded >= 10000) {
      return `${(rounded / 1000).toFixed(1)} Kb`;
    } else if (rounded > 0) {
      return `${rounded} bp`;
    } else {
      if (useMinus) {
        return "<1 bp";
      } else {
        return "0 bp";
      }
    }
  }
  function refineRecordsArray(recordsArray: RecordsObj[]) {
    const minGapLength = MIN_GAP_LENGTH;

    // use a new array of objects to manipulate later, and
    // Combine all gaps from all alignments into a new array:
    const refineRecords: Array<any> = [];
    const allGapsObj = {};
    const placementsArr: Array<any> = [];
    for (const recordsObj of recordsArray) {
      // Calculate context coordinates of the records and gaps within.
      const placements = computeContextLocations2(recordsObj.records, visData!);
      const primaryGaps = getPrimaryGenomeGaps(placements, minGapLength);
      const primaryGapsObj = primaryGaps.reduce((resultObj, gap) => {
        return { ...resultObj, ...{ [gap.contextBase]: gap.length } };
      }, {});
      refineRecords.push({
        recordsObj: recordsObj,
        placements: placements,
        primaryGapsObj: primaryGapsObj,
      });
      for (const contextBase of Object.keys(primaryGapsObj)) {
        if (contextBase in allGapsObj) {
          allGapsObj[contextBase] = Math.max(
            allGapsObj[contextBase],
            primaryGapsObj[contextBase]
          );
        } else {
          allGapsObj[contextBase] = primaryGapsObj[contextBase];
        }
      }
      placementsArr.push(placements);
    }

    // Build a new primary navigation context using the gaps
    const allPrimaryGaps: Array<any> = [];
    for (const contextBase of Object.keys(allGapsObj)) {
      allPrimaryGaps.push({
        contextBase: Number(contextBase),
        length: allGapsObj[contextBase],
      });
    }
    allPrimaryGaps.sort((a, b) => a.contextBase - b.contextBase); // ascending.

    // For each records, insertion gaps to sequences if for contextBase only in allGapsSet:
    if (refineRecords.length > 1) {
      // skip this part for pairwise alignment.
      for (const records of refineRecords) {
        const insertionContexts: Array<any> = [];
        for (const contextBase of Object.keys(allGapsObj)) {
          if (contextBase in records.primaryGapsObj) {
            const lengthDiff =
              allGapsObj[contextBase] - records.primaryGapsObj[contextBase];
            if (lengthDiff > 0) {
              insertionContexts.push({
                contextBase: Number(contextBase),
                length: lengthDiff,
              });
            }
          } else {
            insertionContexts.push({
              contextBase: Number(contextBase),
              length: allGapsObj[contextBase],
            });
          }
        }
        insertionContexts.sort((a, b) => b.contextBase - a.contextBase); // sort descending...
        for (const insertPosition of insertionContexts) {
          const gapString = "-".repeat(insertPosition.length);
          const insertBase = insertPosition.contextBase;
          const thePlacement = records.placements.filter(
            (placement) =>
              placement.contextSpan.start < insertBase &&
              placement.contextSpan.end > insertBase
          )[0]; // There could only be 0 or 1 placement pass the filter.
          if (thePlacement) {
            const visibleTargetSeq =
              thePlacement.visiblePart.getTargetSequence();
            const insertIndex = indexLookup(
              visibleTargetSeq,
              insertBase - thePlacement.contextSpan.start
            );
            const relativePosition =
              thePlacement.visiblePart.sequenceInterval.start + insertIndex;
            const targetSeq = thePlacement.record.targetSeq;
            const querySeq = thePlacement.record.querySeq;
            thePlacement.record.targetSeq =
              targetSeq.slice(0, relativePosition) +
              gapString +
              targetSeq.slice(relativePosition);
            thePlacement.record.querySeq =
              querySeq.slice(0, relativePosition) +
              gapString +
              querySeq.slice(relativePosition);
          }
        }

        records.recordsObj.records = records.placements.map(
          (placement) => placement.record
        );
      }
    }
    const newRecords = refineRecords.map((final) => final.recordsObj);
    return {
      newRecordsArray: newRecords,
      allGaps: allPrimaryGaps,
      placementsArr,
    };

    function indexLookup(sequence: string, base: number): number {
      let index = 0;
      for (const char of sequence) {
        index++;
        if (char !== "-") {
          base--;
        }
        if (base === 0) {
          break;
        }
      }
      return index;
    }
  }
  function getTargetSequence(visiblePart: any) {
    const alignIter = new AlignmentIterator(
      visiblePart.feature[3].genomealign.targetseq
    );
    // +1 because AlignmentIterator starts on string index -1.
    const substringStart = alignIter.advanceN(visiblePart.relativeStart);
    const substringEnd = alignIter.advanceN(
      visiblePart.relativeEnd - visiblePart.relativeStart
    );

    return visiblePart.feature[3].genomealign.targetseq.substring(
      substringStart,
      substringEnd
    );
  }

  function getQuerySequence(visiblePart: any) {
    const alignIter = new AlignmentIterator(
      visiblePart.feature[3].genomealign.targetseq
    );
    // +1 because AlignmentIterator starts on string index -1. old comment//// new comment doing this made my code misalsign so we changed it to start at 0 index and not substract -1
    const substringStart = alignIter.advanceN(visiblePart.relativeStart);
    const substringEnd = alignIter.advanceN(
      visiblePart.relativeEnd - visiblePart.relativeStart
    );

    return visiblePart.feature[3].genomealign.queryseq.substring(
      substringStart,
      substringEnd
    );
  }
  function getPrimaryGenomeGaps(
    placements: PlacedAlignment[],
    minGapLength: number
  ) {
    const gaps: Array<any> = [];
    for (const placement of placements) {
      const { visiblePart, contextSpan } = placement;
      const segments = segmentSequence(
        visiblePart.getTargetSequence(),
        minGapLength,
        true
      );
      const baseLookup = makeBaseNumberLookup(
        visiblePart.getTargetSequence(),
        contextSpan.start
      );
      for (const segment of segments) {
        gaps.push({
          contextBase: baseLookup[segment.index],
          length: segment.length,
        });
      }
    }
    return gaps;
  }
  function segmentSequence(
    sequence: string,
    minGapLength: number,
    onlyGaps = false
  ) {
    const results: Array<any> = [];
    const gapRegex = new RegExp("-" + "+", "g"); // One or more '-' chars
    let match;
    while ((match = gapRegex.exec(sequence)) !== null) {
      // Find gaps with the regex
      pushSegment(true, match.index, match[0].length, minGapLength);
    }
    if (onlyGaps) {
      return results;
    }

    // Derive non-gaps from the gaps
    let currIndex = 0;
    const gaps = results.slice();
    for (const gap of gaps) {
      pushSegment(false, currIndex, gap.index - currIndex);
      currIndex = gap.index + gap.length;
    }
    // Final segment between the last gap and the end of the sequence
    pushSegment(false, currIndex, sequence.length - currIndex);

    return results;

    function pushSegment(
      isGap: boolean,
      index: number,
      length: number,
      minLength: number = 0
    ) {
      if (length > minLength) {
        results.push({ isGap, index, length });
      }
    }
  }
  function makeBaseNumberLookup(
    sequence: string,
    baseAtStart: number,
    isReverse = false
  ): number[] {
    const diff = isReverse ? -1 : 1;

    const bases: Array<any> = [];
    let currentBase = baseAtStart;
    for (const char of sequence) {
      bases.push(currentBase);
      if (char !== "-") {
        currentBase += diff;
      }
    }
    return bases;
  }

  //ROUGHMODEFUNCTIONS __________________________________________________________________________________________________________________________________________________________
  //ROUGHMODEFUNCTIONS __________________________________________________________________________________________________________________________________________________________
  //ROUGHMODEFUNCTIONS __________________________________________________________________________________________________________________________________________________________
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
    const { queryFeature, queryXSpan, segments, targetXSpan } = placement;
    const queryRectTopY = roughHeight - RECT_HEIGHT;
    const targetGenomeRect = (
      <rect
        x={targetXSpan.targetXStart}
        y={0}
        width={targetXSpan.targetEnd - targetXSpan.targetXStart}
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

    let label;
    if (queryXSpan.end - queryXSpan.start) {
      label = (
        <text
          x={windowWidth / 2}
          y={queryRectTopY + 0.5 * RECT_HEIGHT}
          dominantBaseline="middle"
          textAnchor="middle"
          fill="white"
          fontSize={12}
        >
          {queryFeature.mergeLocus.chrName}:{" "}
          {queryFeature.mergeLocus.mergedStart}-
          {queryFeature.mergeLocus.mergedEnd}
        </text>
      );
    }

    const curvePaths = segments.map((segment, i) => {
      const x0 = Math.floor(segment.targetXSpan.start);
      const y0 = RECT_HEIGHT;
      const x1 =
        (!plotReverse && segment.record.queryStrand === "-") ||
        (plotReverse && segment.record.queryStrand === "+")
          ? Math.ceil(segment.queryXSpan.xEnd)
          : Math.floor(segment.queryXSpan.xStart);
      const y1 = queryRectTopY;
      const x2 =
        (!plotReverse && segment.record.queryStrand === "-") ||
        (plotReverse && segment.record.queryStrand === "+")
          ? Math.floor(segment.queryXSpan.xStart)
          : Math.ceil(segment.queryXSpan.xEnd);
      // const y2 = queryRectTopY;

      const x3 = segment.targetXSpan.end;
      const targetGenome = "hg38";
      const queryGenome = "mm10";
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
      <React.Fragment key={queryFeature.mergeLocus.toString()}>
        {targetGenomeRect}
        {queryGenomeRect}
        {label}
        {ensureMaxListLength(curvePaths, MAX_POLYGONS)}
      </React.Fragment>
    );
  }
  function computeContextLocations2(
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
  function getOverlap(other, placement) {
    const intersectionStart = Math.max(placement.start, other.start);
    const intersectionEnd = Math.min(placement.end, other.end);
    if (intersectionStart < intersectionEnd) {
      return { intersectionStart, intersectionEnd };
    } else {
      return null;
    }
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
    parentLocus: { [key: string]: any },
    internalLoci: Array<{ [key: string]: any }>,
    parentXSpan: { [key: string]: any },
    drawReverse: boolean
  ) {
    const xSpans: Array<any> = [];

    if (drawReverse) {
      // place segments from right to left if drawReverse
      for (const locus of internalLoci) {
        const distanceFromParent = locus.start - parentLocus.mergedStart;
        const xDistanceFromParent = distanceFromParent / bpToPx!;

        const locusXEnd = parentXSpan.end - xDistanceFromParent;
        const xWidth = (locus.end - locus.start) / bpToPx!;
        const xEnd = locusXEnd < parentXSpan.end ? locusXEnd : parentXSpan.end;
        const xStart =
          locusXEnd - xWidth > parentXSpan.start
            ? locusXEnd - xWidth
            : parentXSpan.start;
        xSpans.push({ xStart, xEnd });
      }
    } else {
      for (const locus of internalLoci) {
        const distanceFromParent = locus.start - parentLocus.mergedStart;
        const xDistanceFromParent = distanceFromParent / bpToPx!;
        const locusXStart = parentXSpan.start + xDistanceFromParent;
        const xWidth = (locus.end - locus.start) / bpToPx!;
        const xStart =
          locusXStart > parentXSpan.start ? locusXStart : parentXSpan.start;
        const xEnd =
          locusXStart + xWidth < parentXSpan.end
            ? locusXStart + xWidth
            : parentXSpan.end;
        xSpans.push({ xStart, xEnd });
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
          right: side === "left" ? `${view.current!}px` : "",
          left:
            side === "right"
              ? `${-view.current! - newTrackWidth.current!.viewWindow.start}px`
              : "",
        }}
      >
        {side === "right"
          ? rightTrackGenes.map(
              (item, index) =>
                // index <= rightTrackGenes.length - 1 ?

                item

              //  : (
              //   <div style={{ display: 'flex', width: windowWidth }}>
              //     ....LOADING
              //   </div>
              // )
            )
          : leftTrackGenes.map(
              (item, index) =>
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
