import React from "react";
import { useEffect, useRef, useState } from "react";
import GetBedData from "./getRemoteData/tabixSource";
const AWS_API = "https://lambda.epigenomegateway.org/v2";
const requestAnimationFrame = window.requestAnimationFrame;
const cancelAnimationFrame = window.cancelAnimationFrame;
const windowWidth = window.innerWidth;
function BedTrack(props) {
  let name, region, start, end;
  let bpRegionSize;
  let bpToPx;

  if (Object.keys(props.trackData).length > 0) {
    [name, region, start, end] = props.trackData.location.split(":");
    bpRegionSize = props.bpRegionSize;
    bpToPx = props.bpToPx;
  }

  start = Number(start);
  end = Number(end);

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

  const prevOverflowStrand2 = useRef<{ [key: string]: any }>({});
  const overflowStrand2 = useRef<{ [key: string]: any }>({});
  const trackRegionR = useRef<Array<any>>([]);
  const trackRegionL = useRef<Array<any>>([]);

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

  function getRndInteger(min = 0, max = 10000000000) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  async function fetchGenomeData(initial: number = 0) {
    // TO - IF STRAND OVERFLOW THEN NEED TO SET TO MAX WIDTH OR 0 to NOT AFFECT THE LOGIC.

    const userRespond = await GetBedData(
      "https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands.bed.gz",
      region,
      start,
      end
    );

    var result = userRespond;

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
      <SetStrand
        key={getRndInteger()}
        strandPos={strandLevelList}
        checkPrev={prevOverflowStrand.current}
        startTrackPos={end - bpRegionSize}
      />,
    ]);

    trackRegionR.current.push(
      <text fontSize={30} x={200} y={400} fill="black">
        {`${end - bpRegionSize} - ${end}`}
      </text>
    );

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

    prevOverflowStrand.current = { ...overflowStrand.current };
    overflowStrand.current = {};

    if (props.trackData.initial) {
      setLeftTrack([
        ...leftTrackGenes,
        <SetStrand
          key={getRndInteger()}
          strandPos={strandLevelList}
          startTrackPos={start}
        />,
      ]);
      trackRegionL.current.push(
        <text fontSize={30} x={200} y={400} fill="black">
          {`${start} - ${end}`}
        </text>
      );
      trackRegionL.current.push(
        <text fontSize={30} x={200} y={400} fill="black">
          {`${start - bpRegionSize} - ${start}`}
        </text>
      );
    }
  }

  //________________________________________________________________________________________________________________________________________________________
  //________________________________________________________________________________________________________________________________________________________

  async function fetchGenomeData2() {
    const userRespond = await GetBedData(
      "https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands.bed.gz",
      region,
      start,
      end
    );
    let result = userRespond;

    var strandIntervalList: Array<any> = [];
    result.sort((a, b) => {
      return b.end - a.end;
    });
    console.log(result);
    if (result[0]) {
      result = result[0];
      console.log(result);
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
      <SetStrand
        key={getRndInteger()}
        strandPos={strandLevelList}
        checkPrev={prevOverflowStrand2.current}
        startTrackPos={start}
      />,
    ]);
    trackRegionL.current.push(
      <text fontSize={30} x={200} y={400} fill="black">
        {`${start - bpRegionSize} - ${start}`}
      </text>
    );
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
        {props.trackInterval[index] ? props.trackInterval[index] : ""}
      </svg>
    ));
  }

  useEffect(() => {
    setGenomeTrackR(
      <ShowGenomeData
        trackHtml={rightTrackGenes}
        trackInterval={trackRegionR.current}
        size={rightSectionSize}
      />
    );
  }, [rightTrackGenes]);

  useEffect(() => {
    const tempData = leftTrackGenes.slice(0);
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
  }, [leftTrackGenes]);

  useEffect(() => {
    async function handle() {
      if (props.trackData.location && props.trackData.side === "right") {
        setRightSectionSize((prevStrandInterval) => {
          const t = [...prevStrandInterval];
          t.push("");
          return t;
        });
        await fetchGenomeData();
      } else if (props.trackData.location && props.trackData.side === "left") {
        console.log("trigger left");
        setLeftSectionSize((prevStrandInterval) => {
          const t = [...prevStrandInterval];
          t.push("");
          return t;
        });
        await fetchGenomeData2();
      }
    }
    handle();
  }, [props.trackData]);

  return <div>{props.Xpos <= 0 ? genomeTrackR : genomeTrackL}</div>;
}

export default BedTrack;
