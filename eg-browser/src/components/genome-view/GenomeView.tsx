import useCurrentGenome from "@/lib/hooks/useCurrentGenome";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { selectCurrentSession } from "@/lib/redux/slices/browserSlice";
import { updateCurrentSession } from "@/lib/redux/slices/browserSlice";
import { selectIsNavigatorVisible } from "@/lib/redux/slices/settingsSlice";
import { selectTool } from "@/lib/redux/slices/utilitySlice";
import { onRetrieveSession } from "@eg/tracks/src/components/GenomeView/TabComponents/SessionUI";
import {
  resetState,
  selectBundle,
  selectScreenShotOpen,
  updateBundle,
  updateScreenShotData,
} from "@/lib/redux/slices/hubSlice";
import {
  GenomeCoordinate,
  IHighlightInterval,
  ITrackModel,
  TrackContainerRepresentable,
} from "@eg/tracks";

import Toolbar from "./toolbar/Toolbar";
import { useRef } from "react";
import { fetchBundle } from "../../lib/redux/thunk/session";

import { RootState } from "../../lib/redux/store";

export default function GenomeView() {
  const dispatch = useAppDispatch();
  const currentSession = useAppSelector(selectCurrentSession);
  const tool = useAppSelector(selectTool);

  const genomeConfig = useCurrentGenome();
  const isNavigatorVisible = useAppSelector(selectIsNavigatorVisible);

  const isScreenShotOpen = useAppSelector(selectScreenShotOpen);
  const lastSessionId = useRef<null | string>(null);

  const currentState = useAppSelector((state: RootState) => state);
  console.log(currentState.browser);
  if (!currentSession || !genomeConfig) {
    return null;
  }
  // const bundleId = currentSession.bundleId;
  const bundleId = currentSession.bundleId;

  const sessionId = currentSession.id;
  if (lastSessionId.current !== sessionId) {
    dispatch(resetState());
    lastSessionId.current = sessionId;
    if (bundleId) {
      dispatch(fetchBundle(bundleId));
    }
  }
  const genomeName = currentSession.genomeId;
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
        viewRegion: currCoordinate,
        userViewRegion: { start: startbase, end: endbase },
      })
    );
  };

  return (
    <div>
      <TrackContainerRepresentable
        key={currentSession.id}
        genomeName={genomeName ? genomeName : "hg38"}
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
        currentState={currentState}
      />
    </div>
  );
}
