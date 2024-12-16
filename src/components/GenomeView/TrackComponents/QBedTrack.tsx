import React, { memo } from "react";
import { useEffect, useRef, useState } from "react";
import { TrackProps } from "../../../models/trackModels/trackProps";

import { DEFAULT_OPTIONS as defaultNumericalTrack } from "./commonComponents/numerical/NumericalTrack";
import { DEFAULT_OPTIONS as defaultQBedTrack } from "./QBedComponents/QBedTrackComponents";

import ReactDOM from "react-dom";
import { cacheTrackData } from "./CommonTrackStateChangeFunctions.tsx/cacheTrackData";
import { getTrackXOffset } from "./CommonTrackStateChangeFunctions.tsx/getTrackPixelXOffset";
import { getCacheData } from "./CommonTrackStateChangeFunctions.tsx/getCacheData";
import { getDisplayModeFunction } from "./displayModeComponentMap";
import { useGenome } from "@/lib/contexts/GenomeContext";

export const DEFAULT_OPTIONS = {
  ...defaultNumericalTrack,
  ...defaultQBedTrack,
};
DEFAULT_OPTIONS.aggregateMethod = "MEAN";
DEFAULT_OPTIONS.displayMode = "density";

const QBedTrack: React.FC<TrackProps> = memo(function QBedTrack({
  trackData,
  updateGlobalTrackConfig,

  side,
  windowWidth = 0,
  genomeArr,
  genomeIdx,
  trackModel,
  dataIdx,
  checkTrackPreload,
  trackIdx,
  id,

  legendRef,
  applyTrackConfigChange,
  sentScreenshotData,
}) {
  const configOptions = useRef({ ...DEFAULT_OPTIONS });
  const svgHeight = useRef(0);
  const rightIdx = useRef(0);
  const leftIdx = useRef(1);
  const updateSide = useRef("right");
  const updatedLegend = useRef<any>();

  const fetchedDataCache = useRef<{ [key: string]: any }>({});
  const displayCache = useRef<{ [key: string]: any }>({
    density: {},
  });

  const usePrimaryNav = useRef<boolean>(true);
  const xPos = useRef(0);
  const { screenshotOpen } = useGenome();

  const [canvasComponents, setCanvasComponents] = useState<any>(null);

  const [legend, setLegend] = useState<any>();

  const displaySetter = {
    density: {
      setComponents: setCanvasComponents,
    },
  };
  function resetState() {
    configOptions.current = { ...DEFAULT_OPTIONS };
    svgHeight.current = 0;
    rightIdx.current = 0;
    leftIdx.current = 1;
    updateSide.current = "right";
    updatedLegend.current = undefined;
    fetchedDataCache.current = {};
    displayCache.current = {
      density: {},
    };

    xPos.current = 0;

    setLegend(undefined);
  }

  function createSVGOrCanvas(trackState, genesArr, cacheIdx) {
    let curXPos = getTrackXOffset(trackState, windowWidth);

    let res = getDisplayModeFunction(
      {
        genesArr,
        usePrimaryNav: usePrimaryNav.current,
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

      setCanvasComponents(res);
    }
  }
  useEffect(() => {
    if (trackData![`${id}`]) {
      if (trackData!.trackState.initial === 1) {
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
        });
      }

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
  }, [trackData]);

  useEffect(() => {
    getCacheData({
      usePrimaryNav: usePrimaryNav.current,
      rightIdx: rightIdx.current,
      leftIdx: leftIdx.current,
      dataIdx,
      displayCache: displayCache.current,
      fetchedDataCache: fetchedDataCache.current,
      displayType: configOptions.current.displayMode,
      displaySetter,
      svgHeight,
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

export default memo(QBedTrack);
