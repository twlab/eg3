import { scaleLinear } from "d3-scale";
import React, { createRef, memo } from "react";
import { useEffect, useRef, useState } from "react";
// import worker_script from '../../Worker/worker';
import JSON5 from "json5";
import TestToolTipHic from "./commonComponents/hover/tooltipHic";
import { InteractionDisplayMode } from "./commonComponents/user-options/DisplayModes";

import { GenomeInteraction } from "./getRemoteData/GenomeInteraction";
import percentile from "percentile";
export enum ScaleChoices {
  AUTO = "auto",
  FIXED = "fixed",
}
// SCrolling to 80% view on current epi browser matches default in eg3
// let worker: Worker;
let hmData: Array<any> = [];
const TOP_PADDING = 2;
const DEFAULT_OPTIONS = {
  color: "#B8008A",
  color2: "#006385",
  backgroundColor: "var(--bg-color)",
  displayMode: InteractionDisplayMode.HEATMAP,
  scoreScale: ScaleChoices.AUTO,
  scoreMax: 10,
  scalePercentile: 95,
  scoreMin: 0,
  height: 500,
  lineWidth: 2,
  greedyTooltip: false,
  fetchViewWindowOnly: false,
  bothAnchorsInView: false,
  isThereG3dTrack: false,
  clampHeight: false,
};

let defaultHic = {
  color: "#B8008A",
  color2: "#006385",
  backgroundColor: "var(--bg-color)",
  displayMode: "heatmap",
  scoreScale: "auto",
  scoreMax: 10,
  scalePercentile: 95,
  scoreMin: 0,
  height: 1000,
  lineWidth: 2,
  greedyTooltip: false,
  fetchViewWindowOnly: false,
  bothAnchorsInView: false,
  isThereG3dTrack: false,
  clampHeight: false,
  binSize: 0,
  normalization: "NONE",
  label: "",
};
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
  // step 1 filtered
  // step 2 change genomeInteraction in placedInteraction
  // step 3compute the value find the middle rect and display on screen
  // step 4 show both sides when hovering
  function fetchGenomeData() {
    // TO - IF STRAND OVERFLOW THEN NEED TO SET TO MAX WIDTH OR 0 to NOT AFFECT THE LOGIC.

    let startPos;
    startPos = start;
    if (result === undefined) {
      return;
    }
    // initialize the first index of the interval so we can start checking for prev overlapping intervals

    if (result && hicOption === 0) {
      // let checking for interval overlapping and determining what level each strand should be on
      for (let i = result.length - 1; i >= 0; i--) {
        const curStrand = result[i];
        if (curStrand.end > end) {
          const strandId = curStrand.start + curStrand.end;
          overflowStrand.current[strandId] = {
            level: i,
            strand: curStrand,
          };
        }

        if (trackData!.initial) {
          if (curStrand.txStart < start) {
            overflowStrand2.current[curStrand.id] = {
              level: i,
              strand: curStrand,
            };
          }
        }
        if (!trackData!.initial && curStrand.end < end) {
          break;
        }
      }
    }

    for (const record of result) {
      let data = JSON5.parse("{" + record[3] + "}");
      data.genomealign.targetseq = null;
      data.genomealign.queryseq = null;

      record[3] = data;
    }

    const newCanvasRef = createRef();

    let placements = placeInteractions(result);
    console.log(placements);
    // let polyCoord = placedInteraction.map((item, index) =>
    //   renderRect(item, index)
    // );
    // let tmpObj = {};
    // tmpObj["placedInteraction"] = placedInteraction;
    // tmpObj["polyCoord"] = polyCoord;

    // if (trackData2!.side === "right") {
    //   if (hicOption === 0) {
    //     setRightTrack([...rightTrackGenes, tmpObj]);
    //     setCanvasRefR((prevRefs) => [...prevRefs, newCanvasRef]);
    //   } else {
    //     setRightTrack([tmpObj]);
    //     setCanvasRefR(new Array<any>(newCanvasRef));
    //   }
    //   prevOverflowStrand.current = { ...overflowStrand.current };
    //   overflowStrand.current = {};
    // } else if (trackData2!.side === "left") {
    //   if (hicOption === 0) {
    //     setLeftTrack([...leftTrackGenes, tmpObj]);
    //     setCanvasRefL((prevRefs) => [...prevRefs, newCanvasRef]);
    //   } else {
    //     setLeftTrack([tmpObj]);
    //     setCanvasRefL(new Array<any>(newCanvasRef));
    //   }
    // }
    // if (trackData!.initial) {
    //   const newCanvasRefL = createRef();
    //   prevOverflowStrand2.current = { ...overflowStrand2.current };
    //   overflowStrand2.current = {};
    //   setCanvasRefL((prevRefs) => [...prevRefs, newCanvasRefL]);
    //   setLeftTrack([...leftTrackGenes, tmpObj]);
    // }

    // CHECK if there are overlapping strands to the next track
  }

  //________________________________________________________________________________________________________________________________________________________
  //________________________________________________________________________________________________________________________________________________________
  // function baseSpanToXCenter(baseInterval) {
  //       const span = this.baseSpanToXSpan(baseInterval);
  //       const centerX = Math.round((span.start + span.end) / 2);
  //       // const startX = this.baseToX(baseInterval.start);
  //       // const endX = this.baseToX(baseInterval.end);
  //       // const centerX = (startX + endX) / 2;
  //       // Round centerx and return (centerX, centerX) to plot a single marker
  //       return new OpenInterval(centerX, centerX);
  //   }
  function placeInteractions(features) {
    const mappedInteractions: Array<any> = [];
    for (const feature of features) {
      // if (contextLocation) {
      //   const xSpan = useCenter
      //     ? drawModel.baseSpanToXCenter(contextLocation)
      //     : drawModel.baseSpanToXSpan(contextLocation);
      //   const { visiblePart, isReverse } = this._locatePlacement(
      //     feature,
      //     navContext,
      //     contextLocation
      //   );
      //   placements.push({
      //     feature,
      //     visiblePart,
      //     contextLocation,
      //     xSpan,
      //     isReverse,
      //   });
      // }

      const startX = (feature.start - start) / bpToPx!;
      const endX = (feature.end - start) / bpToPx!;

      const xSpan = { start: startX, end: endX };

      const centerX = Math.round((startX + endX) / 2);
      mappedInteractions.push({ feature, xSpan, centerX });
    }

    return mappedInteractions;
  }

  function renderRect(placedInteraction: any, index: number) {
    // if (placedInteraction.interaction.color) {
    //   color = placedInteraction.interaction.color;
    //   color2 = placedInteraction.interaction.color;
    // }
    let color = defaultHic.color;
    let color2 = defaultHic.color;
    const score = placedInteraction.interaction.score;
    if (!score) {
      return null;
    }

    const { xSpan1, xSpan2 } = placedInteraction;
    if (xSpan1.end < start && xSpan2.start > end) {
      return null;
    }
    // if (bothAnchorsInView) {
    //   if (xSpan1.start < viewWindow.start || xSpan2.end > viewWindow.end) {
    //     return null;
    //   }
    // }
    const gapCenter = (xSpan1.end + xSpan2.start) / 2;
    const gapLength = xSpan2.start - xSpan1.end;
    const topX = gapCenter;
    const halfSpan1 = Math.max(0.5 * (xSpan1.end - xSpan1.start), 1);
    const halfSpan2 = Math.max(0.5 * (xSpan2.end - xSpan2.start), 1);
    let topY, bottomY, leftY, rightY;
    // if (defaultHic.clampHeight) {
    //   bottomY = this.clampScale(0.5 * gapLength + halfSpan1 + halfSpan2);
    //   topY = bottomY - this.clampScale(halfSpan1 + halfSpan2);
    //   leftY = topY + this.clampScale(halfSpan1);
    //   rightY = topY + this.clampScale(halfSpan2);
    // } else {
    topY = 0.5 * gapLength;
    bottomY = topY + halfSpan1 + halfSpan2;
    leftY = topY + halfSpan1;
    rightY = topY + halfSpan2;

    const points = [
      // Going counterclockwise
      [topX, topY], // Top
      [topX - halfSpan1, leftY], // Left
      [topX - halfSpan1 + halfSpan2, bottomY], // Bottom = left + halfSpan2
      [topX + halfSpan2, rightY], // Right
    ];

    const key =
      "" + xSpan1.start + xSpan1.end + xSpan2.start + xSpan2.end + index;
    // only push the points in screen
    if (topX + halfSpan2 > start && topX - halfSpan1 < end) {
      hmData.push({
        points,
        interaction: placedInteraction.interaction,
        xSpan1,
        xSpan2,
      });
    }

    let currRes = {
      key: key,
      points: points, // React can convert the array to a string
      fill: score >= 0 ? color : color2,
      opacity: score,
    };

    return currRes;

    // const height = bootomYs.length > 0 ? Math.round(_.max(bootomYs)) : 50;
    // return <svg width={width} height={height} onMouseOut={onMouseOut} >{diamonds}</svg>;
    // return <svg width={width} height={Heatmap.getHeight(this.props)} onMouseOut={onMouseOut} >{diamonds}</svg>;
  }

  function fetchGenomeData2() {
    let startPos;
    startPos = start;

    // initialize the first index of the interval so we can start checking for prev overlapping intervals

    if (result) {
      // let checking for interval overlapping and determining what level each strand should be on
      result.sort((a, b) => {
        return b.end - a.end;
      });

      // let checking for interval overlapping and determining what level each strand should be on
      for (let i = result.length - 1; i >= 0; i--) {
        const curStrand = result[i];
        if (curStrand.start < start) {
          const strandId = curStrand.start + curStrand.end;

          overflowStrand2.current[strandId] = {
            level: i,
            strand: curStrand,
          };
        }

        if (curStrand.start > start) {
          break;
        }
      }
    }

    const newCanvasRef = createRef();

    let placedInteraction = placeInteractions(result);

    let polyCoord = placedInteraction.map((item, index) =>
      renderRect(item, index)
    );
    let tmpObj = {};
    tmpObj["placedInteraction"] = placedInteraction;
    tmpObj["polyCoord"] = polyCoord;

    setLeftTrack([...leftTrackGenes, tmpObj]);

    setCanvasRefL((prevRefs) => [...prevRefs, newCanvasRef]);

    prevOverflowStrand2.current = { ...overflowStrand2.current };
    overflowStrand2.current = {};
  }

  function computeScales(data: GenomeInteraction[]) {
    if (defaultHic.scoreScale === ScaleChoices.AUTO) {
      // const maxScore = this.props.data.length > 0 ? _.maxBy(this.props.data, "score").score : 10;
      const item = percentile(
        DEFAULT_OPTIONS.scalePercentile,
        data,
        (item) => item.score
      );
      // console.log(item)
      const maxScore = data.length > 0 ? (item as GenomeInteraction).score : 10;
      // console.log(maxScore)
      return {
        opacityScale: scaleLinear()
          .domain([0, maxScore])
          .range([0, 1])
          .clamp(true),
        heightScale: scaleLinear()
          .domain([0, maxScore])
          .range([0, defaultHic.height - TOP_PADDING])
          .clamp(true),
        min: 0,
        max: maxScore,
      };
    } else {
      if (defaultHic.scoreMin >= defaultHic.scoreMax) {
        // notify.show(
        //   'Score min cannot be greater than Score max',
        //   'error',
        //   2000
        // );
        return {
          opacityScale: scaleLinear()
            .domain([defaultHic.scoreMax - 1, defaultHic.scoreMax])
            .range([0, 1])
            .clamp(true),
          heightScale: scaleLinear()
            .domain([defaultHic.scoreMax - 1, defaultHic.scoreMax])
            .range([0, defaultHic.height - TOP_PADDING])
            .clamp(true),
          min: defaultHic.scoreMax - 1,
          max: defaultHic.scoreMax,
        };
      }
      return {
        opacityScale: scaleLinear()
          .domain([defaultHic.scoreMin, defaultHic.scoreMax])
          .range([0, 1])
          .clamp(true),
        heightScale: scaleLinear()
          .domain([defaultHic.scoreMin, defaultHic.scoreMax])
          .range([0, defaultHic.height - TOP_PADDING])
          .clamp(true),
        min: defaultHic.scoreMin,
        max: defaultHic.scoreMax,
      };
    }
  }

  function filterData(data: any) {
    let filteredData: Array<any> = [];
    // if (maxValueFilter && !isNaN(maxValueFilter)) {
    //   filteredData = data.filter((d) => d.score <= maxValueFilter);
    // } else {
    filteredData = data;
    // }
    // if (defaultHic.minValueFilter && !isNaN(minValueFilter)) {
    //   filteredData = filteredData.filter((d) => d.score >= minValueFilter);
    // }
    return filteredData;
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
  }, [trackData2, side]);
  // use absolute for tooltip and hover element so the position will stack ontop of the track which will display on the right position
  // absolute element will affect each other position so you need those element to all have absolute
  return (
    <div
      style={{
        height: "150px",
        position: "relative",
      }}
    ></div>
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
