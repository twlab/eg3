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
  IHighlightInterval,
  ITrackModel,
  TrackContainerRepresentable,
} from "@eg/tracks";

import Toolbar from "./toolbar/Toolbar";
import { useRef } from "react";
import { fetchBundle } from "../../lib/redux/thunk/session";

import { RootState } from "../../lib/redux/store";

export default function GenomeView() {
  const prevViewRegion = useRef<any>("")
  const currentSession = useAppSelector(selectCurrentSession);
  const currentState = useAppSelector((state: RootState) => {
    return currentSession ? { ...state.browser } : null;
  });

  const dispatch = useAppDispatch();

  const tool = useAppSelector(selectTool);

  const genomeConfig = useCurrentGenome();
  const isNavigatorVisible = useAppSelector(selectIsNavigatorVisible);

  const isScreenShotOpen = useAppSelector(selectScreenShotOpen);
  const lastSessionId = useRef<null | string>(null);
  const bundleId = currentSession ? currentSession.bundleId : null;

  const sessionId = currentSession ? currentSession.id : null;

  prevViewRegion.current = currentSession ? currentSession?.viewRegion : "";
  if (lastSessionId.current !== sessionId) {
    dispatch(resetState());
    lastSessionId.current = sessionId;
    if (bundleId) {
      dispatch(fetchBundle(bundleId));
    }
  }

  // const bundleId = currentSession.bundleId;

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

    let updatedCoord;
    if (coordinate === prevViewRegion.current) {
      updatedCoord = `${coordinate},${startbase}-${endbase}`;
    } else {
      updatedCoord = coordinate;
    }
    prevViewRegion.current = updatedCoord
    dispatch(
      updateCurrentSession({
        viewRegion: updatedCoord,
        userViewRegion: { start: startbase, end: endbase },
      })
    );
  };

  // need to check if genomes are the same, for example if we update session bundle it can have a different genome name from genomeConfig because
  // currentSession updates first, but genomeConfig still has the previous genome
  return currentSession && genomeConfig && (currentSession.genomeId === genomeConfig.name) ? (
    <div>
      <TrackContainerRepresentable
        key={currentSession.id}
        genomeName={
          currentSession?.genomeId ? currentSession?.genomeId : "hg38"
        }
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
        viewRegion={currentSession?.viewRegion}
        userViewRegion={currentSession.userViewRegion}
        tool={tool}
        Toolbar={Toolbar}
        selectedRegionSet={currentSession?.selectedRegionSet}
        setScreenshotData={setScreenshotData}
        isScreenShotOpen={isScreenShotOpen}
        overrideViewRegion={currentSession?.overrideViewRegion}
        currentState={currentState}
      />
    </div>
  ) : null;
}
