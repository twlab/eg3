import { scaleLinear } from "d3-scale";
import React, { createRef, memo } from "react";
import { useEffect, useRef, useState } from "react";
const CHROMOSOMES_Y = 60;
const TOP_PADDING = 2;
export const MAX_PIXELS_PER_BASE_NUMERIC = 0.5;

export const DEFAULT_OPTIONS = {
  aggregateMethod: "mean",
  height: 40,
  color: "blue",
  color2: "darkorange",
  yScale: "auto",
  yMax: 0.25,
  yMin: -0.25,
};

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
    [start, end] = trackData!.location.split(":");
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
    const newCanvasRef2 = createRef();
    setCanvasRefR((prevRefs) => [...prevRefs, newCanvasRef]);
    setCanvasRefR2((prevRefs) => [...prevRefs, newCanvasRef2]);
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
  function SetStrand(props) {
    //TO- DO FIX Y COORD ADD SPACE EVEN WHEN THERES NO STRAND ON LEVEL
    var yCoord = 25;
    const strandList: Array<any> = [];

    if (props.strandPos.length) {
      var checkObj = false;
      if (props.checkPrev !== undefined) {
        checkObj = true;
      }
      for (let i = 0; i < props.strandPos.length; i++) {
        let strandHtml: Array<any> = [];

        for (let j = 0; j < props.strandPos[i].length; j++) {
          const singleStrand = props.strandPos[i][j];

          if (
            Object.keys(singleStrand).length === 0 ||
            (checkObj && singleStrand.id in props.checkPrev)
          ) {
            continue;
          }

          //add a single strand to current track------------------------------------------------------------------------------------
          strandHtml.push(
            <React.Fragment key={j}>
              <line
                x1={`${(singleStrand.start - props.startTrackPos) / bpToPx!}`}
                y1={`${yCoord}`}
                x2={`${(singleStrand.end - props.startTrackPos) / bpToPx!}`}
                y2={`${yCoord}`}
              />
            </React.Fragment>
          );
        }

        strandList.push(strandHtml);
      }
    }

    return strandList.map((item, index) => (
      <React.Fragment key={index}>{item}</React.Fragment>
    ));
  }
  function averagFeatureHeight(data: any) {
    let xToFeatures: Array<Array<any>> = [];
    for (let i = 0; i < data.length; i++) {
      const newArr: Array<any> = Array.from(
        { length: Number(windowWidth * 2) },
        () => []
      );
      xToFeatures.push(newArr);
    }
    console.log(xToFeatures);
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].length; j++) {
        let singleStrand = data[i][j];

        if (Object.keys(singleStrand).length > 0) {
          let xSpanStart =
            (singleStrand.start - rightTrackGenes[i][1]) / bpToPx!;
          let xSpanEnd = (singleStrand.end - rightTrackGenes[i][1]) / bpToPx!;
          const startX = Math.max(0, Math.floor(xSpanStart));
          const endX = Math.min(windowWidth * 2 - 1, Math.ceil(xSpanEnd));

          for (let x = startX; x <= endX; x++) {
            xToFeatures[i][x].push(singleStrand);
          }
        }
      }
    }
    console.log(xToFeatures);
    return xToFeatures;
  }
  function xAvg(data: any) {
    let max = 0;
    let min = 0;
    console.log(data);
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].length; j++) {
        let sum = 0;

        for (let x = 0; x < data[i][j].length; x++) {
          sum += data[i][j][x].score;
        }
        let avgPos = 0;
        if (data[i][j].length > 0) {
          avgPos = sum / data[i][j].length;
        }

        if (avgPos > max) {
          max = avgPos;
        }
        if (avgPos < min) {
          min = avgPos;
        }
        data[i][j] = avgPos;
      }
    }

    return [data, max, min];
  }
  function scaleX(data: any) {
    console.log(data);
    var scale = scaleLinear()
      .domain([-data[1], data[1]])
      .range([2, 20])
      .clamp(true);
    for (let i = 0; i < data[0].length; i++) {
      for (let j = 0; j < data[0][i].length; j++) {
        if (data[0][i][j] !== 0) {
          data[0][i][j] = scale(data[0][i][j]);
        }
      }
    }
    return data;
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
      let dataForward: Array<any> = [];
      let dataReverse: Array<any> = [];
      for (let i = 0; i < rightTrackGenes.length; i++) {
        const newArr: Array<any> = [];
        dataForward.push(newArr);
        const newArr2: Array<any> = [];
        dataReverse.push(newArr2);
      }
      console.log(rightTrackGenes);
      for (let i = 0; i < rightTrackGenes.length; i++) {
        let startPos = rightTrackGenes[i][1];
        for (let j = 0; j < rightTrackGenes[i][0].length; j++) {
          for (let x = 0; x < rightTrackGenes[i][0][j].length; x++) {
            let singleStrand = rightTrackGenes[i][0][j][x];
            if (singleStrand.score < 0) {
              dataReverse[i].push(singleStrand);
            } else {
              dataForward[i].push(singleStrand);
            }
            //   if (Object.keys(singleStrand).length > 0) {
            //     let xSpanStart = (singleStrand.start - startPos) / bpToPx!;
            //     let xSpanEnd = (singleStrand.end - startPos) / bpToPx!;
            //     const startX = Math.max(0, Math.floor(xSpanStart));
            //     const endX = Math.min(windowWidth * 2 - 1, Math.ceil(xSpanEnd));
            //     for (let x = startX; x <= endX; x++) {
            //       xToFeatures[i][x].push(singleStrand);
            //     }
            //   }
          }
        }
      }

      let featureForward = averagFeatureHeight(dataForward);
      let featureReverse = averagFeatureHeight(dataReverse);

      let avgPos = xAvg(featureForward);
      let avgNeg = xAvg(featureReverse);
      avgNeg[1] = avgPos[1];
      avgNeg[2] = avgPos[2];
      let resultPos = scaleX(avgPos);
      let resultNeg = scaleX(avgNeg);

      canvasRefR.map((canvasRef, index) => {
        if (canvasRef.current) {
          let context = canvasRef.current.getContext("2d");

          context.clearRect(0, 0, context.canvas.width, context.canvas.height);

          for (let i = 0; i < featureForward[index].length; i++) {
            // going through width pixels
            // i = canvas pixel xpos
            context.fillStyle = "blue";

            context.fillRect(
              i,
              20 - featureForward[index][i],
              1,
              featureForward[index][i]
            );
          }
        }
      });

      canvasRefR2.map((canvasRef, index) => {
        if (canvasRef.current) {
          let context = canvasRef.current.getContext("2d");

          context.clearRect(0, 0, context.canvas.width, context.canvas.height);

          for (let i = 0; i < featureReverse[index].length; i++) {
            // going through width pixels
            // i = canvas pixel xpos
            if (featureReverse[index][i] !== 0) {
              console.log(featureReverse[index][i]);
              context.fillStyle = "red";

              context.fillRect(i, 0, 1, featureReverse[index][i]);
            }
          }
        }
      });
    }
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
        let avgPos = 0;
        if (xToFeatures[i][j].length > 0) {
          avgPos = sum / xToFeatures[i][j].length;
        }

        avgPos = scale(avgPos);

        xToFeatures[i][j] = avgPos;
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
    async function handle() {
      if (trackData!.location && trackData!.side === "right") {
        fetchGenomeData();
      } else if (trackData!.location && trackData!.side === "left") {
        fetchGenomeData2();
      }
    }
    handle();
  }, [trackData]);

  return (
    <div style={{ display: "flex", height: "40px", border: "2px solid black" }}>
      {side === "right" ? (
        <div style={{ display: "flex", flexDirection: "row" }}>
          {rightTrackGenes.map((item, index) => (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <canvas
                key={index}
                ref={canvasRefR[index]}
                height={"20"}
                width={`${windowWidth * 2}px`}
                style={{}}
              />
              <canvas
                key={index + 2}
                ref={canvasRefR2[index]}
                height={"20"}
                width={`${windowWidth * 2}px`}
                style={{}}
              />
            </div>
          ))}
        </div>
      ) : (
        leftTrackGenes.map((item, index) => (
          <canvas
            key={index}
            ref={canvasRefL[index]}
            height={"100"}
            width={`${windowWidth * 2}px`}
            style={{}}
          />
        ))
      )}
    </div>
  );
});
export default memo(DynseqTrack);
