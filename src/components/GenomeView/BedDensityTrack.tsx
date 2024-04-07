import React, { createRef } from "react";
import { useEffect, useRef, useState } from "react";
import GetBedData from "./getRemoteData/tabixSource";
const AWS_API = "https://lambda.epigenomegateway.org/v2";
const requestAnimationFrame = window.requestAnimationFrame;
const cancelAnimationFrame = window.cancelAnimationFrame;
const windowWidth = window.innerWidth;
function BedTrack(props) {
  //To-Do: need to move this part to initial render so this section only run once
  const genome = props.currGenome;

  const [region, coord] = genome.defaultRegion.split(":");
  const [leftStartStr, rightStartStr] = coord.split("-");
  const leftStartCoord = Number(leftStartStr);
  const rightStartCoord = Number(rightStartStr);
  const bpRegionSize = (rightStartCoord - leftStartCoord) * 2;
  const bpToPx = bpRegionSize / (windowWidth * 2);
  //useRef to store data between states without re render the component
  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates
  const block = useRef<HTMLInputElement>(null);
  const frameID = useRef(0);
  const lastX = useRef(0);
  const dragX = useRef(0);
  const [rightTrackGenes, setRightTrack] = useState<Array<any>>([]);
  const [leftTrackGenes, setLeftTrack] = useState<Array<any>>([]);
  const prevOverflowStrand = useRef<{ [key: string]: any }>({});
  const overflowStrand = useRef<{ [key: string]: any }>({});
  const [canvasRefR, setCanvasRefR] = useState<Array<any>>([]);
  const [canvasRefL, setCanvasRefL] = useState<Array<any>>([]);
  const prevOverflowStrand2 = useRef<{ [key: string]: any }>({});
  const overflowStrand2 = useRef<{ [key: string]: any }>({});
  const [trackRegionR, setTrackRegionR] = useState<Array<any>>([]);
  const [trackRegionL, setTrackRegionL] = useState<Array<any>>([]);
  const [side, setSide] = useState("right");

  const [canvasRdy, setCanvas] = useState(false);
  // These states are used to update the tracks with new fetched data
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track
  const [isDragging, setDragging] = useState(false);
  const [rightSectionSize, setRightSectionSize] = useState<Array<any>>([
    "",
    "",
  ]);
  const [leftSectionSize, setLeftSectionSize] = useState<Array<any>>(["", ""]);

  const [genomeTrack, setGenomeTrack] = useState("right");
  const [addNewBpRegionLeft, setAddNewBpRegionLeft] = useState(false);
  const [addNewBpRegionRight, setAddNewBpRegionRight] = useState(false);
  const [maxBp, setMaxBp] = useState(
    rightStartCoord + (rightStartCoord - leftStartCoord)
  );
  const [minBp, setMinBp] = useState(leftStartCoord);

  function handleMove(e) {
    if (!isDragging) {
      return;
    }
    const deltaX = lastX.current - e.pageX;

    lastX.current = e.pageX;
    dragX.current -= deltaX;

    //can change speed of scroll by mutipling dragX.current by 0.5 when setting the track position
    cancelAnimationFrame(frameID.current);
    frameID.current = requestAnimationFrame(() => {
      block.current!.style.transform = `translate3d(${dragX.current}px, 0px, 0)`;
    });
  }

  function handleMouseDown(e: { pageX: number; preventDefault: () => void }) {
    lastX.current = e.pageX;

    setDragging(true);
    e.preventDefault();
  }

  function getRndInteger(min = 0, max = 10000000000) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
  function handleMouseUp() {
    setDragging(false);
    if (dragX.current > 0 && side === "right") {
      setSide("left");
    } else if (dragX.current <= 0 && side === "left") {
      console.log("wtf");
      setSide("right");
    } else {
      if (
        -dragX.current / windowWidth >= 2 * (rightSectionSize.length - 2) &&
        dragX.current < 0
      ) {
        setAddNewBpRegionRight(true);
      } else if (
        //need to add windowwith when moving left is because when the size of track is 2x it misalign the track because its already halfway
        //so we need to add to keep the position correct.
        (dragX.current + windowWidth) / windowWidth >=
          2 * (leftSectionSize.length - 3) &&
        dragX.current > 0
      ) {
        setAddNewBpRegionLeft(true);
      }
    }
  }
  async function fetchGenomeData(initial: number = 0) {
    // TO - IF STRAND OVERFLOW THEN NEED TO SET TO MAX WIDTH OR 0 to NOT AFFECT THE LOGIC.
    let userRespond;
    let startPos;
    if (initial) {
      userRespond = await GetBedData(
        "https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands.bed.gz",
        region,
        minBp,
        maxBp
      );
      startPos = minBp;
    } else {
      userRespond = await GetBedData(
        "https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands.bed.gz",
        region,
        maxBp - bpRegionSize,
        maxBp
      );
      startPos = maxBp - bpRegionSize;
    }

    var result = await userRespond;

    var strandIntervalList: Array<any> = [];
    // initialize the first index of the interval so we can start checking for prev overlapping intervals
    console.log(result);
    if (result[0]) {
      result = result[0];
      var resultIdx = 0;
      console.log(result);
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

    setRightTrack([
      ...rightTrackGenes,
      [
        <SetStrand
          key={getRndInteger()}
          strandPos={strandLevelList}
          checkPrev={prevOverflowStrand.current}
          startTrackPos={maxBp - bpRegionSize}
        />,
        [...strandLevelList],
        startPos,
      ],
    ]);

    const newCanvasRef = createRef();
    setCanvasRefR((prevRefs) => [...prevRefs, newCanvasRef]);

    setTrackRegionR([
      ...trackRegionR,
      <text fontSize={30} x={200} y={100} fill="black">
        {`${maxBp - bpRegionSize} - ${maxBp}`}
      </text>,
    ]);
    // CHECK if there are overlapping strands to the next track
    for (var i = 0; i < strandLevelList.length; i++) {
      const levelContent = strandLevelList[i];
      for (var strand of levelContent) {
        if (strand.end > maxBp) {
          const strandId = strand.start + strand.end;
          overflowStrand.current[strandId] = {
            level: i,
            strand: strand,
          };
        }
      }
    }

    if (initial) {
      setLeftTrack([
        ...leftTrackGenes,
        [
          <SetStrand
            key={getRndInteger()}
            strandPos={strandLevelList}
            checkPrev={prevOverflowStrand.current}
            startTrackPos={minBp}
          />,
          [...strandLevelList],
          startPos,
        ],
      ]);
      const newCanvasRef = createRef();
      setCanvasRefL((prevRefs) => [...prevRefs, newCanvasRef]);

      setTrackRegionL([
        ...trackRegionL,
        <text fontSize={30} x={200} y={100} fill="black">
          {`${minBp} - ${maxBp}`}
        </text>,
        <text fontSize={30} x={200} y={100} fill="black">
          {`${minBp - bpRegionSize} - ${minBp}`}
        </text>,
      ]);
      setMinBp(minBp - bpRegionSize);
    }
    prevOverflowStrand.current = { ...overflowStrand.current };
    overflowStrand.current = {};
    setMaxBp(maxBp + bpRegionSize);
  }

  //________________________________________________________________________________________________________________________________________________________
  //________________________________________________________________________________________________________________________________________________________

  async function fetchGenomeData2() {
    const userRespond = await GetBedData(
      "https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands.bed.gz",
      region,
      minBp,
      minBp + bpRegionSize
    );
    let result = await userRespond;
    let startPos = minBp;
    var strandIntervalList: Array<any> = [];
    result.sort((a, b) => {
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
          startTrackPos={minBp}
        />,
        [...strandLevelList],
        startPos,
      ],
    ]);

    const newCanvasRef = createRef();
    setCanvasRefL((prevRefs) => [...prevRefs, newCanvasRef]);
    setTrackRegionL([
      ...trackRegionL,
      <text fontSize={30} x={200} y={100} fill="black">
        {`${minBp} - ${minBp + bpRegionSize}`}
      </text>,
    ]);
    for (var i = 0; i < strandLevelList.length; i++) {
      var levelContent = strandLevelList[i];
      for (var strand of levelContent) {
        if (strand.start < minBp) {
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

    setMinBp(minBp - bpRegionSize);
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
                x1={`${(singleStrand.start - props.startTrackPos) / bpToPx}`}
                y1={`${yCoord}`}
                x2={`${(singleStrand.end - props.startTrackPos) / bpToPx}`}
                y2={`${yCoord}`}
                stroke={"blue"}
                strokeWidth="20"
              />
            </React.Fragment>
          );
        }

        yCoord += 25;

        strandList.push(strandHtml);
      }
    }

    return strandList.map((item, index) => (
      <React.Fragment key={index}>{item}</React.Fragment>
    ));
  }

  useEffect(() => {
    // Access the context and draw shapes for each canvas
    // canvasRefR.map((canvasRef, index) => {
    //   if (canvasRef.current) {
    //     let context = canvasRef.current.getContext("2d");
    //     // Example: Draw a rectangle

    //     for (let i = 0; i < rightTrackGenes[index][1].length; i++) {
    //       let startPos = rightTrackGenes[i][2];
    //       for (let j = 0; j < rightTrackGenes[index][1][i].length; j++) {
    //         let singleStrand = rightTrackGenes[index][1][i][j];
    //         context.fillStyle = "red";
    //         console.log(
    //           (singleStrand.start - startPos) / bpToPx,
    //           (singleStrand.end - startPos) / bpToPx -
    //             (singleStrand.start - startPos) / bpToPx
    //         );
    //         context.fillRect(
    //           (singleStrand.start - startPos) / bpToPx,
    //           10,
    //           (singleStrand.end - startPos) / bpToPx -
    //             (singleStrand.start - startPos) / bpToPx,
    //           50
    //         );
    //       }
    //     }
    //   }
    // });
    //ERASE ELEMNTS FROM THE LEFT TRACK WHEN WE ADD A NEW TRACK FROM THE RIGHT
    //FIND A WAY TO MAKE IT WORK all the time
    //maybe clear before setting
    console.log(canvasRefR, side);
    canvasRefR.map((canvasRef, index) => {
      if (canvasRef.current) {
        let context = canvasRef.current.getContext("2d");
        for (let i = 0; i < rightTrackGenes[index][1].length; i++) {
          let startPos = rightTrackGenes[index][2];
          for (let j = 0; j < rightTrackGenes[index][1][i].length; j++) {
            let singleStrand = rightTrackGenes[index][1][i][j];
            context.fillStyle = "red";

            context.fillRect(
              (singleStrand.start - startPos) / bpToPx,
              10,
              (singleStrand.end - startPos) / bpToPx -
                (singleStrand.start - startPos) / bpToPx,
              50
            );
          }
        }
      }
    });
  }, [rightTrackGenes]);

  useEffect(() => {
    console.log(canvasRefL, side);
    canvasRefL.map((canvasRef, index) => {
      if (canvasRef.current) {
        let context = canvasRef.current.getContext("2d");

        context.fillStyle = "green";
        context.fillRect(20, 20, 50, 50);
      }
    });
  }, [leftTrackGenes]);

  useEffect(() => {
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    async function getData() {
      await fetchGenomeData(1);
    }
    getData();
  }, []);

  useEffect(() => {
    if (addNewBpRegionRight) {
      console.log("trigger right");
      async function handle() {
        setRightSectionSize((prevStrandInterval) => {
          const t = [...prevStrandInterval];
          t.push("");
          return t;
        });
        await fetchGenomeData();
      }
      handle();
    }
    setAddNewBpRegionRight(false);
  }, [addNewBpRegionRight]);

  useEffect(() => {
    if (addNewBpRegionLeft) {
      console.log("trigger left");
      setLeftSectionSize((prevStrandInterval) => {
        const t = [...prevStrandInterval];
        t.push("");
        return t;
      });
      fetchGenomeData2();
    }
    setAddNewBpRegionLeft(false);
  }, [addNewBpRegionLeft]);

  useEffect(() => {
    if (side === "left") {
      console.log("IT SHOUID WORKKKKKKKKKKKK");
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
            console.log(canvasRefR);
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

  return (
    <div
      style={{
        height: "200px",
        flexDirection: "row",
        whiteSpace: "nowrap",
        //not using flex allows us to keep the position of the track

        overflow: "hidden",
        margin: "auto",
      }}
    >
      {dragX.current <= 0 ? (
        <div>{dragX.current}</div>
      ) : (
        <div>{dragX.current + windowWidth}</div>
      )}
      <div>{side}</div>
      <div
        style={{
          flex: "1",
          display: "flex",
          justifyContent: dragX.current <= 0 ? "start" : "end",
          height: "200px",
          flexDirection: "row",
          whiteSpace: "nowrap",
          // div width has to match a single track width or the alignment will be off
          // in order to smoothly tranverse need to fetch info offscreen maybe?????
          // 1. try add more blocks so the fetch is offscreen
          width: `${windowWidth * 2}px`,
          backgroundColor: "pink",
          overflow: "hidden",
          margin: "auto",
        }}
      >
        <div ref={block} onMouseDown={handleMouseDown} style={{}}>
          {dragX.current <= 0
            ? rightTrackGenes.map((item, index) => (
                <svg
                  key={index}
                  width={`${windowWidth * 2}px`}
                  height={"100%"}
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
                  <line
                    x1={`0`}
                    y1={"100%"}
                    x2={`${windowWidth * 2}px`}
                    y2={"100%"}
                    stroke="gray"
                    strokeWidth="3"
                  />

                  {item[0]}

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
                  {trackRegionR[index]}
                </svg>
              ))
            : leftTrackGenes
                .slice(0)
                .reverse()
                .map((item, index) => (
                  <svg
                    key={index}
                    width={`${windowWidth * 2}px`}
                    height={"100%"}
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
                    <line
                      x1={`0`}
                      y1={"100%"}
                      x2={`${windowWidth * 2}px`}
                      y2={"100%"}
                      stroke="gray"
                      strokeWidth="3"
                    />
                    {item[0]}
                    <foreignObject
                      x="0"
                      y="55%"
                      width={`${windowWidth * 2}px`}
                      height="100%"
                    >
                      <canvas
                        id="canvas2"
                        key={index}
                        ref={canvasRefL[canvasRefL.length - 1 - index]}
                        height={"100%"}
                        width={`${windowWidth * 2}px`}
                        style={{}}
                      />
                    </foreignObject>

                    {trackRegionL.slice(0).reverse()[index]}
                  </svg>
                ))}
        </div>
      </div>
    </div>
  );
}

export default BedTrack;
