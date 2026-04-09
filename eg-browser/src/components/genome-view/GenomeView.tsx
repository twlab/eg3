import useCurrentGenome from "@/lib/hooks/useCurrentGenome";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { selectCurrentSession } from "@/lib/redux/slices/browserSlice";
import { updateCurrentSession } from "@/lib/redux/slices/browserSlice";
import { useEffect, useRef } from "react";
import {
  selectDarkTheme,
  selectIsNavigatorVisible,
  selectIsToolBarVisible,
} from "@/lib/redux/slices/settingsSlice";
import { selectToolState } from "@/lib/redux/slices/utilitySlice";
import {
  selectScreenShotOpen,
  updateScreenShotData,
} from "@/lib/redux/slices/hubSlice";
import {
  GenomeCoordinate,
  IHighlightInterval,
  ITrackModel,
  RegionSet,
} from "wuepgg3-track";
// import "wuepgg3-track/style.css";
import { TrackContainerRepresentable } from "wuepgg3-track";
import Toolbar from "./toolbar/Toolbar";

import { TrackPlaceHolder } from "../root-layout/tabs/tracks/destinations/TrackPlaceHolder";
import { selectCurrentState } from "../../lib/redux/selectors";

interface GenomeViewProps {
  infiniteScrollWorkers?: React.MutableRefObject<{
    worker: { fetchWorker: Worker; hasOnMessage: boolean }[];
  } | null>;
  fetchGenomeAlignWorker?: React.MutableRefObject<{
    fetchWorker: Worker;
    hasOnMessage: boolean;
  } | null>;
}

export default function GenomeView({
  infiniteScrollWorkers: externalInfiniteScrollWorkers,
  fetchGenomeAlignWorker: externalFetchGenomeAlignWorker,
}: GenomeViewProps = {}) {
  const currentSession = useAppSelector(selectCurrentSession);
  const currentState = useAppSelector(selectCurrentState);

  const dispatch = useAppDispatch();

  const toolState = useAppSelector(selectToolState);

  const genomeConfig = useCurrentGenome();
  const isNavigatorVisible = useAppSelector(selectIsNavigatorVisible);
  const isToolBarVisible = useAppSelector(selectIsToolBarVisible);
  const isScreenShotOpen = useAppSelector(selectScreenShotOpen);
  const darkTheme = useAppSelector(selectDarkTheme);
  const bundleId =
    currentSession && currentSession.bundleId ? currentSession.bundleId : null;

  // useEffect(() => {
  //   if (bundleId) {
  //     dispatch(fetchBundle(bundleId));
  //   }
  // }, [bundleId, dispatch]);

  // const bundleId = currentSession.bundleId;

  const setScreenshotData = (screenShotData: { [key: string]: any }) => {
    dispatch(updateScreenShotData(screenShotData));
  };

  const handleNewHighlight = (highlights: IHighlightInterval[]) => {
    dispatch(updateCurrentSession({ highlights }));
  };

  const handleTracksChange = (tracks: ITrackModel[]) => {
    dispatch(updateCurrentSession({ tracks }));
  };

  const handleNewRegion = (coordinate: GenomeCoordinate) => {
    dispatch(
      updateCurrentSession({
        userViewRegion: coordinate,
      }),
    );
  };

  const handleNewRegionSelect = (coordinate: GenomeCoordinate) => {
    dispatch(
      updateCurrentSession({
        viewRegion: coordinate,
        userViewRegion: coordinate,
      }),
    );
  };
  function handleSetSelected(
    set: RegionSet | null,
    coordinate: GenomeCoordinate | null,
  ) {
    if (currentSession?.selectedRegionSet || set) {
      dispatch(
        updateCurrentSession({
          selectedRegionSet: set,
          userViewRegion: coordinate,
        }),
      );
    }
  }

  return currentSession &&
    genomeConfig &&
    (currentSession.genomeId === genomeConfig.name ||
      currentSession.genomeId === genomeConfig.id) ? (
    <TrackContainerRepresentable
      key={currentSession.id}
      genomeName={currentSession?.genomeId ? currentSession?.genomeId : "hg38"}
      tracks={currentSession.tracks}
      highlights={currentSession.highlights}
      genomeConfig={genomeConfig}
      legendWidth={120}
      showGenomeNav={isNavigatorVisible}
      showToolBar={isToolBarVisible}
      onNewRegion={handleNewRegion}
      onNewHighlight={handleNewHighlight}
      onTracksChange={handleTracksChange}
      onNewRegionSelect={handleNewRegionSelect}
      onSetSelected={handleSetSelected}
      viewRegion={currentSession?.viewRegion}
      userViewRegion={currentSession.userViewRegion}
      tool={toolState}
      Toolbar={{ toolbar: Toolbar, skeleton: TrackPlaceHolder }}
      selectedRegionSet={currentSession?.selectedRegionSet}
      setScreenshotData={setScreenshotData}
      isScreenShotOpen={isScreenShotOpen}
      overrideViewRegion={currentSession?.overrideViewRegion}
      currentState={currentState}
      darkTheme={darkTheme}
      width={currentSession.width}
      height={currentSession.height}
      infiniteScrollWorkers={externalInfiniteScrollWorkers}
      fetchGenomeAlignWorker={externalFetchGenomeAlignWorker}
    />
  ) : null;
}
