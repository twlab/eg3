import React, { memo, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { TrackProps } from "../../../models/trackModels/trackProps";
import { objToInstanceAlign } from "../TrackManager";
import { getGenomeConfig } from "../../../models/genomes/allGenomes";
import ReactDOM from "react-dom";
import RulerComponent from "./RulerComponents/RulerComponent";
import { useGenome } from "@/lib/contexts/GenomeContext";

import { getTrackXOffset } from "./CommonTrackStateChangeFunctions.tsx/getTrackPixelXOffset";

export const DEFAULT_OPTIONS = { backgroundColor: "var(--bg-color)" };

const ErrorTrack: React.FC<TrackProps> = memo(function ErrorTrack({
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
  const [components, setComponents] = useState<any>();

  // These states are used to update the tracks with new fetched data
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track

  //________________________________________________________________________________________________________________________________________________________

  useEffect(() => {
    if (trackData && trackData.trackState) {
      const primaryVisData =
        trackData!.trackState.genomicFetchCoord[
          trackData!.trackState.primaryGenName
        ].primaryVisData;
      let tmpTrackState = { ...trackData.trackState };

      tmpTrackState["startWindow"] = primaryVisData.viewWindow.start;
      xPos.current = getTrackXOffset(tmpTrackState, windowWidth);

      updateSide.current = tmpTrackState.side;

      if (trackData.trackState.initial) {
        fetchedDataCache.current[rightIdx.current] = {
          trackState: tmpTrackState,
        };
        rightIdx.current--;
        setComponents(
          <div
            style={{
              width: primaryVisData.visWidth,
              height: 40,
              backgroundColor: "red",
              textAlign: "center",
              lineHeight: "40px", // Centering vertically by matching the line height to the height of the div
            }}
          >
            Unsupported Track
          </div>
        );
        checkTrackPreload(id);
      } else {
        if (tmpTrackState.side === "right") {
          fetchedDataCache.current[rightIdx.current] = {
            trackState: tmpTrackState,
          };
          rightIdx.current--;
        } else if (tmpTrackState.side === "left") {
          fetchedDataCache.current[leftIdx.current] = {
            trackState: tmpTrackState,
          };
          leftIdx.current++;
        }
      }
    }
  }, [trackData]);
  useEffect(() => {
    if (
      dataIdx in fetchedDataCache.current &&
      dataIdx > rightIdx.current &&
      dataIdx < leftIdx.current
    ) {
      let state = fetchedDataCache.current[dataIdx];
      xPos.current = getTrackXOffset(state.trackState, windowWidth);

      updateSide.current = state.trackState.side;
    }
  }, [dataIdx]);

  return (
    //svg allows overflow to be visible x and y but the div only allows x overflow, so we need to set the svg to overflow x and y and then limit it in div its container.

    <div
      style={{
        display: "flex",
        position: "relative",
        backgroundColor: "red",
        height: 40,
      }}
    >
      <div
        style={{
          position: "absolute",
          backgroundColor: "red",
          left: updateSide.current === "right" ? `${xPos.current}px` : "",
          right: updateSide.current === "left" ? `${xPos.current}px` : "",
        }}
      >
        {components}
      </div>
    </div>
  );
});

export default memo(ErrorTrack);
