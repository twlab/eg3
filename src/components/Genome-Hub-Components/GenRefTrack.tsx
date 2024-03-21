import { useEffect, useRef, useState } from "react";

let curColor = "blue";
let curColor2 = "orange";
const AWS_API = "https://lambda.epigenomegateway.org/v2";
const requestAnimationFrame = window.requestAnimationFrame;
const cancelAnimationFrame = window.cancelAnimationFrame;

function GenRefTrack(props) {
  //To-Do: need to move this part to initial render so this section only run once
  let genome = props.currGenome;

  const [region, coord] = genome.defaultRegion.split(":");
  const [leftStartStr, rightStartStr] = coord.split("-");
  const leftStartCoord = Number(leftStartStr);
  const rightStartCoord = Number(rightStartStr);
  const bpRegionSize = rightStartCoord - leftStartCoord;
  let bpToPx = bpRegionSize / (window.innerWidth * 1.5);

  //useRef to store data between states without re render the component
  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates
  const block = useRef<HTMLInputElement>(null);
  const frameID = useRef(0);
  const lastX = useRef(0);
  const dragX = useRef(0);
  const rightTrackGenes = useRef<Array<any>>([]);
  const prevOverflowStrand = useRef<{ [key: string]: any }>({});
  const overflowStrand = useRef<{ [key: string]: any }>({});
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const leftTrackGenes = useRef<Array<any>>([]);
  // These states are used to update the tracks with new fetched data
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track
  const [isDragging, setDragging] = useState(false);
  const [svgColor, setSvgColor] = useState<Array<any>>(["yellow", "green"]);
  const [svgColor2, setSvgColor2] = useState<Array<any>>(["yellow", "cyan"]);
  const [genRefDataRight, setGenRefDataRight] = useState<Array<any>>([]);
  const [genRefDataLeft, setGenRefDataLeft] = useState<Array<any>>([]);
  const [genomeTrackLeft, setGenomeTrackLeft] = useState(<></>);
  const [genomeTrackRight, setGenomeTrackRight] = useState(<></>);
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
  function handleMouseUp() {
    setDragging(false);
    if (
      -dragX.current / (windowWidth * 1.5) >= svgColor.length - 2 &&
      dragX.current < 0
    ) {
      setAddNewBpRegionLeft(true);
    } else if (
      dragX.current / (windowWidth * 1.5) >= svgColor2.length - 2 &&
      dragX.current > 0
    ) {
      setAddNewBpRegionRight(true);
    }
  }
  async function fetchGenomeData(initial: number = 0) {
    // TO - IF STRAND OVERFLOW THEN NEED TO SET TO MAX WIDTH OR 0 to NOT AFFECT THE LOGIC.
    if (!initial) {
      const userRespond = await fetch(
        `${AWS_API}/${genome.name}/genes/refGene/queryRegion?chr=chr7&start=${
          maxBp - bpRegionSize
        }&end=${maxBp}`,
        { method: "GET" }
      );
      const result = await userRespond.json();
      const strandIntervalList: Array<any> = [];
      const strandLevelList: Array<any> = [];
      let tempOverflow = { ...overflowStrand };
      if (result) {
        strandIntervalList.push([result[0].txStart, result[0].txEnd, 0]);
        strandLevelList.push(new Array<any>(result[0]));
        for (let i = 1; i < result.length; i++) {
          let idx = strandIntervalList.length - 1;
          let curStrand = result[i];
          if (curStrand.id in prevOverflowStrand.current) {
            console.log("HUIH");
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
            while (
              idx >= 0 &&
              curStrand.txStart <= strandIntervalList[idx][1]
            ) {
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
            if (curStrand.txEnd > maxBp) {
              overflowStrand.current[curStrand.id] = {
                level: strandIntervalList[curHighestLvl[0]][2],
                strand: curStrand,
              };
            }
          } else {
            strandIntervalList.push([result[i].txStart, result[i].txEnd, 0]); // change list to count
            strandLevelList[0].push(curStrand);
            if (curStrand.txEnd > maxBp) {
              overflowStrand.current[curStrand.id] = {
                level: 0,
                strand: curStrand,
              };
            }
          }
        }
      }
      let curOverflow = { ...prevOverflowStrand.current };
      prevOverflowStrand.current = { ...overflowStrand.current };
      overflowStrand.current = {};
      if (Object.keys(curOverflow).length !== 0) {
        console.log(curOverflow);
        // let orderedStrands = Object.keys(overflowStrand.current);
        // orderedStrands.sort((a, b) => {
        //   return overflowStrand.current[a] - overflowStrand.current[b];
        // });
        // for (let id of orderedStrands) {
        //   let level = overflowStrand.current[id].level;
        //   let curStrand = overflowStrand.current[id].strand;
        //   let tempArr: Array<any> = [];
        //   tempArr.push(curStrand);
        //   if (strandLevelList.length - 1 >= level) {
        //     strandLevelList.splice(level, 0, tempArr);
        //   } else {
        //     while (strandLevelList.length - 1 < level) {
        //       strandLevelList.push(new Array<any>());
        //     }
        //     strandLevelList[level].push(curStrand);
        //   }
        // }
      }

      // here check if there are uncomplete strands from previous track and
      // in the strandLevelList insert the strands into their preivous level index and move every
      // curr strand to the right increasing their level by one
      let currTrack: Array<any> = [];
      currTrack.push(strandIntervalList); // change list to count
      let genomeStrands: Array<any> = [];
      genomeStrands = setStrand(strandLevelList);
      //TO-DO HERE CREATE A WAY TO CHECK IF PREV TRACK HAS ON GOING STRANDS
      //AND INSERT THE CONTINUE prev STRAND BETWEEN THE curr genomeStrands indexes since each index is a level
      // this ensures that the strand continues on the same level and the track is balance
      if (genomeStrands.length !== 0) {
        rightTrackGenes.current.push(genomeStrands);
      }

      setGenRefDataRight((prev) => [...prev, ...currTrack]);
    } else {
      const userRespond = await fetch(
        `${AWS_API}/${genome.name}/genes/refGene/queryRegion?chr=${region}&start=${minBp}&end=${maxBp}`,
        { method: "GET" }
      );

      const result = await userRespond.json();
      const strandIntervalList: Array<any> = [];
      const strandLevelList: Array<any> = [];
      if (result) {
        strandIntervalList.push([result[0].txStart, result[0].txEnd, 0]);
        strandLevelList.push(new Array<any>(result[0]));
        for (let i = 1; i < result.length; i++) {
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

            //loop to check which other intervals the current strand overlaps
            while (
              idx >= 0 &&
              curStrand.txStart <= strandIntervalList[idx][1]
            ) {
              if (strandIntervalList[2] > curHighestLvl[1]) {
                // change list to count
                curHighestLvl = [idx, strandIntervalList[2]]; // change list to count
              }
              idx--;
            }

            strandIntervalList[curHighestLvl[0]][2] += 1; // change list to count
            while (
              strandLevelList.length - 1 <
              strandIntervalList[curHighestLvl[0]][2]
            ) {
              strandLevelList.push(new Array<any>());
            }
            strandLevelList[strandIntervalList[curHighestLvl[0]][2]].push(
              curStrand
            );
            if (curStrand.txEnd > maxBp) {
              overflowStrand.current[curStrand.id] =
                strandIntervalList[curHighestLvl[0]][2];
            }
            //add to level list
          } else {
            strandIntervalList.push([result[i].txStart, result[i].txEnd, 0]); // change list to count
            strandLevelList[0].push(curStrand);
            if (curStrand.txEnd > maxBp) {
              overflowStrand.current[curStrand.id] = 0;
            }
          }
        }
      }

      // here check if there are uncomplete strands from previous track and
      // in the strandLevelList insert the strands into their preivous level index and move every
      // curr strand to the right increasing their level by one
      let currTrack: Array<any> = [];
      currTrack.push(strandIntervalList); // change list to count

      let genomeStrands: Array<any> = [];
      genomeStrands = setStrand(strandLevelList);
      if (genomeStrands.length !== 0) {
        rightTrackGenes.current.push(genomeStrands);
      }

      setGenRefDataRight((prev) => [...prev, ...currTrack]);
      setGenRefDataLeft((prev) => [...prev, ...currTrack]);
    }
    setMaxBp(maxBp + bpRegionSize);
  }
  async function fetchGenomeData2() {
    const userRespond = await fetch(
      `${AWS_API}/${
        genome.name
      }/genes/refGene/queryRegion?chr=${region}&start=${
        minBp - bpRegionSize
      }&end=${minBp}`,
      { method: "GET" }
    );
    setMinBp(minBp - bpRegionSize);
    const result = await userRespond.json();
    const tempList: Array<any> = [];
    tempList.push(result);
    setGenRefDataLeft((prev) => [...prev, ...tempList]);
  }
  function setStrand(strandPos: any) {
    let yCoord = 30;
    const strandList: Array<any> = [];
    for (let i = 0; i < strandPos.length; i++) {
      let strandHtml: Array<any> = [];
      if (strandPos[i] !== "") {
        for (let j = 0; j < strandPos[i].length; j++) {
          let singleStrand = strandPos[i][j];
          strandHtml.push(
            <>
              <line
                key={j}
                x1={`${
                  (singleStrand.txStart - (maxBp - bpRegionSize)) / bpToPx
                }`}
                y1={`${yCoord}`}
                x2={`${(singleStrand.txEnd - (maxBp - bpRegionSize)) / bpToPx}`}
                y2={`${yCoord}`}
                stroke="red"
                strokeWidth="8"
              ></line>
              <text
                fontSize={5}
                textLength={
                  (singleStrand.txEnd - (maxBp - bpRegionSize)) / bpToPx -
                  (singleStrand.txStart - (maxBp - bpRegionSize)) / bpToPx
                }
                x={`${
                  (singleStrand.txStart - (maxBp - bpRegionSize)) / bpToPx
                }`}
                y={`${yCoord + 10}`}
                fill="black"
              >
                {singleStrand.name}
              </text>
            </>
          );
        }
      }
      if (strandPos[i] !== "") {
        strandList.push(strandHtml);
      }

      yCoord += 30;
    }
    return strandList;
  }

  function ShowGenomeData() {
    return svgColor.map((item, index) => (
      <svg
        key={index + 454545}
        width={`${windowWidth * 1.5}px`}
        height={"100%"}
        style={{ display: "inline-block" }}
      >
        <rect width={`${windowWidth * 1.5}px`} height="100%" fill={item} />
        {setLines()}
        {rightTrackGenes.current[index]
          ? rightTrackGenes.current[index].map((item, i) => item)
          : ""}
      </svg>
    ));
  }
  function ShowGenomeData2() {
    return svgColor2
      .slice(0)
      .reverse()
      .map((item, index) => (
        <svg
          key={index + 10000000}
          width={`${windowWidth}px`}
          height={"100%"}
          style={{ display: "inline-block" }}
        >
          <rect width={`${windowWidth}px`} height="100%" fill={item} />
          {setLines()}
        </svg>
      ));
  }

  useEffect(() => {
    setGenomeTrackLeft(<ShowGenomeData />);
  }, [genRefDataRight]);

  useEffect(() => {
    setGenomeTrackRight(<ShowGenomeData2 />);
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
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    async function getData() {
      await fetchGenomeData(1);
      setMaxBp(maxBp + bpRegionSize);
    }
    getData();
    console.log(windowWidth);
  }, []);

  useEffect(() => {
    if (addNewBpRegionLeft) {
      async function handle() {
        console.log("trigger add right side of track");

        if (curColor == "blue") {
          curColor = "orange";
        } else {
          curColor = "blue";
        }

        setSvgColor((prevStrandInterval) => {
          const t = [...prevStrandInterval];
          t.push(curColor);
          return t;
        });
        await fetchGenomeData();
      }
      handle();
    }
    setAddNewBpRegionLeft(false);
  }, [addNewBpRegionLeft]);

  useEffect(() => {
    if (addNewBpRegionRight) {
      console.log("trigger add left side of track");
      if (curColor2 == "green") {
        curColor2 = "orange";
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
    setAddNewBpRegionRight(false);
  }, [addNewBpRegionRight]);

  return (
    <>
      <div
        style={{
          flex: "1",
          display: "flex",
          justifyContent: dragX.current <= 0 ? "start" : "end",
          height: "80vh",
          flexDirection: "row",
          whiteSpace: "nowrap",
          width: `${windowWidth * 0.95}px`,
          backgroundColor: "pink",
          overflow: "hidden",
          margin: "auto",
          paddingTop: "15vh",
        }}
      >
        <div
          ref={block}
          onMouseDown={handleMouseDown}
          style={{
            height: "75%",
          }}
        >
          {dragX.current <= 0 ? genomeTrackLeft : genomeTrackRight}
        </div>
      </div>
      <div>
        Fetched ${genome.name} coord {region}: {maxBp - bpRegionSize}-{maxBp}
      </div>
      <div>
        Fetched ${genome.name} coord {region}: {minBp - bpRegionSize}-{minBp}
      </div>
      <div> drag offset: {lastX.current}</div>
      <div> bp movement: {dragX.current}</div>
    </>
  );
}

export default GenRefTrack;
