import React, { memo, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { TrackProps } from "../../../models/trackModels/trackProps";
import { objToInstanceAlign } from "../TrackManager";

import trackConfigMenu from "../../../trackConfigs/config-menu-components.tsx/TrackConfigMenu";

import DisplayedRegionModel from "../../../models/DisplayedRegionModel";

import { RulerTrackConfig } from "../../../trackConfigs/config-menu-models.tsx/RulerTrackConfig";

import { getGenomeConfig } from "../../../models/genomes/allGenomes";
import ReactDOM from "react-dom";
import RulerComponent from "./RulerComponents/RulerComponent";
import { useGenome } from "@/lib/contexts/GenomeContext";
import { cacheTrackData } from "./CommonTrackStateChangeFunctions.tsx/cacheTrackData";
import { getTrackXOffset } from "./CommonTrackStateChangeFunctions.tsx/getTrackPixelXOffset";
import { getCacheData } from "./CommonTrackStateChangeFunctions.tsx/getCacheData";
import OpenInterval from "@/models/OpenInterval";

export const DEFAULT_OPTIONS = { backgroundColor: "var(--bg-color)" };

const RulerTrack: React.FC<TrackProps> = memo(function RulerTrack({
  trackData,
  updateGlobalTrackConfig,
  checkTrackPreload,
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
  trackManagerRef,
  legendRef,
}) {
  const configOptions = useRef({ ...DEFAULT_OPTIONS });

  const rightIdx = useRef(0);
  const leftIdx = useRef(1);
  const fetchedDataCache = useRef<{ [key: string]: any }>({});
  const usePrimaryNav = useRef<boolean>(true);
  const xPos = useRef(0);
  const { screenshotOpen } = useGenome();
  const curRegionData = useRef<{ [key: string]: any }>({});
  const parentGenome = useRef("");
  const configMenuPos = useRef<{ [key: string]: any }>({});
  const updateSide = useRef("right");
  const updatedLegend = useRef<any>();

  const [legend, setLegend] = useState<any>();
  const [canvasComponents, setCanvasComponents] = useState<any>();
  const newTrackWidth = useRef(windowWidth);

  // These states are used to update the tracks with new fetched data
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track

  function createSVGOrCanvas(trackState, genesArr) {
    console.log(trackState);
    let curXPos = getTrackXOffset(trackState, windowWidth);
    function getNumLegend(legend: ReactNode) {
      updatedLegend.current = ReactDOM.createPortal(legend, legendRef.current);
    }

    let canvasElements = (
      <RulerComponent
        viewRegion={objToInstanceAlign(trackState.visRegion)}
        width={trackState.visWidth}
        trackModel={trackModel}
        selectedRegion={objToInstanceAlign(
          trackState.genomicFetchCoord[
            `${genomeArr![genomeIdx!].genome.getName()}`
          ].primaryVisData.viewWindowRegion
        )}
        getNumLegend={getNumLegend}
        genomeConfig={getGenomeConfig(genomeArr![genomeIdx!].genome.getName())}
      />
    );

    if (
      ((rightIdx.current + 2 >= dataIdx || leftIdx.current - 2 <= dataIdx) &&
        usePrimaryNav.current) ||
      ((rightIdx.current + 1 >= dataIdx || leftIdx.current - 1 <= dataIdx) &&
        !usePrimaryNav.current) ||
      trackState.initial ||
      trackState.recreate
    ) {
      xPos.current = curXPos;
      updateSide.current = side;

      setCanvasComponents(canvasElements);
    }
    updateSide.current = side;
  }

  //________________________________________________________________________________________________________________________________________________________

  function onConfigChange(key, value) {
    if (value === configOptions.current[`${key}`]) {
      return;
    }
    {
      configOptions.current[`${key}`] = value;
    }
  }
  function renderConfigMenu(event) {
    event.preventDefault();

    const renderer = new RulerTrackConfig(trackModel);

    // create object that has key as displayMode and the configmenu component as the value
    const items = renderer.getMenuComponents();
    let menu = trackConfigMenu[`${trackModel.type}`]({
      blockRef: trackManagerRef,
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

  function resetState() {
    configOptions.current = { ...DEFAULT_OPTIONS };

    rightIdx.current = 0;
    leftIdx.current = 1;
    updateSide.current = "right";
    updatedLegend.current = undefined;
    fetchedDataCache.current = {};

    xPos.current = 0;

    setLegend(undefined);
  }
  useEffect(() => {
    if (trackData![`${id}`]) {
      if (trackData!.trackState.initial === 1) {
        trackData![`${id}`].result = [[], [], []];
        if (
          "genome" in trackData![`${id}`].metadata &&
          trackData![`${id}`].metadata.genome !==
            genomeArr![genomeIdx!].genome.getName()
        ) {
          usePrimaryNav.current = false;
        }
        if (
          !genomeArr![genomeIdx!].isInitial &&
          genomeArr![genomeIdx!].sizeChange &&
          Object.keys(fetchedDataCache.current).length > 0
        ) {
          if (
            "genome" in trackData![`${id}`].metadata &&
            trackData![`${id}`].metadata.genome !==
              genomeArr![genomeIdx!].genome.getName()
          ) {
            trackData![`${id}`].result =
              fetchedDataCache.current[
                trackData![`${id}`].trackDataIdx
              ].dataCache;
          } else {
            trackData![`${id}`].result = [
              fetchedDataCache.current[trackData![`${id}`].trackDataIdx + 1]
                .dataCache,
              fetchedDataCache.current[trackData![`${id}`].trackDataIdx]
                .dataCache,
              fetchedDataCache.current[trackData![`${id}`].trackDataIdx - 1]
                .dataCache,
            ];
          }
        }
        resetState();
        configOptions.current = {
          ...configOptions.current,
          ...trackModel.options,
        };

        updateGlobalTrackConfig({
          configOptions: configOptions.current,
          trackModel: trackModel,
          id: id,
          trackIdx: trackIdx,
          legendRef: legendRef,
          usePrimaryNav: usePrimaryNav.current,
        });
      } else {
        trackData![`${id}`].result = [];
      }
      if ("result" in trackData![`${id}`]) {
        cacheTrackData({
          usePrimaryNav: usePrimaryNav.current,
          id,
          trackData,
          fetchedDataCache,
          rightIdx,
          leftIdx,
          createSVGOrCanvas,
          trackModel,
        });
      }
    }
  }, [trackData]);

  // useEffect(() => {
  //   if (configChanged === true) {
  //     if (
  //       !useFineModeNav &&
  //       genomeArr![genomeIdx!].genome._name === parentGenome.current
  //     ) {
  //       createCanvas(
  //         curRegionData.current.trackState,
  //         curRegionData.current.deDupcacheDataArr,
  //         false
  //       );
  //     } else {
  //       createCanvas(
  //         curRegionData.current.trackState,
  //         curRegionData.current.deDupcacheDataArr,
  //         true
  //       );
  //     }
  //     updateGlobalTrackConfig({
  //       configOptions: configOptions.current,
  //       trackModel: trackModel,
  //       id: id,
  //       trackIdx: trackIdx,
  //       legendRef: legendRef,
  //     });
  //   }
  //   setConfigChanged(false);
  // }, [configChanged]);
  useEffect(() => {
    if (screenshotOpen) {
      async function handle() {
        let genesArr = [
          fetchedDataCache.current[dataIdx! + 1],
          fetchedDataCache.current[dataIdx!],
          fetchedDataCache.current[dataIdx! - 1],
        ];
        let trackState = {
          ...fetchedDataCache.current[dataIdx!].trackState,
        };

        trackState["viewWindow"] =
          updateSide.current === "right"
            ? new OpenInterval(
                -(dragX! + (xPos.current + windowWidth)),
                windowWidth * 3 + -(dragX! + (xPos.current + windowWidth))
              )
            : new OpenInterval(
                -(dragX! - (xPos.current + windowWidth)) + windowWidth,
                windowWidth * 3 -
                  (dragX! - (xPos.current + windowWidth)) +
                  windowWidth
              );

        genesArr = genesArr.map((item) => item.dataCache).flat(1);
        let drawOptions = { ...configOptions.current };
        drawOptions["forceSvg"] = true;

        let result = await getDisplayModeFunction({
          usePrimaryNav: usePrimaryNav.current,
          genesArr,
          trackState,
          windowWidth,
          configOptions: drawOptions,
          svgHeight,
          updatedLegend,
          trackModel,
        });

        sentScreenshotData({
          component: result,
          trackId: id,
          trackState: trackState,
          trackLegend: updatedLegend.current,
        });
      }

      handle();
    }
  }, [screenshotOpen]);
  useEffect(() => {
    getCacheData({
      usePrimaryNav: usePrimaryNav.current,
      rightIdx: rightIdx.current,
      leftIdx: leftIdx.current,
      dataIdx,
      fetchedDataCache: fetchedDataCache.current,
      xPos,
      updatedLegend,
      trackModel,
      createSVGOrCanvas,
      side,
      updateSide,
    });
  }, [dataIdx]);

  useEffect(() => {
    checkTrackPreload(id);

    setLegend(updatedLegend.current);
  }, [canvasComponents]);

  return (
    //svg allows overflow to be visible x and y but the div only allows x overflow, so we need to set the svg to overflow x and y and then limit it in div its container.

    <div
      onContextMenu={renderConfigMenu}
      style={{
        display: "flex",
        position: "relative",
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

export default memo(RulerTrack);
