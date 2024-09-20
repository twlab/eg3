import React, { memo } from "react";
import { useEffect, useRef, useState } from "react";
import { TrackProps } from "../../models/trackModels/trackProps";
import { objToInstanceAlign } from "./TrackManager";

import { SortItemsOptions } from "../../models/SortItemsOptions";
import OpenInterval from "../../models/OpenInterval";
import { removeDuplicatesWithoutId } from "./commonComponents/check-obj-dupe";

import "./TrackContextMenu.css";
import { DEFAULT_OPTIONS as defaultNumericalTrack } from "./commonComponents/numerical/NumericalTrack";
import { DEFAULT_OPTIONS as defaultDynseq } from "./DynseqTrack/DynseqTrackComputation";
import trackConfigMenu from "../../trackConfigs/config-menu-components.tsx/TrackConfigMenu";
import { v4 as uuidv4 } from "uuid";
import DisplayedRegionModel from "../../models/DisplayedRegionModel";
import { NumericalFeature } from "../../models/Feature";
import ChromosomeInterval from "../../models/ChromosomeInterval";
import DynseqTrackComputation from "./DynseqTrack/DynseqTrackComputation";
import { DynseqTrackConfig } from "../../trackConfigs/config-menu-models.tsx/DynseqTrackConfig";

export const DEFAULT_OPTIONS = {
  ...defaultNumericalTrack,
  ...defaultDynseq,
};
DEFAULT_OPTIONS.aggregateMethod = "MEAN";
DEFAULT_OPTIONS.displayMode = "density";

const DynseqTrack: React.FC<TrackProps> = memo(function DynseqTrack({
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
      xPos.current = fine ? -curTrackData.startWindow : -windowWidth;
    } else if (curTrackData.side === "right") {
      xPos.current = fine
        ? -curTrackData.xDist - curTrackData.startWindow
        : (Math.floor(-curTrackData.xDist / windowWidth) - 1) * windowWidth;
    } else if (curTrackData.side === "left") {
      xPos.current = fine
        ? curTrackData.xDist - curTrackData.startWindow
        : (Math.floor(curTrackData.xDist / windowWidth) - 1) * windowWidth;
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
      let newChrInt = new ChromosomeInterval(
        record.chr,
        record.start,
        record.end
      );
      return new NumericalFeature("", newChrInt).withValue(record.score);
    });

    if (configOptions.current.displayMode === "density") {
      let tmpObj = { ...configOptions.current };
      tmpObj.displayMode = "auto";
      let canvasElements = (
        <DynseqTrackComputation
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

      const renderer = new DynseqTrackConfig(genomeArr![genomeIdx!]);

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

    const renderer = new DynseqTrackConfig(genomeArr![genomeIdx!]);

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
      if (useFineModeNav || "genome" in trackData![`${id}`].metadata) {
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
          let visRegionArr =
            "genome" in trackData![`${id}`].metadata
              ? trackData!.trackState.genomicFetchCoord[
                  trackData![`${id}`].metadata.genome
                ].queryRegion
              : primaryVisData.map((item) => item.visRegion);

          const createTrackState = (index: number, side: string) => ({
            initial: index === 1 ? 1 : 0,
            side,
            xDist: 0,

            visRegion: visRegionArr[index],
            startWindow: primaryVisData[index].viewWindow.start,
            visWidth: primaryVisData[index].visWidth,
          });

          fetchedDataCache.current[leftIdx.current] = {
            dynseqData: trackData![`${id}`].result[0].fetchData,
            trackState: createTrackState(0, "left"),
          };
          leftIdx.current++;

          fetchedDataCache.current[rightIdx.current] = {
            dynseqData: trackData![`${id}`].result[1].fetchData,
            trackState: createTrackState(1, "right"),
          };
          rightIdx.current--;

          fetchedDataCache.current[rightIdx.current] = {
            dynseqData: trackData![`${id}`].result[2].fetchData,
            trackState: createTrackState(2, "right"),
          };
          rightIdx.current--;

          const curDataArr = fetchedDataCache.current[0].dynseqData;
          curRegionData.current = {
            trackState: createTrackState(1, "right"),
            deDupdynseqDataArr: curDataArr,
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
              dynseqData: trackData![`${id}`].result,
              trackState: newTrackState,
            };

            rightIdx.current--;

            curRegionData.current = {
              trackState:
                fetchedDataCache.current[rightIdx.current + 1].trackState,
              deDupdynseqDataArr:
                fetchedDataCache.current[rightIdx.current + 1].dynseqData,
              initial: 0,
            };

            createCanvas(
              newTrackState,
              fetchedDataCache.current[rightIdx.current + 1].dynseqData,
              true
            );
          } else if (trackData!.trackState.side === "left") {
            trackData!.trackState["index"] = leftIdx.current;
            fetchedDataCache.current[leftIdx.current] = {
              dynseqData: trackData![`${id}`].result,
              trackState: newTrackState,
            };

            leftIdx.current++;

            curRegionData.current = {
              trackState:
                fetchedDataCache.current[leftIdx.current - 1].trackState,
              deDupdynseqDataArr:
                fetchedDataCache.current[leftIdx.current - 1].dynseqData,
              initial: 0,
            };

            createCanvas(
              newTrackState,
              fetchedDataCache.current[leftIdx.current - 1].dynseqData,
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
          };
          let trackState1 = {
            initial: 1,
            side: "right",
            xDist: 0,
            regionNavCoord: visRegionArr[1],
            index: 0,
          };
          let trackState2 = {
            initial: 0,
            side: "right",
            xDist: 0,
            regionNavCoord: visRegionArr[2],
            index: -1,
          };

          fetchedDataCache.current[leftIdx.current] = {
            dynseqData: trackData![`${id}`].result[0].fetchData,
            trackState: trackState0,
          };
          leftIdx.current++;

          fetchedDataCache.current[rightIdx.current] = {
            dynseqData: trackData![`${id}`].result[1].fetchData,
            trackState: trackState1,
          };
          rightIdx.current--;
          fetchedDataCache.current[rightIdx.current] = {
            dynseqData: trackData![`${id}`].result[2].fetchData,
            trackState: trackState2,
          };
          rightIdx.current--;

          let testData = [
            fetchedDataCache.current[1],
            fetchedDataCache.current[0],
            fetchedDataCache.current[-1],
          ];

          let dynseqDataArray = testData.map((item) => item.dynseqData).flat(1);

          let deDupdynseqDataArr = removeDuplicatesWithoutId(dynseqDataArray);
          curRegionData.current = {
            trackState: trackState1,
            deDupdynseqDataArr,
          };

          createCanvas(trackState1, deDupdynseqDataArr, false);
        } else {
          let testData: Array<any> = [];

          if (trackData!.trackState.side === "right") {
            trackData!.trackState["index"] = rightIdx.current;
            fetchedDataCache.current[rightIdx.current] = {
              dynseqData: trackData![`${id}`].result,
              trackState: trackData!.trackState,
            };
            let currIdx = rightIdx.current + 2;
            for (let i = 0; i < 3; i++) {
              testData.push(fetchedDataCache.current[currIdx]);
              currIdx--;
            }

            rightIdx.current--;
            let dynseqDataArray = testData
              .map((item) => item.dynseqData)
              .flat(1);
            let deDupdynseqDataArr = removeDuplicatesWithoutId(dynseqDataArray);
            curRegionData.current = {
              trackState: trackData!.trackState,
              deDupdynseqDataArr,
              initial: 0,
            };
            createCanvas(trackData!.trackState, deDupdynseqDataArr, false);
          } else if (trackData!.trackState.side === "left") {
            trackData!.trackState["index"] = leftIdx.current;
            fetchedDataCache.current[leftIdx.current] = {
              dynseqData: trackData![`${id}`].result,
              trackState: trackData!.trackState,
            };

            let currIdx = leftIdx.current - 2;
            for (let i = 0; i < 3; i++) {
              testData.push(fetchedDataCache.current[currIdx]);
              currIdx++;
            }

            leftIdx.current++;
            let dynseqDataArray = testData
              .map((item) => item.dynseqData)
              .flat(1);
            let deDupdynseqDataArr = removeDuplicatesWithoutId(dynseqDataArray);
            curRegionData.current = {
              trackState: trackData!.trackState,
              deDupdynseqDataArr,
              initial: 0,
            };
            createCanvas(trackData!.trackState, deDupdynseqDataArr, false);
          }
        }
      }
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
          height:
            configOptions.current.displayMode === "full"
              ? svgHeight.current + 2
              : configOptions.current.height + 2,
          position: "relative",
        }}
      >
        (
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
        )
      </div>
    </div>
  );
});

export default memo(DynseqTrack);
