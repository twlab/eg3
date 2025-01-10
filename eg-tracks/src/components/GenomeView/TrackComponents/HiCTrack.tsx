import React, { memo, useEffect, useRef, useState } from "react";

import { TrackProps } from "../../../models/trackModels/trackProps";
import { DEFAULT_OPTIONS } from "./InteractionComponents/InteractionTrackComponent";

import { objToInstanceAlign } from "../TrackManager";
import { getTrackXOffset } from "./CommonTrackStateChangeFunctions.tsx/getTrackPixelXOffset";
import { cacheTrackData } from "./CommonTrackStateChangeFunctions.tsx/cacheTrackData";
import { getCacheData } from "./CommonTrackStateChangeFunctions.tsx/getCacheData";
import { getDisplayModeFunction } from "./displayModeComponentMap";

import OpenInterval from "@eg/core/src/eg-lib/models/OpenInterval";
import DisplayedRegionModel from "@eg/core/src/eg-lib/models/DisplayedRegionModel";

const HiCTrack: React.FC<TrackProps> = memo(function HiCTrack(props) {
  const {
    basePerPixel,
    side,
    trackData,
    updateGlobalTrackConfig,
    trackIdx,
    checkTrackPreload,
    windowWidth = 0,
    dataIdx,
    genomeConfig,
    trackModel,
    id,
    dragX,
    legendRef,
    trackManagerRef,
    applyTrackConfigChange,
    sentScreenshotData,

    // viewWindow,
  } = props;

  const configOptions = useRef({ ...DEFAULT_OPTIONS });
  const rightIdx = useRef(0);
  const fetchError = useRef<boolean>(false);
  const leftIdx = useRef(1);
  const updateSide = useRef("right");
  const updatedLegend = useRef<any>();
  const fetchedDataCache = useRef<{ [key: string]: any }>({});
  const straw = useRef<{ [key: string]: any }>({});
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

    trackState["viewWindow"] =
      updateSide.current === "right"
        ? new OpenInterval(
            -(dragX! + (curXPos + windowWidth)),
            windowWidth * 3 + -(dragX! + (curXPos + windowWidth))
          )
        : new OpenInterval(
            -(dragX! - (curXPos + windowWidth)) + windowWidth,
            windowWidth * 3 - (dragX! - (curXPos + windowWidth)) + windowWidth
          );

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
        if (trackData![`${id}`].straw) {
          straw.current = trackData![`${id}`].straw;
        }

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
          trackData![`${id}`]["result"] = await straw.current.getData(
            objToInstanceAlign(visRegion),
            basePerPixel,
            configOptions.current
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

  // useEffect(() => {
  //   setLegend(ReactDOM.createPortal(updatedLegend.current, legendRef.current));
  // }, [canvasComponents]);
  // useEffect(() => {
  //   if (canvasComponents !== null) {
  //     if (id in applyTrackConfigChange) {
  //       if ("type" in applyTrackConfigChange) {
  //         configOptions.current = {
  //           ...DEFAULT_OPTIONS,
  //           ...applyTrackConfigChange[`${id}`],
  //         };
  //       } else {
  //         configOptions.current = {
  //           ...configOptions.current,
  //           ...applyTrackConfigChange[`${id}`],
  //         };
  //       }

  //       updateGlobalTrackConfig({
  //         configOptions: configOptions.current,
  //         trackModel: trackModel,
  //         id: id,
  //         trackIdx: trackIdx,
  //         legendRef: legendRef,
  //       });

  //       getConfigChangeData({
  //         fetchedDataCache: fetchedDataCache.current,
  //         dataIdx,
  //         usePrimaryNav: usePrimaryNav.current,
  //         createSVGOrCanvas,
  //         trackType: trackModel.type,
  //       });
  //     }
  //   }
  // }, [applyTrackConfigChange]);
  useEffect(() => {
    async function handle() {
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
            let tmpNewConfig: any = { ...configOptions.current };

            for (let key in displayCache.current.density) {
              let curCacheComponent =
                displayCache.current.density[`${key}`].canvasData;
              let newComponentChanges = {};
              let newVisRegion = curCacheComponent.props.visRegion;

              newVisRegion = new DisplayedRegionModel(
                newVisRegion._navContext,
                newVisRegion._startBase,
                newVisRegion._endBase
              );
              // }

              let newData = await straw.current.getData(
                newVisRegion,
                basePerPixel,
                tmpNewConfig
              );
              newComponentChanges["data"] = newData;
              newComponentChanges["viewWindow"] =
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
              newComponentChanges["options"] = tmpNewConfig;

              let newComponent = React.cloneElement(
                curCacheComponent,
                newComponentChanges
              );
              displayCache.current.density[`${key}`].canvasData = newComponent;
            }

            setCanvasComponents(
              displayCache.current.density[`${dataIdx}`].canvasData
            );
          }
        }
      }
    }
    handle();
  }, [applyTrackConfigChange]);
  useEffect(() => {
    if (screenshotOpen) {
      async function handle() {
        let trackState = {
          ...fetchedDataCache.current[dataIdx!].trackState,
        };

        let genesArr = await straw.current.getData(
          objToInstanceAlign(
            fetchedDataCache.current[dataIdx!].trackState.visRegion
          ),
          basePerPixel,
          configOptions.current
        );
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

        let result = await getDisplayModeFunction(
          {
            genesArr,
            trackState,
            windowWidth,
            configOptions: drawOptions,
            updatedLegend,
            trackModel,
          },
          null,
          null,
          dataIdx,
          0
        );

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

  // useEffect(() => {
  //   async function handle() {
  //     if (
  //       canvasComponents !== null &&
  //       (configOptions.current.bothAnchorsInView ||
  //         configOptions.current.fetchViewWindowOnly)
  //     ) {
  //       let trackState = {
  //         ...fetchedDataCache.current[dataIdx!].trackState,
  //       };

  //       trackState["viewWindow"] =
  //         updateSide.current === "right"
  //           ? new OpenInterval(
  //               -(dragX! + (xPos.current + windowWidth)),
  //               windowWidth * 3 + -(dragX! + (xPos.current + windowWidth))
  //             )
  //           : new OpenInterval(
  //               -(dragX! - (xPos.current + windowWidth)) + windowWidth,
  //               windowWidth * 3 -
  //                 (dragX! - (xPos.current + windowWidth)) +
  //                 windowWidth
  //             );
  //       let drawOptions = { ...configOptions.current };
  //       let genesArr = await trackData![`${id}`].straw.getData(
  //         objToInstanceAlign(trackState.visRegion),
  //         basePerPixel,
  //         drawOptions
  //       );

  //       let result = await getDisplayModeFunction({
  //         genesArr,
  //         trackState,
  //         windowWidth,
  //         configOptions: drawOptions,

  //         updatedLegend,
  //         trackModel,
  //       });
  //       setCanvasComponents(result);
  //     }
  //   }
  //   handle();
  // }, [dragX]);

  useEffect(() => {
    async function handle() {
      if (
        canvasComponents !== null &&
        (dataIdx > rightIdx.current || dataIdx < leftIdx.current) &&
        (configOptions.current.bothAnchorsInView ||
          configOptions.current.fetchViewWindowOnly)
      ) {
        if (dataIdx! in displayCache.current.density) {
          let tmpNewConfig = { ...configOptions.current };

          for (let key in displayCache.current.density) {
            let curCacheComponent =
              displayCache.current.density[`${key}`].canvasData;
            let newComponentChanges = {};
            let newVisRegion = curCacheComponent.props.visRegion;

            // if (tmpNewConfig.fetchViewWindowOnly) {
            //   newVisRegion = viewWindow;
            // } else {
            newVisRegion = new DisplayedRegionModel(
              newVisRegion._navContext,
              newVisRegion._startBase,
              newVisRegion._endBase
            );
            // }

            let newData = await straw.current.getData(
              newVisRegion,
              basePerPixel,
              tmpNewConfig
            );
            newComponentChanges["data"] = newData;
            newComponentChanges["viewWindow"] =
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
            newComponentChanges["options"] = tmpNewConfig;

            let newComponent = React.cloneElement(
              curCacheComponent,
              newComponentChanges
            );
            displayCache.current.density[`${key}`].canvasData = newComponent;
          }

          setCanvasComponents(
            displayCache.current.density[`${dataIdx}`].canvasData
          );
        }
      }
    }
    handle();
  }, [dragX]);
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

export default memo(HiCTrack);
