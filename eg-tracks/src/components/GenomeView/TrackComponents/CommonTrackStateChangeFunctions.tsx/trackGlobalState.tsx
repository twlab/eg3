import DisplayedRegionModel from "../../../../models/DisplayedRegionModel";

interface cacheFetchedDataParams {
  trackState: any;
  globalTrackState: any;
  navContext: any;
  bpRegionSize: number;
}

export function trackGlobalState({
  trackState,
  globalTrackState,
  navContext,
  bpRegionSize,
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
      index: 1,
      visRegion: new DisplayedRegionModel(
        navContext,
        trackState.visData.visRegion._startBase - bpRegionSize,
        trackState.visData.visRegion._startBase
      ),
    };
    let trackState1 = {
      ...trackState,
      visRegion: new DisplayedRegionModel(
        navContext,
        trackState.visData.visRegion._endBase,
        trackState.visData.visRegion._endBase + bpRegionSize
      ),
      regionLoci: trackState.regionLoci[1],
      initial: 1,
      side: "right",
      xDist: 0,

      index: 0,
      startWindow: primaryVisData.viewWindow.start,
      visWidth: primaryVisData.visWidth,
    };

    let trackState2 = {
      regionLoci: trackState.regionLoci[2],
      initial: 0,
      visData: trackState.initVisData[2],
      side: "right",
      xDist: 0,
      index: -1,
    };

    globalTrackState.current.trackState[globalTrackState.current["leftIdx"]] = {
      trackState: trackState0,
    };

    globalTrackState.current["leftIdx"]++;

    globalTrackState.current.trackState[globalTrackState.current["rightIdx"]] =
      {
        trackState: trackState1,
      };

    globalTrackState.current["rightIdx"]--;

    globalTrackState.current.trackState[globalTrackState.current["rightIdx"]] =
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
      globalTrackState.current.trackState[
        globalTrackState.current["rightIdx"]
      ] = {
        trackState: {
          ...newTrackState,
          regionLoci:
            trackState.genomicFetchCoord[trackState.primaryGenName].genomicLoci,
        },
      };
      globalTrackState.current.trackState[
        globalTrackState.current["rightIdx"] + 1
      ] = {
        trackState: newTrackState,
      };

      globalTrackState.current["rightIdx"]--;
    } else if (trackState.side === "left") {
      globalTrackState.current.trackState[globalTrackState.current["leftIdx"]] =
        {
          trackState: newTrackState,
        };
      globalTrackState.current.trackState[
        globalTrackState.current["leftIdx"] - 1
      ] = {
        trackState: newTrackState,
      };

      globalTrackState.current["leftIdx"]++;
    }
  }
}
