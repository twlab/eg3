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
  console.log(result);
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

  function fetchGenomeData(initial: number = 0) {
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

    let svgResult = setStrand({
      strandPos: [...strandLevelList],
      checkPrev: { ...prevOverflowStrand.current },
      startTrackPos: start,
    });

    setRightTrack([...rightTrackGenes, svgResult]);

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

      let svgResultLeft = setStrand({
        strandPos: [...strandLevelList],
        checkPrev: { ...prevOverflowStrand2.current },
        startTrackPos: end - bpRegionSize!,
      });

      setLeftTrack([...leftTrackGenes, svgResultLeft]);

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

  function fetchGenomeData2() {
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

    let svgResultLeft = setStrand({
      strandPos: [...strandLevelList],
      checkPrev: { ...prevOverflowStrand2.current },
      startTrackPos: start,
    });

    setLeftTrack([...leftTrackGenes, svgResultLeft]);

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

  // check each strand interval on each level to see if they overlapp and place it there
  // they are already in order of not overlapp. so we just just check  Loop previousIndex <- (currentIndex interval)
  //update the previous level start and end
  function setStrand(trackGeneData: { [Key: string]: any }) {
    // Set up event listener for messages from the worker
    // const worker = new Worker('./worker', {
    //   name: 'runSetStrand',
    //   type: 'module',
    // });
    // const { setStrand } = wrap<import('./worker').runSetStrand>(worker);
    // trackGeneData['bpToPx'] = bpToPx;
    // console.log(await setStrand(trackGeneData));

    var yCoord = 20;
    const strandList: Array<any> = [];

    if (Object.keys(trackGeneData).length > 0) {
      var checkObj = false;
      if (trackGeneData.checkPrev !== undefined) {
        checkObj = true;
      }
      for (let i = 0; i < trackGeneData.strandPos.length; i++) {
        let strandHtml: Array<any> = [];
        for (let j = 0; j < trackGeneData.strandPos[i].length; j++) {
          const singleStrand = trackGeneData.strandPos[i][j];

          if (
            Object.keys(singleStrand).length === 0 ||
            (checkObj && singleStrand.id in trackGeneData.checkPrev)
          ) {
            continue;
          } else {
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

            const startX =
              (singleStrand.txStart - trackGeneData.startTrackPos) / bpToPx!;
            const endX =
              (singleStrand.txEnd - trackGeneData.startTrackPos) / bpToPx!;
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

            for (
              let arrowTipX = placementStartX;
              arrowTipX <= placementEndX;
              arrowTipX += arrowSeparation
            ) {
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
                  strokeWidth={0.5}
                />
              );
            }
            if (trackGeneData.startTrackPos > singleStrand.txStart) {
              console.log(singleStrand, trackGeneData.startTrackPos);
            }
            strandHtml.push(
              <React.Fragment key={singleStrand.txStart + singleStrand.txEnd}>
                {children.map((item, index) => item)}
                <line
                  x1={`${
                    (singleStrand.txStart - trackGeneData.startTrackPos) /
                    bpToPx!
                  }`}
                  y1={`${yCoord}`}
                  x2={`${
                    (singleStrand.txEnd - trackGeneData.startTrackPos) / bpToPx!
                  }`}
                  y2={`${yCoord}`}
                  stroke={`${strandColor}`}
                  strokeWidth="4"
                />
                {exonIntervals.map((coord, index) => (
                  <line
                    key={index}
                    x1={`${(coord[0] - trackGeneData.startTrackPos) / bpToPx!}`}
                    y1={`${yCoord}`}
                    x2={`${(coord[1] - trackGeneData.startTrackPos) / bpToPx!}`}
                    y2={`${yCoord}`}
                    stroke={`${strandColor}`}
                    strokeWidth="7"
                  />
                ))}

                <text
                  fontSize={7}
                  x={`${
                    (singleStrand.txStart - trackGeneData.startTrackPos) /
                    bpToPx!
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

    return strandList;
  }

  useEffect(() => {
    if (trackData!.side === 'right') {
      fetchGenomeData();
    } else if (trackData!.side === 'left') {
      fetchGenomeData2();
    }
  }, [trackData]);

  return (
    //svg allows overflow to be visible x and y but the div only allows x overflow, so we need to set the svg to overflow x and y and then limit it in div its container.
    <div style={{ display: 'flex', overflowX: 'visible', overflowY: 'hidden' }}>
      {side === 'right'
        ? rightTrackGenes.map(
            (item, index) => (
              // index <= rightTrackGenes.length - 1 ?
              <svg
                key={index}
                width={`${windowWidth}px`}
                height={'250'}
                style={{
                  overflow: 'visible',
                }}
              >
                <line
                  x1={`${windowWidth}px`}
                  y1="0"
                  x2={`${windowWidth}px`}
                  y2={'100%'}
                  stroke="gray"
                  strokeWidth="1"
                />

                {rightTrackGenes[index]}
                {trackRegionR.current[index]}
              </svg>
            )
            //  : (
            //   <div style={{ display: 'flex', width: windowWidth  }}>
            //     ....LOADING
            //   </div>
            // )
          )
        : leftTrackGenes.map((item, index) => (
            // index <= rightTrackGenes.length - 1 ?
            <svg
              key={leftTrackGenes.length - index - 1}
              width={`${windowWidth}px`}
              height={'250'}
              style={{ display: 'inline-block' }}
              overflow="visible"
            >
              <line
                x1={`${windowWidth}px`}
                y1="0"
                x2={`${windowWidth}px`}
                y2={'100%'}
                stroke="gray"
                strokeWidth="1"
              />

              {leftTrackGenes[leftTrackGenes.length - index - 1]}
              {trackRegionL.current[trackRegionL.current.length - index - 1]}
            </svg>
          ))}
    </div>
  );
});

export default memo(GenRefTrack);
