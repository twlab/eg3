import React, { memo } from 'react';
import { useEffect, useRef, useState } from 'react';

interface BedTrackProps {
  bpRegionSize?: number;
  bpToPx?: number;
  trackData?: { [key: string]: any }; // Replace with the actual type
  side?: string;
  windowWidth?: number;
}
const BedTrack: React.FC<BedTrackProps> = memo(function BedTrack({
  bpRegionSize,
  bpToPx,
  trackData,
  side,
  windowWidth = 0,
}) {
  let start, end;
  let result;
  if (Object.keys(trackData!).length > 0) {
    [start, end] = trackData!.location.split(':');
    result = trackData!.bedResult;
    bpRegionSize = bpRegionSize;
    bpToPx = bpToPx;
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
  function fetchGenomeData() {
    // TO - IF STRAND OVERFLOW THEN NEED TO SET TO MAX WIDTH OR 0 to NOT AFFECT THE LOGIC.

    var strandIntervalList: Array<any> = [];
    // initialize the first index of the interval so we can start checking for prev overlapping intervals

    if (result[0]) {
      result = result[0];
      var resultIdx = 0;

      // let checking for interval overlapping and determining what level each strand should be on
      for (let i = resultIdx; i < result.length; i++) {
        var idx = strandIntervalList.length - 1;
        const curStrand = result[i];
        if (curStrand.end > end) {
          const strandId = curStrand.start + curStrand.end;
          overflowStrand.current[strandId] = {
            level: i,
            strand: curStrand,
          };
        }

        if (trackData!.initial) {
          if (curStrand.txStart < start) {
            overflowStrand2.current[curStrand.id] = {
              level: i,
              strand: curStrand,
            };
          }
        }
      }
    }
    let svgResult = setStrand({
      strandPos: [...result],
      checkPrev: { ...prevOverflowStrand.current },
      startTrackPos: end - bpRegionSize!,
    });
    setRightTrack([...rightTrackGenes, svgResult]);
    prevOverflowStrand.current = { ...overflowStrand.current };
    overflowStrand.current = {};

    if (trackData!.initial) {
      prevOverflowStrand2.current = { ...overflowStrand2.current };

      overflowStrand2.current = {};
      // setLeftTrack([
      //   ...leftTrackGenes,
      //   <SetStrand
      //     key={getRndInteger()}
      //     strandPos={result}
      //     startTrackPos={start}
      //   />,
      // ]);
    }
  }

  //________________________________________________________________________________________________________________________________________________________
  //________________________________________________________________________________________________________________________________________________________

  function fetchGenomeData2() {
    var strandIntervalList: Array<any> = [];
    result[0].sort((a, b) => {
      return b.end - a.end;
    });
    console.log(result);
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
      console.log(result);
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
          if (strandIntervalList[idx][0] < curStrand.start) {
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

    // setLeftTrack([
    //   ...leftTrackGenes,
    //   <SetStrand
    //     key={getRndInteger()}
    //     strandPos={strandLevelList}
    //     checkPrev={prevOverflowStrand2.current}
    //     startTrackPos={start}
    //   />,
    // ]);

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
  function setStrand(trackGeneData: { [Key: string]: any }) {
    //TO- DO FIX Y COORD ADD SPACE EVEN WHEN THERES NO STRAND ON LEVEL
    var yCoord = 25;
    const strandList: Array<any> = [];

    if (Object.keys(trackGeneData).length > 0) {
      var checkObj = false;
      if (trackGeneData.checkPrev !== undefined) {
        checkObj = true;
      }

      let strandHtml: Array<any> = [];

      for (let j = 0; j < trackGeneData.strandPos.length; j++) {
        const singleStrand = trackGeneData.strandPos[j];

        if (
          Object.keys(singleStrand).length === 0 ||
          (checkObj && singleStrand.id in trackGeneData.checkPrev)
        ) {
          continue;
        }

        //add a single strand to current track------------------------------------------------------------------------------------
        strandHtml.push(
          <line
            x1={`${
              (singleStrand.start - trackGeneData.startTrackPos) / bpToPx!
            }`}
            y1={`${yCoord}`}
            x2={`${(singleStrand.end - trackGeneData.startTrackPos) / bpToPx!}`}
            y2={`${yCoord}`}
            stroke={'blue'}
            strokeWidth="20"
          />
        );
      }

      yCoord += 25;

      strandList.push(strandHtml);
    }

    return strandList.map((item, index) => item);
  }

  function ShowGenomeData(props) {
    return props.trackHtml.map((item, index) => (
      <svg
        key={index}
        width={`${windowWidth * 2}px`}
        height={'100%'}
        style={{ display: 'inline-block' }}
        overflow="visible"
      >
        {props.trackHtml[index] ? props.trackHtml[index] : ''}
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
    function handle() {
      if (trackData!.side === 'right') {
        fetchGenomeData();
      } else if (trackData!.side === 'left') {
        fetchGenomeData2();
      }
    }
    handle();
  }, [trackData]);

  return (
    <div>
      {' '}
      {side === 'right'
        ? rightTrackGenes.map((item, index) =>
            index <= rightTrackGenes.length - 1 ? (
              <svg
                width={`${windowWidth * 2}px`}
                height={'100%'}
                style={{ display: 'inline-block' }}
                overflow="visible"
              >
                {rightTrackGenes[index]}
              </svg>
            ) : (
              <div style={{ display: 'flex', width: windowWidth * 2 }}>
                ....LOADING
              </div>
            )
          )
        : genomeTrackL}
    </div>
  );
});
export default memo(BedTrack);
