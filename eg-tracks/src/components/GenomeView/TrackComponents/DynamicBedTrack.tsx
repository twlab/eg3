import React, { memo } from "react";
import { useEffect, useRef, useState } from "react";
import { TrackProps } from "../../../models/trackModels/trackProps";
import { DEFAULT_OPTIONS as defaultAnnotationTrack } from "../../../trackConfigs/config-menu-models.tsx/AnnotationTrackConfig";

import ReactDOM from "react-dom";
import {
  cacheTrackData,
  transformArray,
} from "./CommonTrackStateChangeFunctions.tsx/cacheTrackData";
import { getCacheData } from "./CommonTrackStateChangeFunctions.tsx/getCacheData";
import { getTrackXOffset } from "./CommonTrackStateChangeFunctions.tsx/getTrackPixelXOffset";
import { getDisplayModeFunction } from "./displayModeComponentMap";
import { useGenome } from "@/lib/contexts/GenomeContext";

import _ from "lodash";

export const TOP_PADDING = 2;
export const ROW_VERTICAL_PADDING = 2;

export const DEFAULT_OPTIONS = {
  ...defaultAnnotationTrack,
  color: "blue",
  color2: "red",
  rowHeight: 10,
  maxRows: 5,
  hiddenPixels: 0.5,
  speed: [5],
  playing: true,
  dynamicColors: [],
  useDynamicColors: false,
  backgroundColor: "white",
};
DEFAULT_OPTIONS.displayMode = "density";
const DynamicBedTrack: React.FC<TrackProps> = memo(function DynamicBedTrack({
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
  checkTrackPreload,

  legendRef,
  applyTrackConfigChange,
  sentScreenshotData,
}) {
  const svgHeight = useRef(0);
  const displayCache = useRef<{ [key: string]: any }>({ density: {} });
  const configOptions = useRef({ ...DEFAULT_OPTIONS });
  const rightIdx = useRef(0);
  const fetchError = useRef<boolean>(false);
  const leftIdx = useRef(1);
  const fetchedDataCache = useRef<{ [key: string]: any }>({});
  const usePrimaryNav = useRef<boolean>(true);
  const xPos = useRef(0);
  const { screenshotOpen } = useGenome();
  const updateSide = useRef("right");
  const updatedLegend = useRef<any>();

  const [canvasComponent, setCanvasComponents] = useState<any>(null);

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
      full: {},
      density: {},
    };

    setLegend(undefined);
  }
  async function createSVGOrCanvas(trackState, genesArr, isError, cacheIdx) {
    let curXPos = getTrackXOffset(trackState, windowWidth);
    if (isError) {
      fetchError.current = true;
    }
    const getBedPadding = (bed) =>
      bed.getName().length * configOptions.current.rowHeight + 2;
    const getHeight = (results) => {
      const maxRow: any = _.max(results.map((r) => r.numRowsAssigned));
      let rowsToDraw = Math.min(maxRow, configOptions.current.maxRows);
      if (rowsToDraw < 1) {
        rowsToDraw = 1;
      }
      return (
        rowsToDraw * (configOptions.current.rowHeight + ROW_VERTICAL_PADDING) +
        TOP_PADDING
      );
    };

    let res = fetchError.current ? (
      <div
        style={{
          width: trackState.visWidth,
          height: 60,
          backgroundColor: "orange",
          textAlign: "center",
          lineHeight: "40px", // Centering vertically by matching the line height to the height of the div
        }}
      >
        Error remotely getting track data
      </div>
    ) : (
      await getDisplayModeFunction(
        {
          genesArr,
          usePrimaryNav: usePrimaryNav.current,
          trackState,
          windowWidth,
          configOptions: configOptions.current,
          renderTooltip: () => {},
          svgHeight,
          updatedLegend,
          trackModel,
          getBedPadding,
          getHeight,
          ROW_HEIGHT: configOptions.current.rowHeight,
        },
        displaySetter,
        displayCache,
        cacheIdx,
        curXPos
      )
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
      checkTrackPreload(id);
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
          const trackIndex = trackData![`${id}`].trackDataIdx;
          const cache = fetchedDataCache.current;
          if (
            "genome" in trackData![`${id}`].metadata &&
            trackData![`${id}`].metadata.genome !==
              genomeArr![genomeIdx!].genome.getName()
          ) {
            let idx = trackIndex in cache ? trackIndex : 0;
            trackData![`${id}`].result =
              fetchedDataCache.current[idx].dataCache;
          } else {
            let left, mid, right;

            if (
              trackIndex in cache &&
              trackIndex + 1 in cache &&
              trackIndex - 1 in cache
            ) {
              left = trackIndex + 1;
              mid = trackIndex;
              right = trackIndex - 1;
            } else {
              left = 1;
              mid = 0;
              right = -1;
            }

            const dataCacheCurrentNext =
              fetchedDataCache.current[left]?.dataCache ?? [];
            const dataCacheCurrent =
              fetchedDataCache.current[mid]?.dataCache ?? [];
            const dataCacheCurrentPrev =
              fetchedDataCache.current[right]?.dataCache ?? [];

            let combined: Array<any> = [
              dataCacheCurrentNext,
              dataCacheCurrent,
              dataCacheCurrentPrev,
            ];

            trackData![`${id}`].result = transformArray(combined);
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
      }

      if (trackData![`${id}`].result) {
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

  useEffect(() => {
    getCacheData({
      isError: fetchError.current,
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
    setLegend(
      updatedLegend.current &&
        ReactDOM.createPortal(updatedLegend.current, legendRef.current)
    );
  }, [canvasComponent]);

  useEffect(() => {
    if (canvasComponent !== null) {
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
        {canvasComponent}
      </div>
      {legend}
    </div>
  );
});

export default memo(DynamicBedTrack);
