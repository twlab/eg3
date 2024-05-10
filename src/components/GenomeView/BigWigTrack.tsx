import { scaleLinear } from "d3-scale";
import React, { createRef, memo } from "react";
import { useEffect, useRef, useState } from "react";

interface BedTrackProps {
  bpRegionSize?: number;
  bpToPx?: number;
  trackData?: { [key: string]: any }; // Replace with the actual type
  side?: string;
  windowWidth?: number;
}
const BigWigTrack: React.FC<BedTrackProps> = memo(function BigWigTrack({
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
    result = trackData!.bigWigResult;
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
  const [canvasRefL, setCanvasRefL] = useState<Array<any>>([]);
  const prevOverflowStrand2 = useRef<{ [key: string]: any }>({});
  const overflowStrand2 = useRef<{ [key: string]: any }>({});
  var scale = scaleLinear().domain([0, 1]).range([2, 40]).clamp(true);
  // These states are used to update the tracks with new fetched data
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track

  function getRndInteger(min = 0, max = 10000000000) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  async function fetchGenomeData(initial: number = 0) {
    // TO - IF STRAND OVERFLOW THEN NEED TO SET TO MAX WIDTH OR 0 to NOT AFFECT THE LOGIC.

    let startPos;
    startPos = start;

    var strandIntervalList: Array<any> = [];
    // initialize the first index of the interval so we can start checking for prev overlapping intervals

    if (result[0]) {
      result = result[0];
      var resultIdx = 0;

      if (
        resultIdx < result.length &&
        !(
          result[resultIdx].start + result[resultIdx].end in
          prevOverflowStrand.current
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
          prevOverflowStrand.current
      ) {
        strandIntervalList.push([
          result[resultIdx].start,
          result[resultIdx].end,
          new Array<any>(),
        ]);

        while (
          strandIntervalList[resultIdx][2].length <
          prevOverflowStrand.current[
            result[resultIdx].start + result[resultIdx].end
          ].level
        ) {
          strandIntervalList[resultIdx][2].push({});
        }
        strandIntervalList[resultIdx][2].splice(
          prevOverflowStrand.current[
            result[resultIdx].start + result[resultIdx].end
          ].level,
          0,
          prevOverflowStrand.current[
            result[resultIdx].start + result[resultIdx].end
          ].strand
        );
      }

      // let checking for interval overlapping and determining what level each strand should be on
      for (let i = resultIdx + 1; i < result.length; i++) {
        var idx = strandIntervalList.length - 1;
        const curStrand = result[i];
        var curHighestLvl = [idx, strandIntervalList[idx][2]];

        // if current starting coord is less than previous ending coord then they overlap
        if (curStrand.start <= strandIntervalList[idx][1]) {
          // combine the intervals into one larger interval that encompass the strands
          if (curStrand.end > strandIntervalList[idx][1]) {
            strandIntervalList[idx][1] = curStrand.end;
          }
          const curStrandId = curStrand.start + curStrand.end;
          //NOW CHECK IF THE STRAND IS OVERFLOWING FROM THE LAST TRACK
          if (curStrandId in prevOverflowStrand.current) {
            while (
              strandIntervalList[idx][2].length <
              prevOverflowStrand.current[curStrandId].level
            ) {
              strandIntervalList[idx][2].push({});
            }
            strandIntervalList[idx][2].splice(
              prevOverflowStrand.current[curStrandId].level,
              0,
              prevOverflowStrand.current[curStrandId].strand
            );

            idx--;
            while (
              idx >= 0 &&
              prevOverflowStrand.current[curStrandId].strand.start <=
                strandIntervalList[idx][1]
            ) {
              if (
                strandIntervalList[idx][2].length >
                prevOverflowStrand.current[curStrandId].level
              ) {
                if (curStrand.end > strandIntervalList[idx][1]) {
                  strandIntervalList[idx][1] = curStrand.end;
                }
                strandIntervalList[idx][2].splice(
                  prevOverflowStrand.current[curStrandId].level,
                  0,
                  new Array<any>()
                );
              }
              idx--;
            }
            continue;
          }

          //loop to check which other intervals the current strand overlaps
          while (idx >= 0 && curStrand.start <= strandIntervalList[idx][1]) {
            if (strandIntervalList[idx][2].length > curHighestLvl[1].length) {
              if (curStrand.end > strandIntervalList[idx][1]) {
                strandIntervalList[idx][1] = curStrand.end;
              }
              curHighestLvl = [idx, strandIntervalList[idx][2]];
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

    //SORT our interval data into levels to be place on the track
    const strandLevelList: Array<any> = [];
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

    setRightTrack([...rightTrackGenes, [[...strandLevelList], startPos]]);

    const newCanvasRef = createRef();
    setCanvasRefR((prevRefs) => [...prevRefs, newCanvasRef]);

    // CHECK if there are overlapping strands to the next track
    for (var i = 0; i < strandLevelList.length; i++) {
      const levelContent = strandLevelList[i];
      for (var strand of levelContent) {
        if (strand.end > end) {
          const strandId = strand.start + strand.end;
          overflowStrand.current[strandId] = {
            level: i,
            strand: strand,
          };
        }
      }
    }

    if (trackData!.initial) {
      for (var i = 0; i < strandLevelList.length; i++) {
        var levelContent = strandLevelList[i];
        for (var strand of levelContent) {
          if (strand.txStart < start) {
            overflowStrand2.current[strand.id] = {
              level: i,
              strand: strand,
            };
          }
        }
      }

      prevOverflowStrand2.current = { ...overflowStrand2.current };

      overflowStrand2.current = {};
      setLeftTrack([...leftTrackGenes, [[...strandLevelList], startPos]]);
      const newCanvasRef = createRef();
      setCanvasRefL((prevRefs) => [...prevRefs, newCanvasRef]);
    }
    prevOverflowStrand.current = { ...overflowStrand.current };
    overflowStrand.current = {};
  }

  //________________________________________________________________________________________________________________________________________________________
  //________________________________________________________________________________________________________________________________________________________

  async function fetchGenomeData2() {
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

  useEffect(() => {
    // to find the "xSpan" or the x coord of the canvas and svg. They start at 0 - the windowwith * 2 for this setup
    //     x1={`${(singleStrand.start - props.startTrackPos) / bpToPx!}`
    // x2={`${(singleStrand.end - props.startTrackPos) / bpToPx!}`}
    // step 1: loop through the svg width which is windowwith * 2
    // 2: create an array for each x pixel.
    // 3: round each strand start and end xspan
    // 4: If a strand is in the same xspan pixel then add them to a array index
    // 5: the array index will represent the x coord pixel of the canvas and svg
    let xToFeatures: Array<any> = [];
    for (let i = 0; i < rightTrackGenes.length; i++) {
      const newArr: Array<any> = Array.from(
        { length: windowWidth * 2 },
        () => []
      );
      xToFeatures.push(newArr);
    }

    for (let i = 0; i < rightTrackGenes.length; i++) {
      let startPos = rightTrackGenes[i][1];
      for (let j = 0; j < rightTrackGenes[i][0].length; j++) {
        for (let x = 0; x < rightTrackGenes[i][0][j].length; x++) {
          let singleStrand = rightTrackGenes[i][0][j][x];

          if (Object.keys(singleStrand).length > 0) {
            let xSpanStart = (singleStrand.start - startPos) / bpToPx!;
            let xSpanEnd = (singleStrand.end - startPos) / bpToPx!;
            const startX = Math.max(0, Math.floor(xSpanStart));
            const endX = Math.min(windowWidth * 2 - 1, Math.ceil(xSpanEnd));
            for (let x = startX; x <= endX; x++) {
              xToFeatures[i][x].push(singleStrand);
            }
          }
        }
      }
    }
    for (let i = 0; i < xToFeatures.length; i++) {
      for (let j = 0; j < xToFeatures[i].length; j++) {
        let sum = 0;

        for (let x = 0; x < xToFeatures[i][j].length; x++) {
          sum += xToFeatures[i][j][x].score;
        }
        let avg = 0;
        if (xToFeatures[i][j].length > 0) {
          avg = sum / xToFeatures[i][j].length;
        }

        avg = scale(avg);

        xToFeatures[i][j] = avg;
      }
    }

    canvasRefR.map((canvasRef, index) => {
      if (canvasRef.current) {
        let context = canvasRef.current.getContext("2d");

        context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        for (let i = 0; i < xToFeatures[index].length; i++) {
          // going through width pixels
          // i = canvas pixel xpos
          context.fillStyle = "blue";
          context.globalAlpha = 1;

          context.fillRect(
            i,
            40 - xToFeatures[index][i],
            1,
            xToFeatures[index][i]
          );
        }
      }
    });
  }, [rightTrackGenes]);

  useEffect(() => {
    let xToFeatures: Array<any> = [];
    for (let i = 0; i < leftTrackGenes.length; i++) {
      const newArr: Array<any> = Array.from(
        { length: windowWidth * 2 },
        () => []
      );
      xToFeatures.push(newArr);
    }

    for (let i = 0; i < leftTrackGenes.length; i++) {
      let startPos = leftTrackGenes[i][1];
      for (let j = 0; j < leftTrackGenes[i][0].length; j++) {
        for (let x = 0; x < leftTrackGenes[i][0][j].length; x++) {
          let singleStrand = leftTrackGenes[i][0][j][x];

          if (Object.keys(singleStrand).length > 0) {
            let xSpanStart = (singleStrand.start - startPos) / bpToPx!;
            let xSpanEnd = (singleStrand.end - startPos) / bpToPx!;
            const startX = Math.max(0, Math.floor(xSpanStart));
            const endX = Math.min(windowWidth * 2 - 1, Math.ceil(xSpanEnd));
            for (let x = startX; x <= endX; x++) {
              xToFeatures[i][x].push(singleStrand);
            }
          }
        }
      }
    }

    for (let i = 0; i < xToFeatures.length; i++) {
      for (let j = 0; j < xToFeatures[i].length; j++) {
        let sum = 0;

        for (let x = 0; x < xToFeatures[i][j].length; x++) {
          sum += xToFeatures[i][j][x].score;
        }
        let avg = 0;
        if (xToFeatures[i][j].length > 0) {
          avg = sum / xToFeatures[i][j].length;
        }

        avg = scale(avg);

        xToFeatures[i][j] = avg;
      }
    }
    canvasRefL.map((canvasRef, index) => {
      if (canvasRefL[canvasRefL.length - 1 - index].current) {
        let context =
          canvasRefL[canvasRefL.length - 1 - index].current.getContext("2d");

        context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        for (let i = 0; i < xToFeatures[index].length; i++) {
          // going through width pixels
          // i = canvas pixel xpos
          context.fillStyle = "blue";
          context.globalAlpha = 1;
          context.fillRect(
            i,
            40 - xToFeatures[index][i],
            1,
            xToFeatures[index][i]
          );
        }
      }
    });
  }, [leftTrackGenes]);

  useEffect(() => {
    if (side === "left") {
      if (canvasRefL.length != 0) {
        canvasRefL.forEach((canvasRef, index) => {
          if (canvasRef.current) {
            let context = canvasRef.current.getContext("2d");
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
    } else if (side === "right") {
      if (canvasRefR.length != 0) {
        canvasRefR.forEach((canvasRef, index) => {
          if (canvasRef.current) {
            let context = canvasRef.current.getContext("2d");

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
      if (trackData!.location && trackData!.side === "right") {
        fetchGenomeData();
      } else if (trackData!.location && trackData!.side === "left") {
        fetchGenomeData2();
      }
    }
    handle();
  }, [trackData]);

  return (
    <div>
      {side === "right"
        ? rightTrackGenes.map((item, index) => (
            <canvas
              id="canvas1"
              key={index}
              ref={canvasRefR[index]}
              height={"100"}
              width={`${windowWidth * 2}px`}
              style={{}}
            />
          ))
        : leftTrackGenes.map((item, index) => (
            <canvas
              id="canvas2"
              key={index + 232323232323233}
              ref={canvasRefL[index]}
              height={"100"}
              width={`${windowWidth * 2}px`}
              style={{}}
            />
          ))}
    </div>
  );
});
export default memo(BigWigTrack);
