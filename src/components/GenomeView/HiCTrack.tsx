import { scaleLinear } from 'd3-scale';
import React, { createRef, memo } from 'react';
import { useEffect, useRef, useState } from 'react';
// import worker_script from '../../Worker/worker';
import TestToolTipHic from './commonComponents/hover/tooltipHic';
import { InteractionDisplayMode } from './commonComponents/user-options/DisplayModes';

import { GenomeInteraction } from './getRemoteData/GenomeInteraction';
import percentile from 'percentile';
export enum ScaleChoices {
  AUTO = 'auto',
  FIXED = 'fixed',
}
// SCrolling to 80% view on current epi browser matches default in eg3
// let worker: Worker;
let hmData: Array<any> = [];
const TOP_PADDING = 2;
const DEFAULT_OPTIONS = {
  color: '#B8008A',
  color2: '#006385',
  backgroundColor: 'var(--bg-color)',
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
  color: '#B8008A',
  color2: '#006385',
  backgroundColor: 'var(--bg-color)',
  displayMode: 'heatmap',
  scoreScale: 'auto',
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
  normalization: 'NONE',
  label: '',
};
interface BedTrackProps {
  bpRegionSize?: number;
  bpToPx?: number;
  trackData?: { [key: string]: any }; // Replace with the actual type
  side?: string;
  windowWidth?: number;
}
const HiCTrack: React.FC<BedTrackProps> = memo(function HiCTrack({
  bpRegionSize,
  bpToPx,
  trackData,
  side,
  windowWidth = 0,
}) {
  let start, end;

  let result;
  if (Object.keys(trackData!).length > 0) {
    [start, end] = trackData!.location.split(':');
    result = trackData!.hicResult;
    bpRegionSize = bpRegionSize;
    bpToPx = bpToPx;
  }

  start = Number(start);
  end = Number(end);
  //useRef to store data between states without re render the component
  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates

  const [rightTrackGenes, setRightTrack] = useState<Array<any>>([]);

  const [leftTrackGenes, setLeftTrack] = useState<Array<any>>([]);
  const prevOverflowStrand = useRef<{ [key: string]: any }>({});
  const overflowStrand = useRef<{ [key: string]: any }>({});
  const [canvasRefR, setCanvasRefR] = useState<Array<any>>([]);
  const [canvasRefR2, setCanvasRefR2] = useState<Array<any>>([]);

  const [canvasRefL, setCanvasRefL] = useState<Array<any>>([]);
  const [canvasRefL2, setCanvasRefL2] = useState<Array<any>>([]);
  const prevOverflowStrand2 = useRef<{ [key: string]: any }>({});
  const overflowStrand2 = useRef<{ [key: string]: any }>({});
  // step 1 filtered
  // step 2 change genomeInteraction in placedInteraction
  // step 3compute the value find the middle rect and display on screen
  // step 4 show both sides when hovering
  function fetchGenomeData(initial: number = 0) {
    // TO - IF STRAND OVERFLOW THEN NEED TO SET TO MAX WIDTH OR 0 to NOT AFFECT THE LOGIC.

    let startPos;
    startPos = start;

    // initialize the first index of the interval so we can start checking for prev overlapping intervals

    if (result) {
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

    const newCanvasRef = createRef();

    let placedInteraction = placeInteractions(result);

    let polyCoord = placedInteraction.map((item, index) =>
      renderRect(item, index)
    );
    let tmpObj = {};
    tmpObj['placedInteraction'] = placedInteraction;
    tmpObj['polyCoord'] = polyCoord;

    setRightTrack([...rightTrackGenes, tmpObj]);

    if (trackData!.initial) {
      const newCanvasRefL = createRef();
      prevOverflowStrand2.current = { ...overflowStrand2.current };
      overflowStrand2.current = {};
      setCanvasRefL((prevRefs) => [...prevRefs, newCanvasRefL]);
      setLeftTrack([...leftTrackGenes, tmpObj]);
    }

    setCanvasRefR((prevRefs) => [...prevRefs, newCanvasRef]);

    // CHECK if there are overlapping strands to the next track

    prevOverflowStrand.current = { ...overflowStrand.current };
    overflowStrand.current = {};
  }

  //________________________________________________________________________________________________________________________________________________________
  //________________________________________________________________________________________________________________________________________________________
  function placeInteractions(interactions: GenomeInteraction[]) {
    const mappedInteractions: Array<any> = [];
    for (const interaction of interactions) {
      let location1 = interaction.locus1;
      let location2 = interaction.locus2;

      const startX1 = (location1.start - start) / bpToPx!;
      const endX1 = (location1.end - start) / bpToPx!;

      const startX2 = (location2.start - start) / bpToPx!;
      const endX2 = (location2.end - start) / bpToPx!;

      const xSpan1 = { start: startX1, end: endX1 };
      const xSpan2 = { start: startX2, end: endX2 };
      mappedInteractions.push({ interaction, xSpan1, xSpan2 });
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
      '' + xSpan1.start + xSpan1.end + xSpan2.start + xSpan2.end + index;
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
    tmpObj['placedInteraction'] = placedInteraction;
    tmpObj['polyCoord'] = polyCoord;

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
      let context = canvasRef.getContext('2d');
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      for (let i = 0; i < polyRegionData.length; i++) {
        const points = polyRegionData[i].points;
        context.fillStyle = '#B8008A';
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

  useEffect(() => {
    if (side === 'left' && leftTrackGenes.length > 0) {
      console.log(leftTrackGenes);
      leftTrackGenes.forEach((canvasRef, index) => {
        if (canvasRefL[index].current) {
          drawCanvas(
            leftTrackGenes[index].polyCoord,
            canvasRefL[index].current
          );
        }
      });
    } else if (side === 'right' && rightTrackGenes.length > 0) {
      rightTrackGenes.forEach((canvasRef, index) => {
        if (canvasRefR[index].current) {
          drawCanvas(
            rightTrackGenes[index].polyCoord,
            canvasRefR[index].current
          );
        }
      });
    }
  }, [side]);

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
    if (trackData!.side === 'right') {
      fetchGenomeData();
    } else if (trackData!.side === 'left') {
      fetchGenomeData2();
    }
  }, [trackData]);
  // use absolute for tooltip and hover element so the position will stack ontop of the track which will display on the right position
  // absolute element will affect each other position so you need those element to all have absolute
  return (
    <div>
      {side === 'right' ? (
        <div
          key={'hicRight'}
          style={{
            opacity: 0.5,
            display: 'flex',
            position: 'absolute',
          }}
        >
          {rightTrackGenes.map((item, index) => (
            <TestToolTipHic
              key={index}
              data={rightTrackGenes[index]}
              windowWidth={windowWidth}
              trackIdx={index}
            />
          ))}
        </div>
      ) : (
        <div
          key={'hicLeft'}
          style={{
            opacity: 0.5,
            display: 'flex',
            position: 'absolute',
          }}
        >
          {leftTrackGenes.map((item, index) => (
            <TestToolTipHic
              key={leftTrackGenes.length - index - 1}
              data={leftTrackGenes[leftTrackGenes.length - index - 1]}
              windowWidth={windowWidth}
              trackIdx={leftTrackGenes.length - index - 1}
            />
          ))}
        </div>
      )}
      {side === 'right' ? (
        <div style={{ display: 'flex' }}>
          {canvasRefR.map((item, index) => (
            <canvas
              key={index}
              ref={item}
              height={'1000'}
              width={`${windowWidth * 2}px`}
              style={{}}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex' }}>
          {canvasRefL.map((item, index) => (
            <canvas
              key={canvasRefL.length - index - 1}
              ref={canvasRefL[canvasRefL.length - index - 1]}
              height={'1000'}
              width={`${windowWidth * 2}px`}
              style={{}}
            />
          ))}
        </div>
      )}
    </div>
  );
});
export default memo(HiCTrack);
