import React, { memo } from "react";
import { useEffect, useRef, useState } from "react";
import { TrackProps } from "../../../models/trackModels/trackProps";

import { DEFAULT_OPTIONS as defaultNumericalTrack } from "./commonComponents/numerical/NumericalTrack";

import ReactDOM from "react-dom";
import { cacheTrackData } from "./CommonTrackStateChangeFunctions.tsx/cacheTrackData";
import { getTrackXOffset } from "./CommonTrackStateChangeFunctions.tsx/getTrackPixelXOffset";
import { getCacheData } from "./CommonTrackStateChangeFunctions.tsx/getCacheData";
import { getDisplayModeFunction } from "./displayModeComponentMap";

import { getConfigChangeData } from "./CommonTrackStateChangeFunctions.tsx/getDataAfterConfigChange";
import OpenInterval from "@eg/core/src/eg-lib/models/OpenInterval";

export const DEFAULT_OPTIONS = {
  ...defaultNumericalTrack,
};
DEFAULT_OPTIONS.aggregateMethod = "MEAN";

const BigWigTrack: React.FC<TrackProps> = memo(function BigWigTrack({
  trackData,
  updateGlobalTrackConfig,
  genomeConfig,
  side,
  windowWidth = 0,
  trackModel,
  dataIdx,
  checkTrackPreload,
  trackIdx,
  id,
  legendRef,
  applyTrackConfigChange,
  sentScreenshotData,
  dragX,
}) {
  const screenshotOpen = null;
  const configOptions = useRef({ ...DEFAULT_OPTIONS });
  const svgHeight = useRef(0);
  const rightIdx = useRef(0);
  const leftIdx = useRef(1);
  const updateSide = useRef("right");
  const updatedLegend = useRef<any>();
  const fetchError = useRef<boolean>(false);
  const fetchedDataCache = useRef<{ [key: string]: any }>({});
  const displayCache = useRef<{ [key: string]: any }>({
    full: {},
    density: {},
  });

  const usePrimaryNav = useRef<boolean>(true);
  const xPos = useRef(0);

  const [canvasComponents, setCanvasComponents] = useState<any>(null);

  const [legend, setLegend] = useState<any>();

  const displaySetter = {
    density: {
      setComponents: setCanvasComponents,
    },
  };
  function resetState() {
    configOptions.current = { ...DEFAULT_OPTIONS };

    rightIdx.current = 0;
    leftIdx.current = 1;
    updateSide.current = "right";
    updatedLegend.current = undefined;
    fetchedDataCache.current = {};
    displayCache.current = {
      density: {},
    };

    setLegend(undefined);
  }

  async function createSVGOrCanvas(trackState, genesArr, isError, cacheIdx) {
    let curXPos = getTrackXOffset(trackState, windowWidth);
    if (isError) {
      fetchError.current = true;
    }
    trackState["viewWindow"] = new OpenInterval(0, trackState.visWidth);
    function step() {
      let res;
      if (isError || fetchError.current) {
        fetchError.current = true;
        res = (
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
        );
      } else {
        res = getDisplayModeFunction(
          {
            usePrimaryNav: usePrimaryNav.current,
            genesArr,
            trackState,
            windowWidth,
            configOptions: configOptions.current,
            svgHeight,
            updatedLegend,
            trackModel,
          },
          displaySetter,
          displayCache,
          0,
          curXPos
        );
      }

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

    // Start the first step
    requestAnimationFrame(step);
  }
  useEffect(() => {
    if (trackData![`${id}`]) {
      if (trackData!.trackState.initial === 1) {
        if (
          "genome" in trackData![`${id}`].metadata &&
          trackData![`${id}`].metadata.genome &&
          trackData![`${id}`].metadata.genome !== genomeConfig.genome.getName()
        ) {
          usePrimaryNav.current = false;
        }
        if (
          !genomeConfig.isInitial &&
          genomeConfig.sizeChange &&
          Object.keys(fetchedDataCache.current).length > 0
        ) {
          const trackIndex = trackData![`${id}`].trackDataIdx;
          const cache = fetchedDataCache.current;
          if (
            "genome" in trackData![`${id}`].metadata &&
            trackData![`${id}`].metadata.genome !==
              genomeConfig.genome.getName()
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

            trackData![`${id}`].result = [
              cache[left].dataCache,
              cache[mid].dataCache,
              cache[right].dataCache,
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
      if ("result" in trackData![`${id}`]) {
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
    setLegend(ReactDOM.createPortal(updatedLegend.current, legendRef.current));
  }, [canvasComponents]);
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

        displayCache.current[`${configOptions.current.displayMode}`] = {};
        getConfigChangeData({
          fetchedDataCache: fetchedDataCache.current,
          dataIdx,
          usePrimaryNav: usePrimaryNav.current,
          createSVGOrCanvas,
          trackType: trackModel.type,
        });
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

export default memo(BigWigTrack);
