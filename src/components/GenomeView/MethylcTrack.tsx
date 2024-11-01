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
  updateGlobalTrackConfig,
  side,
  windowWidth = 0,
  genomeArr,
  genomeIdx,
  trackModel,
  dataIdx,

  trackIdx,
  id,
  useFineModeNav,
  legendRef,

  applyTrackConfigChange,
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

  function createSVGOrCanvas(trackState, genesArr, cacheIdx) {
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

  useEffect(() => {
    if (trackData![`${id}`]) {
      if (trackData!.initial === 1) {
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
        });
      }
      if (
        useFineModeNav ||
        (trackData![`${id}`].metadata.genome !== undefined &&
          genomeArr![genomeIdx!].genome.getName() !==
            trackData![`${id}`].metadata.genome)
      ) {
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
      if (id in applyTrackConfigChange) {
        if ("type" in applyTrackConfigChange) {
          configOptions.current = {
            ...DEFAULT_OPTIONS,
            ...applyTrackConfigChange[`${id}`],
          };
        } else {
          configOptions.current = {
            ...configOptions.current,
            ...applyTrackConfigChange[`${id}`],
          };
        }

        updateGlobalTrackConfig({
          configOptions: configOptions.current,
          trackModel: trackModel,
          id: id,
          trackIdx: trackIdx,
          legendRef: legendRef,
        });
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
        }
      }
    }
  }, [applyTrackConfigChange]);

  return (
    <div
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
