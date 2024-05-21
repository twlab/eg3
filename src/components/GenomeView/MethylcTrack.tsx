import { scaleLinear } from 'd3-scale';
import React, { createRef, memo } from 'react';
import { useEffect, useRef, useState } from 'react';
import MethylCRecord from './MethylCRecord';
import { myFeatureAggregator } from './commonComponents/screen-scaling/FeatureAggregator';
import worker_script from '../../Worker/worker';
let worker: Worker;
const VERTICAL_PADDING = 0;
const PLOT_DOWNWARDS_STRAND = 'reverse';
const DEFAULT_COLORS_FOR_CONTEXT = {
  CG: { color: 'rgb(100,139,216)', background: '#d9d9d9' },
  CHG: { color: 'rgb(255,148,77)', background: '#ffe0cc' },
  CHH: { color: 'rgb(255,0,255)', background: '#ffe5ff' },
};
const OVERLAPPING_CONTEXTS_COLORS = DEFAULT_COLORS_FOR_CONTEXT.CG;
const UNKNOWN_CONTEXT_COLORS = DEFAULT_COLORS_FOR_CONTEXT.CG;
interface BedTrackProps {
  bpRegionSize?: number;
  bpToPx?: number;
  trackData?: { [key: string]: any }; // Replace with the actual type
  side?: string;
  windowWidth?: number;
}
const MethylcTrack: React.FC<BedTrackProps> = memo(function MethylcTrack({
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
    result = trackData!.methylcResult;
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

    //SORT our interval data into levels to be place on the track

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
      let converted = event.data;
      let scales = computeScales(converted);
      let length = converted.length;

      drawCanvas(0, length, newCanvasRef, converted, scales, newCanvasRef2);
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
    };
    setCanvasRefR((prevRefs) => [...prevRefs, newCanvasRef]);
    setCanvasRefR2((prevRefs) => [...prevRefs, newCanvasRef2]);
    // CHECK if there are overlapping strands to the next track

    prevOverflowStrand.current = { ...overflowStrand.current };
    overflowStrand.current = {};
  }

  //________________________________________________________________________________________________________________________________________________________
  //________________________________________________________________________________________________________________________________________________________

  function fetchGenomeData2() {
    let startPos;
    startPos = start;

    var strandIntervalList: Array<any> = [];
    // initialize the first index of the interval so we can start checking for prev overlapping intervals

    if (result !== undefined && result.length > 0) {
      result[0].sort((a, b) => {
        return b.end - a.end;
      });
      result = result[0];
      var resultIdx = 0;

      // let checking for interval overlapping and determining what level each strand should be on
      for (let i = resultIdx; i < result.length; i++) {
        var idx = strandIntervalList.length - 1;
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
      let scales = computeScales(converted);
      let length = converted.length;

      drawCanvas(0, length, newCanvasRef, converted, scales, newCanvasRef2);
      setLeftTrack([
        ...leftTrackGenes,
        { canvasData: converted, scaleData: scales },
      ]);
    };
    setCanvasRefL((prevRefs) => [...prevRefs, newCanvasRef]);
    setCanvasRefL2((prevRefs) => [...prevRefs, newCanvasRef2]);

    prevOverflowStrand2.current = { ...overflowStrand2.current };

    overflowStrand2.current = {};
  }

  function computeScales(xMap, height: number = 40, maxMethyl: number = 1) {
    /*
      xMap = returnValueOfAggregateRecords = [
          {
              combined: {
                  depth: 5 (NaN if no data),
                  contextValues: [
                      {context: "CG", value: 0.3},
                      {context: "CHH", value: 0.3},
                      {context: "CHG", value: 0.3},
                  ]
              },
              forward: {},
              reverse: {}
          },
          ...
      ]
      */
    const forwardRecords = xMap.map((record) => record.forward);
    const reverseRecords = xMap.map((record) => record.reverse);

    const maxDepthForward = forwardRecords.reduce(
      (maxRecord, record) => {
        return record.depth > maxRecord.depth ? record : maxRecord;
      },
      { depth: 0 }
    );

    const maxDepthReverse = reverseRecords.reduce(
      (maxRecord, record) => {
        return record.depth > maxRecord.depth ? record : maxRecord;
      },
      { depth: 0 }
    );

    const maxDepth = Math.max(maxDepthForward.depth, maxDepthReverse.depth);

    return {
      methylToY: scaleLinear()
        .domain([maxMethyl, 0])
        .range([VERTICAL_PADDING, height])
        .clamp(true),
      depthToY: scaleLinear()
        .domain([maxDepth, 0])
        .range([VERTICAL_PADDING, height])
        .clamp(true),
    };
  }

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
    for (let j = startRange; j < endRange; j++) {
      let forward = converted[j].forward;
      let reverse = converted[j].reverse;
      // let combine = converted[j].combined;

      for (let contextData of forward.contextValues) {
        const drawY = scales.methylToY(contextData.value);
        const drawHeight = 40 - drawY;
        const contextName = contextData.context;
        const color = DEFAULT_COLORS_FOR_CONTEXT[contextName].color;

        context.fillStyle = color;
        context.globalAlpha = 0.75;
        context.fillRect(j, drawY, 1, drawHeight);
      }

      for (let contextData of reverse.contextValues) {
        const drawY = scales.methylToY(contextData.value);
        const drawHeight = 40 - drawY;
        const contextName = contextData.context;
        const color = DEFAULT_COLORS_FOR_CONTEXT[contextName].color;

        contextRev.fillStyle = color;
        contextRev.globalAlpha = 0.75;
        contextRev.fillRect(j, 0, 1, drawHeight);
      }
    }
  }

  useEffect(() => {
    if (side === 'left') {
      if (leftTrackGenes.length != 0) {
        leftTrackGenes.forEach((canvasRef, index) => {
          if (canvasRefL[index].current && canvasRefL2[index].current) {
            let length = leftTrackGenes[index].canvasData.length;
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
            let length = rightTrackGenes[index].canvasData.length;
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
    function handle() {
      if (trackData!.location && trackData!.side === 'right') {
        fetchGenomeData();
      } else if (trackData!.location && trackData!.side === 'left') {
        console.log(trackData);
        fetchGenomeData2();
      }
    }
    handle();
  }, [trackData]);

  return (
    <div style={{ height: '80px' }}>
      {side === 'right' ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            {canvasRefR.map((item, index) => (
              <canvas
                key={index}
                ref={item}
                height={'40'}
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
                height={'40'}
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
                height={'40'}
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
                height={'40'}
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
export default memo(MethylcTrack);
