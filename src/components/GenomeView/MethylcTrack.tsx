import { scaleLinear } from 'd3-scale';
import React, { createRef, memo } from 'react';
import { useEffect, useRef, useState } from 'react';
import MethylCRecord from './MethylCRecord';
import { myFeatureAggregator } from './commonComponents/screen-scaling/FeatureAggregator';
import { reverse } from 'dns';
const VERTICAL_PADDING = 0;
const PLOT_DOWNWARDS_STRAND = 'reverse';
const DEFAULT_COLORS_FOR_CONTEXT = {
  CG: { color: 'rgb(100,139,216)', background: '#d9d9d9' },
  CHG: { color: 'rgb(255,148,77)', background: '#ffe0cc' },
  CHH: { color: 'rgb(255,0,255)', background: '#ffe5ff' },
};
const OVERLAPPING_CONTEXTS_COLORS = DEFAULT_COLORS_FOR_CONTEXT.CG;
const UNKNOWN_CONTEXT_COLORS = DEFAULT_COLORS_FOR_CONTEXT.CG;
interface BedTrackProps {
  bpRegionSize?: number;
  bpToPx?: number;
  trackData?: { [key: string]: any }; // Replace with the actual type
  side?: string;
  windowWidth?: number;
}
const MethylcTrack: React.FC<BedTrackProps> = memo(function MethylcTrack({
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
    result = trackData!.methylcResult;
    bpRegionSize = bpRegionSize;
    bpToPx = bpToPx;
  }

  start = Number(start);
  end = Number(end);
  //useRef to store data between states without re render the component
  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates

  const [rightTrackGenes, setRightTrack] = useState<Array<any>>([]);

  const [leftTrackGenes, setLeftTrack] = useState<Array<any>>([]);
  const prevOverflowStrand = useRef<{ [key: string]: any }>({});
  const overflowStrand = useRef<{ [key: string]: any }>({});
  const [canvasRefR, setCanvasRefR] = useState<Array<any>>([]);
  const [canvasRefR2, setCanvasRefR2] = useState<Array<any>>([]);
  const [canvasRefL, setCanvasRefL] = useState<Array<any>>([]);
  const [canvasRefL2, setCanvasRefL2] = useState<Array<any>>([]);
  const prevOverflowStrand2 = useRef<{ [key: string]: any }>({});
  const overflowStrand2 = useRef<{ [key: string]: any }>({});
  var scale = scaleLinear().domain([0, 1]).range([2, 40]).clamp(true);
  // These states are used to update the tracks with new fetched data
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track

  function getRndInteger(min = 0, max = 10000000000) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  async function fetchGenomeData(initial: number = 0) {
    // TO - IF STRAND OVERFLOW THEN NEED TO SET TO MAX WIDTH OR 0 to NOT AFFECT THE LOGIC.

    let startPos;
    startPos = start;

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

    setRightTrack([...rightTrackGenes, [[...result], startPos]]);

    const newCanvasRef = createRef();
    const newCanvasRef2 = createRef();
    setCanvasRefR((prevRefs) => [...prevRefs, newCanvasRef]);
    setCanvasRefR2((prevRefs) => [...prevRefs, newCanvasRef2]);
    // CHECK if there are overlapping strands to the next track

    if (trackData!.initial) {
      prevOverflowStrand2.current = { ...overflowStrand2.current };

      overflowStrand2.current = {};
      setLeftTrack([...leftTrackGenes, [[...result], startPos]]);
      const newCanvasRef = createRef();
      setCanvasRefL((prevRefs) => [...prevRefs, newCanvasRef]);
      const newCanvasRef2 = createRef();
      setCanvasRefL2((prevRefs) => [...prevRefs, newCanvasRef2]);
    }
    prevOverflowStrand.current = { ...overflowStrand.current };
    overflowStrand.current = {};
  }

  //________________________________________________________________________________________________________________________________________________________
  //________________________________________________________________________________________________________________________________________________________

  async function fetchGenomeData2() {
    let startPos = start;
    var strandIntervalList: Array<any> = [];

    result[0].sort((a, b) => {
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

    setLeftTrack([...leftTrackGenes, [[...result[0]], startPos]]);

    const newCanvasRef = createRef();
    setCanvasRefL((prevRefs) => [...prevRefs, newCanvasRef]);
    const newCanvasRef2 = createRef();
    setCanvasRefL2((prevRefs) => [...prevRefs, newCanvasRef2]);
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
  function findFeatureInPixel(data: any, windowWidth: number, bpToPx) {
    let xToFeatures: Array<Array<any>> = [];
    for (let i = 0; i < data.length; i++) {
      const newArr: Array<any> = Array.from(
        { length: Number(windowWidth * 2) },
        () => []
      );
      xToFeatures.push(newArr);
    }

    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].length; j++) {
        for (let x = 0; x < data[i][j].length; x++) {
          let singleStrand = data[i][j][x];

          if (Object.keys(singleStrand).length > 0) {
            let xSpanStart = (singleStrand.start - data[i][1]) / bpToPx!;
            let xSpanEnd = (singleStrand.end - data[i][1]) / bpToPx!;
            const startX = Math.max(0, Math.floor(xSpanStart));
            const endX = Math.min(windowWidth * 2 - 1, Math.ceil(xSpanEnd));

            for (let x = startX; x <= endX; x++) {
              xToFeatures[i][x].push(singleStrand);
            }
          }
        }
      }
    }
    return xToFeatures;
  }

  function computeScales(xMap, height: number = 40, maxMethyl: number = 1) {
    /*
      xMap = returnValueOfAggregateRecords = [
          {
              combined: {
                  depth: 5 (NaN if no data),
                  contextValues: [
                      {context: "CG", value: 0.3},
                      {context: "CHH", value: 0.3},
                      {context: "CHG", value: 0.3},
                  ]
              },
              forward: {},
              reverse: {}
          },
          ...
      ]
      */
    const forwardRecords = xMap.map((record) => record.forward);
    const reverseRecords = xMap.map((record) => record.reverse);

    const maxDepthForward = forwardRecords.reduce(
      (maxRecord, record) => {
        return record.depth > maxRecord.depth ? record : maxRecord;
      },
      { depth: 0 }
    );

    const maxDepthReverse = reverseRecords.reduce(
      (maxRecord, record) => {
        return record.depth > maxRecord.depth ? record : maxRecord;
      },
      { depth: 0 }
    );

    const maxDepth = Math.max(maxDepthForward.depth, maxDepthReverse.depth);

    return {
      methylToY: scaleLinear()
        .domain([maxMethyl, 0])
        .range([VERTICAL_PADDING, height])
        .clamp(true),
      depthToY: scaleLinear()
        .domain([maxDepth, 0])
        .range([VERTICAL_PADDING, height])
        .clamp(true),
    };
  }
  useEffect(() => {
    // to find the "xSpan" or the x coord of the canvas and svg. They start at 0 - the windowwith * 2 for this setup
    //     x1={`${(singleStrand.start - props.startTrackPos) / bpToPx!}`
    // x2={`${(singleStrand.end - props.startTrackPos) / bpToPx!}`}
    // step 1: loop through the svg width which is windowwith * 2
    // 2: create an array for each x pixel.
    // 3: round each strand start and end xspan
    // 4: If a strand is in the same xspan pixel then add them to a array index
    // 5: the array index will represent the x coord pixel of the canvas and svg

    //     CONTEXT = 3,
    // VALUE = 4,
    // STRAND = 5,
    // DEPTH = 6,
    if (rightTrackGenes.length > 0) {
      let dataForward: Array<any> = [];
      let dataReverse: Array<any> = [];
      for (let i = 0; i < rightTrackGenes.length; i++) {
        const newArr: Array<any> = [];
        dataForward.push(newArr);
        const newArr2: Array<any> = [];
        dataReverse.push(newArr2);
      }

      let xToRecords = findFeatureInPixel(
        rightTrackGenes,
        windowWidth,
        bpToPx!
      );

      let aggregatedRecords: Array<any> = [];
      for (let i = 0; i < xToRecords.length; i++) {
        aggregatedRecords.push(
          xToRecords[i].map(MethylCRecord.aggregateByStrand)
        );
      }

      if (rightTrackGenes.length > 0) {
        if (canvasRefR[canvasRefR.length - 1].current) {
          let context =
            canvasRefR[canvasRefR.length - 1].current.getContext('2d');

          context.clearRect(0, 0, context.canvas.width, context.canvas.height);
          let scales = computeScales(
            aggregatedRecords[aggregatedRecords.length - 1]
          );
          for (
            let j = 0;
            j < aggregatedRecords[aggregatedRecords.length - 1].length;
            j++
          ) {
            let forward =
              aggregatedRecords[aggregatedRecords.length - 1][j].forward;
            let reverse =
              aggregatedRecords[aggregatedRecords.length - 1][j].reverse;
            let combine =
              aggregatedRecords[aggregatedRecords.length - 1][j].combined;

            for (let contextData of forward.contextValues) {
              const drawY = scales.methylToY(Number(contextData.value));
              const drawHeight = 40 - drawY;
              const contextName = contextData.context;
              const color = DEFAULT_COLORS_FOR_CONTEXT[contextName].color;

              context.fillStyle = color;
              context.globalAlpha = 0.75;
              context.fillRect(j, drawY, 1, drawHeight);
            }
          }
        }
      }

      // if (canvasRefR2[canvasRefR2.length - 1].current) {
      //   let context =
      //     canvasRefR2[canvasRefR2.length - 1].current.getContext('2d');

      //   context.clearRect(0, 0, context.canvas.width, context.canvas.height);

      //   for (
      //     let i = 0;
      //     i < xToFeatureReverse[canvasRefR2.length - 1].length;
      //     i++
      //   ) {
      //     // going through width pixels
      //     // i = canvas pixel xpos
      //     if (xToFeatureReverse[canvasRefR2.length - 1][i] !== 0) {
      //       context.fillStyle = 'red';

      //       context.fillRect(
      //         i,
      //         0,
      //         1,
      //         xToFeatureReverse[canvasRefR2.length - 1][i]
      //       );
      //     }
      //   }
      // }
    }
  }, [rightTrackGenes]);

  useEffect(() => {
    if (leftTrackGenes.length > 0) {
      let [featureForward, xToFeatureReverse] = myFeatureAggregator.makeXMap(
        leftTrackGenes,
        bpToPx!,
        windowWidth,
        bpRegionSize!
      );

      if (canvasRefL.length > 0) {
        if (canvasRefL[canvasRefL.length - 1].current) {
          let context =
            canvasRefL[canvasRefL.length - 1].current.getContext('2d');

          context.clearRect(0, 0, context.canvas.width, context.canvas.height);

          for (
            let i = 0;
            i < featureForward[canvasRefL.length - 1].length;
            i++
          ) {
            // going through width pixels
            // i = canvas pixel xpos

            if (featureForward[canvasRefL.length - 1][i] !== 0) {
              context.fillStyle = 'blue';
              context.fillRect(
                i,
                featureForward[canvasRefL.length - 1][i],
                1,
                20 - featureForward[canvasRefL.length - 1][i]
              );
            }
          }
        }
      }

      if (canvasRefL2.length > 0) {
        if (canvasRefL2[canvasRefL2.length - 1].current) {
          let context =
            canvasRefL2[canvasRefL2.length - 1].current.getContext('2d');

          context.clearRect(0, 0, context.canvas.width, context.canvas.height);

          for (
            let i = 0;
            i < xToFeatureReverse[canvasRefL2.length - 1].length;
            i++
          ) {
            // going through width pixels
            // i = canvas pixel xpos
            if (xToFeatureReverse[canvasRefL2.length - 1][i] !== 0) {
              context.fillStyle = 'red';

              context.fillRect(
                i,
                0,
                1,
                xToFeatureReverse[canvasRefL2.length - 1][i]
              );
            }
          }
        }
      }
    }
  }, [leftTrackGenes]);

  useEffect(() => {
    if (side === 'left') {
      if (canvasRefL.length != 0) {
        canvasRefL.forEach((canvasRef, index) => {
          if (canvasRef.current) {
            let context = canvasRef.current.getContext('2d');
            context.clearRect(
              0,
              0,
              context.canvas.width,
              context.canvas.height
            );
          }
        });
        setLeftTrack([...leftTrackGenes]);
      }
    } else if (side === 'right') {
      if (canvasRefR.length != 0) {
        canvasRefR.forEach((canvasRef, index) => {
          if (canvasRef.current) {
            let context = canvasRef.current.getContext('2d');

            context.clearRect(
              0,
              0,
              context.canvas.width,
              context.canvas.height
            );
          }
        });
        setRightTrack([...rightTrackGenes]);
      }
    }
  }, [side]);

  useEffect(() => {
    async function handle() {
      if (trackData!.location && trackData!.side === 'right') {
        fetchGenomeData();
      } else if (trackData!.location && trackData!.side === 'left') {
        fetchGenomeData2();
      }
    }
    handle();
  }, [trackData]);

  return (
    <div style={{ height: '80px' }}>
      {side === 'right' ? (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          {rightTrackGenes.map((item, index) => (
            <div
              key={index + 34343479}
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              <canvas
                key={index}
                ref={canvasRefR[index]}
                height={'40'}
                width={`${windowWidth * 2}px`}
                style={{}}
              />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          {leftTrackGenes.map((item, index) => (
            <div
              key={canvasRefL.length - index - 1}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'end',
              }}
            >
              <canvas
                key={canvasRefL.length - index - 1 + 34343}
                ref={canvasRefL[canvasRefL.length - index - 1]}
                height={'20'}
                width={`${windowWidth * 2}px`}
                style={{}}
              />
              <canvas
                key={canvasRefL2.length - index - 1 + 3343434}
                ref={canvasRefL2[canvasRefL2.length - index - 1]}
                height={'20'}
                width={`${windowWidth * 2}px`}
                style={{}}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
export default memo(MethylcTrack);
