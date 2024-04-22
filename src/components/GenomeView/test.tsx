import React from "react";
import { useEffect, useRef, useState } from "react";
import GetBedData from "./getRemoteData/tabixSource";
const AWS_API = "https://lambda.epigenomegateway.org/v2";
const requestAnimationFrame = window.requestAnimationFrame;
const cancelAnimationFrame = window.cancelAnimationFrame;
import GenRefTrack from "./GenRefTrack";
import BedTrack from "./BedTrack";
import BedDensityTrack from "./BedDensityTrack";
import { ChromosomeData } from "../../localdata/chromosomedata";
import {
  genomesName,
  genomesKeyName,
  chrType,
} from "../../localdata/genomename";
const windowWidth = window.innerWidth;

let chrData: Array<any> = [];
let chrLength: Array<any> = [];
function Test(props) {
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

  // These states are used to update the tracks with new fetched data
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track
  const [isDragging, setDragging] = useState(false);
  const [rightSectionSize, setRightSectionSize] = useState<Array<any>>([
    "",
    "",
  ]);
  const [chr, setChr] = useState(0);
  const [leftSectionSize, setLeftSectionSize] = useState<Array<any>>(["", ""]);
  const [side, setSide] = useState("right");
  const [genomeTrackR, setGenomeTrackR] = useState<{ [key: string]: any }>({});
  const [Xpos, setXPos] = useState(0);
  const [maxBp, setMaxBp] = useState(
    rightStartCoord + (rightStartCoord - leftStartCoord)
  );
  const [minBp, setMinBp] = useState(leftStartCoord);

  function createGenomeData() {
    let genDataKey;
    for (let i = 0; i < genomesName.length; i++) {
      if (genomesName[i] === genome.name) {
        genDataKey = genomesKeyName[i];
        break;
      }
    }

    return genDataKey;
  }

  function getChrData(key: string) {
    let chrList: Array<any> = [];
    let allChrData = ChromosomeData[key];
    for (const chromosome of allChrData) {
      if (chrType.includes(chromosome.getName())) {
        chrData.push(chromosome.getName());
        chrLength.push(chromosome.getLength());
      }
    }
    setChr(chrData.indexOf(region));
  }
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
    setDragging(true);
    lastX.current = e.pageX;

    e.preventDefault();
  }
  function handleMouseUp() {
    setDragging(false);
    setXPos(dragX.current);
    if (dragX.current > 0 && side === "right") {
      setSide("left");
    } else if (dragX.current <= 0 && side === "left") {
      setSide("right");
    }

    if (
      -dragX.current / windowWidth >= 2 * (rightSectionSize.length - 2) &&
      dragX.current < 0
    ) {
      if (maxBp > Number(chrLength[chr])) {
        let prevChr = [maxBp - bpRegionSize, Number(chrLength[chr])];
        let curChr = [0, maxBp - Number(chrLength[chr])];
        let testcur = [
          Number(chrLength[chr]) -
            (maxBp - bpRegionSize) +
            maxBp -
            Number(chrLength[chr]),
          bpRegionSize,
        ];
        console.log(prevChr, curChr, testcur);
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

    if (initial) {
      try {
        userRespond = await fetch(
          `${AWS_API}/${genome.name}/genes/refGene/queryRegion?chr=${region}&start=${minBp}&end=${maxBp}`,
          { method: "GET" }
        );
        bedRespond = await GetBedData(
          "https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands.bed.gz",
          region,
          minBp,
          maxBp
        );

        tempObj["location"] = `${genome.name}:${region}:${minBp}:${maxBp}`;
      } catch {}
    } else {
      try {
        userRespond = await fetch(
          `${AWS_API}/${
            genome.name
          }/genes/refGene/queryRegion?chr=${region}&start=${
            maxBp - bpRegionSize
          }&end=${maxBp}`,
          { method: "GET" }
        );
        bedRespond = await GetBedData(
          "https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands.bed.gz",
          region,
          maxBp - bpRegionSize,
          maxBp
        );
        tempObj["location"] = `${genome.name}:${region}:${
          maxBp - bpRegionSize
        }:${maxBp}`;
      } catch {}
    }
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
  }

  //________________________________________________________________________________________________________________________________________________________
  //________________________________________________________________________________________________________________________________________________________

  async function fetchGenomeData2() {
    let tempObj = {};
    let bedRespond;
    let userRespond;
    try {
      userRespond = await fetch(
        `${AWS_API}/${
          genome.name
        }/genes/refGene/queryRegion?chr=${region}&start=${minBp}&end=${
          minBp + bpRegionSize
        }`,
        { method: "GET" }
      );
      bedRespond = await GetBedData(
        "https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands.bed.gz",
        region,
        minBp,
        minBp + bpRegionSize
      );
      tempObj["location"] = `${genome.name}:${region}:${minBp}:${
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
      let key = createGenomeData();
      getChrData(key);
    }
    getData();
  }, []);

  return (
    <div
      style={{
        height: "800px",
        flexDirection: "row",
        whiteSpace: "nowrap",
        //not using flex allows us to keep the position of the track
        width: "1500px",
        overflow: "hidden",
        margin: "auto",
      }}
    >
      {Xpos <= 0 ? (
        <div>{dragX.current}</div>
      ) : (
        <div>{dragX.current + windowWidth}</div>
      )}

      <div
        style={{
          flex: "1",
          display: "flex",
          justifyContent: Xpos <= 0 ? "start" : "end",
          height: "800px",
          flexDirection: "row",
          whiteSpace: "nowrap",
          // div width has to match a single track width or the alignment will be off
          // in order to smoothly tranverse need to fetch info offscreen maybe?????
          // 1. try add more blocks so the fetch is offscreen
          width: `${windowWidth * 2}px`,
          backgroundColor: "gainsboro",
          overflow: "hidden",
          margin: "auto",
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
          <GenRefTrack
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
            trackSide={side}
          />
        </div>
      </div>
    </div>
  );
}

export default Test;
