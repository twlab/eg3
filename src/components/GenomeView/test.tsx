import React from "react";
import { useEffect, useRef, useState } from "react";
import GetBedData from "./getRemoteData/tabixSource";
const AWS_API = "https://lambda.epigenomegateway.org/v2";
const requestAnimationFrame = window.requestAnimationFrame;
const cancelAnimationFrame = window.cancelAnimationFrame;
import GenRefTrack from "./GenRefTrack";
import BedTrack from "./BedTrack";
import BedDensityTrack from "./BedDensityTrack";

const windowWidth = window.innerWidth;
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

  const rightSectionSize = useRef<Array<any>>(["", ""]);

  const leftSectionSize = useRef<Array<any>>(["", ""]);

  const [side, setSide] = useState("right");
  const [getNewRegionData, setGetNewRegionData] = useState<{
    [key: string]: any;
  }>({});
  const [Xpos, setXPos] = useState(0);
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

  function handleMouseUp() {
    setDragging(false);
    setXPos(dragX.current);
    if (dragX.current > 0 && side === "right") {
      setSide("left");
    } else if (dragX.current <= 0 && side === "left") {
      setSide("right");
    } else {
      if (
        -dragX.current / windowWidth >=
          2 * (rightSectionSize.current.length - 2) &&
        dragX.current < 0
      ) {
        setAddNewBpRegionRight(true);
      } else if (
        //need to add windowwith when moving left is because when the size of track is 2x it misalign the track because its already halfway
        //so we need to add to keep the position correct.
        (dragX.current + windowWidth) / windowWidth >=
          2 * (leftSectionSize.current.length - 3) &&
        dragX.current > 0
      ) {
        setAddNewBpRegionLeft(true);
      }
    }
  }
  async function fetchGenomeData(initial: number = 0) {
    // TO - IF STRAND OVERFLOW THEN NEED TO SET TO MAX WIDTH OR 0 to NOT AFFECT THE LOGIC.

    let tempObj = {};
    let userRespond;
    let bedRespond;

    if (initial) {
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
    } else {
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
    }
    const bedResult = await bedRespond;
    const result = await userRespond.json();
    tempObj["bedResult"] = bedResult;
    tempObj["result"] = result;
    tempObj["side"] = "right";

    if (initial) {
      tempObj["initial"] = 1;
      setGetNewRegionData({ ...tempObj });
      setMinBp(minBp - bpRegionSize);
    } else {
      tempObj["initial"] = 0;
      setGetNewRegionData({ ...tempObj });
    }

    setMaxBp(maxBp + bpRegionSize);
  }

  //________________________________________________________________________________________________________________________________________________________
  //________________________________________________________________________________________________________________________________________________________

  async function fetchGenomeData2() {
    let tempObj = {};
    let bedRespond;
    const userRespond = await fetch(
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
    const result = await userRespond.json();
    const bedResult = await bedRespond;
    tempObj["result"] = result;
    tempObj["bedResult"] = bedResult;

    tempObj["side"] = "left";
    setGetNewRegionData({ ...tempObj });
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
    async function getData() {
      await fetchGenomeData(1);
    }
    getData();
  }, []);

  useEffect(() => {
    if (addNewBpRegionRight) {
      async function handle() {
        rightSectionSize.current.push("");
        fetchGenomeData();
      }
      handle();
    }
    setAddNewBpRegionRight(false);
  }, [addNewBpRegionRight]);

  useEffect(() => {
    if (addNewBpRegionLeft) {
      async function handle() {
        leftSectionSize.current.push("");
        fetchGenomeData2();
      }
      handle();
    }
    setAddNewBpRegionLeft(false);
  }, [addNewBpRegionLeft]);

  return (
    <div
      // this is the container for the track, able to resize without messing with function of track
      style={{
        height: "800px",
        flexDirection: "row",
        whiteSpace: "nowrap",
        //not using flex allows us to keep the position of the track
        width: "1600px",
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
        // This div determines the length, position of the track, and manage new regions getting added without shifting track position , cannot resize this without causing track position to mess up when updating information
        // container that keep tracks in the current position
        style={{
          flex: "1",
          display: "flex",
          justifyContent: Xpos <= 0 ? "start" : "end",
          height: "800px",
          flexDirection: "row",
          whiteSpace: "nowrap",
          width: `${windowWidth * 2}px`,
          backgroundColor: "gainsboro",
          overflow: "hidden",
          margin: "auto",
        }}
      >
        <div
          // allow the user to drag the track and manage the type of track user requested, where can be dragged os determined
          // display the type of track in stacking order
          ref={block}
          onMouseDown={handleMouseDown}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <GenRefTrack
            bpRegionSize={bpRegionSize}
            bpToPx={bpToPx}
            trackData={getNewRegionData}
            Xpos={Xpos}
          />

          <BedTrack
            bpRegionSize={bpRegionSize}
            bpToPx={bpToPx}
            trackData={getNewRegionData}
            Xpos={Xpos}
          />
          <BedDensityTrack
            bpRegionSize={bpRegionSize}
            bpToPx={bpToPx}
            trackData={getNewRegionData}
            Xpos={Xpos}
          />
        </div>
      </div>
    </div>
  );
}

export default Test;
