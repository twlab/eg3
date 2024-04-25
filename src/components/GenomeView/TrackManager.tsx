import { useEffect, useRef, useState } from "react";
import GetBedData from "./getRemoteData/tabixSource";
const AWS_API = "https://lambda.epigenomegateway.org/v2";
const requestAnimationFrame = window.requestAnimationFrame;
const cancelAnimationFrame = window.cancelAnimationFrame;
import GenRefTrack from "./GenRefTrack";
import BedTrack from "./BedTrack";
import BedDensityTrack from "./BedDensityTrack";
import CircularProgress from "@mui/material/CircularProgress";
const windowWidth = window.innerWidth;
let chrData: Array<any> = [];
let chrLength: Array<any> = [];

interface MyComponentProps {
  bpRegionSize?: number;
  bpToPx?: number;
  trackData?: { [key: string]: any }; // Replace with the actual type
  side?: string;
}

const componentMap: { [key: string]: React.FC<MyComponentProps> } = {
  refGene: GenRefTrack,
  bed: BedTrack,
  bedDensity: BedDensityTrack,
  // Add more components as needed
};

function TrackManager(props) {
  //To-Do: MOVED THIS PART TO GENOMEROOT SO THAT THESE DAta are INILIZED ONLY ONCE.
  const genome = props.currGenome;

  const [region, coord] = genome.defaultRegion.split(":");
  const [leftStartStr, rightStartStr] = coord.split("-");
  const leftStartCoord = Number(leftStartStr);
  const rightStartCoord = Number(rightStartStr);
  const bpRegionSize = (rightStartCoord - leftStartCoord) * 2;
  const bpToPx = bpRegionSize / (windowWidth * 2);

  let allChrData = genome.chromosomes;

  for (const chromosome in allChrData) {
    if (props.chrOrder.includes(chromosome)) {
      chrData.push(chromosome);
      chrLength.push(allChrData[chromosome]);
    }
  }

  //useRef to store data between states without re render the component
  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates
  const block = useRef<HTMLInputElement>(null);
  const frameID = useRef(0);
  const lastX = useRef(0);
  const dragX = useRef(0);

  // These states are used to update the tracks with new fetched data
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track
  const [isDragging, setDragging] = useState(false);
  const [rightSectionSize, setRightSectionSize] = useState<Array<any>>([
    "",
    "",
  ]);

  const [chrIndex, setchrIndex] = useState(chrData.indexOf(region));
  const [leftSectionSize, setLeftSectionSize] = useState<Array<any>>(["", ""]);
  const [side, setSide] = useState("right");
  const [isLoading, setIsLoading] = useState(true);
  const [genomeTrackR, setGenomeTrackR] = useState<{ [key: string]: any }>({});
  const [bpX, setBpX] = useState(0);
  const [maxBp, setMaxBp] = useState(
    rightStartCoord + (rightStartCoord - leftStartCoord)
  );
  const [minBp, setMinBp] = useState(leftStartCoord);
  let trackComponent: Array<any> = [];
  for (let i = 0; i < genome.defaultTracks.length; i++) {
    trackComponent.push(componentMap[genome.defaultTracks[i].name]);
  }
  function handleMove(e) {
    if (!isDragging) {
      return;
    }

    const deltaX = lastX.current - e.pageX;
    if (
      (isLoading && deltaX > 0 && side === "right") ||
      (isLoading && deltaX < 0 && side === "left")
    ) {
      return;
    }

    lastX.current = e.pageX;

    dragX.current -= deltaX;

    //can change speed of scroll by mutipling dragX.current by 0.5 when setting the track position
    cancelAnimationFrame(frameID.current);
    frameID.current = requestAnimationFrame(() => {
      block.current!.style.transform = `translate3d(${dragX.current}px, 0px, 0)`;
    });
  }
  const handleClick = () => {
    let curRegion =
      chrData[chrIndex] +
      ":" +
      String(bpX) +
      "-" +
      String(bpX + bpRegionSize / 2);
    props.addTrack({
      region: curRegion,
      trackName: "bed",
      genome: genome,
    });
  };
  function handleMouseDown(e: { pageX: number; preventDefault: () => void }) {
    setDragging(true);
    lastX.current = e.pageX;

    e.preventDefault();
  }
  function handleMouseUp() {
    setDragging(false);
    const curBp = leftStartCoord + -dragX.current * bpToPx;
    let curRegion =
      chrData[chrIndex] +
      ":" +
      String(curBp) +
      "-" +
      String(curBp + bpRegionSize / 2);
    props.startBp(curRegion);
    setBpX(curBp);

    if (dragX.current > 0 && side === "right") {
      setSide("left");
    } else if (dragX.current <= 0 && side === "left") {
      setSide("right");
    }

    if (
      -dragX.current / windowWidth >= 2 * (rightSectionSize.length - 2) &&
      dragX.current < 0
    ) {
      setIsLoading(true);
      if (maxBp > Number(chrLength[chrIndex])) {
        let prevChr = [maxBp - bpRegionSize, Number(chrLength[chrIndex])];
        let curChr = [0, maxBp - Number(chrLength[chrIndex])];
        let testcur = [
          Number(chrLength[chrIndex]) -
            (maxBp - bpRegionSize) +
            maxBp -
            Number(chrLength[chrIndex]),
          bpRegionSize,
        ];
        setchrIndex(chrIndex + 1);
        console.log(prevChr, curChr, testcur);
        setMaxBp(maxBp - Number(chrLength[chrIndex]) + bpRegionSize);
      } else {
        console.log("trigger righ");
        setRightSectionSize((prevStrandInterval) => {
          const t = [...prevStrandInterval];
          t.push("");
          return t;
        });

        fetchGenomeData();
      }
    } else if (
      //need to add windowwith when moving left is because when the size of track is 2x it misalign the track because its already halfway
      //so we need to add to keep the position correct.
      (dragX.current + windowWidth) / windowWidth >=
        2 * (leftSectionSize.length - 2) &&
      dragX.current > 0
    ) {
      setIsLoading(true);
      console.log("trigger left");
      setLeftSectionSize((prevStrandInterval) => {
        const t = [...prevStrandInterval];
        t.push("");
        return t;
      });
      fetchGenomeData2();
    }
  }
  async function fetchGenomeData(initial: number = 0) {
    // TO - IF STRAND OVERFLOW THEN NEED TO SET TO MAX WIDTH OR 0 to NOT AFFECT THE LOGIC.

    let tempObj = {};
    let userRespond;
    let bedRespond;

    try {
      userRespond = await fetch(
        `${AWS_API}/${genome.name}/genes/refGene/queryRegion?chr=${
          chrData[chrIndex]
        }&start=${maxBp - bpRegionSize}&end=${maxBp}`,
        { method: "GET" }
      );
      bedRespond = await GetBedData(
        "https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands.bed.gz",
        chrData[chrIndex],
        maxBp - bpRegionSize,
        maxBp
      );
      tempObj["location"] = `${genome.name}:${chrData[chrIndex]}:${
        maxBp - bpRegionSize
      }:${maxBp}`;
    } catch {}

    const bedResult = bedRespond;
    const result = await userRespond.json();
    tempObj["bedResult"] = bedResult;
    tempObj["result"] = result;
    tempObj["side"] = "right";

    if (initial) {
      tempObj["initial"] = 1;
      setGenomeTrackR({ ...tempObj });
      setMinBp(minBp - bpRegionSize);
    } else {
      tempObj["initial"] = 0;
      setGenomeTrackR({ ...tempObj });
    }

    setMaxBp(maxBp + bpRegionSize);
    setIsLoading(false);
  }

  //________________________________________________________________________________________________________________________________________________________
  //________________________________________________________________________________________________________________________________________________________

  async function fetchGenomeData2() {
    let tempObj = {};
    let bedRespond;
    let userRespond;
    try {
      userRespond = await fetch(
        `${AWS_API}/${genome.name}/genes/refGene/queryRegion?chr=${
          chrData[chrIndex]
        }&start=${minBp}&end=${minBp + bpRegionSize}`,
        { method: "GET" }
      );
      bedRespond = await GetBedData(
        "https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands.bed.gz",
        chrData[chrIndex],
        minBp,
        minBp + bpRegionSize
      );
      tempObj["location"] = `${genome.name}:${chrData[chrIndex]}:${minBp}:${
        minBp + bpRegionSize
      }`;
    } catch {}
    const result = await userRespond.json();
    const bedResult = bedRespond;
    tempObj["result"] = result;
    tempObj["bedResult"] = bedResult;

    tempObj["side"] = "left";
    setGenomeTrackR({ ...tempObj });
    setMinBp(minBp - bpRegionSize);
    setIsLoading(false);
  }

  useEffect(() => {
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    console.log(windowWidth);
    async function getData() {
      await fetchGenomeData(1);
    }

    getData();
    setIsLoading(false);
  }, []);

  return (
    <div
      style={{
        flexDirection: "row",
        whiteSpace: "nowrap",
        //not using flex allows us to keep the position of the track
        width: "70%",
        overflow: "hidden",
        margin: "auto",
      }}
    >
      <button onClick={handleClick}>add bed</button>

      <div>{bpX}</div>

      {isLoading ? (
        <CircularProgress
          variant="indeterminate"
          disableShrink
          sx={{
            color: (theme) =>
              theme.palette.mode === "light" ? "#1a90ff" : "#308fe8",
            animationDuration: "550ms",

            left: 0,
          }}
          size={20}
          thickness={4}
        />
      ) : (
        <div>DATA READY LETS GO</div>
      )}

      <div
        style={{
          flex: "1",
          display: "flex",
          justifyContent: dragX.current <= 0 ? "start" : "end",

          flexDirection: "row",

          // div width has to match a single track width or the alignment will be off
          // in order to smoothly tranverse need to fetch info offscreen maybe?????
          // 1. try add more blocks so the fetch is offscreen
          width: `${windowWidth * 2}px`,
          backgroundColor: "gainsboro",
        }}
      >
        <div
          ref={block}
          onMouseDown={handleMouseDown}
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          {trackComponent.map((Component, index) => (
            <Component
              key={index}
              bpRegionSize={bpRegionSize}
              bpToPx={bpToPx}
              trackData={genomeTrackR}
              side={side}
            />
          ))}
          {/* <GenRefTrack
            bpRegionSize={bpRegionSize}
            bpToPx={bpToPx}
            trackData={genomeTrackR}
            side={side}
          />

          <BedTrack
            bpRegionSize={bpRegionSize}
            bpToPx={bpToPx}
            trackData={genomeTrackR}
            side={side}
          />
          <BedDensityTrack
            bpRegionSize={bpRegionSize}
            bpToPx={bpToPx}
            trackData={genomeTrackR}
            side={side}
          /> */}
        </div>
      </div>
    </div>
  );
}

export default TrackManager;
