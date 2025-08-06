import { useAppDispatch, useAppSelector } from "../../../../../lib/redux/hooks";
import {
  selectCurrentSession,
  updateCurrentSession,
} from "../../../../../lib/redux/slices/browserSlice";
import {
  resetState,
  selectBundle,
  selectCustomTracksPool,
  updateBundle,
} from "../../../../../lib/redux/slices/hubSlice";
import SessionUI from "./SessionUI";
import { selectIsNavigatorVisible } from "../../../../../lib/redux/slices/settingsSlice";
import { BundleProps } from "./SessionUI";

import useCurrentGenome from "../../../../../lib/hooks/useCurrentGenome";
import { GenomeSerializer, DisplayedRegionModel } from "wuepgg3-track-test";
import useExpandedNavigationTab from "../../../../../lib/hooks/useExpandedNavigationTab";
const Session: React.FC = () => {
  useExpandedNavigationTab();
  const dispatch = useAppDispatch();
  const customTracksPool = useAppSelector(selectCustomTracksPool);
  const currentSession = useAppSelector(selectCurrentSession);
  const bundle = useAppSelector(selectBundle);
  const isNavigatorVisible = useAppSelector(selectIsNavigatorVisible);
  const _genomeConfig = useCurrentGenome();
  let curUserState: BundleProps | null = null;

  if (currentSession && _genomeConfig && bundle) {
    const highlights = currentSession.highlights;
    const isShowingNavigator = isNavigatorVisible;
    const regionSets = currentSession.regionSets;
    const tracks = currentSession.tracks;
    const selectedRegionSet = currentSession.selectedRegionSet;

    const genomeConfig = GenomeSerializer.deserialize(_genomeConfig);
    const userViewRegion = currentSession.userViewRegion;

    curUserState = {
      bundleId: bundle.bundleId,
      customTracksPool,
      darkTheme: false,
      genomeName: currentSession.genomeId,
      highlights,
      isShowingNavigator: isShowingNavigator,
      layout: {},
      metadataTerms: [],
      regionSetView: selectedRegionSet,
      regionSets,
      trackLegendWidth: 120,
      tracks,
      viewRegion: userViewRegion
        ? new DisplayedRegionModel(
            genomeConfig.navContext,
            userViewRegion?.start,
            userViewRegion?.end
          )
        : new DisplayedRegionModel(
            genomeConfig.navContext,
            ...genomeConfig.defaultRegion
          ),
    };
  }
  //provide data to genomeTracks to new current bundle session
  function onRestoreSession(sessionBundle: any) {
    const session = {
      genomeId: sessionBundle.genomeName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      title: "",
      viewRegion:
        `${sessionBundle.viewRegion._startBase}` +
        `${sessionBundle.viewRegion._endBase}`,
      userViewRegion: {
        start: sessionBundle.viewRegion._startBase,
        end: sessionBundle.viewRegion._endBase,
      },
      tracks: sessionBundle.tracks.map((item) => {
        item.waitToUpdate = true;
        return item;
      }),
      highlights: sessionBundle.highlights ?? [],
      metadataTerms: sessionBundle.metadataTerms ?? [],
      selectedRegionSet: sessionBundle.regionSetView ?? null,
      regionSets: sessionBundle.regionSets ?? [],
    };

    dispatch(resetState());
    dispatch(updateCurrentSession(session));
  }

  //set the bundleid for this session to the retreive id and bundle to new bundle
  function onRetrieveBundle(newBundle: any) {
    if (newBundle && newBundle.bundleId) {
      dispatch(updateBundle(newBundle));
      dispatch(
        updateCurrentSession({
          bundleId: newBundle.bundleId,
        })
      );
    }
  }

  //add or delete session from bundle
  function onUpdateBundle(bundle: any) {
    dispatch(updateBundle(bundle));
    dispatch(updateCurrentSession({ bundleId: bundle.bundleId }));
  }
  return (
    <SessionUI
      onRestoreSession={onRestoreSession}
      onRetrieveBundle={onRetrieveBundle}
      updateBundle={onUpdateBundle}
      bundleId={bundle.bundleId ? bundle.bundleId : ""}
      curBundle={bundle}
      state={curUserState}
    />
  );
};

export default Session;
