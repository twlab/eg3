import React, { memo, useEffect, useRef, useState } from "react";
import { TrackProps } from "../../models/trackModels/trackProps";

import { DEFAULT_OPTIONS as defaultNumericalTrack } from "./commonComponents/numerical/NumericalTrack";
import { DEFAULT_OPTIONS as defaultMethylc } from "./MethylcComponents/MethylCTrackComputation";
import trackConfigMenu from "../../trackConfigs/config-menu-components.tsx/TrackConfigMenu";

import { MethylCTrackConfig } from "../../trackConfigs/config-menu-models.tsx/MethylCTrackConfig";

import ReactDOM from "react-dom";
import { cacheTrackData } from "./CommonTrackStateChangeFunctions.tsx/cacheTrackData";
import { getCacheData } from "./CommonTrackStateChangeFunctions.tsx/getCacheData";
import { getTrackXOffset } from "./CommonTrackStateChangeFunctions.tsx/getTrackPixelXOffset";
import { getDisplayModeFunction } from "./displayModeComponentMap";

export const DEFAULT_OPTIONS = {
  ...defaultNumericalTrack,
  ...defaultMethylc,
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
  trackManagerRef,
  selectConfigChange,
}) {
  const configOptions = useRef({ ...DEFAULT_OPTIONS });
  const svgHeight = useRef(0);
  const rightIdx = useRef(0);
  const leftIdx = useRef(1);
  const updateSide = useRef("right");
  const updatedLegend = useRef<any>();

  const fetchedDataCache = useRef<{ [key: string]: any }>({});
  const displayCache = useRef<{ [key: string]: any }>({ density: {} });
  const useFineOrSecondaryParentNav = useRef(false);
  const xPos = useRef(0);
  const configMenuPos = useRef<{ [key: string]: any }>({});
  const [canvasComponents, setCanvasComponents] = useState<any>(null);
  const [configChanged, setConfigChanged] = useState(false);
  const [legend, setLegend] = useState<any>();

  const displaySetter = {
    density: {
      setComponents: setCanvasComponents,
    },
  };

  async function createSVGOrCanvas(trackState, genesArr, cacheIdx) {
    let curXPos = getTrackXOffset(
      trackState,
      windowWidth,
      useFineOrSecondaryParentNav.current
    );

    getDisplayModeFunction(
      {
        genesArr,
        useFineOrSecondaryParentNav: useFineOrSecondaryParentNav.current,
        trackState,
        windowWidth,
        configOptions: configOptions.current,
        svgHeight,
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
  function onConfigChange(key, value) {
    if (value === configOptions.current[key]) {
      return;
    } else if (
      key === "displayMode" &&
      value !== configOptions.current.displayMode
    ) {
      configOptions.current.displayMode = value;

      trackModel.options = configOptions.current;
      const renderer = new MethylCTrackConfig(trackModel);

      const items = renderer.getMenuComponents();
      let menu = trackConfigMenu[trackModel.type]({
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
      configOptions.current[key] = value;
    }
    setConfigChanged(true);
  }

  function renderConfigMenu(event) {
    event.preventDefault();
    const renderer = new MethylCTrackConfig(trackModel);

    const items = renderer.getMenuComponents();
    let menu = trackConfigMenu[trackModel.type]({
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

  useEffect(() => {
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
      if (useFineModeNav || trackData![`${id}`].metadata.genome !== undefined) {
        useFineOrSecondaryParentNav.current = true;
      }

      cacheTrackData(
        useFineOrSecondaryParentNav.current,
        id,
        trackData,
        fetchedDataCache,
        rightIdx,
        leftIdx,
        createSVGOrCanvas,
        genomeArr![genomeIdx!],
        "none"
      );
    }
  }, [trackData]);

  useEffect(() => {
    if (dataIdx! in displayCache.current.density) {
      let tmpNewConfig = { ...configOptions.current };

      for (let key in displayCache.current.density) {
        let curCacheComponent = displayCache.current.density[key].canvasData;
        let newComponent = React.cloneElement(curCacheComponent, {
          options: tmpNewConfig,
        });
        displayCache.current.density[key].canvasData = newComponent;
      }
      configOptions.current = tmpNewConfig;
      setCanvasComponents(displayCache.current.density[dataIdx!].canvasData);

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
    getCacheData(
      useFineOrSecondaryParentNav.current,
      rightIdx.current,
      leftIdx.current,
      dataIdx,
      displayCache.current,
      fetchedDataCache.current,
      configOptions.current.displayMode,
      displaySetter,
      svgHeight,
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

  useEffect(() => {
    if (canvasComponents !== null) {
      configOptions.current = {
        ...configOptions.current,
        ...selectConfigChange.changedOption,
      };
      onTrackConfigChange({
        configOptions: configOptions.current,
        trackModel: trackModel,
        id: id,
        trackIdx: trackIdx,
        legendRef: legendRef,
      });
      setConfigChanged(true);
    }
  }, [selectConfigChange]);

  return (
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
