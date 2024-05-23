import { scaleLinear } from 'd3-scale';
import React, { createRef, memo } from 'react';
import { useEffect, useRef, useState } from 'react';

import worker_script from '../../Worker/dynseqWorker';
let worker: Worker;
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

  const [canvasRefR2, setCanvasRefR2] = useState<Array<any>>([]);
  const [canvasRefL, setCanvasRefL] = useState<Array<any>>([]);
  const [canvasRefL2, setCanvasRefL2] = useState<Array<any>>([]);
  const prevOverflowStrand2 = useRef<{ [key: string]: any }>({});
  const overflowStrand2 = useRef<{ [key: string]: any }>({});

  // These states are used to update the tracks with new fetched data
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track

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

    const newCanvasRef = createRef();
    const newCanvasRef2 = createRef();

    worker = new Worker(worker_script);

    worker.postMessage({
      trackGene: result,
      windowWidth: windowWidth,
      bpToPx: bpToPx!,
      bpRegionSize: bpRegionSize!,
      startBpRegion: start,
    });

    // Listen for messages from the web worker
    worker.onmessage = (event) => {
      const converted = event.data;

      let scales = computeScales(
        converted.forward,
        converted.reverse,
        0,
        bpRegionSize
      );

      drawCanvas(
        0,
        windowWidth * 2,
        newCanvasRef,
        converted,
        scales,
        newCanvasRef2
      );
      setRightTrack([
        ...rightTrackGenes,
        { canvasData: converted, scaleData: scales },
      ]);
      if (trackData!.initial) {
        const newCanvasRevRef = createRef();
        const newCanvasRevRef2 = createRef();
        prevOverflowStrand2.current = { ...overflowStrand2.current };
        setLeftTrack([
          ...leftTrackGenes,
          { canvasData: converted, scaleData: scales },
        ]);
        overflowStrand2.current = {};
        setCanvasRefL((prevRefs) => [...prevRefs, newCanvasRevRef]);

        setCanvasRefL2((prevRefs) => [...prevRefs, newCanvasRevRef2]);
      }

      worker.terminate();
    };
    setCanvasRefR((prevRefs) => [...prevRefs, newCanvasRef]);
    setCanvasRefR2((prevRefs) => [...prevRefs, newCanvasRef2]);
    prevOverflowStrand.current = { ...overflowStrand.current };
    overflowStrand.current = {};
  }

  //________________________________________________________________________________________________________________________________________________________
  //________________________________________________________________________________________________________________________________________________________

  function fetchGenomeData2() {
    let startPos;
    startPos = start;

    // initialize the first index of the interval so we can start checking for prev overlapping intervals

    if (result !== undefined && result.length > 0) {
      result[0].sort((a, b) => {
        return b.end - a.end;
      });
      result = result[0];
      var resultIdx = 0;

      // let checking for interval overlapping and determining what level each strand should be on
      for (let i = resultIdx; i < result.length; i++) {
        const curStrand = result[i];
        if (curStrand.start < start) {
          const strandId = curStrand.start + curStrand.end;

          overflowStrand2.current[strandId] = {
            level: i,
            strand: curStrand,
          };
        }
      }
    }

    const newCanvasRef = createRef();
    const newCanvasRef2 = createRef();

    worker = new Worker(worker_script);

    worker.postMessage({
      trackGene: result,
      windowWidth: windowWidth,
      bpToPx: bpToPx!,
      bpRegionSize: bpRegionSize!,
      startBpRegion: start,
    });

    worker.onmessage = (event) => {
      let converted = event.data;
      let scales = computeScales(
        converted.forward,
        converted.reverse,
        0,
        bpRegionSize
      );
      drawCanvas(
        0,
        windowWidth * 2,
        newCanvasRef,
        converted,
        scales,
        newCanvasRef2
      );
      setLeftTrack([
        ...leftTrackGenes,
        { canvasData: converted, scaleData: scales },
      ]);
      worker.terminate();
    };
    setCanvasRefL((prevRefs) => [...prevRefs, newCanvasRef]);
    setCanvasRefL2((prevRefs) => [...prevRefs, newCanvasRef2]);

    prevOverflowStrand2.current = { ...overflowStrand2.current };

    overflowStrand2.current = {};
  }
  // const DEFAULT_OPTIONS = {
  //   aggregateMethod: 'mean',
  //   displayMode: 'auto',
  //   height: 40,
  //   color: 'blue',
  //   colorAboveMax: 'red',
  //   color2: 'darkorange',
  //   color2BelowMin: 'darkgreen',
  //   yScale: 'auto',
  //   yMax: 10,
  //   yMin: 0,
  //   smooth: 0,
  //   ensemblStyle: false,
  // };

  // const AUTO_HEATMAP_THRESHOLD = 21; // If pixel height is less than this, automatically use heatmap
  const TOP_PADDING = 2;
  // const THRESHOLD_HEIGHT = 3; // the bar tip height which represet value above max or below min
  async function drawCanvas(
    startRange,
    endRange,
    canvasRef,
    converted,
    scales,
    canvasRefReverse
  ) {
    let context = canvasRef.current.getContext('2d');
    let contextRev = canvasRefReverse.current.getContext('2d');

    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    contextRev.clearRect(0, 0, context.canvas.width, context.canvas.height);

    for (let i = startRange; i < endRange; i++) {
      if (converted.forward[i] !== 0) {
        context.fillStyle = 'blue';
        const drawY = scales.valueToY(converted.forward[i]);

        context.fillRect(i, drawY, 1, 20 - drawY);
      }
      if (converted.reverse[i] !== 0) {
        const height = scales.valueToYReverse(converted.reverse[i]);

        contextRev.fillStyle = 'red';

        contextRev.fillRect(i, 0, 1, height);
      }
    }
  }
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
    if (side === 'left') {
      if (leftTrackGenes.length != 0) {
        leftTrackGenes.forEach((canvasRef, index) => {
          if (canvasRefL[index].current && canvasRefL2[index].current) {
            let length = leftTrackGenes[index].canvasData.reverse.length;

            drawCanvas(
              0,
              length,
              canvasRefL[index],
              leftTrackGenes[index].canvasData,
              leftTrackGenes[index].scaleData,
              canvasRefL2[index]
            );
          }
        });
      }
    } else if (side === 'right') {
      if (rightTrackGenes.length != 0) {
        rightTrackGenes.forEach((canvasRef, index) => {
          if (canvasRefR[index].current && canvasRefR2[index].current) {
            let length = rightTrackGenes[index].canvasData.forward.length;
            drawCanvas(
              0,
              length,
              canvasRefR[index],
              rightTrackGenes[index].canvasData,
              rightTrackGenes[index].scaleData,
              canvasRefR2[index]
            );
          }
        });
      }
    }
  }, [side]);

  useEffect(() => {
    if (trackData!.side === 'right') {
      fetchGenomeData();
    } else if (trackData!.side === 'left') {
      fetchGenomeData2();
    }
  }, [trackData]);

  return (
    <div style={{ height: '40px' }}>
      {side === 'right' ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            {canvasRefR.map((item, index) => (
              <canvas
                key={index}
                ref={item}
                height={'20'}
                width={`${windowWidth * 2}px`}
                style={{}}
              />
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            {canvasRefR2.map((item, index) => (
              <canvas
                key={index + 32}
                ref={item}
                height={'20'}
                width={`${windowWidth * 2}px`}
                style={{}}
              />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            {canvasRefL.map((item, index) => (
              <canvas
                key={canvasRefL.length - index - 1}
                ref={canvasRefL[canvasRefL.length - index - 1]}
                height={'20'}
                width={`${windowWidth * 2}px`}
                style={{}}
              />
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            {canvasRefL2.map((item, index) => (
              <canvas
                key={canvasRefL2.length - index - 1 + 3343434}
                ref={canvasRefL2[canvasRefL2.length - index - 1]}
                height={'20'}
                width={`${windowWidth * 2}px`}
                style={{}}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
export default memo(DynseqTrack);
