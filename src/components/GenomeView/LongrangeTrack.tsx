import React, { memo, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
// import worker_script from '../../Worker/worker';
import _ from "lodash";
import { TrackProps } from "../../models/trackModels/trackProps";

import trackConfigMenu from "../../trackConfigs/config-menu-components.tsx/TrackConfigMenu";
import OpenInterval from "../../models/OpenInterval";
import InteractionTrackComponent from "./InteractionComponents/InteractionTrackComponent";
import { objToInstanceAlign } from "./TrackManager";
import { DEFAULT_OPTIONS } from "./InteractionComponents/InteractionTrackComponent";
import { LongRangeTrackConfig } from "../../trackConfigs/config-menu-models.tsx/LongRangeTrackConfig";
import ChromosomeInterval from "../../models/ChromosomeInterval";
import { GenomeInteraction } from "../../getRemoteData/GenomeInteraction";
import TrackLegend from "./commonComponents/TrackLegend";
import ReactDOM from "react-dom";
import { getTrackXOffset } from "./CommonTrackStateChangeFunctions.tsx/getTrackPixelXOffset";
import { getDisplayModeFunction } from "./displayModeComponentMap";
import { cacheTrackData } from "./CommonTrackStateChangeFunctions.tsx/cacheTrackData";
import { getCacheData } from "./CommonTrackStateChangeFunctions.tsx/getCacheData";
const LongrangeTrack: React.FC<TrackProps> = memo(function LongrangeTrack(
  props
) {
  const {
    basePerPixel,
    side,
    trackData,
    onTrackConfigChange,
    trackIdx,
    handleDelete,
    windowWidth,
    dataIdx,
    onCloseConfigMenu,
    trackModel,
    id,
    getConfigMenu,
    legendRef,
    trackManagerRef,
  } = props;

  const configOptions = useRef({ ...DEFAULT_OPTIONS });
  const rightIdx = useRef(0);
  const leftIdx = useRef(1);
  const updateSide = useRef("right");
  const updatedLegend = useRef<any>();
  const fetchedDataCache = useRef<{ [key: string]: any }>({});
  const displayCache = useRef<{ [key: string]: any }>({
    full: {},
    density: {},
  });
  const useFineOrSecondaryParentNav = useRef(false);
  const xPos = useRef(0);
  const configMenuPos = useRef<{ [key: string]: any }>({});
  const [canvasComponents, setCanvasComponents] = useState<any>(null);
  const [configChanged, setConfigChanged] = useState(false);
  const [legend, setLegend] = useState<any>();

  const displaySetter = {
    density: { setComponents: setCanvasComponents },
  };

  async function createSVGOrCanvas(trackState, genesArr, cacheIdx) {
    console.log(trackState, genesArr, cacheIdx);
    let curXPos = getTrackXOffset(
      trackState,
      windowWidth,
      useFineOrSecondaryParentNav.current
    );
    let tmpObj = { ...configOptions.current };
    tmpObj["trackManagerHeight"] = trackManagerRef.current.offsetHeight;

    getDisplayModeFunction(
      {
        genesArr,
        useFineOrSecondaryParentNav: useFineOrSecondaryParentNav.current,
        trackState,
        windowWidth,
        configOptions: tmpObj,
        updatedLegend,
        trackModel,
      },
      displaySetter,
      displayCache,
      cacheIdx,
      curXPos
    );

    xPos.current = curXPos;
    updateSide.current = side;
  }

  useEffect(() => {
    async function handle() {
      if (trackData![`${id}`]) {
        if (trackData!.initial === 1) {
          configOptions.current = {
            ...configOptions.current,
            ...trackModel.options,
          };
          onTrackConfigChange({
            configOptions: configOptions.current,
            trackModel: trackModel,
            id: id,
            trackIdx: trackIdx,
            legendRef: legendRef,
          });
        }
        useFineOrSecondaryParentNav.current = true;

        cacheTrackData(
          useFineOrSecondaryParentNav.current,
          id,
          trackData,
          fetchedDataCache,
          rightIdx,
          leftIdx,
          createSVGOrCanvas,
          trackData!.trackState.primaryGenName,
          "none",
          trackModel
        );
      }
    }
    handle();
  }, [trackData]);

  useEffect(() => {
    if (configChanged) {
      if (dataIdx! in displayCache.current.density) {
        let tmpNewConfig = { ...configOptions.current };

        for (let key in displayCache.current.density) {
          let curCacheComponent =
            displayCache.current.density[`${key}`].canvasData;
          let newComponent = React.cloneElement(curCacheComponent, {
            options: tmpNewConfig,
          });
          displayCache.current.density[`${key}`].canvasData = newComponent;
        }
        configOptions.current = tmpNewConfig;

        setCanvasComponents(
          displayCache.current.density[`${dataIdx}`].canvasData
        );

        onTrackConfigChange({
          configOptions: configOptions.current,
          trackModel: trackModel,
          id: id,
          trackIdx: trackIdx,
          legendRef: legendRef,
        });
      }
      setConfigChanged(false);
    }
  }, [configChanged]);

  useEffect(() => {
    getCacheData(
      true,
      rightIdx.current,
      leftIdx.current,
      dataIdx,
      displayCache.current,
      fetchedDataCache.current,
      configOptions.current.displayMode,
      displaySetter,
      "",
      xPos,
      updatedLegend,
      trackModel,
      createSVGOrCanvas,
      side,
      updateSide,
      "none"
    );
  }, [dataIdx]);

  useEffect(() => {
    setLegend(ReactDOM.createPortal(updatedLegend.current, legendRef.current));
  }, [canvasComponents]);

  function onConfigChange(key, value) {
    if (value === configOptions.current[`${key}`]) return;
    if (key === "displayMode" && value !== configOptions.current.displayMode) {
      configOptions.current.displayMode = value;
      trackModel.options = configOptions.current;

      const renderer = new LongRangeTrackConfig(trackModel);
      const items = renderer.getMenuComponents();

      let menu = trackConfigMenu[`${trackModel.type}`]({
        blockRef: trackManagerRef,
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
    const renderer = new LongRangeTrackConfig(trackModel);
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

  return (
    <div
      onContextMenu={renderConfigMenu}
      style={{
        display: "flex",
        position: "relative",
        height: configOptions.current.height + 2,
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

export default memo(LongrangeTrack);
