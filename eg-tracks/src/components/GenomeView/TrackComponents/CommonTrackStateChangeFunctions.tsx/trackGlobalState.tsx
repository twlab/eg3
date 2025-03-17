interface cacheFetchedDataParams {
  trackState: any;
  globalTrackState: any;
}

export function trackGlobalState({
  trackState,
  globalTrackState,
}: cacheFetchedDataParams) {
  const primaryVisData =
    trackState.genomicFetchCoord[trackState.primaryGenName].primaryVisData;

  if (trackState.initial === 1) {
    let trackState0 = {
      initial: 0,
      regionLoci: trackState.regionLoci[0],
      visData: trackState.initVisData[0],
      side: "left",
      xDist: 0,
    };
    let trackState1 = {
      ...trackState,
      regionLoci: trackState.regionLoci[1],
      initial: 1,
      side: "right",
      visData: trackState.initVisData[1],
      xDist: 0,
      startWindow: primaryVisData.viewWindow.start,
      visWidth: primaryVisData.visWidth,
    };

    let trackState2 = {
      regionLoci: trackState.regionLoci[2],
      initial: 0,
      visData: trackState.initVisData[2],
      side: "right",
      xDist: 0,
    };

    globalTrackState.current.trackStates[globalTrackState.current["leftIdx"]] =
      {
        trackState: trackState0,
      };

    globalTrackState.current["leftIdx"]++;

    globalTrackState.current.trackStates[globalTrackState.current["rightIdx"]] =
      {
        trackState: trackState1,
      };

    globalTrackState.current["rightIdx"]--;

    globalTrackState.current.trackStates[globalTrackState.current["rightIdx"]] =
      {
        trackState: trackState2,
      };

    globalTrackState.current["rightIdx"]--;
  } else {
    let newTrackState = {
      ...trackState,
      initial: 0,
      side: trackState.side,
      xDist: trackState.xDist,

      startWindow: primaryVisData.viewWindow.start,
      visWidth: primaryVisData.visWidth,
    };

    if (trackState.side === "right") {
      globalTrackState.current.trackStates[
        globalTrackState.current["rightIdx"]
      ] = {
        trackState: {
          regionLoci:
            trackState.genomicFetchCoord[trackState.primaryGenName].genomicLoci,
        },
      };
      globalTrackState.current.trackStates[
        globalTrackState.current["rightIdx"] + 1
      ] = {
        trackState: newTrackState,
      };

      globalTrackState.current["rightIdx"]--;
    } else if (trackState.side === "left") {
      globalTrackState.current.trackStates[
        globalTrackState.current["leftIdx"]
      ] = {
        trackState: {
          regionLoci:
            trackState.genomicFetchCoord[trackState.primaryGenName].genomicLoci,
        },
      };

      globalTrackState.current.trackStates[
        globalTrackState.current["leftIdx"] - 1
      ] = {
        trackState: newTrackState,
      };

      globalTrackState.current["leftIdx"]++;
    }
  }
}
