import { scaleLinear } from "d3-scale";
import React, { createRef, memo } from "react";
import { useEffect, useRef, useState } from "react";

import TestToolTip from "./commonComponents/hover/tooltip";

const worker = new Worker(new URL("../../worker/worker.ts", import.meta.url), {
  type: "module",
});
const VERTICAL_PADDING = 0;
const DEFAULT_COLORS_FOR_CONTEXT = {
  CG: { color: "rgb(100,139,216)", background: "#d9d9d9" },
  CHG: { color: "rgb(255,148,77)", background: "#ffe0cc" },
  CHH: { color: "rgb(255,0,255)", background: "#ffe5ff" },
};
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
    [start, end] = trackData!.location.split(":");
    result = trackData!.methylc;
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

  function fetchGenomeData(initial: number = 0) {
    // TO - IF STRAND OVERFLOW THEN NEED TO SET TO MAX WIDTH OR 0 to NOT AFFECT THE LOGIC.

    let startPos;
    startPos = start;

    // initialize the first index of the interval so we can start checking for prev overlapping intervals

    if (result !== undefined && result.length > 0) {
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

    //SORT our interval data into levels to be place on the track

    const newCanvasRef = createRef();
    const newCanvasRef2 = createRef();

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
      setRightTrack([
        ...rightTrackGenes,
        { canvasData: converted, scaleData: scales },
      ]);
      if (trackData!.initial) {
        const newCanvasRevRef = createRef();
        const newCanvasRevRef2 = createRef();
        prevOverflowStrand2.current = { ...overflowStrand2.current };
        setCanvasRefL((prevRefs) => [...prevRefs, newCanvasRevRef]);
        setCanvasRefL2((prevRefs) => [...prevRefs, newCanvasRevRef2]);
        setLeftTrack([
          ...leftTrackGenes,
          { canvasData: converted, scaleData: scales },
        ]);
        overflowStrand2.current = {};
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

    // initialize the first index of the interval so we can start checking for prev overlapping intervals

    if (result.length > 0) {
      result.sort((a, b) => {
        return b.end - a.end;
      });

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

        if (curStrand.start > start) {
          break;
        }
      }
    }

    const newCanvasRef = createRef();
    const newCanvasRef2 = createRef();

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
    if (canvasRef.current === null || !canvasRefReverse.current === null) {
      return;
    }
    let context = canvasRef.current.getContext("2d");
    let contextRev = canvasRefReverse.current.getContext("2d");

    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    contextRev.clearRect(0, 0, context.canvas.width, context.canvas.height);
    for (let j = startRange; j < endRange; j++) {
      let forward = converted[j].forward;
      let reverse = converted[j].reverse;
      // let combine = converted[j].combined;
      let depthFilter = 0;

      if (j + 1 !== endRange) {
        let currRecord = converted[j].forward;
        let nextRecord = converted[j + 1].forward;
        let currRecordRev = converted[j].reverse;
        let nextRecordRev = converted[j + 1].reverse;
        if (currRecord.depth < depthFilter) {
          continue;
        }

        const y1 = scales.depthToY(currRecord.depth);
        const y2 = scales.depthToY(nextRecord.depth);

        context.strokeStyle = "#525252";
        context.beginPath();
        context.moveTo(j, y1);
        context.lineTo(j + 1, y2);
        context.stroke();

        const y1Rev = scales.depthToY(currRecordRev.depth);
        const y2Rev = scales.depthToY(nextRecordRev.depth);

        contextRev.strokeStyle = "#525252";
        contextRev.beginPath();
        contextRev.moveTo(j, 40 - y1Rev);
        contextRev.lineTo(j + 1, 40 - y2Rev);
        contextRev.stroke();
      }

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
    if (side === "left") {
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
    } else if (side === "right") {
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
  }, [side]);
  useEffect(() => {
    if (rightTrackGenes.length > 0) {
      drawCanvas(
        0,
        rightTrackGenes[rightTrackGenes.length - 1].canvasData.length,
        canvasRefR[canvasRefR.length - 1],
        rightTrackGenes[rightTrackGenes.length - 1].canvasData,
        rightTrackGenes[rightTrackGenes.length - 1].scaleData,
        canvasRefR2[canvasRefR2.length - 1]
      );
    }
  }, [rightTrackGenes]);

  useEffect(() => {
    if (leftTrackGenes.length > 0) {
      drawCanvas(
        0,
        leftTrackGenes[leftTrackGenes.length - 1].canvasData.length,
        canvasRefL[canvasRefL.length - 1],
        leftTrackGenes[leftTrackGenes.length - 1].canvasData,
        leftTrackGenes[leftTrackGenes.length - 1].scaleData,
        canvasRefL2[canvasRefL2.length - 1]
      );
    }
  }, [leftTrackGenes]);
  useEffect(() => {
    if (trackData!.side === "right") {
      fetchGenomeData();
    } else if (trackData!.side === "left") {
      fetchGenomeData2();
    }
  }, [trackData]);

  return (
    <div
      style={{
        height: "150px",
        position: "relative",
      }}
    >
      {side === "right" ? (
        <>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              position: "absolute",
              opacity: 0.5,

              zIndex: 3,
            }}
          >
            {rightTrackGenes.map((item, index) => (
              <TestToolTip
                key={index}
                data={rightTrackGenes[index]}
                windowWidth={windowWidth}
                trackIdx={index}
                side={"right"}
              />
            ))}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",

              zIndex: 2,
            }}
          >
            <div style={{ display: "flex", flexDirection: "row" }}>
              {canvasRefR.map((item, index) => (
                <canvas
                  key={index}
                  ref={item}
                  height={"40"}
                  width={`${windowWidth}px`}
                  style={{}}
                />
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "row" }}>
              {canvasRefR2.map((item, index) => (
                <canvas
                  key={index + 32}
                  ref={item}
                  height={"40"}
                  width={`${windowWidth}px`}
                  style={{}}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              position: "absolute",
              opacity: 0.5,

              zIndex: 3,
            }}
          >
            {leftTrackGenes.map((item, index) => (
              <TestToolTip
                key={leftTrackGenes.length - 1 - index}
                data={leftTrackGenes[leftTrackGenes.length - 1 - index]}
                windowWidth={windowWidth}
                trackIdx={leftTrackGenes.length - 1 - index}
                length={index}
                side={"left"}
              />
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", flexDirection: "row" }}>
              {canvasRefL.map((item, index) => (
                <canvas
                  key={canvasRefL.length - index - 1}
                  ref={canvasRefL[canvasRefL.length - index - 1]}
                  height={"40"}
                  width={`${windowWidth}px`}
                  style={{}}
                />
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "row" }}>
              {canvasRefL2.map((item, index) => (
                <canvas
                  key={canvasRefL2.length - index - 1}
                  ref={canvasRefL2[canvasRefL2.length - index - 1]}
                  height={"40"}
                  width={`${windowWidth}px`}
                  style={{}}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
});
export default memo(MethylcTrack);
