import React, { memo, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { TrackProps } from "../../../models/trackModels/trackProps";
import { objToInstanceAlign } from "../TrackManager";
import { getGenomeConfig } from "../../../models/genomes/allGenomes";
import ReactDOM from "react-dom";
import RulerComponent from "./RulerComponents/RulerComponent";
import { useGenome } from "@/lib/contexts/GenomeContext";
import { cacheTrackData } from "./CommonTrackStateChangeFunctions.tsx/cacheTrackData";
import { getTrackXOffset } from "./CommonTrackStateChangeFunctions.tsx/getTrackPixelXOffset";
import { getCacheData } from "./CommonTrackStateChangeFunctions.tsx/getCacheData";
import OpenInterval from "@/models/OpenInterval";
import { getDisplayModeFunction } from "./displayModeComponentMap";

export const DEFAULT_OPTIONS = { backgroundColor: "var(--bg-color)" };

const RulerTrack: React.FC<TrackProps> = memo(function RulerTrack({
  trackData,
  updateGlobalTrackConfig,
  checkTrackPreload,
  side,
  windowWidth = 0,
  genomeArr,
  genomeIdx,
  trackModel,
  dataIdx,

  trackIdx,
  id,
  dragX,

  legendRef,
  sentScreenshotData,
}) {
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

  const [legend, setLegend] = useState<any>();
  const [canvasComponents, setCanvasComponents] = useState<any>();

  // These states are used to update the tracks with new fetched data
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track

  async function createSVGOrCanvas(trackState, genesArr, isError) {
    let curXPos = getTrackXOffset(trackState, windowWidth);
    if (isError) {
      fetchError.current = true;
    }
    trackState["viewWindow"] = new OpenInterval(0, trackState.visWidth);
    const result = await getDisplayModeFunction({
      genesArr,
      trackState,
      windowWidth,
      configOptions: configOptions.current,
      genomeName: genomeArr![genomeIdx!].genome.getName(),
      updatedLegend,
      trackModel,
    });

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

      setCanvasComponents(result);
    }
    updateSide.current = side;
  }

  //________________________________________________________________________________________________________________________________________________________

  function resetState() {
    configOptions.current = { ...DEFAULT_OPTIONS };

    rightIdx.current = 0;
    leftIdx.current = 1;
    updateSide.current = "right";
    updatedLegend.current = undefined;
    fetchedDataCache.current = {};

    setLegend(undefined);
  }
  useEffect(() => {
    if (trackData![`${id}`]) {
      if (trackData!.trackState.initial === 1) {
        trackData![`${id}`].result = [[], [], []];
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
          usePrimaryNav: usePrimaryNav.current,
        });
      } else {
        trackData![`${id}`].result = [];
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
    if (screenshotOpen) {
      async function handle() {
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

        const result = await getDisplayModeFunction({
          geneArr: [],
          trackState,
          windowWidth,
          configOptions: drawOptions,
          genomeName: genomeArr![genomeIdx!].genome.getName(),
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
    getCacheData({
      isError: fetchError.current,
      usePrimaryNav: usePrimaryNav.current,
      rightIdx: rightIdx.current,
      leftIdx: leftIdx.current,
      dataIdx,
      fetchedDataCache: fetchedDataCache.current,
      xPos,
      updatedLegend,
      trackModel,
      createSVGOrCanvas,
      side,
      updateSide,
    });
  }, [dataIdx]);

  useEffect(() => {
    if (!genomeArr![genomeIdx!].isInitial) {
    }
    setLegend(ReactDOM.createPortal(updatedLegend.current, legendRef.current));
  }, [canvasComponents]);

  return (
    //svg allows overflow to be visible x and y but the div only allows x overflow, so we need to set the svg to overflow x and y and then limit it in div its container.

    <div
      style={{
        display: "flex",
        position: "relative",
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

export default memo(RulerTrack);
