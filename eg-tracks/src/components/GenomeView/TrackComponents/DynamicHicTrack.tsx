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
    checkTrackPreload,
    windowWidth,
    dataIdx,
    genomeConfig,
    trackModel,
    id,

    legendRef,
    trackManagerRef,
    applyTrackConfigChange,
    sentScreenshotData,
  } = props;

  const configOptions = useRef({ ...DEFAULT_OPTIONS });
  const rightIdx = useRef(0);
  const fetchError = useRef<boolean>(false);
  const leftIdx = useRef(1);
  const updateSide = useRef("right");
  const updatedLegend = useRef<any>();
  const fetchedDataCache = useRef<{ [key: string]: any }>({});
  const displayCache = useRef<{ [key: string]: any }>({
    density: {},
  });

  const usePrimaryNav = useRef<boolean>(true);
  const xPos = useRef(0);
  const screenshotOpen = null;

  const [canvasComponents, setCanvasComponents] = useState<any>(null);

  const [legend, setLegend] = useState<any>();

  const displaySetter = {
    density: { setComponents: setCanvasComponents },
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
    let tmpObj = { ...configOptions.current };
    tmpObj["trackManagerHeight"] = trackManagerRef.current.offsetHeight;

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
      )
    );

    if (
      rightIdx.current + 1 >= dataIdx ||
      leftIdx.current - 1 <= dataIdx ||
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
    async function handle() {
      if (trackData![`${id}`]) {
        if (trackData!.trackState.initial === 1) {
          if (
            "genome" in trackData![`${id}`].metadata &&
            trackData![`${id}`].metadata.genome !==
              genomeConfig.genome.getName()
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
            let idx = trackIndex in cache ? trackIndex : 0;
            trackData![`${id}`].result =
              fetchedDataCache.current[idx].dataCache;
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
          configOptions.current["trackManagerRef"] = trackManagerRef;
        }

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

        if (trackData![`${id}`].result === undefined) {
          trackData![`${id}`]["result"] = await Promise.all(
            trackData![`${id}`].straw.map((straw, index) => {
              return straw.getData(
                objToInstanceAlign(visRegion),
                basePerPixel,
                configOptions.current
              );
            })
          );
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
    }
    handle();
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
