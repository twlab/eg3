import { scaleLinear } from "d3-scale";
import React, { createRef, memo } from "react";
import { useEffect, useRef, useState } from "react";
// import worker_script from '../../Worker/worker';
import JSON5 from "json5";

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
    let placedRecords = placeInteractions(result);

    console.log(bpToPx);

    //step 3 get mergeDistance
    const mergeDistance = MERGE_PIXEL_DISTANCE * bpToPx!;

    // step 4 Count how many bases are in positive strand and how many of them are in negative strand.
    // More in negative strand (<0) => plotStrand = "-".

    const aggregateStrandsNumber = result.reduce(
      (aggregateStrand, record) =>
        aggregateStrand +
        (record[3].genomealign.strand === "-"
          ? -1 * record[3].genomealign.stop - record[3].genomealign.start
          : record[3].genomealign.stop - record[3].genomealign.start),
      0
    );

    const plotStrand = aggregateStrandsNumber < 0 ? "-" : "+";

    //step 5 mergeAdvanced merge the alignments by query genome coordinates
    // Custom groupBy function in TypeScript

    // visiblepart === to placedRecords,
    // in the old code, a to create a new chromosome interval class is sent to mergeAdvanced
    // as each obj in placeRecords is iterated, it will create a visiblepart obj ->convert to chromosome interval -> and then
    // using chromosomeInterval.chr to group by the chr.
    // creates a
    // const groupBy = <T, K extends keyof any>(
    //   list: T[],
    //   getKey: (item: T) => K
    // ) =>
    //   list.reduce((previous, currentItem) => {
    //     const group = getKey(currentItem);
    //     if (!previous[group]) previous[group] = [];
    //     previous[group].push(currentItem);
    //     return previous;
    //   }, {} as Record<K, T[]>);

    // // Usage example: Group by 'chr'
    // const groupedByChromosome = groupBy(placedRecords, (obj) => obj.chr);
  }

  function placeInteractions(features) {
    const placements: Array<any> = [];
    for (const feature of features) {
      const startX = (feature.start - start) / bpToPx!;
      const endX = (feature.end - start) / bpToPx!;

      const xSpan = { start: startX, end: endX };

      // has option to use center otherwise xspan is start and end
      const centerX = Math.round((startX + endX) / 2);
      placements.push({ feature, xSpan });
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
