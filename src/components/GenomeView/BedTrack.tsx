import React from "react";
import { useEffect, useRef, useState } from "react";

const windowWidth = window.innerWidth;
function BedTrack(props) {
  let name, region, start, end;
  let bpRegionSize;
  let bpToPx;
  let result;
  if (Object.keys(props.trackData).length > 0) {
    [name, region, start, end] = props.trackData.location.split(":");
    result = props.trackData.bedResult;
    bpRegionSize = props.bpRegionSize;
    bpToPx = props.bpToPx;
  }

  start = Number(start);
  end = Number(end);

  const [rightTrackGenes, setRightTrack] = useState<Array<any>>([]);
  const [leftTrackGenes, setLeftTrack] = useState<Array<any>>([]);
  const prevOverflowStrand = useRef<{ [key: string]: any }>({});
  const overflowStrand = useRef<{ [key: string]: any }>({});

  const prevOverflowStrand2 = useRef<{ [key: string]: any }>({});
  const overflowStrand2 = useRef<{ [key: string]: any }>({});

  // These states are used to update the tracks with new fetched data
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track

  const [genomeTrackR, setGenomeTrackR] = useState(<></>);
  const [genomeTrackL, setGenomeTrackL] = useState(<></>);

  function getRndInteger(min = 0, max = 10000000000) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  async function fetchGenomeData() {
    // TO - IF STRAND OVERFLOW THEN NEED TO SET TO MAX WIDTH OR 0 to NOT AFFECT THE LOGIC.

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

    setRightTrack([
      ...rightTrackGenes,
      <SetStrand
        key={getRndInteger()}
        strandPos={strandLevelList}
        checkPrev={prevOverflowStrand.current}
        startTrackPos={end - bpRegionSize}
      />,
    ]);

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
        <SetStrand
          key={getRndInteger()}
          strandPos={strandLevelList}
          startTrackPos={start}
        />,
      ]);
    }
  }

  //________________________________________________________________________________________________________________________________________________________
  //________________________________________________________________________________________________________________________________________________________

  async function fetchGenomeData2() {
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
      <SetStrand
        key={getRndInteger()}
        strandPos={strandLevelList}
        checkPrev={prevOverflowStrand2.current}
        startTrackPos={start}
      />,
    ]);

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
    return props.trackHtml.map((item, index) => (
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
    setGenomeTrackR(<ShowGenomeData trackHtml={rightTrackGenes} />);
  }, [rightTrackGenes]);

  useEffect(() => {
    const tempData = leftTrackGenes.slice(0);
    tempData.reverse();

    setGenomeTrackL(<ShowGenomeData trackHtml={tempData} />);
  }, [leftTrackGenes]);

  useEffect(() => {
    async function handle() {
      if (props.trackData.location && props.trackData.side === "right") {
        fetchGenomeData();
      } else if (props.trackData.location && props.trackData.side === "left") {
        fetchGenomeData2();
      }
    }
    handle();
  }, [props.trackData]);

  return <div>{props.side === "right" ? genomeTrackR : genomeTrackL}</div>;
}

export default BedTrack;
