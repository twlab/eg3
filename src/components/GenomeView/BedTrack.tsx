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

  function fetchGenomeData() {
    // TO - IF STRAND OVERFLOW THEN NEED TO SET TO MAX WIDTH OR 0 to NOT AFFECT THE LOGIC.

    // initialize the first index of the interval so we can start checking for prev overlapping intervals

    if (result[0]) {
      result = result[0];
      var resultIdx = 0;

      // let checking for interval overlapping and determining what level each strand should be on
      for (let i = resultIdx; i < result.length; i++) {
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
      setLeftTrack([...leftTrackGenes, svgResult]);
    }
  }

  //________________________________________________________________________________________________________________________________________________________
  //________________________________________________________________________________________________________________________________________________________

  function fetchGenomeData2() {
    let startPos;
    startPos = start;

    // initialize the first index of the interval so we can start checking for prev overlapping intervals

    if (result !== undefined && result.length > 0) {
      result[0].sort((a, b) => {
        return b.end - a.end;
      });
      result = result[0];
      var resultIdx = 0;

      // let checking for interval overlapping and determining what level each strand should be on
      for (let i = resultIdx; i < result.length; i++) {
        const curStrand = result[i];
        if (curStrand.start < start) {
          const strandId = curStrand.start + curStrand.end;

          overflowStrand2.current[strandId] = {
            level: i,
            strand: curStrand,
          };
        }
      }
    }
    let svgResult = setStrand({
      strandPos: [...result],
      checkPrev: { ...prevOverflowStrand2.current },
      startTrackPos: start,
    });
    setLeftTrack([...leftTrackGenes, svgResult]);

    prevOverflowStrand2.current = { ...overflowStrand2.current };

    overflowStrand2.current = {};
  }
  function setStrand(trackGeneData: { [Key: string]: any }) {
    //TO- DO FIX Y COORD ADD SPACE EVEN WHEN THERES NO STRAND ON LEVE
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
        //strokewidth will expand equally in both direction up and down so to fill 40. Y1 and Y2 needs to be in the middle which
        // is 20 expanding 20 up
        //add a single strand to current track------------------------------------------------------------------------------------
        strandHtml.push(
          <React.Fragment key={singleStrand.start + singleStrand.end + 2333}>
            <line
              x1={`${
                (singleStrand.start - trackGeneData.startTrackPos) / bpToPx!
              }`}
              y1={`${20}`}
              x2={`${
                (singleStrand.end - trackGeneData.startTrackPos) / bpToPx!
              }`}
              y2={`${20}`}
              stroke={'blue'}
              strokeWidth={40}
            />
          </React.Fragment>
        );
      }

      strandList.push(strandHtml);
    }

    return strandList.map((item, index) => item);
  }

  useEffect(() => {
    if (trackData!.side === 'right') {
      fetchGenomeData();
    } else if (trackData!.side === 'left') {
      fetchGenomeData2();
    }
  }, [trackData]);

  return (
    <div style={{ display: 'flex' }}>
      {side === 'right'
        ? rightTrackGenes.map(
            (item, index) => (
              // index <= rightTrackGenes.length - 1 ?
              <svg
                key={index}
                width={`${windowWidth}px`}
                height={'40'}
                overflow="visible"
              >
                {rightTrackGenes[index]}
              </svg>
            )
            // : (
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
              height={'40'}
              style={{ display: 'inline-block' }}
              overflow="visible"
            >
              {leftTrackGenes[leftTrackGenes.length - index - 1]}
            </svg>
          ))}
    </div>
  );
});
export default memo(BedTrack);
