import { scaleLinear } from "d3-scale";
import React, { createRef, memo } from "react";
import { TrackProps } from "../../models/trackModels/trackProps";
import { useEffect, useRef, useState } from "react";
import worker_script from "../../worker/bigWigWorker";

const BigWigTrack: React.FC<TrackProps> = memo(function BigWigTrack({
  bpRegionSize,
  bpToPx,
  trackData,
  side,
  windowWidth = 0,
  handleDelete,
  trackIdx,
  id,
  trackManagerId,
}) {
  let start, end;

  let result: Array<any> = [];
  if (Object.keys(trackData!).length > 0) {
    [start, end] = trackData!.location.split(":");
    result = trackData!.bigWig;

    bpRegionSize = bpRegionSize;
    bpToPx = bpToPx;
  }

  start = Number(start);
  end = Number(end);
  //useRef to store data between states without re render the component
  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates

  const [rightTrackGenes, setRightTrack] = useState<Array<any>>([]);
  const [rightCanvas, setRightCanvas] = useState<Array<any>>([]);
  const [leftTrackGenes, setLeftTrack] = useState<Array<any>>([]);
  const prevOverflowStrand = useRef<{ [key: string]: any }>({});
  const overflowStrand = useRef<{ [key: string]: any }>({});
  const [canvasRefR, setCanvasRefR] = useState<Array<any>>([]);
  const [canvasRefL, setCanvasRefL] = useState<Array<any>>([]);
  const prevOverflowStrand2 = useRef<{ [key: string]: any }>({});
  const overflowStrand2 = useRef<{ [key: string]: any }>({});

  // These states are used to update the tracks with new fetched data
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track

  function drawCanvas(
    startRange,
    endRange,
    canvasRef: any,
    aggFeatures: Array<any>,
    scales,
    height: number = 40
  ) {
    if (canvasRef.current === null) {
      return;
    }
    let context = canvasRef.current.getContext("2d");
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    for (let i = startRange; i < endRange; i++) {
      if (aggFeatures[i] !== 0) {
        // going through width pixels
        // i = canvas pixel xpos
        const drawY = scales(aggFeatures[i]);
        context.fillStyle = "blue";
        context.fillRect(i, 40 - drawY, 1, drawY);
      }
    }
  }

  function fetchGenomeData(initial: number = 0) {
    // TO - IF STRAND OVERFLOW THEN NEED TO SET TO MAX WIDTH OR 0 to NOT AFFECT THE LOGIC.

    let startPos;
    startPos = start;

    // initialize the first index of the interval so we can start checking for prev overlapping intervals

    if (result.length > 0) {
      var resultIdx = 0;

      // let checking for interval overlapping and determining what level each strand should be on
      for (let i = resultIdx; i < result.length; i++) {
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
    } else {
      return;
    }

    const newCanvasRef = createRef();
    let worker: Worker;

    worker = new Worker(worker_script);
    // fix fetch data to return only one data because right now we sent mutiple fetched data
    worker.postMessage({
      trackGene: result,
      windowWidth: windowWidth,
      bpToPx: bpToPx!,
      bpRegionSize: bpRegionSize!,
      startBpRegion: start,
      trackManagerId,
    });

    // Listen for messages from the web worker
    worker.onmessage = (event) => {
      let converted = event.data;

      var scales = scaleLinear().domain([0, 1]).range([2, 40]).clamp(true);

      setRightTrack((prev) => [
        ...prev,
        { canvasData: converted, scaleData: scales },
      ]);

      if (trackData!.initial) {
        const newCanvasRevRef = createRef();
        prevOverflowStrand2.current = { ...overflowStrand2.current };
        setCanvasRefL((prevRefs) => [...prevRefs, newCanvasRevRef]);

        setLeftTrack([
          ...leftTrackGenes,
          { canvasData: converted, scaleData: scales },
        ]);
        overflowStrand2.current = {};
      }
      worker.terminate();
    };
    setCanvasRefR((prevRefs) => [...prevRefs, newCanvasRef]);

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

    if (result.length > 0) {
      result.sort((a, b) => {
        return b.end - a.end;
      });

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
    let worker: Worker;

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
      let scales = scaleLinear().domain([0, 1]).range([2, 40]).clamp(true);

      setLeftTrack([
        ...leftTrackGenes,
        { canvasData: converted, scaleData: scales },
      ]);
      worker.terminate();
    };
    setCanvasRefL((prevRefs) => [...prevRefs, newCanvasRef]);

    prevOverflowStrand2.current = { ...overflowStrand2.current };

    overflowStrand2.current = {};
  }

  useEffect(() => {
    if (side === "left") {
      if (leftTrackGenes.length != 0) {
        leftTrackGenes.forEach((canvasRef, index) => {
          if (canvasRefL[index].current) {
            let length = leftTrackGenes[index].canvasData.length;
            drawCanvas(
              0,
              length,
              canvasRefL[index],
              leftTrackGenes[index].canvasData,
              leftTrackGenes[index].scaleData
            );
          }
        });
      }
    } else if (side === "right") {
      if (rightTrackGenes.length != 0) {
        rightTrackGenes.forEach((canvasRef, index) => {
          if (canvasRefR[index].current) {
            let length = rightTrackGenes[index].canvasData.length;
            drawCanvas(
              0,
              length,
              canvasRefR[index],
              rightTrackGenes[index].canvasData,
              rightTrackGenes[index].scaleData
            );
          }
        });
      }
    }
  }, [side]);

  useEffect(() => {
    if (trackData!.side === "right") {
      fetchGenomeData();
    } else if (trackData!.side === "left") {
      fetchGenomeData2();
    }
  }, [trackData]);
  useEffect(() => {
    if (rightTrackGenes.length > 0) {
      drawCanvas(
        0,
        windowWidth,
        canvasRefR[canvasRefR.length - 1],
        rightTrackGenes[rightTrackGenes.length - 1].canvasData,
        rightTrackGenes[rightTrackGenes.length - 1].scaleData
      );
    }
  }, [rightTrackGenes]);

  useEffect(() => {
    if (leftTrackGenes.length > 0) {
      drawCanvas(
        0,
        windowWidth,
        canvasRefL[canvasRefL.length - 1],
        leftTrackGenes[leftTrackGenes.length - 1].canvasData,
        leftTrackGenes[leftTrackGenes.length - 1].scaleData
      );
    }
  }, [leftTrackGenes]);
  return (
    <div style={{ display: "flex" }}>
      {/* <button onClick={() => handleDelete(trackIdx)}>Delete</button> */}
      {side === "right"
        ? canvasRefR.map((item, index) => (
            <canvas
              key={"" + index + id}
              ref={item}
              height={"40"}
              width={`${windowWidth}px`}
              style={{}}
            />
          ))
        : canvasRefL.map((item, index) => (
            <canvas
              key={"" + (canvasRefL.length - index - 1) + id}
              ref={canvasRefL[canvasRefL.length - index - 1]}
              height={"40"}
              width={`${windowWidth}px`}
              style={{}}
            />
          ))}
    </div>
  );
});
export default memo(BigWigTrack);
