import React, { memo, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { TrackProps } from "../../models/trackModels/trackProps";
import { objToInstanceAlign } from "./TrackManager";

import { SortItemsOptions } from "../../models/SortItemsOptions";
import OpenInterval from "../../models/OpenInterval";
import { removeDuplicatesWithoutId } from "./commonComponents/check-obj-dupe";

import { DEFAULT_OPTIONS as defaultNumericalTrack } from "./commonComponents/numerical/NumericalTrack";
import { DEFAULT_OPTIONS as defaultDynseq } from "./MethylcComponents/MethylCTrackComputation";
import trackConfigMenu from "../../trackConfigs/config-menu-components.tsx/TrackConfigMenu";
import { v4 as uuidv4 } from "uuid";
import DisplayedRegionModel from "../../models/DisplayedRegionModel";

import MethylCTrackComputation from "./MethylcComponents/MethylCTrackComputation";
import { MethylCTrackConfig } from "../../trackConfigs/config-menu-models.tsx/MethylCTrackConfig";
import MethylCRecord from "../../models/MethylCRecord";
import ReactDOM from "react-dom";

export const DEFAULT_OPTIONS = {
  ...defaultNumericalTrack,
  ...defaultDynseq,
};
DEFAULT_OPTIONS.aggregateMethod = "MEAN";
DEFAULT_OPTIONS.displayMode = "density";

const MethylcTrack: React.FC<TrackProps> = memo(function MethylcTrack({
  trackData,
  onTrackConfigChange,

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
  legendRef,
}) {
  const configOptions = useRef({ ...DEFAULT_OPTIONS });

  const rightIdx = useRef(0);
  const leftIdx = useRef(1);
  const fetchedDataCache = useRef<{ [key: string]: any }>({});
  const updateSide = useRef("right");
  const updatedLegend = useRef<any>();
  const xPos = useRef(0);
  const curRegionData = useRef<{ [key: string]: any }>({});
  const parentGenome = useRef("");
  const configMenuPos = useRef<{ [key: string]: any }>({});
  const [canvasComponents, setCanvasComponents] = useState<any>();
  const newTrackWidth = useRef(windowWidth);
  const [configChanged, setConfigChanged] = useState(false);
  const [legend, setLegend] = useState<any>();
  // These states are used to update the tracks with new fetched data
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track

  async function createCanvas(curTrackData, genesArr, fine) {
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

    if (configOptions.current.displayMode === "density") {
      let tmpObj = { ...configOptions.current };
      tmpObj.displayMode = "auto";
      function getNumLegend(legend: ReactNode) {
        updatedLegend.current = ReactDOM.createPortal(
          legend,
          legendRef.current
        );
      }
      let canvasElements = (
        <MethylCTrackComputation
          data={algoData}
          options={tmpObj}
          viewWindow={
            new OpenInterval(0, fine ? curTrackData.visWidth : windowWidth * 3)
          }
          viewRegion={
            fine ? objToInstanceAlign(curTrackData.visRegion) : currDisplayNav
          }
          width={fine ? curTrackData.visWidth : windowWidth * 3}
          forceSvg={false}
          trackModel={trackModel}
          getNumLegend={getNumLegend}
        />
      );
      setCanvasComponents(canvasElements);
    }
    if (curTrackData.initial === 1) {
      xPos.current = fine ? -curTrackData.startWindow : -windowWidth;
    } else if (curTrackData.side === "right") {
      xPos.current = fine
        ? (Math.floor(-curTrackData.xDist / windowWidth) - 1) * windowWidth -
          windowWidth +
          curTrackData.startWindow
        : (Math.floor(-curTrackData.xDist / windowWidth) - 1) * windowWidth;
    } else if (curTrackData.side === "left") {
      xPos.current = fine
        ? (Math.floor(curTrackData.xDist / windowWidth) - 1) * windowWidth -
          windowWidth +
          curTrackData.startWindow
        : (Math.floor(curTrackData.xDist / windowWidth) - 1) * windowWidth;
    }
    updateSide.current = side;
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

      trackModel.options = configOptions.current;

      const renderer = new MethylCTrackConfig(trackModel);

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

      getConfigMenu(menu, "singleSelect");
    } else {
      configOptions.current[`${key}`] = value;
    }
    setConfigChanged(true);
  }
  function renderConfigMenu(event) {
    event.preventDefault();

    const renderer = new MethylCTrackConfig(trackModel);

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

    getConfigMenu(menu, "singleSelect");
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
        viewData = fetchedDataCache.current[dataIdx!].cacheData;
        curIdx = dataIdx!;
      } else if (dataIdx! < leftIdx.current && dataIdx! > 0) {
        viewData = fetchedDataCache.current[dataIdx!].cacheData;
        curIdx = dataIdx!;
      }
    } else {
      if (dataIdx! > rightIdx.current + 1 && dataIdx! <= 0) {
        viewData = [
          fetchedDataCache.current[dataIdx! + 1],
          fetchedDataCache.current[dataIdx!],
          fetchedDataCache.current[dataIdx! - 1],
        ];

        curIdx = dataIdx! - 1;
      } else if (dataIdx! < leftIdx.current - 1 && dataIdx! > 0) {
        viewData = [
          fetchedDataCache.current[dataIdx! - 1],
          fetchedDataCache.current[dataIdx!],
          fetchedDataCache.current[dataIdx! + 1],
        ];

        curIdx = dataIdx! + 1;
      }
    }
    if (viewData.length > 0) {
      curRegionData.current = {
        trackState: fetchedDataCache.current[curIdx].trackState,
        deDupcacheDataArr: viewData,
        initial: 0,
      };
      if (
        !useFineModeNav &&
        genomeArr![genomeIdx!].genome._name === parentGenome.current
      ) {
        let cacheDataArray = viewData.map((item) => item.cacheData).flat(1);
        let deDupcacheDataArr = removeDuplicatesWithoutId(cacheDataArray);
        viewData = deDupcacheDataArr;
        curRegionData.current = {
          trackState: fetchedDataCache.current[curIdx].trackState,
          deDupcacheDataArr: viewData,
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
      if (useFineModeNav || trackData![`${id}`].metadata.genome !== undefined) {
        const primaryVisData =
          trackData!.trackState.genomicFetchCoord[
            trackData!.trackState.primaryGenName
          ].primaryVisData;

        if (trackData!.trackState.initial === 1) {
          if ("genome" in trackData![`${id}`].metadata) {
            parentGenome.current = trackData![`${id}`].metadata.genome;
          } else {
            parentGenome.current = trackData!.trackState.primaryGenName;
          }
          let visRegion =
            "genome" in trackData![`${id}`].metadata
              ? trackData!.trackState.genomicFetchCoord[
                  trackData![`${id}`].metadata.genome
                ].queryRegion
              : primaryVisData.visRegion;

          const createTrackState = (index: number, side: string) => ({
            initial: index === 1 ? 1 : 0,
            side,
            xDist: 0,

            visRegion: visRegion,
            startWindow: primaryVisData.viewWindow.start,
            visWidth: primaryVisData.visWidth,
          });

          fetchedDataCache.current[rightIdx.current] = {
            cacheData: trackData![`${id}`].result[0],
            trackState: createTrackState(1, "right"),
          };
          rightIdx.current--;

          const curDataArr = fetchedDataCache.current[0].cacheData;
          curRegionData.current = {
            trackState: createTrackState(1, "right"),
            deDupcacheDataArr: curDataArr,
          };

          createCanvas(createTrackState(1, "right"), curDataArr, true);
        } else {
          let visRegion;
          if ("genome" in trackData![`${id}`].metadata) {
            visRegion =
              trackData!.trackState.genomicFetchCoord[
                `${trackData![`${id}`].metadata.genome}`
              ].queryRegion;
          } else {
            visRegion = primaryVisData.visRegion;
          }
          let newTrackState = {
            initial: 0,
            side: trackData!.trackState.side,
            xDist: trackData!.trackState.xDist,
            visRegion: visRegion,
            startWindow: primaryVisData.viewWindow.start,
            visWidth: primaryVisData.visWidth,
            useFineModeNav: true,
          };

          if (trackData!.trackState.side === "right") {
            newTrackState["index"] = rightIdx.current;
            fetchedDataCache.current[rightIdx.current] = {
              cacheData: trackData![`${id}`].result,
              trackState: newTrackState,
            };

            rightIdx.current--;

            curRegionData.current = {
              trackState:
                fetchedDataCache.current[rightIdx.current + 1].trackState,
              deDupcacheDataArr:
                fetchedDataCache.current[rightIdx.current + 1].cacheData,
              initial: 0,
            };

            createCanvas(
              newTrackState,
              fetchedDataCache.current[rightIdx.current + 1].cacheData,
              true
            );
          } else if (trackData!.trackState.side === "left") {
            trackData!.trackState["index"] = leftIdx.current;
            fetchedDataCache.current[leftIdx.current] = {
              cacheData: trackData![`${id}`].result,
              trackState: newTrackState,
            };

            leftIdx.current++;

            curRegionData.current = {
              trackState:
                fetchedDataCache.current[leftIdx.current - 1].trackState,
              deDupcacheDataArr:
                fetchedDataCache.current[leftIdx.current - 1].cacheData,
              initial: 0,
            };

            createCanvas(
              newTrackState,
              fetchedDataCache.current[leftIdx.current - 1].cacheData,
              true
            );
          }
        }
      } else {
        //_________________________________________________________________________________________________________________________________________________
        const primaryVisData =
          trackData!.trackState.genomicFetchCoord[
            `${trackData!.trackState.primaryGenName}`
          ];

        if (trackData!.initial === 1) {
          if ("genome" in trackData![`${id}`].metadata) {
            parentGenome.current = trackData![`${id}`].metadata.genome;
          } else {
            parentGenome.current = trackData!.trackState.primaryGenName;
          }
          const visRegionArr = primaryVisData.initNavLoci.map(
            (item) =>
              new DisplayedRegionModel(
                genomeArr![genomeIdx!].navContext,
                item.start,
                item.end
              )
          );
          let trackState0 = {
            initial: 0,
            side: "left",
            xDist: 0,
            regionNavCoord: visRegionArr[0],
            index: 1,
            startWindow: primaryVisData.primaryVisData.viewWindow.start,
            visWidth: primaryVisData.primaryVisData.visWidth,
          };
          let trackState1 = {
            initial: 1,
            side: "right",
            xDist: 0,
            regionNavCoord: visRegionArr[1],
            index: 0,
            startWindow: primaryVisData.primaryVisData.viewWindow.start,
            visWidth: primaryVisData.primaryVisData.visWidth,
          };
          let trackState2 = {
            initial: 0,
            side: "right",
            xDist: 0,
            regionNavCoord: visRegionArr[2],
            index: -1,
            startWindow: primaryVisData.primaryVisData.viewWindow.start,
            visWidth: primaryVisData.primaryVisData.visWidth,
          };

          fetchedDataCache.current[leftIdx.current] = {
            cacheData: trackData![`${id}`].result[0],
            trackState: trackState0,
          };
          leftIdx.current++;

          fetchedDataCache.current[rightIdx.current] = {
            cacheData: trackData![`${id}`].result[1],
            trackState: trackState1,
          };
          rightIdx.current--;
          fetchedDataCache.current[rightIdx.current] = {
            cacheData: trackData![`${id}`].result[2],
            trackState: trackState2,
          };
          rightIdx.current--;

          let testData = [
            fetchedDataCache.current[1],
            fetchedDataCache.current[0],
            fetchedDataCache.current[-1],
          ];

          let cacheDataArray = testData.map((item) => item.cacheData).flat(1);

          let deDupcacheDataArr = removeDuplicatesWithoutId(cacheDataArray);
          curRegionData.current = {
            trackState: trackState1,
            deDupcacheDataArr,
          };
          createCanvas(trackState1, deDupcacheDataArr, false);
        } else {
          let testData: Array<any> = [];
          let newTrackState = {
            ...trackData!.trackState,
            startWindow: primaryVisData.primaryVisData.viewWindow.start,
            visWidth: primaryVisData.primaryVisData.visWidth,
          };
          if (trackData!.trackState.side === "right") {
            trackData!.trackState["index"] = rightIdx.current;
            fetchedDataCache.current[rightIdx.current] = {
              cacheData: trackData![`${id}`].result,
              trackState: newTrackState,
            };
            let currIdx = rightIdx.current + 2;
            for (let i = 0; i < 3; i++) {
              testData.push(fetchedDataCache.current[currIdx]);
              currIdx--;
            }

            rightIdx.current--;
            let cacheDataArray = testData.map((item) => item.cacheData).flat(1);
            let deDupcacheDataArr = removeDuplicatesWithoutId(cacheDataArray);
            curRegionData.current = {
              trackState: newTrackState,
              deDupcacheDataArr,
              initial: 0,
            };
            createCanvas(newTrackState, deDupcacheDataArr, false);
          } else if (trackData!.trackState.side === "left") {
            trackData!.trackState["index"] = leftIdx.current;
            fetchedDataCache.current[leftIdx.current] = {
              cacheData: trackData![`${id}`].result,
              trackState: newTrackState,
            };

            let currIdx = leftIdx.current - 2;
            for (let i = 0; i < 3; i++) {
              testData.push(fetchedDataCache.current[currIdx]);
              currIdx++;
            }

            leftIdx.current++;
            let cacheDataArray = testData.map((item) => item.cacheData).flat(1);
            let deDupcacheDataArr = removeDuplicatesWithoutId(cacheDataArray);
            curRegionData.current = {
              trackState: trackData!.trackState,
              deDupcacheDataArr,
              initial: 0,
            };
            createCanvas(newTrackState, deDupcacheDataArr, false);
          }
        }
      }
    }
    if (trackData![`${id}`] && trackData!.initial === 1) {
      onTrackConfigChange({
        configOptions: configOptions.current,
        trackModel: trackModel,
        id: id,
        trackIdx: trackIdx,
        legendRef: legendRef,
      });
    }
  }, [trackData]);

  useEffect(() => {
    if (configChanged === true) {
      if (
        !useFineModeNav &&
        genomeArr![genomeIdx!].genome._name === parentGenome.current
      ) {
        createCanvas(
          curRegionData.current.trackState,
          curRegionData.current.deDupcacheDataArr,
          false
        );
      } else {
        createCanvas(
          curRegionData.current.trackState,
          curRegionData.current.deDupcacheDataArr,
          true
        );
      }
      onTrackConfigChange({
        configOptions: configOptions.current,
        trackModel: trackModel,
        id: id,
        trackIdx: trackIdx,
        legendRef: legendRef,
      });
    }
    setConfigChanged(false);
  }, [configChanged]);
  useEffect(() => {
    //when dataIDx and rightRawData.current equals we have a new data since rightRawdata.current didn't have a chance to push new data yet
    //so this is for when there atleast 3 raw data length, and doesn't equal rightRawData.current length, we would just use the lastest three newest vaLUE
    // otherwise when there is new data cuz the user is at the end of the track
    getCacheData();
  }, [dataIdx]);
  useEffect(() => {
    setLegend(updatedLegend.current);
  }, [canvasComponents]);

  return (
    //svg allows overflow to be visible x and y but the div only allows x overflow, so we need to set the svg to overflow x and y and then limit it in div its container.

    <div
      onContextMenu={renderConfigMenu}
      style={{
        display: "flex",
        position: "relative",

        height: configOptions.current.height * 2 + 2,
      }}
    >
      <div
        style={{
          position: "absolute",
          backgroundColor: configOptions.current.backgroundColor,
          left: updateSide.current === "right" ? `${xPos.current}px` : "",
          right: updateSide.current === "left" ? `${xPos.current}px` : "",
        }}
      >
        {canvasComponents}
      </div>
      {legend}
    </div>
  );
});

export default memo(MethylcTrack);
