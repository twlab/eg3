import React, { createRef, memo } from "react";
import { useEffect, useRef, useState } from "react";

const windowWidth = window.innerWidth;
interface BedTrackProps {
  bpRegionSize?: number;
  bpToPx?: number;
  trackData?: { [key: string]: any }; // Replace with the actual type
  side?: string;
}
const BigWigTrack: React.FC<BedTrackProps> = memo(function BigWigTrack({
  bpRegionSize,
  bpToPx,
  trackData,
  side,
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
    console.log(strandLevelList);
    setRightTrack([
      ...rightTrackGenes,
      [
        <SetStrand
          key={getRndInteger()}
          strandPos={strandLevelList}
          checkPrev={prevOverflowStrand.current}
          startTrackPos={end - bpRegionSize!}
        />,
        [...strandLevelList],
        startPos,
      ],
    ]);

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
      setLeftTrack([
        ...leftTrackGenes,
        [
          <SetStrand
            key={getRndInteger()}
            strandPos={strandLevelList}
            checkPrev={prevOverflowStrand.current}
            startTrackPos={start}
          />,
          [...strandLevelList],
          startPos,
        ],
      ]);
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

    setLeftTrack([
      ...leftTrackGenes,
      [
        <SetStrand
          key={getRndInteger()}
          strandPos={strandLevelList}
          checkPrev={prevOverflowStrand2.current}
          startTrackPos={start}
        />,
        [...strandLevelList],
        startPos,
      ],
    ]);

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
    console.log(props.strandPos);

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
                y1={`${0}`}
                x2={`${(singleStrand.end - props.startTrackPos) / bpToPx!}`}
                y2={`${3000}`}
                stroke={"blue"}
                strokeWidth={"20"}
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

  useEffect(() => {
    canvasRefR.map((canvasRef, index) => {
      if (canvasRef.current) {
        let context = canvasRef.current.getContext("2d");
        for (let i = 0; i < rightTrackGenes[index][1].length; i++) {
          let startPos = rightTrackGenes[index][2];
          for (let j = 0; j < rightTrackGenes[index][1][i].length; j++) {
            let singleStrand = rightTrackGenes[index][1][i][j];
            context.fillStyle = "red";

            context.fillRect(
              (singleStrand.start - startPos) / bpToPx!,
              70,
              (singleStrand.end - startPos) / bpToPx! -
                (singleStrand.start - startPos) / bpToPx!,
              80
            );
          }
        }
      }
    });
  }, [rightTrackGenes]);

  useEffect(() => {
    canvasRefL.map((canvasRef, index) => {
      if (canvasRef.current) {
        let context =
          canvasRefL[canvasRefL.length - 1 - index].current.getContext("2d");
        let idx = leftTrackGenes.length - 1;
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        for (let i = 0; i < leftTrackGenes[index][1].length; i++) {
          let startPos = leftTrackGenes[index][2];
          for (let j = 0; j < leftTrackGenes[index][1][i].length; j++) {
            let singleStrand = leftTrackGenes[index][1][i][j];
            context.fillStyle = "red";

            context.fillRect(
              (singleStrand.start - startPos) / bpToPx!,
              10,
              (singleStrand.end - startPos) / bpToPx! -
                (singleStrand.start - startPos) / bpToPx!,
              80
            );
          }
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
        console.log(trackData);
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
            <svg
              key={index}
              width={`${windowWidth * 2}px`}
              height={"50%"}
              style={{ display: "inline-block" }}
              overflow="visible"
            >
              <line
                x1={`0`}
                y1="0"
                x2={`${windowWidth * 2}px`}
                y2={"0"}
                stroke="gray"
                strokeWidth="3"
              />
              <line
                x1={`${windowWidth * 2}px`}
                y1="0"
                x2={`${windowWidth * 2}px`}
                y2={"100%"}
                stroke="gray"
                strokeWidth="3"
              />

              {/* {item[0]} */}

              <foreignObject
                x="0"
                y="55%"
                width={`${windowWidth * 2}px`}
                height="100%"
              >
                <canvas
                  id="canvas1"
                  key={index}
                  ref={canvasRefR[index]}
                  height={"100%"}
                  width={`${windowWidth * 2}px`}
                  style={{}}
                />
              </foreignObject>
            </svg>
          ))
        : leftTrackGenes.map((item, index) => (
            <svg
              key={index}
              width={`${windowWidth * 2}px`}
              height={"50%"}
              style={{ display: "inline-block" }}
              overflow="visible"
            >
              <line
                x1={`0`}
                y1="0"
                x2={`${windowWidth * 2}px`}
                y2={"0"}
                stroke="gray"
                strokeWidth="3"
              />
              <line
                x1={`${windowWidth * 2}px`}
                y1="0"
                x2={`${windowWidth * 2}px`}
                y2={"100%"}
                stroke="gray"
                strokeWidth="3"
              />

              <foreignObject
                x="0"
                y="55%"
                width={`${windowWidth * 2}px`}
                height="100%"
              >
                <canvas
                  id="canvas2"
                  key={index}
                  ref={canvasRefL[index]}
                  height={"100%"}
                  width={`${windowWidth * 2}px`}
                  style={{}}
                />
              </foreignObject>
            </svg>
          ))}
    </div>
  );
});
export default memo(BigWigTrack);
