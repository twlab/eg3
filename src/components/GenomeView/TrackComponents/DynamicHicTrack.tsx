import React, { memo, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { TrackProps } from "../../../models/trackModels/trackProps";
import { DEFAULT_OPTIONS } from "./InteractionComponents/InteractionTrackComponent";

import { objToInstanceAlign } from "../TrackManager";
import { getTrackXOffset } from "./CommonTrackStateChangeFunctions.tsx/getTrackPixelXOffset";
import { cacheTrackData } from "./CommonTrackStateChangeFunctions.tsx/cacheTrackData";
import { getCacheData } from "./CommonTrackStateChangeFunctions.tsx/getCacheData";
import { getDisplayModeFunction } from "./displayModeComponentMap";

const DynamicHicTrack: React.FC<TrackProps> = memo(function DynamicHicTrack(
  props
) {
  const {
    basePerPixel,
    side,
    trackData,
    updateGlobalTrackConfig,
    trackIdx,

    windowWidth,
    dataIdx,

    trackModel,
    id,

    legendRef,
    trackManagerRef,
    applyTrackConfigChange,
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

  const [canvasComponents, setCanvasComponents] = useState<any>(null);
  const [configChanged, setConfigChanged] = useState(false);
  const [legend, setLegend] = useState<any>();

  const displaySetter = {
    density: { setComponents: setCanvasComponents },
  };

  function createSVGOrCanvas(trackState, genesArr, cacheIdx) {
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
          updateGlobalTrackConfig({
            configOptions: configOptions.current,
            trackModel: trackModel,
            id: id,
            trackIdx: trackIdx,
            legendRef: legendRef,
          });
        }
        useFineOrSecondaryParentNav.current = true;

        const primaryVisData =
          trackData!.trackState.genomicFetchCoord[
            trackData!.trackState.primaryGenName
          ].primaryVisData;

        let visRegion =
          "genome" in trackData![`${id}`].metadata
            ? trackData!.trackState.genomicFetchCoord[
                trackData![`${id}`].metadata.genome
              ].queryRegion
            : primaryVisData.visRegion;

        trackData![`${id}`]["result"] = await Promise.all(
          trackData![`${id}`].straw.map((straw, index) => {
            return straw.getData(
              objToInstanceAlign(visRegion),
              basePerPixel,
              configOptions.current
            );
          })
        );
        console.log(trackData![`${id}`]["result"]);
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

export default memo(DynamicHicTrack);
