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
  const rightTrackGenes = useRef<Array<any>>([]);
  const prevOverflowStrand = useRef<{ [key: string]: any }>({});
  const overflowStrand = useRef<{ [key: string]: any }>({});

  const prevOverflowStrand2 = useRef<{ [key: string]: any }>({});
  const overflowStrand2 = useRef<{ [key: string]: any }>({});
  const trackRegionR = useRef<Array<any>>([]);
  const trackRegionL = useRef<Array<any>>([]);
  const leftTrackGenes = useRef<Array<any>>([]);
  // These states are used to update the tracks with new fetched data
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track
  const [isDragging, setDragging] = useState(false);
  const [rightSectionSize, setRightSectionSize] = useState<Array<any>>([
    "",
    "",
  ]);
  const [leftSectionSize, setLeftSectionSize] = useState<Array<any>>(["", ""]);

  const [genomeTrackR, setGenomeTrackR] = useState(<></>);
  const [genomeTrackL, setGenomeTrackL] = useState(<></>);
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
  async function fetchGenomeData(initial: number = 0) {
    // TO - IF STRAND OVERFLOW THEN NEED TO SET TO MAX WIDTH OR 0 to NOT AFFECT THE LOGIC.
    let userRespond;
    if (initial) {
      console.log(minBp, maxBp);
      userRespond = await fetch(
        `${AWS_API}/${genome.name}/genes/refGene/queryRegion?chr=${region}&start=${minBp}&end=${maxBp}`,
        { method: "GET" }
      );
    } else {
      userRespond = await fetch(
        `${AWS_API}/${
          genome.name
        }/genes/refGene/queryRegion?chr=${region}&start=${
          maxBp - bpRegionSize
        }&end=${maxBp}`,
        { method: "GET" }
      );
    }

    const result = await userRespond.json();

    var strandIntervalList: Array<any> = [];
    // initialize the first index of the interval so we can start checking for prev overlapping intervals
    if (result) {
      var resultIdx = 0;
      console.log(result);
      if (
        resultIdx < result.length &&
        !(result[resultIdx].id in prevOverflowStrand.current)
      ) {
        strandIntervalList.push([
          result[resultIdx].txStart,
          result[resultIdx].txEnd,
          new Array<any>(result[resultIdx]),
        ]);
      } else if (
        resultIdx < result.length &&
        result[resultIdx].id in prevOverflowStrand.current
      ) {
        strandIntervalList.push([
          result[resultIdx].txStart,
          result[resultIdx].txEnd,
          new Array<any>(),
        ]);

        while (
          strandIntervalList[resultIdx][2].length <
          prevOverflowStrand.current[result[resultIdx].id].level
        ) {
          strandIntervalList[resultIdx][2].push({});
        }
        strandIntervalList[resultIdx][2].splice(
          prevOverflowStrand.current[result[resultIdx].id].level,
          0,
          prevOverflowStrand.current[result[resultIdx].id].strand
        );
      }

      // let checking for interval overlapping and determining what level each strand should be on
      for (let i = resultIdx + 1; i < result.length; i++) {
        var idx = strandIntervalList.length - 1;
        const curStrand = result[i];
        var curHighestLvl = [idx, strandIntervalList[idx][2]];

        // if current starting coord is less than previous ending coord then they overlap
        if (curStrand.txStart <= strandIntervalList[idx][1]) {
          // combine the intervals into one larger interval that encompass the strands
          if (curStrand.txEnd > strandIntervalList[idx][1]) {
            strandIntervalList[idx][1] = curStrand.txEnd;
          }
          //NOW CHECK IF THE STRAND IS OVERFLOWING FROM THE LAST TRACK
          if (curStrand.id in prevOverflowStrand.current) {
            while (
              strandIntervalList[idx][2].length <
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
                strandIntervalList[idx][1]
            ) {
              if (
                strandIntervalList[idx][2].length >
                prevOverflowStrand.current[curStrand.id].level
              ) {
                if (curStrand.txEnd > strandIntervalList[idx][1]) {
                  strandIntervalList[idx][1] = curStrand.txEnd;
                }
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
            if (strandIntervalList[idx][2].length > curHighestLvl[1].length) {
              if (curStrand.txEnd > strandIntervalList[idx][1]) {
                strandIntervalList[idx][1] = curStrand.txEnd;
              }
              curHighestLvl = [idx, strandIntervalList[idx][2]];
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
    rightTrackGenes.current.push(
      <SetStrand
        key={getRndInteger()}
        strandPos={strandLevelList}
        checkPrev={prevOverflowStrand.current}
        startTrackPos={maxBp - bpRegionSize}
      />
    );
    trackRegionR.current.push(
      <text fontSize={30} x={200} y={400} fill="black">
        {`${maxBp - bpRegionSize} - ${maxBp}`}
      </text>
    );

    // CHECK if there are overlapping strands to the next track
    for (var i = 0; i < strandLevelList.length; i++) {
      const levelContent = strandLevelList[i];
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

    if (initial) {
      leftTrackGenes.current.push(
        <SetStrand
          key={getRndInteger()}
          strandPos={strandLevelList}
          startTrackPos={minBp}
        />
      );
      trackRegionL.current.push(
        <text fontSize={30} x={200} y={400} fill="black">
          {`${minBp} - ${maxBp}`}
        </text>
      );
      trackRegionL.current.push(
        <text fontSize={30} x={200} y={400} fill="black">
          {`${minBp - bpRegionSize} - ${minBp}`}
        </text>
      );
      setMinBp(minBp - bpRegionSize);
    }

    setMaxBp(maxBp + bpRegionSize);
  }

  //________________________________________________________________________________________________________________________________________________________
  //________________________________________________________________________________________________________________________________________________________

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

    var strandIntervalList: Array<any> = [];
    result.sort((a, b) => {
      return b.txEnd - a.txEnd;
    });
    if (result) {
      var resultIdx = 0;

      if (
        resultIdx < result.length &&
        !(result[resultIdx].id in prevOverflowStrand2.current)
      ) {
        strandIntervalList.push([
          result[resultIdx].txStart,
          result[resultIdx].txEnd,
          new Array<any>(result[resultIdx]),
        ]);
      } else if (
        resultIdx < result.length &&
        result[resultIdx].id in prevOverflowStrand2.current
      ) {
        strandIntervalList.push([
          result[resultIdx].txStart,
          result[resultIdx].txEnd,
          new Array<any>(),
        ]);

        while (
          strandIntervalList[resultIdx][2].length <
          prevOverflowStrand2.current[result[resultIdx].id].level
        ) {
          strandIntervalList[resultIdx][2].push({});
        }
        strandIntervalList[resultIdx][2].splice(
          prevOverflowStrand2.current[result[resultIdx].id].level,
          0,
          prevOverflowStrand2.current[result[resultIdx].id].strand
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

        // if current starting coord is less than previous ending coord then they overlap
        if (curStrand.txEnd >= strandIntervalList[idx][0]) {
          // combine the intervals into one larger interval that encompass the strands
          if (strandIntervalList[idx][0] > curStrand.txStart) {
            strandIntervalList[idx][0] = curStrand.txStart;
          }

          //NOW CHECK IF THE STRAND IS OVERFLOWING FROM THE LAST TRACK
          if (curStrand.id in prevOverflowStrand2.current) {
            while (
              strandIntervalList[idx][2].length - 1 <
              prevOverflowStrand2.current[curStrand.id].level
            ) {
              strandIntervalList[idx][2].push({});
            }
            strandIntervalList[idx][2].splice(
              prevOverflowStrand2.current[curStrand.id].level,
              0,
              prevOverflowStrand2.current[curStrand.id].strand
            );

            idx--;
            while (
              idx >= 0 &&
              prevOverflowStrand2.current[curStrand.id].strand.txEnd >=
                strandIntervalList[idx][0]
            ) {
              if (
                strandIntervalList[idx][2].length >
                prevOverflowStrand2.current[curStrand.id].level
              ) {
                if (strandIntervalList[idx][0] > curStrand.txStart) {
                  strandIntervalList[idx][0] = curStrand.txStart;
                }
                strandIntervalList[idx][2].splice(
                  prevOverflowStrand2.current[curStrand.id].level,
                  0,
                  new Array<any>()
                );
              }

              idx--;
            }
            continue;
          }

          //loop to check which other intervals the current strand overlaps
          while (idx >= 0 && curStrand.txEnd >= strandIntervalList[idx][0]) {
            if (strandIntervalList[idx][2].length - 1 > curHighestLvl[1]) {
              if (strandIntervalList[idx][0] > curStrand.txStart) {
                strandIntervalList[idx][0] = curStrand.txStart;
              }

              curHighestLvl = [idx, strandIntervalList[idx][2].length];
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

    leftTrackGenes.current.push(
      <SetStrand
        key={getRndInteger()}
        strandPos={strandLevelList}
        checkPrev={prevOverflowStrand2.current}
        startTrackPos={minBp}
      />
    );

    trackRegionL.current.push(
      <text fontSize={30} x={200} y={400} fill="black">
        {`${minBp - bpRegionSize} - ${minBp}`}
      </text>
    );

    for (var i = 0; i < strandLevelList.length; i++) {
      var levelContent = strandLevelList[i];
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

          // find the color and exons on the strand---------------------------------------------------------------
          var strandColor;
          if (singleStrand.transcriptionClass === "coding") {
            strandColor = "purple";
          } else {
            strandColor = "green";
          }
          const exonIntervals: Array<any> = [];
          const exonStarts = singleStrand.exonStarts.split(",");
          const exonEnds = singleStrand.exonEnds.split(",");
          for (let z = 0; z < exonStarts.length; z++) {
            exonIntervals.push([Number(exonStarts[z]), Number(exonEnds[z])]);
          }
          // add arrows direction to the strand------------------------------------------------------
          const startX = (singleStrand.txStart - props.startTrackPos) / bpToPx;
          const endX = (singleStrand.txEnd - props.startTrackPos) / bpToPx;
          const ARROW_WIDTH = 5;
          const arrowSeparation = 22;
          const bottomY = 5;
          var placementStartX = startX - ARROW_WIDTH / 2;
          var placementEndX = endX;
          if (singleStrand.strand === "+") {
            placementStartX += ARROW_WIDTH;
          } else {
            placementEndX -= ARROW_WIDTH;
          }

          const children: Array<any> = [];
          // Naming: if our arrows look like '<', then the tip is on the left, and the two tails are on the right.
          for (
            let arrowTipX = placementStartX;
            arrowTipX <= placementEndX;
            arrowTipX += arrowSeparation
          ) {
            // Is forward strand ? point to the right : point to the left
            const arrowTailX =
              singleStrand.strand === "+"
                ? arrowTipX - ARROW_WIDTH
                : arrowTipX + ARROW_WIDTH;
            const arrowPoints = [
              [arrowTailX, yCoord - bottomY],
              [arrowTipX, yCoord],
              [arrowTailX, bottomY + yCoord],
            ];
            children.push(
              <polyline
                key={arrowTipX}
                points={`${arrowPoints}`}
                fill="none"
                stroke={strandColor}
                strokeWidth={1}
              />
            );
          }
          //add a single strand to current track------------------------------------------------------------------------------------
          strandHtml.push(
            <React.Fragment key={j}>
              {children.map((item, index) => item)}
              <line
                x1={`${(singleStrand.txStart - props.startTrackPos) / bpToPx}`}
                y1={`${yCoord}`}
                x2={`${(singleStrand.txEnd - props.startTrackPos) / bpToPx}`}
                y2={`${yCoord}`}
                stroke={`${strandColor}`}
                strokeWidth="4"
              />
              {exonIntervals.map((coord, index) => (
                <line
                  key={index + 198}
                  x1={`${(coord[0] - props.startTrackPos) / bpToPx}`}
                  y1={`${yCoord}`}
                  x2={`${(coord[1] - props.startTrackPos) / bpToPx}`}
                  y2={`${yCoord}`}
                  stroke={`${strandColor}`}
                  strokeWidth="7"
                />
              ))}

              <text
                fontSize={7}
                x={`${(singleStrand.txStart - props.startTrackPos) / bpToPx}`}
                y={`${yCoord - 7}`}
                fill="black"
              >
                {singleStrand.name}
              </text>
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

  function ShowGenomeData(props) {
    return props.size.map((item, index) => (
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

        {props.trackHtml[index] ? props.trackHtml[index] : ""}
      </svg>
    ));
  }

  useEffect(() => {
    setGenomeTrackR(
      <ShowGenomeData
        trackHtml={rightTrackGenes.current}
        trackInterval={trackRegionR.current}
        size={rightSectionSize}
      />
    );
  }, [maxBp]);

  useEffect(() => {
    const tempData = leftTrackGenes.current.slice(0);
    tempData.reverse();
    const tempRegion = trackRegionL.current.slice(0);
    tempRegion.reverse();
    let tempSize = leftSectionSize.slice(0);
    tempSize.pop();
    setGenomeTrackL(
      <ShowGenomeData
        trackHtml={tempData}
        trackInterval={tempRegion}
        size={tempSize}
      />
    );
  }, [minBp]);
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

  return (
    <div
      style={{
        height: "800px",
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
      <div
        style={{
          flex: "1",
          display: "flex",
          justifyContent: dragX.current <= 0 ? "start" : "end",
          height: "800px",
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
        <div
          ref={block}
          onMouseDown={handleMouseDown}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <div>{dragX.current <= 0 ? genomeTrackR : genomeTrackL}</div>
          <div>{dragX.current <= 0 ? genomeTrackR : genomeTrackL}</div>
          <div>{dragX.current <= 0 ? genomeTrackR : genomeTrackL}</div>
        </div>
      </div>
    </div>
  );
}

export default GenRefTrack;
