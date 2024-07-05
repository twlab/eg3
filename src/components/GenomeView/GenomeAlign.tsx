import React, { createRef, memo } from "react";
import { useEffect, useRef, useState } from "react";
// import worker_script from '../../Worker/worker';
import JSON5 from "json5";
import _ from "lodash";
import ChromosomeInterval from "../../models/ChromosomeInterval";
import Feature from "../../models/Feature";
import { FeatureSegment } from "../../models/FeatureSegment";
import NavigationContext from "../../models/NavigationContext";
import OpenInterval from "../../models/OpenInterval";
import { countBases, AlignmentIterator } from "./AlignmentStringUtils";
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

interface BedTrackProps {
  bpRegionSize?: number;
  bpToPx?: number;
  trackData?: { [key: string]: any }; // Replace with the actual type
  side?: string;
  windowWidth?: number;
  totalSize?: number;
  trackData2?: { [key: string]: any }; // Replace with the actual type
  dragXDist?: number;
}

// multiAlignCal defaults
const MAX_FINE_MODE_BASES_PER_PIXEL = 10;
const MARGIN = 5;
// const MIN_GAP_DRAW_WIDTH = 3;
const MIN_GAP_LENGTH = 0.99;
const MERGE_PIXEL_DISTANCE = 200;
const MIN_MERGE_DRAW_WIDTH = 5;

const GenomeAlign: React.FC<BedTrackProps> = memo(function GenomeAlign({
  bpRegionSize,
  bpToPx,
  trackData,
  side,
  windowWidth = 0,
  totalSize = 0,
  trackData2,
  dragXDist,
}) {
  let start, end;

  let result;
  if (Object.keys(trackData2!).length > 0) {
    [start, end] = trackData2!.location.split(":");

    result = trackData2!.genomealignResult;
  }

  start = Number(start);
  end = Number(end);
  //useRef to store data between states without re render the component
  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates

  const [rightTrackGenes, setRightTrack] = useState<Array<any>>([]);

  const [leftTrackGenes, setLeftTrack] = useState<Array<any>>([]);
  const view = useRef(0);

  const overflowStrand2 = useRef<{ [key: string]: any }>({});

  // We will do MultiAlignmentViewCalculator here for rough mode

  function fetchGenomeData() {
    let startPos;
    startPos = start;
    if (result === undefined) {
      return;
    }
    // This is for rough mode for compare genome alignment track
    //step 1 AlignSourceWorker
    for (const record of result) {
      let data = JSON5.parse("{" + record[3] + "}");
      // if (options.isRoughMode) {

      // }
      record[3] = data;
    }

    let drawData: Array<any> = [];
    //check if 1 pixel >= 10bp
    //FINEMODE __________________________________________________________________________________________________________________________________________________________

    //step  1 check bp and get the gaps
    if (bpToPx! <= 10) {
      // refineRecordArray - find all the gaps for the data
      //To-Do: Fixed placements data, made visiblepart equivalent to eg2 data
      // figured out how to get those data inside of _computeContextLocations
      const { newRecordsArray, allGaps } = refineRecordsArray(result);
      console.log(allGaps);

      // calcualtePrimaryVis
    }

    //step 2 use the gap data after refinedRecordArray to create a new visData
    // const primaryVisData = calculatePrimaryVis(allGaps);
    //ROUGHMODE __________________________________________________________________________________________________________________________________________________________
    else {
      //step 2 ._computeContextLocations ->   placeFeature(): get x base interval converted to pixels
      // creating the alignmentRecords
      let placedRecords = computeContextLocations(result);
      console.log(placedRecords);
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
        console.log(mergeTargetXSpan);
        const preferredStart = drawCenter - halfDrawWidth;
        const preferredEnd = drawCenter + halfDrawWidth;
        // Place it so it doesn't overlap other segments

        const mergeXSpan = intervalPlacer.place({
          start: preferredStart,
          end: preferredEnd,
        });

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
  //fineMode FUNCTIONS __________________________________________________________________________________________________________________________________________________________
  // function calculatePrimaryVis(allGaps: Array<any>) {
  //   // Calculate primary visData that have all the primary gaps from different alignemnts insertions.
  //   const { visRegion, viewWindow, viewWindowRegion } = visData;
  //   const oldNavContext = visRegion.getNavigationContext();
  //   const navContextBuilder = new NavContextBuilder(oldNavContext);
  //   navContextBuilder.setGaps(allGaps);
  //   const newNavContext = navContextBuilder.build();
  //   // Calculate new DisplayedRegionModel and LinearDrawingModel from the new nav context
  //   const newVisRegion = convertOldVisRegion(visRegion);
  //   const newViewWindowRegion = convertOldVisRegion(viewWindowRegion);
  //   const newPixelsPerBase =
  //     viewWindow.getLength() / newViewWindowRegion.getWidth();
  //   const newVisWidth = newVisRegion.getWidth() * newPixelsPerBase;
  //   const newDrawModel = new LinearDrawingModel(newVisRegion, newVisWidth);
  //   const newViewWindow = newDrawModel.baseSpanToXSpan(
  //     newViewWindowRegion.getContextCoordinates()
  //   );

  //   return {
  //     visRegion: newVisRegion,
  //     visWidth: newVisWidth,
  //     viewWindowRegion: newViewWindowRegion,
  //     viewWindow: newViewWindow,
  //   };

  //   function convertOldVisRegion(visRegion: DisplayedRegionModel) {
  //     const [contextStart, contextEnd] = visRegion.getContextCoordinates();
  //     return new DisplayedRegionModel(
  //       newNavContext,
  //       navContextBuilder.convertOldCoordinates(contextStart),
  //       navContextBuilder.convertOldCoordinates(contextEnd)
  //     );
  //   }
  // }
  function refineRecordsArray(recordsArray: Array<any>) {
    const minGapLength = MIN_GAP_LENGTH;

    // use a new array of objects to manipulate later, and
    // Combine all gaps from all alignments into a new array:
    const refineRecords: Array<any> = [];
    const allGapsObj = {};

    const placements: Array<any> = computeContextLocations(recordsArray);
    console.log(placements);
    const primaryGaps: Array<any> = getPrimaryGenomeGaps(
      placements,
      minGapLength
    );
    const primaryGapsObj = primaryGaps.reduce((resultObj, gap) => {
      return { ...resultObj, ...{ [gap.contextBase]: gap.length } };
    }, {});
    refineRecords.push({
      recordsObj: recordsArray,
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
              placement.record.locus.start < insertBase &&
              placement.record.locus.end > insertBase
          )[0]; // There could only be 0 or 1 placement pass the filter.
          if (thePlacement) {
            const visibleTargetSeq = thePlacement.record.targetSeq;
            const insertIndex = indexLookup(
              visibleTargetSeq,
              insertBase - thePlacement.record.locus.start
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
    console.log(allPrimaryGaps);
    return { newRecordsArray: newRecords, allGaps: allPrimaryGaps };

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
    const substringStart = alignIter.advanceN(visiblePart.relativeStart + 1);
    const substringEnd = alignIter.advanceN(
      visiblePart.relativeEnd - visiblePart.relativeStart
    );

    return visiblePart.feature[3].genomealign.targetseq.substring(
      substringStart,
      substringEnd
    );
  }
  function getPrimaryGenomeGaps(placements: Array<any>, minGapLength: number) {
    const gaps: Array<any> = [];

    for (const placement of placements) {
      const { visiblePart, contextSpan } = placement;

      const segments = segmentSequence(
        getTargetSequence(visiblePart),
        minGapLength,
        true
      );
      const baseLookup = makeBaseNumberLookup(
        getTargetSequence(visiblePart),
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
    console.log(placement);
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
    console.log(segments);
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

  function computeContextLocations(features) {
    const placements: Array<any> = [];
    console.log(features);
    for (const feature of features) {
      let contextXSpan = getOverlap(
        { start, end },
        { start: feature.start, end: feature.end }
      );
      console.log(contextXSpan);
      const startX = (contextXSpan!.intersectionStart - start) / bpToPx!;
      const endX = (contextXSpan!.intersectionEnd - start) / bpToPx!;

      const targetXSpan = { start: startX, end: endX };

      // has option to use center otherwise xspan is start and end
      const centerX = Math.round((startX + endX) / 2);
      // locatePlacement

      // we have to fit the primary genome coordinates to the window screen
      // so we need to also make the same adjustments in bp also to the secondary genome

      // First, get the genomic coordinates of the context location, i.e. the "context locus"
      const contextFeatureCoord = contextXSpan!.intersectionStart;
      const placedBase = start;

      // We have a base number, but it could be the end or the beginning of the context locus.
      let contextLocusStart;

      contextLocusStart = placedBase;

      // relativeStart and relativeEnd are the numbers that we need to cut our primary
      // genome coordinates to fit in side the window view.
      // in relativeStart if primaryGenome Start is less than window view bp region start then relativeStart
      // is the different between the two numbers. and we add relativeStart to the secondary genome so
      // the secondarying genome start position will also fit inside the view window
      // basically relativeStart is how much bp we need to add to secondarying genome start to fit
      // inside window view bp region

      // for relativeEnd is the distance between primary genome start and end
      // since we need to match the prime movement. we add the relativeStart to secondgenome
      // to fit into bp region view and then add the diff between prime start and end to
      // second genome start

      // we use the starting
      const distFromFeatureLocus = contextLocusStart - feature.start;
      const relativeStart = Math.max(0, distFromFeatureLocus);
      // for relative end we use the contextXspan because feature.end could be outside the end view
      let relativeEnd =
        relativeStart +
        contextXSpan!.intersectionEnd -
        contextXSpan!.intersectionStart;

      let secondaryGenomeStart = feature[3].genomealign.start + relativeStart;
      let secondaryGenomeEnd = Math.min(
        feature[3].genomealign.start + relativeEnd,
        feature[3].genomealign.stop
      );
      // the visible part of the secondary genome on screen
      const visiblePart = {
        feature: feature,
        chr: feature[3].genomealign.chr,
        start: secondaryGenomeStart,
        end: secondaryGenomeEnd,
        relativeStart,
        relativeEnd,
      };

      let tmpRecord = {
        locus: { chr: feature.chr, start: feature.start, end: feature.end },
        queryLocus: {
          chr: feature[3].genomealign.chr,
          start: feature[3].genomealign.start,
          end: feature[3].genomealign.stop,
        },
        querySeq: feature[3].genomealign.queryseq,
        targetSeq: feature[3].genomealign.targetseq,
        queryStrand: feature[3].genomealign.strand,
      };
      placements.push({
        record: tmpRecord,
        targetXSpan,
        visiblePart,
        contextSpan: { start, end },
      });
    }

    return placements;
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
    console.log(parentXSpan);
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
    private _placements: Array<any>;

    constructor(margin = 0) {
      this.leftExtent = Infinity;
      this.rightExtent = -Infinity;
      this.margin = margin;
      this._placements = [];
    }

    place(preferredLocation: any) {
      let finalLocation = preferredLocation;
      if (
        this._placements.some(
          (placement) => getOverlap(preferredLocation, placement) != null
        )
      ) {
        const center = 0.5 * (preferredLocation.start + preferredLocation.end);
        const isInsertLeft =
          Math.abs(center - this.leftExtent) <
          Math.abs(center - this.rightExtent);
        finalLocation = isInsertLeft
          ? {
              start:
                this.leftExtent -
                (preferredLocation.end - preferredLocation.start),
              end: this.leftExtent,
            }
          : {
              start: this.rightExtent,
              end:
                this.rightExtent +
                (preferredLocation.end - preferredLocation.start),
            };
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

  // useEffect(() => {
  //   if (side === "left") {
  //     leftTrackGenes.forEach((canvasRef, index) => {
  //       if (canvasRefL[index].current) {
  //         drawCanvas(
  //           leftTrackGenes[index].polyCoord,
  //           canvasRefL[index].current
  //         );
  //       }
  //     });
  //   } else if (side === "right") {
  //     rightTrackGenes.forEach((canvasRef, index) => {
  //       if (canvasRefR[index].current) {
  //         drawCanvas(
  //           rightTrackGenes[index].polyCoord,
  //           canvasRefR[index].current
  //         );
  //       }
  //     });
  //   }
  // }, [side]);

  // useEffect(() => {
  //   if (rightTrackGenes.length > 0) {
  //     drawCanvas(
  //       rightTrackGenes[rightTrackGenes.length - 1].polyCoord,
  //       canvasRefR[canvasRefR.length - 1].current
  //     );
  //   }
  // }, [rightTrackGenes]);

  // useEffect(() => {
  //   if (leftTrackGenes.length > 0) {
  //     drawCanvas(
  //       leftTrackGenes[leftTrackGenes.length - 1].polyCoord,
  //       canvasRefL[canvasRefL.length - 1].current
  //     );
  //   }
  // }, [leftTrackGenes]);

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
        overflowX: "visible",
        overflowY: "hidden",
      }}
    >
      <svg
        width={`${windowWidth}px`}
        height={"250"}
        style={{
          overflow: "visible",

          position: "absolute",
          right: side === "left" ? `${view.current!}px` : "",
          left: side === "right" ? `${-view.current!}px` : "",
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
    </div>
  );
});
export default memo(GenomeAlign);
