import React, { memo } from 'react';
import { useEffect, useRef, useState } from 'react';
const AWS_API = 'https://lambda.epigenomegateway.org/v2';

interface GenRefTrackProps {
  bpRegionSize?: number;
  bpToPx?: number;
  trackData?: { [key: string]: any }; // Replace with the actual type
  side?: string;
  windowWidth?: number;
}
const GenRefTrack: React.FC<GenRefTrackProps> = memo(function GenRefTrack({
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
    result = trackData!.result;
  }

  start = Number(start);
  end = Number(end);

  //useRef to store data between states without re render the component
  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates
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

  const [genomeTrackR, setGenomeTrackR] = useState(<></>);
  const [genomeTrackL, setGenomeTrackL] = useState(<></>);

  function getRndInteger(min = 0, max = 10000000000) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  async function fetchGenomeData(initial: number = 0) {
    // TO - IF STRAND OVERFLOW THEN NEED TO SET TO MAX WIDTH OR 0 to NOT AFFECT THE LOGIC.

    var strandIntervalList: Array<any> = [];
    // initialize the first index of the interval so we can start checking for prev overlapping intervals
    if (result) {
      var resultIdx = 0;

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
    setRightTrack([
      ...rightTrackGenes,
      <SetStrand
        key={getRndInteger()}
        strandPos={strandLevelList}
        checkPrev={prevOverflowStrand.current}
        startTrackPos={end - bpRegionSize!}
      />,
    ]);

    trackRegionR.current.push(
      <text fontSize={30} x={200} y={400} fill="black">
        {`${start} - ${end}`}
      </text>
    );

    // CHECK if there are overlapping strands to the next track
    for (var i = 0; i < strandLevelList.length; i++) {
      const levelContent = strandLevelList[i];
      for (var strand of levelContent) {
        if (strand.txEnd > end) {
          overflowStrand.current[strand.id] = {
            level: i,
            strand: strand,
          };
        }
      }
    }

    prevOverflowStrand.current = { ...overflowStrand.current };
    overflowStrand.current = {};

    if (trackData!.initial) {
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
      trackRegionL.current.push(
        <text fontSize={30} x={200} y={400} fill="black">
          {`${start - bpRegionSize!} - ${start}`}
        </text>
      );
      trackRegionL.current.push(
        <text fontSize={30} x={200} y={400} fill="black">
          {`${start} - ${end}`}
        </text>
      );
    }
  }

  //________________________________________________________________________________________________________________________________________________________
  //________________________________________________________________________________________________________________________________________________________

  async function fetchGenomeData2() {
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
        {`${start} - ${end}`}
      </text>
    );

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
  }

  function areIntervalsOverlapping(
    interval1Start: number,
    interval1End: number,
    interval2Start: number,
    interval2End: number
  ): boolean {
    return interval1Start <= interval2End && interval2Start <= interval1End;
  }
  // check each strand interval on each level to see if they overlapp and place it there
  // they are already in order of not overlapp. so we just just check  Loop previousIndex <- (currentIndex interval)
  //update the previous level start and end
  function SetStrand(props) {
    //TO- DO FIX Y COORD ADD SPACE EVEN WHEN THERES NO STRAND ON LEVEL
    var yCoord = 20;
    const strandList: Array<any> = [];

    if (props.strandPos.length) {
      var checkObj = false;
      if (props.checkPrev !== undefined) {
        checkObj = true;
      }
      for (let i = 0; i < props.strandPos.length; i++) {
        let strandHtml: Array<any> = [];
        let addY = false;
        for (let j = 0; j < props.strandPos[i].length; j++) {
          const singleStrand = props.strandPos[i][j];

          if (
            Object.keys(singleStrand).length === 0 ||
            (checkObj && singleStrand.id in props.checkPrev)
          ) {
            continue;
          } else {
            // find the color and exons on the strand---------------------------------------------------------------
            var strandColor;
            if (singleStrand.transcriptionClass === 'coding') {
              strandColor = 'purple';
            } else {
              strandColor = 'green';
            }
            const exonIntervals: Array<any> = [];
            const exonStarts = singleStrand.exonStarts.split(',');
            const exonEnds = singleStrand.exonEnds.split(',');
            for (let z = 0; z < exonStarts.length; z++) {
              exonIntervals.push([Number(exonStarts[z]), Number(exonEnds[z])]);
            }
            // add arrows direction to the strand------------------------------------------------------
            const startX =
              (singleStrand.txStart - props.startTrackPos) / bpToPx!;
            const endX = (singleStrand.txEnd - props.startTrackPos) / bpToPx!;
            const ARROW_WIDTH = 5;
            const arrowSeparation = 22;
            const bottomY = 5;
            var placementStartX = startX - ARROW_WIDTH / 2;
            var placementEndX = endX;
            if (singleStrand.strand === '+') {
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
                singleStrand.strand === '+'
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
                  x1={`${
                    (singleStrand.txStart - props.startTrackPos) / bpToPx!
                  }`}
                  y1={`${yCoord}`}
                  x2={`${(singleStrand.txEnd - props.startTrackPos) / bpToPx!}`}
                  y2={`${yCoord}`}
                  stroke={`${strandColor}`}
                  strokeWidth="4"
                />
                {exonIntervals.map((coord, index) => (
                  <line
                    key={index + 198}
                    x1={`${(coord[0] - props.startTrackPos) / bpToPx!}`}
                    y1={`${yCoord}`}
                    x2={`${(coord[1] - props.startTrackPos) / bpToPx!}`}
                    y2={`${yCoord}`}
                    stroke={`${strandColor}`}
                    strokeWidth="7"
                  />
                ))}

                <text
                  fontSize={7}
                  x={`${
                    (singleStrand.txStart - props.startTrackPos) / bpToPx!
                  }`}
                  y={`${yCoord - 7}`}
                  fill="black"
                >
                  {singleStrand.name}
                </text>
              </React.Fragment>
            );
          }
        }

        yCoord += 20;

        strandList.push(strandHtml);
      }
    }

    return strandList.map((item, index) => (
      <React.Fragment key={index}>{item}</React.Fragment>
    ));
  }

  function ShowGenomeData(props) {
    console.log(props.trackHtml);
    return props.trackHtml.map((item, index) => (
      <svg
        key={index}
        width={`${windowWidth * 2}px`}
        height={'100%'}
        style={{ display: 'inline-block' }}
        overflow="visible"
      >
        <line
          x1={`0`}
          y1="0"
          x2={`${windowWidth * 2}px`}
          y2={'0'}
          stroke="gray"
          strokeWidth="3"
        />
        <line
          x1={`${windowWidth * 2}px`}
          y1="0"
          x2={`${windowWidth * 2}px`}
          y2={'100%'}
          stroke="gray"
          strokeWidth="3"
        />
        <line
          x1={`0`}
          y1={'100%'}
          x2={`${windowWidth * 2}px`}
          y2={'100%'}
          stroke="gray"
          strokeWidth="3"
        />

        {props.trackHtml[index]}
        {props.trackInterval[index]}
      </svg>
    ));
  }

  useEffect(() => {
    setGenomeTrackR(
      <ShowGenomeData
        trackHtml={rightTrackGenes}
        trackInterval={trackRegionR.current}
      />
    );
  }, [rightTrackGenes]);

  useEffect(() => {
    const tempData = leftTrackGenes.slice(0);
    tempData.reverse();
    const tempRegion = trackRegionL.current.slice(0);
    tempRegion.reverse();

    setGenomeTrackL(
      <ShowGenomeData trackHtml={tempData} trackInterval={tempRegion} />
    );
  }, [leftTrackGenes]);

  useEffect(() => {
    async function handle() {
      if (trackData!.side === 'right') {
        fetchGenomeData();
      } else if (trackData!.side === 'left') {
        console.log(trackData);
        fetchGenomeData2();
      }
    }
    handle();
  }, [trackData]);

  return <div style={{}}>{side === 'right' ? genomeTrackR : genomeTrackL}</div>;
});

export default memo(GenRefTrack);
