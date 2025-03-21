import useCurrentGenome from "@/lib/hooks/useCurrentGenome";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { selectCurrentSession } from "@/lib/redux/slices/browserSlice";
import { updateCurrentSession } from "@/lib/redux/slices/browserSlice";
import { selectIsNavigatorVisible } from "@/lib/redux/slices/settingsSlice";
import { selectTool } from "@/lib/redux/slices/utilitySlice";
import {
  resetState,
  selectScreenShotOpen,
  updateScreenShotData,
} from "@/lib/redux/slices/hubSlice";
import {
  GenomeCoordinate,
  getGenomeConfig,
  IHighlightInterval,
  ITrackModel,
  TrackContainerRepresentable,
} from "@eg/tracks";
import { child, get, getDatabase, ref, set } from "firebase/database";
import Toolbar from "./toolbar/Toolbar";
import { useRef } from "react";
import DisplayedRegionModel from "@eg/tracks/src/models/DisplayedRegionModel";
import RegionSet from "@eg/tracks/src/models/RegionSet";

export default function GenomeView() {
  const dispatch = useAppDispatch();
  const currentSession = useAppSelector(selectCurrentSession);
  const tool = useAppSelector(selectTool);
  const genomeConfig = useCurrentGenome();
  const isNavigatorVisible = useAppSelector(selectIsNavigatorVisible);
  const isScreenShotOpen = useAppSelector(selectScreenShotOpen);

  const lastSessionId = useRef<null | string>(null);
  if (!currentSession || !genomeConfig) {
    return null;
  }
  // const bundleId = currentSession.bundleId;
  const bundleId = "dbfe07ff-92f7-4214-9f88-f5003f681981";

  const sessionId = currentSession.id;
  if (lastSessionId.current !== sessionId) {
    dispatch(resetState());
    lastSessionId.current = sessionId;

    if (bundleId) {
      const retrieveId = bundleId;
      if (retrieveId.length === 0) {
        console.log("Session bundle Id cannot be empty.", "error", 2000);
        return null;
      }

      const dbRef = ref(getDatabase());
      get(child(dbRef, `sessions/${retrieveId}`))
        .then((snapshot) => {
          if (snapshot.exists()) {
            let res = snapshot.val();
            for (let curId in res.sessionsInBundle) {
              if (res.sessionsInBundle.hasOwnProperty(curId)) {
                let object = res.sessionsInBundle[curId].state;
                console.log(object, "return RESULT");

                const regionSets = object.regionSets
                  ? object.regionSets.map(RegionSet.deserialize)
                  : [];
                const regionSetView =
                  regionSets[object.regionSetViewIndex] || null;

                // Create the newBundle object based on the existing object.
                let newBundle = {
                  genomeName: object.genomeName,
                  viewRegion: new DisplayedRegionModel(
                    getGenomeConfig(object.genomeName).navContext,
                    object.viewRegion._startBase,
                    object.viewRegion._endBase
                  ),

                  tracks: object.tracks,
                  metadataTerms: object.metadataTerms || [],
                  regionSets,
                  regionSetView,
                  trackLegendWidth: object.trackLegendWidth || 120,
                  bundleId: object.bundleId,
                  isShowingNavigator: object.isShowingNavigator,
                  isShowingVR: object.isShowingVR,
                  layout: object.layout || {},
                  highlights: object.highlights || [],
                  darkTheme: object.darkTheme || false,
                };
                console.log(newBundle, "ORGANiZED BUNDLE BAK TO STATE");
                // Replace the state key with the newBundle in the session.
                res.sessionsInBundle[curId].state = newBundle;
              }
            }
            console.log(res);
          } else {
            console.log("No data available");
          }
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
    }
  }
  const selectedRegionSet = currentSession?.selectedRegionSet;
  const overrideViewRegion = currentSession?.overrideViewRegion;
  const viewRegion = currentSession?.viewRegion;
  const setScreenshotData = (screenShotData: { [key: string]: any }) => {
    dispatch(updateScreenShotData(screenShotData));
  };

  const handleNewHighlight = (highlights: IHighlightInterval[]) => {
    dispatch(updateCurrentSession({ highlights }));
  };

  const handleTrackSelected = (tracks: ITrackModel[]) => {
    dispatch(updateCurrentSession({ tracks }));
  };

  const handleTrackDeleted = (tracks: ITrackModel[]) => {
    dispatch(updateCurrentSession({ tracks }));
  };

  const handleTrackAdded = (tracks: ITrackModel[]) => {
    dispatch(updateCurrentSession({ tracks }));
  };
  const handleNewRegion = (startbase: number, endbase: number) => {
    dispatch(
      updateCurrentSession({
        userViewRegion: { start: startbase, end: endbase },
      })
    );
  };
  const handleNewRegionSelect = (
    startbase: number,
    endbase: number,
    coordinate: GenomeCoordinate
  ) => {
    let currCoordinate: GenomeCoordinate | null = coordinate;
    if (coordinate === viewRegion) {
      currCoordinate = null;
    }
    dispatch(
      updateCurrentSession({
        userViewRegion: { start: startbase, end: endbase },
      })
    );
    dispatch(updateCurrentSession({ viewRegion: currCoordinate }));
  };

  return (
    <div>
      <TrackContainerRepresentable
        key={currentSession.id}
        tracks={currentSession.tracks}
        highlights={currentSession.highlights}
        genomeConfig={genomeConfig}
        legendWidth={120}
        showGenomeNav={isNavigatorVisible}
        onNewRegion={handleNewRegion}
        onNewHighlight={handleNewHighlight}
        onTrackSelected={handleTrackSelected}
        onTrackDeleted={handleTrackDeleted}
        onTrackAdded={handleTrackAdded}
        onNewRegionSelect={handleNewRegionSelect}
        viewRegion={viewRegion}
        userViewRegion={currentSession.userViewRegion}
        tool={tool}
        Toolbar={Toolbar}
        selectedRegionSet={selectedRegionSet}
        setScreenshotData={setScreenshotData}
        isScreenShotOpen={isScreenShotOpen}
        overrideViewRegion={overrideViewRegion}
      />
    </div>
  );
}
