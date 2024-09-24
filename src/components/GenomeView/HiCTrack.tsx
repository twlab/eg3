import React, { memo } from "react";
import { useEffect, useRef, useState } from "react";
import { TrackProps } from "../../models/trackModels/trackProps";
import { objToInstanceAlign } from "./TrackManager";

import { SortItemsOptions } from "../../models/SortItemsOptions";
import OpenInterval from "../../models/OpenInterval";
import { removeDuplicatesWithoutId } from "./commonComponents/check-obj-dupe";

import "./TrackContextMenu.css";
import { DEFAULT_OPTIONS as defaultInteractionTrack } from "./interactionTrack/InteractionTrackComponent";
import trackConfigMenu from "../../trackConfigs/config-menu-components.tsx/TrackConfigMenu";
import { v4 as uuidv4 } from "uuid";
import DisplayedRegionModel from "../../models/DisplayedRegionModel";

import InteractionTrackComponent from "./interactionTrack/InteractionTrackComponent";
import { MethylCTrackConfig } from "../../trackConfigs/config-menu-models.tsx/MethylCTrackConfig";
import MethylCRecord from "../../models/MethylCRecord";
import { InteractionDisplayMode } from "../../trackConfigs/config-menu-models.tsx/DisplayModes";

export const DEFAULT_OPTIONS = {
  ...defaultInteractionTrack,
};

const InteractionTrack: React.FC<TrackProps> = memo(function InteractionTrack({
  trackData,
  side,
  windowWidth = 0,
  genomeArr,
  genomeIdx,
  trackModel,
  dataIdx,
  getConfigMenu,
  onCloseConfigMenu,
  handleDelete,
  trackIdx,
  id,
  useFineModeNav,
}) {
  const configOptions = useRef({ ...DEFAULT_OPTIONS });
  const svgHeight = useRef(0);
  const rightIdx = useRef(0);
  const leftIdx = useRef(1);
  const fetchedDataCache = useRef<{ [key: string]: any }>({});
  const prevDataIdx = useRef(0);
  const xPos = useRef(0);
  const curRegionData = useRef<{ [key: string]: any }>({});
  const parentGenome = useRef("");
  const configMenuPos = useRef<{ [key: string]: any }>({});
  const [canvasComponents, setCanvasComponents] = useState<any>();
  const newTrackWidth = useRef(windowWidth);
  const [configChanged, setConfigChanged] = useState(false);

  // These states are used to update the tracks with new fetched data
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track

  async function createCanvas(curTrackData, genesArr, fine) {
    if (curTrackData.index === 0) {
      xPos.current = -curTrackData.startWindow;
    } else if (curTrackData.side === "right") {
      xPos.current = -curTrackData!.xDist - curTrackData.startWindow;
    } else if (curTrackData.side === "left") {
      xPos.current = curTrackData!.xDist - curTrackData.startWindow;
    }

    if (fine) {
      newTrackWidth.current = curTrackData.visWidth;
    }

    let currDisplayNav;
    let sortType = SortItemsOptions.NOSORT;

    if (!fine) {
      if (curTrackData.side === "right") {
        currDisplayNav = new DisplayedRegionModel(
          curTrackData.regionNavCoord._navContext,
          curTrackData.regionNavCoord._startBase -
            (curTrackData.regionNavCoord._endBase -
              curTrackData.regionNavCoord._startBase) *
              2,
          curTrackData.regionNavCoord._endBase
        );
        if (curTrackData.index === 0) {
          currDisplayNav = new DisplayedRegionModel(
            curTrackData.regionNavCoord._navContext,
            curTrackData.regionNavCoord._startBase -
              (curTrackData.regionNavCoord._endBase -
                curTrackData.regionNavCoord._startBase),
            curTrackData.regionNavCoord._endBase +
              (curTrackData.regionNavCoord._endBase -
                curTrackData.regionNavCoord._startBase)
          );
        }
      } else if (curTrackData.side === "left") {
        currDisplayNav = new DisplayedRegionModel(
          curTrackData.regionNavCoord._navContext,
          curTrackData.regionNavCoord._startBase,
          curTrackData.regionNavCoord._endBase +
            (curTrackData.regionNavCoord._endBase -
              curTrackData.regionNavCoord._startBase) *
              2
        );
      }
    }
    // forma data so we can convert it using functions

    let algoData = genesArr.map((record) => {
      return new MethylCRecord(record);
    });

    if (configOptions.current.displayMode === InteractionDisplayMode.HEATMAP) {
      let tmpObj = { ...configOptions.current };
      let canvasElements = (
        <InteractionTrackComponent
          data={algoData}
          options={tmpObj}
          viewWindow={
            new OpenInterval(0, fine ? curTrackData.visWidth : windowWidth * 3)
          }
          visRegion={
            fine ? objToInstanceAlign(curTrackData.visRegion) : currDisplayNav
          }
          width={fine ? curTrackData.visWidth : windowWidth * 3}
          forceSvg={false}
          trackModel={trackModel}
        />
      );
      setCanvasComponents(canvasElements);
    }
  }

  //________________________________________________________________________________________________________________________________________________________

  function onConfigChange(key, value) {
    if (value === configOptions.current[`${key}`]) {
      return;
    } else if (
      key === "displayMode" &&
      value !== configOptions.current.displayMode
    ) {
      configOptions.current.displayMode = value;

      genomeArr![genomeIdx!].options = configOptions.current;

      const renderer = new MethylCTrackConfig(genomeArr![genomeIdx!]);

      const items = renderer.getMenuComponents();

      let menu = trackConfigMenu[`${trackModel.type}`]({
        trackIdx,
        handleDelete,
        id,
        pageX: configMenuPos.current.left,
        pageY: configMenuPos.current.top,
        onCloseConfigMenu,
        trackModel,
        configOptions: configOptions.current,
        items,
        onConfigChange,
      });

      getConfigMenu(menu);
    } else {
      configOptions.current[`${key}`] = value;
    }
    setConfigChanged(true);
  }
  function renderConfigMenu(event) {
    event.preventDefault();

    genomeArr![genomeIdx!].options = configOptions.current;

    const renderer = new MethylCTrackConfig(genomeArr![genomeIdx!]);

    // create object that has key as displayMode and the configmenu component as the value
    const items = renderer.getMenuComponents();
    let menu = trackConfigMenu[`${trackModel.type}`]({
      trackIdx,
      handleDelete,
      id,
      pageX: event.pageX,
      pageY: event.pageY,
      onCloseConfigMenu,
      trackModel,
      configOptions: configOptions.current,
      items,
      onConfigChange,
    });

    getConfigMenu(menu);
    configMenuPos.current = { left: event.pageX, top: event.pageY };
  }

  function getCacheData() {
    let viewData: Array<any> = [];
    let curIdx;

    if (
      useFineModeNav ||
      genomeArr![genomeIdx!].genome._name !== parentGenome.current
    ) {
      if (dataIdx! !== rightIdx.current && dataIdx! <= 0) {
        if (dataIdx === 1) {
          dataIdx = 0;
        }
        viewData = fetchedDataCache.current[dataIdx!].dynseqData;
        curIdx = dataIdx!;
      } else if (dataIdx! !== leftIdx.current && dataIdx! > 0) {
        if (dataIdx === 1) {
          dataIdx = 0;
        }
        viewData = fetchedDataCache.current[dataIdx!].dynseqData;
        curIdx = dataIdx!;
      }
    } else {
      if (dataIdx! !== rightIdx.current && dataIdx! <= 0) {
        if (prevDataIdx.current > dataIdx!) {
          viewData = [
            fetchedDataCache.current[dataIdx! + 2],
            fetchedDataCache.current[dataIdx! + 1],
            fetchedDataCache.current[dataIdx!],
          ];

          curIdx = dataIdx!;
        } else if (prevDataIdx.current < dataIdx!) {
          viewData = [
            fetchedDataCache.current[dataIdx! + 1],
            fetchedDataCache.current[dataIdx!],
            fetchedDataCache.current[dataIdx! - 1],
          ];

          curIdx = dataIdx! - 1;
          curIdx = dataIdx!;
        }
      } else if (dataIdx! !== leftIdx.current && dataIdx! > 0) {
        if (prevDataIdx.current < dataIdx!) {
          viewData = [
            fetchedDataCache.current[dataIdx!],
            fetchedDataCache.current[dataIdx! - 1],
            fetchedDataCache.current[dataIdx! - 2],
          ];

          curIdx = dataIdx!;
        } else if (prevDataIdx.current > dataIdx!) {
          viewData = [
            fetchedDataCache.current[dataIdx! + 1],
            fetchedDataCache.current[dataIdx!],

            fetchedDataCache.current[dataIdx! - 1],
          ];

          curIdx = dataIdx! + 1;
        }
      }
    }
    if (viewData.length > 0) {
      if (
        !useFineModeNav &&
        genomeArr![genomeIdx!].genome._name === parentGenome.current
      ) {
        let dynseqDataArray = viewData.map((item) => item.dynseqData).flat(1);
        let deDupdynseqDataArr = removeDuplicatesWithoutId(dynseqDataArray);
        viewData = deDupdynseqDataArr;
        curRegionData.current = {
          trackState: fetchedDataCache.current[curIdx].trackState,
          deDupdynseqDataArr: viewData,
          initial: 0,
        };

        createCanvas(
          fetchedDataCache.current[curIdx].trackState,
          viewData,
          false
        );
      } else {
        createCanvas(
          fetchedDataCache.current[curIdx].trackState,
          viewData,
          true
        );
      }
    }
  }
  useEffect(() => {
    if (trackData![`${id}`]) {
      console.log(trackData);
      // if (useFineModeNav || "genome" in trackData![`${id}`].metadata) {
      //   const primaryVisData =
      //     trackData!.trackState.genomicFetchCoord[
      //       trackData!.trackState.primaryGenName
      //     ].primaryVisData;
      //   if (trackData!.trackState.initial === 1) {
      //     if ("genome" in trackData![`${id}`].metadata) {
      //       parentGenome.current = trackData![`${id}`].metadata.genome;
      //     } else {
      //       parentGenome.current = trackData!.trackState.primaryGenName;
      //     }
      //     let visRegionArr =
      //       "genome" in trackData![`${id}`].metadata
      //         ? trackData!.trackState.genomicFetchCoord[
      //             trackData![`${id}`].metadata.genome
      //           ].queryRegion
      //         : primaryVisData.map((item) => item.visRegion);
      //     const createTrackState = (index: number, side: string) => ({
      //       initial: index === 1 ? 1 : 0,
      //       side,
      //       xDist: 0,
      //       visRegion: visRegionArr[index],
      //       startWindow: primaryVisData[index].viewWindow.start,
      //       visWidth: primaryVisData[index].visWidth,
      //     });
      //     fetchedDataCache.current[leftIdx.current] = {
      //       dynseqData: trackData![`${id}`].result[0].fetchData,
      //       trackState: createTrackState(0, "left"),
      //     };
      //     leftIdx.current++;
      //     fetchedDataCache.current[rightIdx.current] = {
      //       dynseqData: trackData![`${id}`].result[1].fetchData,
      //       trackState: createTrackState(1, "right"),
      //     };
      //     rightIdx.current--;
      //     fetchedDataCache.current[rightIdx.current] = {
      //       dynseqData: trackData![`${id}`].result[2].fetchData,
      //       trackState: createTrackState(2, "right"),
      //     };
      //     rightIdx.current--;
      //     const curDataArr = fetchedDataCache.current[0].dynseqData;
      //     curRegionData.current = {
      //       trackState: createTrackState(1, "right"),
      //       deDupdynseqDataArr: curDataArr,
      //     };
      //     createCanvas(createTrackState(1, "right"), curDataArr, true);
      //   } else {
      //     let visRegion;
      //     if ("genome" in trackData![`${id}`].metadata) {
      //       visRegion =
      //         trackData!.trackState.genomicFetchCoord[
      //           `${trackData![`${id}`].metadata.genome}`
      //         ].queryRegion;
      //     } else {
      //       visRegion = primaryVisData.visRegion;
      //     }
      //     let newTrackState = {
      //       initial: 0,
      //       side: trackData!.trackState.side,
      //       xDist: trackData!.trackState.xDist,
      //       visRegion: visRegion,
      //       startWindow: primaryVisData.viewWindow.start,
      //       visWidth: primaryVisData.visWidth,
      //       useFineModeNav: true,
      //     };
      //     if (trackData!.trackState.side === "right") {
      //       newTrackState["index"] = rightIdx.current;
      //       fetchedDataCache.current[rightIdx.current] = {
      //         dynseqData: trackData![`${id}`].result,
      //         trackState: newTrackState,
      //       };
      //       rightIdx.current--;
      //       curRegionData.current = {
      //         trackState:
      //           fetchedDataCache.current[rightIdx.current + 1].trackState,
      //         deDupdynseqDataArr:
      //           fetchedDataCache.current[rightIdx.current + 1].dynseqData,
      //         initial: 0,
      //       };
      //       createCanvas(
      //         newTrackState,
      //         fetchedDataCache.current[rightIdx.current + 1].dynseqData,
      //         true
      //       );
      //     } else if (trackData!.trackState.side === "left") {
      //       trackData!.trackState["index"] = leftIdx.current;
      //       fetchedDataCache.current[leftIdx.current] = {
      //         dynseqData: trackData![`${id}`].result,
      //         trackState: newTrackState,
      //       };
      //       leftIdx.current++;
      //       curRegionData.current = {
      //         trackState:
      //           fetchedDataCache.current[leftIdx.current - 1].trackState,
      //         deDupdynseqDataArr:
      //           fetchedDataCache.current[leftIdx.current - 1].dynseqData,
      //         initial: 0,
      //       };
      //       createCanvas(
      //         newTrackState,
      //         fetchedDataCache.current[leftIdx.current - 1].dynseqData,
      //         true
      //       );
      //     }
      //   }
      // }
    }
  }, [trackData]);

  useEffect(() => {
    if (configChanged === true) {
      if (!useFineModeNav) {
        createCanvas(
          curRegionData.current.trackState,
          curRegionData.current.deDupdynseqDataArr,
          false
        );
      } else {
        createCanvas(
          curRegionData.current.trackState,
          curRegionData.current.deDupdynseqDataArr,
          true
        );
      }
    }
    setConfigChanged(false);
  }, [configChanged]);
  useEffect(() => {
    //when dataIDx and rightRawData.current equals we have a new data since rightRawdata.current didn't have a chance to push new data yet
    //so this is for when there atleast 3 raw data length, and doesn't equal rightRawData.current length, we would just use the lastest three newest vaLUE
    // otherwise when there is new data cuz the user is at the end of the track
    getCacheData();
  }, [dataIdx]);

  return (
    //svg allows overflow to be visible x and y but the div only allows x overflow, so we need to set the svg to overflow x and y and then limit it in div its container.

    <div
      style={{
        display: "flex",

        flexDirection: "column",
      }}
      onContextMenu={renderConfigMenu}
    >
      <div
        style={{
          display: "flex",
          // we add two pixel for the borders, because using absolute for child we have to set the height to match with the parent relative else
          // other elements will overlapp
          height: configOptions.current.height * 2 + 2,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            position: "relative",
            height: configOptions.current.height,
          }}
        >
          <div
            style={{
              borderTop: "1px solid Dodgerblue",
              borderBottom: "1px solid Dodgerblue",
              position: "absolute",
              backgroundColor: configOptions.current.backgroundColor,
              left: side === "right" ? `${xPos.current}px` : "",
              right: side === "left" ? `${xPos.current}px` : "",
            }}
          >
            {canvasComponents}
          </div>
        </div>
      </div>
    </div>
  );
});

export default memo(InteractionTrack);
