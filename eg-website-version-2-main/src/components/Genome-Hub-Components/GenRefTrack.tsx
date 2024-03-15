import { useEffect, useRef, useState } from "react";

let curColor = "blue";
let curColor2 = "orange";
const AWS_API = "https://lambda.epigenomegateway.org/v2";
const requestAnimationFrame = window.requestAnimationFrame;
const cancelAnimationFrame = window.cancelAnimationFrame;

function GenRefTrack(props) {
  //To-Do: need to move this part to initial render so this section only run once
  const genome = props.currGenome;

  const [region, coord] = genome.defaultRegion.split(":");
  const [leftStartStr, rightStartStr] = coord.split("-");
  const leftStartCoord = Number(leftStartStr);
  const rightStartCoord = Number(rightStartStr);
  const bpRegionSize = rightStartCoord - leftStartCoord;

  //useRef to store data between states without re render the component
  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates
  const block = useRef<HTMLInputElement>(null);
  const frameID = useRef(0);
  const lastX = useRef(0);
  const dragX = useRef(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

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
    let yCoord = 50;
    const lineList: Array<any> = [];
    for (let i = 0; i < 9; i++) {
      lineList.push(
        <line
          key={i}
          x1="0"
          y1={`${yCoord}`}
          x2={`${windowWidth}`}
          y2={`${yCoord}`}
          stroke="white"
          strokeWidth="2"
        />
      );
      yCoord += 50;
    }
    return lineList;
  }
  function handleMouseUp() {
    setDragging(false);
    if (
      -dragX.current / windowWidth >= svgColor.length - 1 &&
      dragX.current < 0
    ) {
      setAddNewBpRegionLeft(true);
    } else if (
      dragX.current / windowWidth >= svgColor2.length - 1 &&
      dragX.current > 0
    ) {
      setAddNewBpRegionRight(true);
    }
  }
  async function fetchGenomeData(initial: number = 0) {
    if (!initial) {
      const userRespond = await fetch(
        `${AWS_API}/hg38/genes/refGene/queryRegion?chr=chr7&start=${maxBp}&end=${
          maxBp + bpRegionSize
        }`,
        { method: "GET" }
      );
      const result = await userRespond.json();
      setMaxBp(maxBp + bpRegionSize);
      const tempList: Array<any> = [];
      tempList.push(result);
      setGenRefDataRight((prev) => [...prev, ...tempList]);
    } else {
      const userRespond = await fetch(
        `${AWS_API}/${genome.name}/genes/refGene/queryRegion?chr=${region}&start=${minBp}&end=${maxBp}`,
        { method: "GET" }
      );
      const result = await userRespond.json();
      const tempList: Array<any> = [];
      setGenRefDataRight((prev) => [...prev, ...tempList]);
      setGenRefDataLeft((prev) => [...prev, ...tempList]);
      fetchGenomeData();
      fetchGenomeData2();
    }
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
  function ShowGenomeData() {
    console.log(genRefDataRight);
    return svgColor.map((item, index) => (
      <svg
        key={index + 454545}
        width={`${windowWidth}px`}
        height={"100%"}
        style={{ display: "inline-block" }}
      >
        <rect width={`${windowWidth}px`} height="100%" fill={item} />
        {setLines()}
      </svg>
    ));
  }
  function ShowGenomeData2() {
    console.log(genRefDataLeft);
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
    fetchGenomeData(1);
    console.log(windowWidth);
  }, []);

  useEffect(() => {
    if (addNewBpRegionLeft) {
      console.log("trigger add right side of track");

      if (curColor == "blue") {
        curColor = "black";
      } else {
        curColor = "blue";
      }
      setSvgColor((prev) => {
        const t = [...prev];
        t.push(curColor);
        return t;
      });
      fetchGenomeData();
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
      setSvgColor2((prev) => {
        const t = [...prev];
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
