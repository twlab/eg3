import React, { memo } from "react";
import { useEffect, useRef, useState } from "react";
// import worker_script from '../../Worker/worker';

import _ from "lodash";
import ToolTipGenomealign from "../commonComponents/hover-and-tooltip/toolTipGenomealign";
import { TrackProps } from "../../../models/trackModels/trackProps";
import { GapText, PlacedAlignment } from "./MultiAlignmentViewCalculator";
import {
  renderFineAlignment,
  renderGapText,
  renderRoughStrand,
} from "./genomeAlignComponents";

const GenomeAlign: React.FC<TrackProps> = memo(function GenomeAlign({
  bpToPx,
  side,
  trackData,
  trackIdx,
  handleDelete,
  windowWidth,
  dataIdx,
  id,
}) {
  //useRef to store data between states without re render the component
  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates
  const rightIdx = useRef(0);
  const leftIdx = useRef(1);

  const fetchedDataCache = useRef<{ [key: string]: any }>({});
  const curRegionData = useRef<{ [key: string]: any }>({});
  const xPos = useRef(0);

  const [svgComponents, setSvgComponents] = useState<Array<any>>([]);

  const newTrackWidth = useRef(windowWidth);

  function createSVG(trackState, alignmentData) {
    let result = alignmentData;
    let svgElements;

    if (bpToPx! <= 10) {
      const drawData = result.drawData as PlacedAlignment[];

      svgElements = drawData.map(renderFineAlignment);
      const drawGapText = result.drawGapText as GapText[];
      svgElements.push(...drawGapText.map(renderGapText));

      setSvgComponents(new Array<any>(svgElements));

      if (trackState.index === 0) {
        xPos.current = -trackState.startWindow;
      } else if (trackState.side === "right") {
        xPos.current = -trackState!.xDist - trackState.startWindow;
      } else if (trackState.side === "left") {
        xPos.current = trackState!.xDist - trackState.startWindow;
      }

      newTrackWidth.current = trackState.visWidth;
    }

    //ROUGHMODE __________________________________________________________________________________________________________________________________________________________
    //step 1
    else {
      // newWorkerData["viewMode"] = "roughMode";
      // worker.onmessage = (event) => {
      //   let drawDataArr = event.data.drawDataArr;
      //   let drawData = drawDataArr[0].drawData;
      //   svgElements = drawData.map((placement) =>
      //     renderRoughAlignment(placement, false, 80)
      //   );
      //   newTrackWidth.current = drawDataArr[0].primaryVisData;
      //   const arrows = renderRoughStrand("+", 0, visData!.viewWindow, false);
      //   svgElements.push(arrows);
      //   const primaryViewWindow = drawDataArr[0].primaryVisData.viewWindow;
      //   const strand = drawDataArr[0].plotStrand;
      //   const height = 80;
      //   const primaryArrows = renderRoughStrand(
      //     strand,
      //     height - RECT_HEIGHT,
      //     primaryViewWindow,
      //     true
      //   );
      //   svgElements.push(primaryArrows);
      //   tmpObj = { svgElements, drawDataArr };
      //   if (trackData!.side === "right") {
      //     setRightTrack(new Array<any>(tmpObj));
      //   } else {
      //     setLeftTrack(new Array<any>(tmpObj));
      //   }
      //   xPos.current = event.data.xDist;
      // };
    }
  }

  // function to get for dataidx change and getting stored data
  function getCacheData() {
    //when dataIDx and rightRawData.current equals we have a new data since rightRawdata.current didn't have a chance to push new data yet
    //so this is for when there atleast 3 raw data length, and doesn't equal rightRawData.current length, we would just use the lastest three newest vaLUE
    // otherwise when there is new data cuz the user is at the end of the track
    let viewData = {};
    let curIdx;

    if (dataIdx! !== rightIdx.current && dataIdx! <= 0) {
      viewData = fetchedDataCache.current[dataIdx!].data;
      curIdx = dataIdx!;
    } else if (dataIdx! !== leftIdx.current && dataIdx! > 0) {
      viewData = fetchedDataCache.current[dataIdx!].data;
      curIdx = dataIdx!;
    }
    if ("drawData" in viewData) {
      curRegionData.current = {
        trackState: fetchedDataCache.current[curIdx].trackState,
        deDupRefGenesArr: viewData,
        initial: 0,
      };
      createSVG(fetchedDataCache.current[curIdx].trackState, viewData);
    }
  }
  // INITIAL AND NEW DATA &&&&&&&&&&&&&&&&&&&
  useEffect(() => {
    if (trackData![`${id}`] !== undefined) {
      if (trackData!.initial === 1) {
        let trackState0 = {
          initial: 0,
          side: "left",
          xDist: 0,
          index: 1,
          startWindow:
            trackData![`${id}`].result[0].result.primaryVisData.viewWindow
              .start,
          visWidth:
            trackData![`${id}`].result[0].result.primaryVisData.visWidth,
        };
        let trackState1 = {
          initial: 1,
          side: "right",
          xDist: 0,
          index: 0,
          startWindow:
            trackData![`${id}`].result[1].result.primaryVisData.viewWindow
              .start,
          visWidth:
            trackData![`${id}`].result[1].result.primaryVisData.visWidth,
        };
        let trackState2 = {
          initial: 0,
          side: "right",
          xDist: 0,
          index: -1,
          startWindow:
            trackData![`${id}`].result[2].result.primaryVisData.viewWindow
              .start,
          visWidth:
            trackData![`${id}`].result[2].result.primaryVisData.visWidth,
        };

        fetchedDataCache.current[leftIdx.current] = {
          data: trackData![`${id}`].result[0].result,
          trackState: trackState0,
        };
        leftIdx.current++;

        fetchedDataCache.current[rightIdx.current] = {
          data: trackData![`${id}`].result[1].result,
          trackState: trackState1,
        };
        rightIdx.current--;
        fetchedDataCache.current[rightIdx.current] = {
          data: trackData![`${id}`].result[2].result,
          trackState: trackState2,
        };
        rightIdx.current--;

        let curDataArr = fetchedDataCache.current[0].data;

        curRegionData.current = {
          trackState: trackState1,
          deDupRefGenesArr: curDataArr,
        };
        createSVG(trackState1, curDataArr);
      } else {
        let newTrackState = {
          ...trackData!.trackState,
          startWindow:
            trackData![`${id}`].result.primaryVisData.viewWindow.start,
          visWidth: trackData![`${id}`].result.primaryVisData.visWidth,
        };
        if (trackData!.trackState.side === "right") {
          newTrackState["index"] = rightIdx.current;
          fetchedDataCache.current[rightIdx.current] = {
            data: trackData![`${id}`].result,
            trackState: newTrackState,
          };

          rightIdx.current--;

          curRegionData.current = {
            trackState: newTrackState,
            deDupRefGenesArr:
              fetchedDataCache.current[rightIdx.current + 1].data,
            initial: 0,
          };
          createSVG(
            newTrackState,
            fetchedDataCache.current[rightIdx.current + 1].data
          );
        } else if (trackData!.trackState.side === "left") {
          newTrackState["index"] = leftIdx.current;
          fetchedDataCache.current[leftIdx.current] = {
            data: trackData![`${id}`].result,
            trackState: newTrackState,
          };

          leftIdx.current++;

          curRegionData.current = {
            trackState: newTrackState,
            deDupRefGenesArr:
              fetchedDataCache.current[leftIdx.current - 1].data,
            initial: 0,
          };

          createSVG(
            newTrackState,
            fetchedDataCache.current[leftIdx.current - 1].data
          );
        }
      }
    }
  }, [trackData]);
  // when INDEX POSITION CHANGE

  useEffect(() => {
    getCacheData();
  }, [dataIdx]);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          position: "relative",
          height: 80,
        }}
      >
        <svg
          width={`${newTrackWidth.current}px`}
          height={"80px"}
          style={{
            position: "absolute",

            right: side === "left" ? `${xPos.current!}px` : "",
            left: side === "right" ? `${xPos.current!}px` : "",
          }}
        >
          {svgComponents.map((drawData) => drawData)}
        </svg>
        {/* <div
          style={{
            position: "absolute",
            right: side === "left" ? `${xPos.current!}px` : "",
            left: side === "right" ? `${-xPos.current!}px` : "",
          }}
        >
          {bpToPx! <= 10
            ? xPos.current <= 0
              ? rightTrackGenes.map(
                  (drawData) =>
                    // index <= rightTrackGenes.length - 1 ?
                    drawData["drawData"].map((drawDataArr, index) => (
                      <ToolTipGenomealign
                        key={"genomeAlignRight" + `${trackIdx}`}
                        trackType={trackType}
                        data={drawDataArr}
                        windowWidth={newTrackWidth.current!.visWidth}
                        side={"right"}
                        height={DEFAULT_OPTIONS.height}
                      />
                    ))
                  //  : (
                  //   <div style={{ display: 'flex', width: windowWidth }}>
                  //     ....LOADING
                  //   </div>
                  // )
                )
              : leftTrackGenes.map(
                  (drawData) =>
                    // index <= rightTrackGenes.length - 1 ?
                    drawData["drawData"].map((drawDataArr) => (
                      <ToolTipGenomealign
                        key={"genomealignLeft" + `${trackIdx}`}
                        trackType={trackType}
                        data={drawDataArr}
                        windowWidth={newTrackWidth.current!.visWidth}
                        side={"left"}
                        height={DEFAULT_OPTIONS.height}
                      />
                    ))
                  //  : (
                  //   <div style={{ display: 'flex', width: windowWidth }}>
                  //     ....LOADING
                  //   </div>
                  // )
                )
            : " "}
        </div> */}
      </div>
      {/* <button
        style={{ display: "flex", position: "relative" }}
        onClick={() => handleDelete(trackIdx)}
      >
        Delete
      </button> */}
    </div>
  );
});
export default memo(GenomeAlign);
