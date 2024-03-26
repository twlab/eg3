import React from "react";
import { useEffect, useRef, useState } from "react";

let curColor = "blue";
let curColor2 = "black";
const AWS_API = "https://lambda.epigenomegateway.org/v2";
const requestAnimationFrame = window.requestAnimationFrame;
const cancelAnimationFrame = window.cancelAnimationFrame;
const windowWidth = window.innerWidth;
function GenRefTrack(props) {
  //To-Do: need to move this part to initial render so this section only run once
  let genome = props.currGenome;

  const [region, coord] = genome.defaultRegion.split(":");
  const [leftStartStr, rightStartStr] = coord.split("-");
  const leftStartCoord = Number(leftStartStr);
  const rightStartCoord = Number(rightStartStr);
  const bpRegionSize = rightStartCoord - leftStartCoord;
  let bpToPx = bpRegionSize / (windowWidth * 2);

  //useRef to store data between states without re render the component
  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates
  const block = useRef<HTMLInputElement>(null);
  const frameID = useRef(0);
  const lastX = useRef(0);
  const dragX = useRef(0);
  const rightTrackGenes = useRef<Array<any>>([]);
  const prevOverflowStrand = useRef<{ [key: string]: any }>({});
  const overflowStrand = useRef<{ [key: string]: any }>({});

  const prevOverflowStrand2 = useRef<{ [key: string]: any }>({});
  const overflowStrand2 = useRef<{ [key: string]: any }>({});

  const leftTrackGenes = useRef<Array<any>>([]);
  // These states are used to update the tracks with new fetched data
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track
  const [isDragging, setDragging] = useState(false);
  const [svgColor, setSvgColor] = useState<Array<any>>(["yellow", "green"]);
  const [svgColor2, setSvgColor2] = useState<Array<any>>(["yellow", "cyan"]);
  const [genRefDataRight, setGenRefDataRight] = useState<Array<any>>([]);
  const [genRefDataLeft, setGenRefDataLeft] = useState<Array<any>>([]);
  const [genomeTrackR, setGenomeTrackR] = useState(<></>);
  const [genomeTrackL, setGenomeTrackL] = useState(<></>);
  const [addNewBpRegionLeft, setAddNewBpRegionLeft] = useState(false);
  const [addNewBpRegionRight, setAddNewBpRegionRight] = useState(false);
  const [maxBp, setMaxBp] = useState(rightStartCoord);
  const [minBp, setMinBp] = useState(leftStartCoord);
  function handleMove(e) {
    if (!isDragging) {
      return;
    }
    const deltaX = lastX.current - e.pageX;

    lastX.current = e.pageX;
    dragX.current -= deltaX;

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

  function setLines() {
    let yCoord = 30;
    const lineList: Array<any> = [];
    for (let i = 0; i < 9; i++) {
      lineList.push(
        <line
          key={i}
          x1="0"
          y1={`${yCoord}`}
          x2={`${windowWidth * 1.5}`}
          y2={`${yCoord}`}
          stroke="white"
          strokeWidth="2"
        />
      );
      yCoord += 30;
    }
    return lineList;
  }
  function getRndInteger(min = 0, max = 10000000000) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
  function handleMouseUp() {
    setDragging(false);
    if (
      -dragX.current / (windowWidth * 2) >= svgColor.length - 2 &&
      dragX.current < 0
    ) {
      setAddNewBpRegionRight(true);
    } else if (
      dragX.current / (windowWidth * 2) >= svgColor2.length - 2 &&
      dragX.current > 0
    ) {
      setAddNewBpRegionLeft(true);
    }
  }
  async function fetchGenomeData(initial: number = 0) {
    // TO - IF STRAND OVERFLOW THEN NEED TO SET TO MAX WIDTH OR 0 to NOT AFFECT THE LOGIC.
    let userRespond;
    if (initial) {
      userRespond = await fetch(
        `${AWS_API}/${genome.name}/genes/refGene/queryRegion?chr=${region}&start=${minBp}&end=${maxBp}`,
        { method: "GET" }
      );
    } else {
      userRespond = await fetch(
        `${AWS_API}/${genome.name}/genes/refGene/queryRegion?chr=chr7&start=${
          maxBp - bpRegionSize
        }&end=${maxBp}`,
        { method: "GET" }
      );
    }

    const result = await userRespond.json();

    const strandIntervalList: Array<any> = [];

    if (result) {
      let resultIdx = 0;
      while (
        resultIdx < result.length &&
        result[resultIdx].id in prevOverflowStrand.current
      ) {
        resultIdx += 1;
      }
      if (resultIdx < result.length) {
        strandIntervalList.push([
          result[resultIdx].txStart,
          result[resultIdx].txEnd,
          new Array<any>(result[resultIdx]),
        ]);
      }

      for (let i = resultIdx + 1; i < result.length; i++) {
        let idx = strandIntervalList.length - 1;
        let curStrand = result[i];

        let prevStrandInterval = strandIntervalList[idx];

        let curHighestLvl = [
          idx,
          strandIntervalList[idx][2], // change list to count
        ];

        // if current starting coord is less than previous ending coord then they overlap
        if (curStrand.txStart <= prevStrandInterval[1]) {
          // combine the intervals into one larger interval that encompass the strands
          strandIntervalList[idx][1] = curStrand.txEnd;

          //NOW CHECK IF THE STRAND IS OVERFLOWING FROM THE LAST TRACK
          if (curStrand.id in prevOverflowStrand.current) {
            while (
              strandIntervalList[idx][2].length - 1 <
              prevOverflowStrand.current[curStrand.id].level
            ) {
              strandIntervalList[idx][2].push({});
            }
            strandIntervalList[idx][2].splice(
              prevOverflowStrand.current[curStrand.id].level,
              0,
              prevOverflowStrand.current[curStrand.id].strand
            );

            idx--;
            while (
              idx >= 0 &&
              prevOverflowStrand.current[curStrand.id].strand.txStart <=
                prevStrandInterval[1]
            ) {
              if (
                strandIntervalList[idx][2].length - 1 >=
                prevOverflowStrand.current[curStrand.id].level
              ) {
                strandIntervalList[idx][2].splice(
                  prevOverflowStrand.current[curStrand.id].level,
                  0,
                  new Array<any>()
                );
              }
              idx--;
            }
            continue;
          }

          //loop to check which other intervals the current strand overlaps
          while (idx >= 0 && curStrand.txStart <= strandIntervalList[idx][1]) {
            if (strandIntervalList[2] > curHighestLvl[1]) {
              curHighestLvl = [idx, strandIntervalList[2]];
            }
            idx--;
          }

          strandIntervalList[curHighestLvl[0]][2].push(curStrand);
        } else {
          strandIntervalList.push([
            result[i].txStart,
            result[i].txEnd,
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
    // CHECK if there are overlapping strands to the next track
    for (var i = 0; i < strandLevelList.length; i++) {
      let levelContent = strandLevelList[i];
      for (var strand of levelContent) {
        if (strand.txEnd > maxBp) {
          overflowStrand.current[strand.id] = {
            level: i,
            strand: strand,
          };
        }
      }
    }

    prevOverflowStrand.current = { ...overflowStrand.current };
    overflowStrand.current = {};

    let currTrack: Array<any> = [];
    currTrack.push(strandIntervalList);

    setGenRefDataRight((prev) => [...prev, ...currTrack]);
    rightTrackGenes.current.push(
      <SetStrand key={getRndInteger()} strandPos={strandLevelList} />
    );

    if (initial) {
      setGenRefDataLeft((prev) => [...prev, ...currTrack]);
      leftTrackGenes.current.push(
        <SetStrand2 key={getRndInteger()} strandPos={strandLevelList} />
      );
      setMinBp(minBp - bpRegionSize);
    }

    setMaxBp(maxBp + bpRegionSize);
  }
  async function fetchGenomeData2() {
    const userRespond = await fetch(
      `${AWS_API}/${
        genome.name
      }/genes/refGene/queryRegion?chr=${region}&start=${minBp}&end=${
        minBp + bpRegionSize
      }`,
      { method: "GET" }
    );
    const result = await userRespond.json();

    const strandIntervalList: Array<any> = [];
    const strandLevelList: Array<any> = [];
    result.sort((a, b) => {
      return b.txStart - a.txStart;
    });

    if (result) {
      let resultIdx = 0;
      while (
        resultIdx < result.length &&
        result[resultIdx].id in prevOverflowStrand2.current
      ) {
        resultIdx += 1;
      }
      if (resultIdx < result.length) {
        strandIntervalList.push([
          result[resultIdx].txStart,
          result[resultIdx].txEnd,
          0,
        ]);

        strandLevelList.push(new Array<any>(result[resultIdx]));
      }

      for (let i = resultIdx + 1; i < result.length; i++) {
        let idx = strandIntervalList.length - 1;
        let curStrand = result[i];
        if (curStrand.id in prevOverflowStrand2.current) {
          continue;
        }
        let prevStrandInterval = strandIntervalList[idx];

        let curHighestLvl = [
          idx,
          strandIntervalList[idx][2], // change list to count
        ];

        // if current starting coord is less than previous ending coord then they overlap
        if (curStrand.txStart <= prevStrandInterval[1]) {
          // combine the intervals into one larger interval that encompass the strands
          strandIntervalList[idx][1] = curStrand.txEnd;

          //loop to check which other intervals the current strand overlaps
          while (idx >= 0 && curStrand.txStart <= strandIntervalList[idx][1]) {
            if (strandIntervalList[2] > curHighestLvl[1]) {
              curHighestLvl = [idx, strandIntervalList[2]];
            }
            idx--;
          }

          strandIntervalList[curHighestLvl[0]][2] += 1;
          while (
            strandLevelList.length - 1 <
            strandIntervalList[curHighestLvl[0]][2]
          ) {
            strandLevelList.push(new Array<any>());
          }

          strandLevelList[strandIntervalList[curHighestLvl[0]][2]].push(
            curStrand
          );
        } else {
          strandIntervalList.push([result[i].txStart, result[i].txEnd, 0]);
          strandLevelList[0].push(curStrand);
        }
      }
    }

    let curOverflow = { ...prevOverflowStrand2.current };

    if (Object.keys(curOverflow).length !== 0) {
      let orderedStrands = Object.keys(curOverflow);
      orderedStrands.sort((a, b) => {
        return curOverflow[a].level - curOverflow[b].level;
      });
      for (let id of orderedStrands) {
        let level = curOverflow[id].level;
        let curStrand = curOverflow[id].strand;
        let tempArr: Array<any> = [];
        tempArr.push(curStrand);
        if (strandLevelList.length - 1 >= level) {
          strandLevelList.splice(level, 0, tempArr);
        } else {
          while (strandLevelList.length - 1 < level) {
            strandLevelList.push(new Array<any>());
          }

          strandLevelList[level].push(curStrand);
        }
      }
    }

    for (var i = 0; i < strandLevelList.length; i++) {
      let levelContent = strandLevelList[i];
      for (var strand of levelContent) {
        if (strand.txStart < minBp) {
          overflowStrand2.current[strand.id] = {
            level: i,
            strand: strand,
          };
        }
      }
    }
    prevOverflowStrand2.current = { ...overflowStrand2.current };
    overflowStrand2.current = {};

    let currTrack: Array<any> = [];
    currTrack.push(strandIntervalList);

    leftTrackGenes.current.push(
      <SetStrand2 key={getRndInteger()} strandPos={strandLevelList} />
    );

    setMinBp(minBp - bpRegionSize);
    setGenRefDataLeft((prev) => [...prev, ...currTrack]);
  }
  function SetStrand(props) {
    let yCoord = 30;
    const strandList: Array<any> = [];

    if (props.strandPos.length) {
      for (let i = 0; i < props.strandPos.length; i++) {
        const strandHtml: Array<any> = [];

        if (Object.keys(props.strandPos[i]).length !== 0) {
          for (let j = 0; j < props.strandPos[i].length; j++) {
            const singleStrand = props.strandPos[i][j];
            if (Object.keys(singleStrand).length === 0) {
              continue;
            }
            strandHtml.push(
              <React.Fragment key={j}>
                <line
                  x1={`${
                    (singleStrand.txStart - (maxBp - bpRegionSize)) / bpToPx
                  }`}
                  y1={`${yCoord}`}
                  x2={`${
                    (singleStrand.txEnd - (maxBp - bpRegionSize)) / bpToPx
                  }`}
                  y2={`${yCoord}`}
                  stroke="red"
                  strokeWidth="8"
                />
                <text
                  fontSize={7}
                  x={`${
                    (singleStrand.txStart - (maxBp - bpRegionSize)) / bpToPx
                  }`}
                  y={`${yCoord - 10}`}
                  fill="black"
                >
                  {singleStrand.name}
                </text>
              </React.Fragment>
            );
          }
        } else {
          strandHtml.push(<div></div>);
        }
        if (Object.keys(props.strandPos[i]).length !== 0) {
          strandList.push(strandHtml);
        }

        yCoord += 30;
      }
    }

    return (
      <>
        {strandList.map((item, index) => (
          <React.Fragment key={index}>{item}</React.Fragment>
        ))}
      </>
    );
  }

  function SetStrand2(props) {
    let yCoord = 30;
    const strandList: Array<any> = [];

    if (props.strandPos.length) {
      for (let i = 0; i < props.strandPos.length; i++) {
        const strandHtml: Array<any> = [];

        if (props.strandPos[i] !== "") {
          for (let j = 0; j < props.strandPos[i].length; j++) {
            const singleStrand = props.strandPos[i][j];

            strandHtml.push(
              <React.Fragment key={j}>
                <line
                  x1={`${(singleStrand.txStart - minBp) / bpToPx}`}
                  y1={`${yCoord}`}
                  x2={`${(singleStrand.txEnd - minBp) / bpToPx}`}
                  y2={`${yCoord}`}
                  stroke="red"
                  strokeWidth="8"
                />
                <text
                  fontSize={7}
                  x={`${(singleStrand.txStart - minBp) / bpToPx}`}
                  y={`${yCoord - 10}`}
                  fill="black"
                >
                  {singleStrand.name}
                </text>
              </React.Fragment>
            );
          }
        }

        if (props.strandPos[i] !== "") {
          strandList.push(strandHtml);
        }

        yCoord += 30;
      }
    }

    return (
      <>
        {strandList.map((item, index) => (
          <React.Fragment key={index}>{item}</React.Fragment>
        ))}
      </>
    );
  }

  function ShowGenomeData() {
    return svgColor.map((item, index) => (
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
        {rightTrackGenes.current[index] ? rightTrackGenes.current[index] : ""}
      </svg>
    ));
  }
  function ShowGenomeData2() {
    let tempData = leftTrackGenes.current.slice(0);
    tempData.reverse();
    return svgColor2
      .slice(0)
      .reverse()
      .map((item, index) => (
        <svg
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

          {tempData[index - 1] ? tempData[index - 1] : ""}
        </svg>
      ));
  }

  useEffect(() => {
    setGenomeTrackR(<ShowGenomeData />);
  }, [genRefDataRight]);

  useEffect(() => {
    setGenomeTrackL(<ShowGenomeData2 />);
  }, [genRefDataLeft]);
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

      setMaxBp(maxBp + bpRegionSize);
    }
    getData();
    console.log(windowWidth);
  }, []);

  useEffect(() => {
    console.log(windowWidth);
    if (addNewBpRegionRight) {
      async function handle() {
        if (curColor == "blue") {
          curColor = "orange";
        } else {
          curColor = "blue";
        }
        fetchGenomeData();
        setSvgColor((prevStrandInterval) => {
          const t = [...prevStrandInterval];
          t.push(curColor);
          return t;
        });
      }
      handle();
    }
    setAddNewBpRegionRight(false);
  }, [addNewBpRegionRight]);

  useEffect(() => {
    if (addNewBpRegionLeft) {
      console.log("trigger add left side of track");
      if (curColor2 == "green") {
        curColor2 = "purple";
      } else {
        curColor2 = "green";
      }
      setSvgColor2((prevStrandInterval) => {
        const t = [...prevStrandInterval];
        t.push(curColor2);
        return t;
      });
      fetchGenomeData2();
    }
    setAddNewBpRegionLeft(false);
  }, [addNewBpRegionLeft]);

  return (
    <>
      <div
        style={{
          flex: "1",
          display: "flex",
          justifyContent: dragX.current <= 0 ? "start" : "end",
          height: "900px",
          flexDirection: "row",
          whiteSpace: "nowrap",
          // div width has to match a single track width or the alignment will be off
          // in order to smoothly tranverse need to fetch info offscreen
          // 1. try add more blocks so the fetch is offscreen
          width: `${windowWidth * 2}px`,
          backgroundColor: "pink",
          overflow: "hidden",
          margin: "auto",
          paddingTop: "5vh",
        }}
      >
        <div ref={block} onMouseDown={handleMouseDown} style={{}}>
          {dragX.current <= 0 ? genomeTrackR : genomeTrackL}
        </div>
      </div>
      <div>
        Fetched ${genome.name} coord {region}: {maxBp - bpRegionSize * 3}-
        {maxBp - bpRegionSize * 2}
      </div>
      <div>
        Fetched ${genome.name} coord {region}: {minBp}-{minBp + bpRegionSize}
      </div>
      <div> drag offset: {lastX.current}</div>
      <div> bp movement: {dragX.current}</div>
    </>
  );
}

export default GenRefTrack;
