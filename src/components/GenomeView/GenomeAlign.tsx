import React, { memo, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { TrackProps } from "../../models/trackModels/trackProps";
import HoverToolTip from "./commonComponents/HoverToolTips/HoverToolTip";
import { DEFAULT_OPTIONS } from "./GenomeAlignComponents/GenomeAlignComponents";

import { cacheTrackData } from "./CommonTrackStateChangeFunctions.tsx/cacheTrackData";
import { getCacheData } from "./CommonTrackStateChangeFunctions.tsx/getCacheData";
import { getConfigChangeData } from "./CommonTrackStateChangeFunctions.tsx/getDataAfterConfigChange";
import { getTrackXOffset } from "./CommonTrackStateChangeFunctions.tsx/getTrackPixelXOffset";
import { getDisplayModeFunction } from "./displayModeComponentMap";
DEFAULT_OPTIONS["displayMode"] = "full";
const GenomeAlign: React.FC<TrackProps> = memo(function GenomeAlign({
  basePerPixel,
  side,
  trackData,
  updateGlobalTrackConfig,
  trackIdx,

  windowWidth,
  dataIdx,
  trackModel,
  genomeArr,
  genomeIdx,
  id,
  useFineModeNav,
  legendRef,
  applyTrackConfigChange,
}) {
  const configOptions = useRef<any>({ ...DEFAULT_OPTIONS });
  const rightIdx = useRef(0);
  const leftIdx = useRef(1);
  const fetchedDataCache = useRef<{ [key: string]: any }>({});
  const displayCache = useRef<{ [key: string]: any }>({
    full: {},
  });
  const updatedLegend = useRef<any>();
  const svgHeight = useRef(0);
  const useFineOrSecondaryParentNav = useRef(useFineModeNav);

  const xPos = useRef(0);
  const updateSide = useRef("right");
  const newTrackWidth = useRef(windowWidth);
  const configMenuPos = useRef<{ [key: string]: any }>({});
  const [svgComponents, setSvgComponents] = useState<{ [key: string]: any }>(
    {}
  );
  const [configChanged, setConfigChanged] = useState(false);
  const [legend, setLegend] = useState<any>();

  const displaySetter = {
    full: { setComponents: setSvgComponents },
  };

  function createSVGOrCanvas(trackState, genesArr, cacheIdx) {
    let curXPos = getTrackXOffset(trackState, windowWidth, true);

    getDisplayModeFunction(
      {
        genesArr,
        useFineOrSecondaryParentNav: true,
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
    newTrackWidth.current = trackState.visWidth;
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

      cacheTrackData(
        true,
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
      true,
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
  }, [svgComponents]);

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
        getConfigChangeData(
          true,
          fetchedDataCache.current,
          dataIdx,
          createSVGOrCanvas,
          "none"
        );
      }
    }
  }, [applyTrackConfigChange]);
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        height: `${configOptions.current.height + 2}px`,
      }}
    >
      <svg
        width={`${newTrackWidth.current}px`}
        style={{
          display: "block",
          position: "absolute",
          height: `${configOptions.current.height}px`,
          right: updateSide.current === "left" ? `${xPos.current}px` : "",
          left: updateSide.current === "right" ? `${xPos.current}px` : "",
        }}
      >
        {svgComponents.svgElements}
      </svg>
      {svgComponents.svgElements && (
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
