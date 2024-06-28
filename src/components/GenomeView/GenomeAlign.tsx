import { scaleLinear } from "d3-scale";
import React, { createRef, memo } from "react";
import { useEffect, useRef, useState } from "react";
// import worker_script from '../../Worker/worker';
import JSON5 from "json5";
import _ from "lodash";
import { GenomeInteraction } from "./getRemoteData/GenomeInteraction";
import percentile from "percentile";
import { placements } from "@popperjs/core";

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
    console.log(trackData2!);
    result = trackData2!.genomealignResult;
  }

  start = Number(start);
  end = Number(end);
  //useRef to store data between states without re render the component
  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates

  const [rightTrackGenes, setRightTrack] = useState<Array<any>>([]);
  const [hicOption, setHicOption] = useState(1);
  const [leftTrackGenes, setLeftTrack] = useState<Array<any>>([]);
  const prevOverflowStrand = useRef<{ [key: string]: any }>({});
  const overflowStrand = useRef<{ [key: string]: any }>({});
  const [canvasRefR, setCanvasRefR] = useState<Array<any>>([]);

  const [canvasRefL, setCanvasRefL] = useState<Array<any>>([]);

  const prevOverflowStrand2 = useRef<{ [key: string]: any }>({});
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
      data.genomealign.targetseq = null;
      data.genomealign.queryseq = null;
      // }
      record[3] = data;
    }

    const newCanvasRef = createRef();
    //step 2 ._computeContextLocations ->   placeFeature(): get x base interval converted to pixels
    // creating the alignmentRecords
    let placedRecords = placeInteractions(result);

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
    console.log(positive, negative);
    const aggregateStrandsNumber = result.reduce(
      (aggregateStrand, record) =>
        aggregateStrand +
        (record[3].genomealign.strand === "-"
          ? -1 * (record[3].genomealign.stop - record[3].genomealign.start)
          : record[3].genomealign.stop - record[3].genomealign.start),
      0
    );
    console.log(aggregateStrandsNumber);
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
    console.log(groupedByChromosome);
    //iteratee(a) == chromosomeinterval
    const merged: Array<any> = [];
    for (const chrName in groupedByChromosome) {
      const objectsForChromosome = groupedByChromosome[chrName];
      objectsForChromosome.sort(
        (a, b) => a.visiblePart.start - b.visiblePart.start
      );

      const loci = objectsForChromosome.map((item, index) => item.visiblePart);

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
    const drawData: Array<any> = [];
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
      const mergeXSpan = intervalPlacer.place({ preferredStart, preferredEnd });
      console.log(preferredStart, mergeTargetXSpan, preferredEnd);
      // Put the actual secondary/query genome segments in the placed merged query locus from above

      const queryLoci = placementsInMerge.map(
        (placement) => placement.record.queryLocus
      );
      console.log(plotStrand);
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
    console.log(drawData);
  }

  function placeInteractions(features) {
    console.log(features);
    const placements: Array<any> = [];
    for (const feature of features) {
      const startX = (feature.start - start) / bpToPx!;
      const endX = (feature.end - start) / bpToPx!;

      const targetXSpan = { start: startX, end: endX };

      // has option to use center otherwise xspan is start and end
      const centerX = Math.round((startX + endX) / 2);
      const visiblePart = {
        chr: feature[3].genomealign.chr,
        start: feature[3].genomealign.start,
        end: feature[3].genomealign.stop,
      };
      const bpDiff = start - feature.start;
      const relativeStart = Math.max(0, bpDiff);
      const relativeEnd = feature.end - feature.start;
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
        relativeStart,
        relativeEnd,
      });
    }

    return placements;
  }

  function drawCanvas(polyRegionData, canvasRef) {
    if (canvasRef) {
      let context = canvasRef.getContext("2d");
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      for (let i = 0; i < polyRegionData.length; i++) {
        const points = polyRegionData[i].points;
        context.fillStyle = "#B8008A";
        context.globalAlpha = 1;

        context.beginPath();
        context.moveTo(points[0][0], points[0][1]);
        context.lineTo(points[1][0], points[1][1]);
        context.lineTo(points[2][0], points[2][1]);
        context.lineTo(points[3][0], points[3][1]);
        context.closePath();
        context.fill();
      }
    }
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

        const locusXEnd = parentXSpan.preferredEnd - xDistanceFromParent;
        const xWidth = (locus.end - locus.start) / bpToPx!;
        const xEnd =
          locusXEnd < parentXSpan.preferredEnd
            ? locusXEnd
            : parentXSpan.preferredEnd;
        const xStart =
          locusXEnd - xWidth > parentXSpan.preferredStart
            ? locusXEnd - xWidth
            : parentXSpan.preferredStart;
        xSpans.push({ xStart, xEnd });
      }
    } else {
      for (const locus of internalLoci) {
        const distanceFromParent = locus.start - parentLocus.mergedStart;
        const xDistanceFromParent = distanceFromParent / bpToPx!;
        const locusXStart = parentXSpan.preferredStart + xDistanceFromParent;
        const xWidth = (locus.end - locus.start) / bpToPx!;
        const xStart =
          locusXStart > parentXSpan.preferredStart
            ? locusXStart
            : parentXSpan.preferredStart;
        const xEnd =
          locusXStart + xWidth < parentXSpan.preferredEnd
            ? locusXStart + xWidth
            : parentXSpan.preferredEnd;
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
              start: this.leftExtent - preferredLocation.getLength(),
              end: this.leftExtent,
            }
          : {
              start: this.rightExtent,
              end: this.rightExtent + preferredLocation.getLength(),
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

  useEffect(() => {
    if (rightTrackGenes.length > 0) {
      drawCanvas(
        rightTrackGenes[rightTrackGenes.length - 1].polyCoord,
        canvasRefR[canvasRefR.length - 1].current
      );
    }
  }, [rightTrackGenes]);

  useEffect(() => {
    if (leftTrackGenes.length > 0) {
      console.log(leftTrackGenes);
      drawCanvas(
        leftTrackGenes[leftTrackGenes.length - 1].polyCoord,
        canvasRefL[canvasRefL.length - 1].current
      );
    }
  }, [leftTrackGenes]);

  useEffect(() => {
    console.log("triger left ", trackData2);
    fetchGenomeData();
    // having two prop changes here side and data will cause JSON5 try to run twice causing an error because its already parsed
  }, [trackData2]);
  // use absolute for tooltip and hover element so the position will stack ontop of the track which will display on the right position
  // absolute element will affect each other position so you need those element to all have absolute
  return (
    <div></div>
    // <div
    //   style={{
    //     display: "flex",
    //     position: "relative",
    //     alignContent: side === "right" ? "start" : "end",
    //   }}
    // >
    //   {side === "right"
    //     ? canvasRefR.map((item, index) => (
    //         <canvas
    //           key={index}
    //           ref={item}
    //           height={"1000"}
    //           width={windowWidth}
    //           style={{ position: "absolute", left: `${-dragXDist!}px` }}
    //         />
    //       ))
    //     : canvasRefL.map((item, index) => (
    //         <canvas
    //           key={canvasRefL.length - index - 1}
    //           ref={canvasRefL[canvasRefL.length - index - 1]}
    //           height={"1000"}
    //           width={windowWidth}
    //           style={{ position: "absolute", right: `${dragXDist!}px` }}
    //         />
    //       ))}

    //   {side === "right" ? (
    //     <div
    //       key={"hicRight"}
    //       style={{
    //         opacity: 0.5,

    //         position: "absolute",
    //         left: `${-dragXDist!}px`,
    //       }}
    //     >
    //       {rightTrackGenes.map((item, index) => (
    //         <TestToolTipHic
    //           key={index}
    //           data={rightTrackGenes[index]}
    //           windowWidth={windowWidth}
    //           trackIdx={index}
    //           side={"right"}
    //         />
    //       ))}
    //     </div>
    //   ) : (
    //     <div
    //       key={"hicLeft"}
    //       style={{
    //         opacity: 0.5,
    //         display: "flex",
    //         position: "absolute",
    //         right: `${dragXDist!}px`,
    //       }}
    //     >
    //       {leftTrackGenes.map((item, index) => (
    //         <TestToolTipHic
    //           key={leftTrackGenes.length - index - 1}
    //           data={leftTrackGenes[leftTrackGenes.length - index - 1]}
    //           windowWidth={windowWidth}
    //           trackIdx={leftTrackGenes.length - index - 1}
    //           side={"left"}
    //         />
    //       ))}
    //     </div>
    //   )}
    // </div>
  );
});
export default memo(GenomeAlign);
