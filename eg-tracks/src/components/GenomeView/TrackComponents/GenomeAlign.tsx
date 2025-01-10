import React, { memo, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { TrackProps } from "../../../models/trackModels/trackProps";
import HoverToolTip from "./commonComponents/HoverToolTips/HoverToolTip";
import { DEFAULT_OPTIONS } from "./GenomeAlignComponents/GenomeAlignComponents";

import { cacheTrackData } from "./CommonTrackStateChangeFunctions.tsx/cacheTrackData";
import { getCacheData } from "./CommonTrackStateChangeFunctions.tsx/getCacheData";
import { getConfigChangeData } from "./CommonTrackStateChangeFunctions.tsx/getDataAfterConfigChange";
import { getTrackXOffset } from "./CommonTrackStateChangeFunctions.tsx/getTrackPixelXOffset";
import { getDisplayModeFunction } from "./displayModeComponentMap";

import OpenInterval from "@eg/core/src/eg-lib/models/OpenInterval";
DEFAULT_OPTIONS["displayMode"] = "full";
const GenomeAlign: React.FC<TrackProps> = memo(function GenomeAlign({
  basePerPixel,
  side,
  trackData,
  updateGlobalTrackConfig,
  trackIdx,
  checkTrackPreload,
  windowWidth,
  dataIdx,
  trackModel,
  dragX,
  id,
  useFineModeNav,
  legendRef,
  applyTrackConfigChange,
  sentScreenshotData,
}) {
  const screenshotOpen = null;
  const configOptions = useRef<any>({ ...DEFAULT_OPTIONS });
  const rightIdx = useRef(0);
  const leftIdx = useRef(1);
  const fetchedDataCache = useRef<{ [key: string]: any }>({});
  const fetchError = useRef<boolean>(false);
  const displayCache = useRef<{ [key: string]: any }>({
    full: {},
  });
  const updatedLegend = useRef<any>();
  const svgHeight = useRef(0);
  const usePrimaryNav = useRef<boolean>(true);
  const xPos = useRef(0);
  const updateSide = useRef("right");
  const [svgComponents, setSvgComponents] = useState<{ [key: string]: any }>(
    {}
  );

  const [legend, setLegend] = useState<any>();

  const displaySetter = {
    full: { setComponents: setSvgComponents },
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
    };

    setLegend(undefined);
  }

  async function createSVGOrCanvas(trackState, genesArr, isError, cacheIdx) {
    let curXPos = getTrackXOffset(trackState, windowWidth);
    if (isError) {
      fetchError.current = true;
    }
    let res;

    if (isError || fetchError.current) {
      fetchError.current = true;
      res = {
        svgElements: (
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
        ),
      };
    } else {
      res = getDisplayModeFunction(
        {
          genesArr,
          trackState,
          windowWidth,
          configOptions: configOptions.current,
          svgHeight,
          updatedLegend,
          trackModel,
          basesByPixel: basePerPixel,
        },
        displaySetter,
        displayCache,
        cacheIdx,
        curXPos
      );
    }

    if (
      rightIdx.current + 1 >= dataIdx ||
      leftIdx.current - 1 <= dataIdx ||
      trackState.initial ||
      trackState.recreate
    ) {
      xPos.current = curXPos;
      checkTrackPreload(id);
      updateSide.current = side;

      setSvgComponents(res);
    }
  }
  useEffect(() => {
    if (trackData![`${id}`]) {
      if (trackData!.trackState.initial === 1) {
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
    setLegend(ReactDOM.createPortal(updatedLegend.current, legendRef.current));
  }, [svgComponents]);

  useEffect(() => {
    if (screenshotOpen) {
      async function handle() {
        let genesArr = fetchedDataCache.current[dataIdx!].dataCache;

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

        let drawOptions = { ...configOptions.current };
        drawOptions["forceSvg"] = true;

        let result = await getDisplayModeFunction({
          genesArr,
          trackState,
          windowWidth,
          configOptions: drawOptions,
          svgHeight,
          updatedLegend,
          trackModel,
          basesByPixel: basePerPixel,
        });

        sentScreenshotData({
          component: result.svgElements,
          trackId: id,
          trackState: trackState,
          trackLegend: updatedLegend.current,
        });
      }

      handle();
    }
  }, [screenshotOpen]);
  useEffect(() => {
    if (svgComponents !== null) {
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
          lineHeight: 0,
          right: updateSide.current === "left" ? `${xPos.current}px` : "",
          left: updateSide.current === "right" ? `${xPos.current}px` : "",
          backgroundColor: configOptions.current.backgroundColor,
        }}
      >
        {svgComponents.svgElements}
      </div>
      {svgComponents.svgElements && !fetchError.current && (
        <div
          style={{
            position: "absolute",
            right: updateSide.current === "left" ? `${xPos.current}px` : "",
            left: updateSide.current === "right" ? `${xPos.current}px` : "",
            zIndex: 3,
          }}
        >
          <HoverToolTip
            data={svgComponents.alignment}
            windowWidth={svgComponents.trackState.visWidth}
            trackType={useFineModeNav ? "genomealignFine" : "genomealignRough"}
            height={configOptions.current.height}
            viewRegion={svgComponents.trackState.visRegion}
            side={svgComponents.trackState.side}
            options={configOptions.current}
          />
        </div>
      )}
      {legend}
    </div>
  );
});

export default memo(GenomeAlign);
