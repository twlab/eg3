import { scaleLinear } from 'd3-scale';
import React, { createRef, memo } from 'react';
import { useEffect, useRef, useState } from 'react';

import worker_script from '../../Worker/dynseqWorker';
let worker: Worker;
import { myFeatureAggregator } from './commonComponents/screen-scaling/FeatureAggregator';
interface BedTrackProps {
  bpRegionSize?: number;
  bpToPx?: number;
  trackData?: { [key: string]: any }; // Replace with the actual type
  side?: string;
  windowWidth?: number;
}
const DynseqTrack: React.FC<BedTrackProps> = memo(function DynseqTrack({
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
    result = trackData!.dynseqResult;
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
  const [scaledRightVal, setScaledRightVal] = useState<Array<any>>([]);
  const [canvasRefR2, setCanvasRefR2] = useState<Array<any>>([]);
  const [canvasRefL, setCanvasRefL] = useState<Array<any>>([]);
  const [canvasRefL2, setCanvasRefL2] = useState<Array<any>>([]);
  const prevOverflowStrand2 = useRef<{ [key: string]: any }>({});
  const overflowStrand2 = useRef<{ [key: string]: any }>({});
  var scale = scaleLinear().domain([0, 1]).range([2, 40]).clamp(true);
  // These states are used to update the tracks with new fetched data
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track

  function getRndInteger(min = 0, max = 10000000000) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  function fetchGenomeData(initial: number = 0) {
    // TO - IF STRAND OVERFLOW THEN NEED TO SET TO MAX WIDTH OR 0 to NOT AFFECT THE LOGIC.

    let startPos;
    startPos = start;

    var strandIntervalList: Array<any> = [];
    // initialize the first index of the interval so we can start checking for prev overlapping intervals

    if (result[0]) {
      result = result[0];
      var resultIdx = 0;

      // let checking for interval overlapping and determining what level each strand should be on
      for (let i = resultIdx; i < result.length; i++) {
        var idx = strandIntervalList.length - 1;
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
      }
    }

    setRightTrack([...rightTrackGenes, [[...result], startPos]]);

    const newCanvasRef = createRef();
    const newCanvasRef2 = createRef();
    setCanvasRefR((prevRefs) => [...prevRefs, newCanvasRef]);
    setCanvasRefR2((prevRefs) => [...prevRefs, newCanvasRef2]);
    // CHECK if there are overlapping strands to the next track

    if (trackData!.initial) {
      prevOverflowStrand2.current = { ...overflowStrand2.current };

      overflowStrand2.current = {};
      setLeftTrack([...leftTrackGenes, [[...result], startPos]]);
      const newCanvasRef = createRef();
      setCanvasRefL((prevRefs) => [...prevRefs, newCanvasRef]);
      const newCanvasRef2 = createRef();
      setCanvasRefL2((prevRefs) => [...prevRefs, newCanvasRef2]);
    }
    prevOverflowStrand.current = { ...overflowStrand.current };
    overflowStrand.current = {};
  }

  //________________________________________________________________________________________________________________________________________________________
  //________________________________________________________________________________________________________________________________________________________

  function fetchGenomeData2() {
    let startPos = start;
    var strandIntervalList: Array<any> = [];

    result[0].sort((a, b) => {
      return b.end - a.end;
    });

    if (result[0]) {
      result = result[0];

      var resultIdx = 0;

      if (
        resultIdx < result.length &&
        !(
          result[resultIdx].start + result[resultIdx].end in
          prevOverflowStrand2.current
        )
      ) {
        strandIntervalList.push([
          result[resultIdx].start,
          result[resultIdx].end,
          new Array<any>(result[resultIdx]),
        ]);
      } else if (
        resultIdx < result.length &&
        result[resultIdx].start + result[resultIdx].end in
          prevOverflowStrand2.current
      ) {
        strandIntervalList.push([
          result[resultIdx].start,
          result[resultIdx].end,
          new Array<any>(),
        ]);

        while (
          strandIntervalList[resultIdx][2].length <
          prevOverflowStrand2.current[
            result[resultIdx].start + result[resultIdx].end
          ].level
        ) {
          strandIntervalList[resultIdx][2].push({});
        }
        strandIntervalList[resultIdx][2].splice(
          prevOverflowStrand2.current[
            result[resultIdx].start + result[resultIdx].end
          ].level,
          0,
          prevOverflowStrand2.current[
            result[resultIdx].start + result[resultIdx].end
          ].strand
        );
      }
      //START THE LOOP TO CHECK IF Prev interval overlapp with curr
      for (let i = resultIdx + 1; i < result.length; i++) {
        var idx = strandIntervalList.length - 1;
        var curStrand = result[i];

        var curHighestLvl = [
          idx,
          strandIntervalList[idx][2].length - 1, //
        ];
        const curStrandId = curStrand.start + curStrand.end;
        // if current starting coord is less than previous ending coord then they overlap
        if (curStrand.end >= strandIntervalList[idx][0]) {
          // combine the intervals into one larger interval that encompass the strands
          if (strandIntervalList[idx][0] > curStrand.start) {
            strandIntervalList[idx][0] = curStrand.start;
          }

          //NOW CHECK IF THE STRAND IS OVERFLOWING FROM THE LAST TRACK
          if (curStrandId in prevOverflowStrand2.current) {
            while (
              strandIntervalList[idx][2].length - 1 <
              prevOverflowStrand2.current[curStrandId].level
            ) {
              strandIntervalList[idx][2].push({});
            }
            strandIntervalList[idx][2].splice(
              prevOverflowStrand2.current[curStrandId].level,
              0,
              prevOverflowStrand2.current[curStrandId].strand
            );

            idx--;
            while (
              idx >= 0 &&
              prevOverflowStrand2.current[curStrandId].strand.end >=
                strandIntervalList[idx][0]
            ) {
              if (
                strandIntervalList[idx][2].length >
                prevOverflowStrand2.current[curStrandId].level
              ) {
                if (strandIntervalList[idx][0] > curStrand.start) {
                  strandIntervalList[idx][0] = curStrand.start;
                }
                strandIntervalList[idx][2].splice(
                  prevOverflowStrand2.current[curStrandId].level,
                  0,
                  new Array<any>()
                );
              }

              idx--;
            }
            continue;
          }

          //loop to check which other intervals the current strand overlaps
          while (idx >= 0 && curStrand.end >= strandIntervalList[idx][0]) {
            if (strandIntervalList[idx][2].length - 1 > curHighestLvl[1]) {
              if (strandIntervalList[idx][0] > curStrand.start) {
                strandIntervalList[idx][0] = curStrand.start;
              }

              curHighestLvl = [idx, strandIntervalList[idx][2].length];
            }
            idx--;
          }

          strandIntervalList[curHighestLvl[0]][2].push(curStrand);
        } else {
          strandIntervalList.push([
            result[i].start,
            result[i].end,
            new Array<any>(curStrand),
          ]);
        }
      }
    }

    let strandLevelList: Array<any> = [];
    for (var i = 0; i < strandIntervalList.length; i++) {
      var intervalLevelData = strandIntervalList[i][2];

      for (var j = 0; j < intervalLevelData.length; j++) {
        var strand = intervalLevelData[j];

        while (strandLevelList.length - 1 < j) {
          strandLevelList.push(new Array<any>());
        }
        strandLevelList[j].push(strand);
      }
    }

    setLeftTrack([...leftTrackGenes, [[...strandLevelList], startPos]]);

    const newCanvasRef = createRef();
    setCanvasRefL((prevRefs) => [...prevRefs, newCanvasRef]);
    const newCanvasRef2 = createRef();
    setCanvasRefL2((prevRefs) => [...prevRefs, newCanvasRef2]);
    for (var i = 0; i < strandLevelList.length; i++) {
      var levelContent = strandLevelList[i];
      for (var strand of levelContent) {
        if (strand.start < start) {
          const curStrandId = strand.start + strand.end;
          overflowStrand2.current[curStrandId] = {
            level: i,
            strand: strand,
          };
        }
      }
    }

    prevOverflowStrand2.current = { ...overflowStrand2.current };

    overflowStrand2.current = {};
  }
  const DEFAULT_OPTIONS = {
    aggregateMethod: 'mean',
    displayMode: 'auto',
    height: 40,
    color: 'blue',
    colorAboveMax: 'red',
    color2: 'darkorange',
    color2BelowMin: 'darkgreen',
    yScale: 'auto',
    yMax: 10,
    yMin: 0,
    smooth: 0,
    ensemblStyle: false,
  };

  const AUTO_HEATMAP_THRESHOLD = 21; // If pixel height is less than this, automatically use heatmap
  const TOP_PADDING = 2;
  const THRESHOLD_HEIGHT = 3; // the bar tip height which represet value above max or below min

  function computeScales(
    xToValue,
    xToValue2,
    regionStart,
    regionEnd,
    height: number = 40,
    yScale: string = 'auto',
    yMin: number = 0,
    yMax: number = 10
  ) {
    /*
        All tracks get `PropsFromTrackContainer` (see `Track.ts`).

        `props.viewWindow` contains the range of x that is visible when no dragging.  
            It comes directly from the `ViewExpansion` object from `RegionExpander.ts`
        */

    // if (yMin >= yMax) {
    //   notify.show("Y-axis min must less than max", "error", 2000);
    // }
    // const { trackModel, groupScale } = this.props;
    let min: number,
      max: number,
      xValues2 = [];
    // if (groupScale) {
    //   if (trackModel.options.hasOwnProperty("group")) {
    //     gscale = groupScale[trackModel.options.group];
    //   }
    // }
    // if (!_.isEmpty(gscale)) {
    //   max = _.max(Object.values(gscale.max));
    //   min = _.min(Object.values(gscale.min));

    max = Math.max(...xToValue); // in case undefined returned here, cause maxboth be undefined too

    min = Math.min(...xToValue2);

    const maxBoth = Math.max(Math.abs(max), Math.abs(min));
    max = maxBoth;
    if (xToValue2.length > 0) {
      min = -maxBoth;
    }

    // if (min > max) {
    //   notify.show("Y-axis min should less than Y-axis max", "warning", 5000);
    //   min = 0;
    // }

    // determines the distance of y=0 from the top, also the height of positive part
    const zeroLine =
      min < 0
        ? TOP_PADDING + ((height - 2 * TOP_PADDING) * max) / (max - min)
        : height;

    if (
      xValues2.length > 0 &&
      (yScale === 'auto' || (yScale === 'fixed' && yMin < 0))
    ) {
      return {
        axisScale: scaleLinear()
          .domain([max, min])
          .range([TOP_PADDING, height - TOP_PADDING])
          .clamp(true),
        valueToY: scaleLinear()
          .domain([max, 0])
          .range([TOP_PADDING, zeroLine])
          .clamp(true),
        valueToYReverse: scaleLinear()
          .domain([0, min])
          .range([0, height - zeroLine - TOP_PADDING])
          .clamp(true),
        valueToOpacity: scaleLinear()
          .domain([0, max])
          .range([0, 1])
          .clamp(true),
        valueToOpacityReverse: scaleLinear()
          .domain([0, min])
          .range([0, 1])
          .clamp(true),
        min,
        max,
        zeroLine,
      };
    } else {
      return {
        axisScale: scaleLinear()
          .domain([max, min])
          .range([TOP_PADDING, height])
          .clamp(true),
        valueToY: scaleLinear()
          .domain([max, min])
          .range([TOP_PADDING, height])
          .clamp(true),
        valueToOpacity: scaleLinear()
          .domain([min, max])
          .range([0, 1])
          .clamp(true),
        // for group feature when there is only nagetiva data, to be fixed
        valueToYReverse: scaleLinear()
          .domain([0, min])
          .range([0, height - zeroLine - TOP_PADDING])
          .clamp(true),
        valueToOpacityReverse: scaleLinear()
          .domain([0, min])
          .range([0, 1])
          .clamp(true),
        min,
        max,
        zeroLine,
      };
    }
  }

  useEffect(() => {
    // to find the "xSpan" or the x coord of the canvas and svg. They start at 0 - the windowwith * 2 for this setup
    //     x1={`${(singleStrand.start - props.startTrackPos) / bpToPx!}`
    // x2={`${(singleStrand.end - props.startTrackPos) / bpToPx!}`}
    // step 1: loop through the svg width which is windowwith * 2
    // 2: create an array for each x pixel.
    // 3: round each strand start and end xspan
    // 4: If a strand is in the same xspan pixel then add them to a array index
    // 5: the array index will represent the x coord pixel of the canvas and svg
    if (rightTrackGenes.length > 0) {
      // makeXMap(trackGenes, bpToPx, windowWidth, bpRegionSize)

      worker = new Worker(worker_script);

      worker.postMessage({
        trackGene: rightTrackGenes,
        windowWidth: windowWidth,
        bpToPx: bpToPx!,
        bpRegionSize: bpRegionSize!,
      });

      // Listen for messages from the web worker
      worker.onmessage = (event) => {
        const [avgPos, avgNeg] = event.data;

        let scales = computeScales(
          avgPos[0],
          avgNeg[0],
          0,
          rightTrackGenes[rightTrackGenes.length - 1][1]
        );

        for (let j = 0; j < avgPos[0].length; j++) {
          if (avgPos[0][j] !== 0) {
            avgPos[0][j] = scales.valueToY(avgPos[0][j]);
            avgNeg[0][j] = scales.valueToYReverse(avgNeg[0][j]);
          }
        }

        if (canvasRefR[canvasRefR.length - 1].current) {
          let context =
            canvasRefR[canvasRefR.length - 1].current.getContext('2d');

          context.clearRect(0, 0, context.canvas.width, context.canvas.height);

          for (let i = 0; i < avgPos[0].length; i++) {
            // going through width pixels
            // i = canvas pixel xpos

            if (avgPos[0][i] !== 0) {
              context.fillStyle = 'blue';

              context.fillRect(i, avgPos[0][i], 1, 20 - avgPos[0][i]);
            }
          }
        }

        if (canvasRefR2[canvasRefR2.length - 1].current) {
          let context =
            canvasRefR2[canvasRefR2.length - 1].current.getContext('2d');

          context.clearRect(0, 0, context.canvas.width, context.canvas.height);

          for (let i = 0; i < avgNeg[0].length; i++) {
            // going through width pixels
            // i = canvas pixel xpos
            if (avgNeg[0][i] !== 0) {
              context.fillStyle = 'red';

              context.fillRect(i, 0, 1, avgNeg[0][i]);
            }
          }
        }
      };
    }
  }, [rightTrackGenes]);

  useEffect(() => {
    if (leftTrackGenes.length > 0) {
      let [featureForward, xToFeatureReverse] = myFeatureAggregator.makeXMap(
        leftTrackGenes,
        bpToPx!,
        windowWidth,
        bpRegionSize!
      );

      if (canvasRefL.length > 0) {
        if (canvasRefL[canvasRefL.length - 1].current) {
          let context =
            canvasRefL[canvasRefL.length - 1].current.getContext('2d');

          context.clearRect(0, 0, context.canvas.width, context.canvas.height);

          for (
            let i = 0;
            i < featureForward[canvasRefL.length - 1].length;
            i++
          ) {
            // going through width pixels
            // i = canvas pixel xpos

            if (featureForward[canvasRefL.length - 1][i] !== 0) {
              context.fillStyle = 'blue';
              context.fillRect(
                i,
                featureForward[canvasRefL.length - 1][i],
                1,
                20 - featureForward[canvasRefL.length - 1][i]
              );
            }
          }
        }
      }

      if (canvasRefL2.length > 0) {
        if (canvasRefL2[canvasRefL2.length - 1].current) {
          let context =
            canvasRefL2[canvasRefL2.length - 1].current.getContext('2d');

          context.clearRect(0, 0, context.canvas.width, context.canvas.height);

          for (
            let i = 0;
            i < xToFeatureReverse[canvasRefL2.length - 1].length;
            i++
          ) {
            // going through width pixels
            // i = canvas pixel xpos
            if (xToFeatureReverse[canvasRefL2.length - 1][i] !== 0) {
              context.fillStyle = 'red';

              context.fillRect(
                i,
                0,
                1,
                xToFeatureReverse[canvasRefL2.length - 1][i]
              );
            }
          }
        }
      }
    }
  }, [leftTrackGenes]);

  useEffect(() => {
    if (side === 'left') {
      if (canvasRefL.length != 0) {
        canvasRefL.forEach((canvasRef, index) => {
          if (canvasRef.current) {
            let context = canvasRef.current.getContext('2d');
            context.clearRect(
              0,
              0,
              context.canvas.width,
              context.canvas.height
            );
          }
        });
        setLeftTrack([...leftTrackGenes]);
      }
    } else if (side === 'right') {
      if (canvasRefR.length != 0) {
        canvasRefR.forEach((canvasRef, index) => {
          if (canvasRef.current) {
            let context = canvasRef.current.getContext('2d');

            context.clearRect(
              0,
              0,
              context.canvas.width,
              context.canvas.height
            );
          }
        });
        setRightTrack([...rightTrackGenes]);
      }
    }
  }, [side]);

  useEffect(() => {
    function handle() {
      if (trackData!.location && trackData!.side === 'right') {
        fetchGenomeData();
      } else if (trackData!.location && trackData!.side === 'left') {
        fetchGenomeData2();
      }
    }
    handle();
  }, [trackData]);

  return (
    <div style={{ height: '40px' }}>
      {side === 'right' ? (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          {rightTrackGenes.map((item, index) => (
            <div
              key={index + 34343479}
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              <canvas
                key={index}
                ref={canvasRefR[index]}
                height={'20'}
                width={`${windowWidth * 2}px`}
                style={{}}
              />
              <canvas
                key={index + 2}
                ref={canvasRefR2[index]}
                height={'20'}
                width={`${windowWidth * 2}px`}
                style={{}}
              />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          {leftTrackGenes.map((item, index) => (
            <div
              key={canvasRefL.length - index - 1}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'end',
              }}
            >
              <canvas
                key={canvasRefL.length - index - 1 + 34343}
                ref={canvasRefL[canvasRefL.length - index - 1]}
                height={'20'}
                width={`${windowWidth * 2}px`}
                style={{}}
              />
              <canvas
                key={canvasRefL2.length - index - 1 + 3343434}
                ref={canvasRefL2[canvasRefL2.length - index - 1]}
                height={'20'}
                width={`${windowWidth * 2}px`}
                style={{}}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
export default memo(DynseqTrack);
