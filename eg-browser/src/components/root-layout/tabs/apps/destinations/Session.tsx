import { useAppDispatch, useAppSelector } from "../../../../../lib/redux/hooks";
import {
  selectCurrentSession,
  updateCurrentSession,
} from "../../../../../lib/redux/slices/browserSlice";
import {
  selectBundle,
  selectCustomTracksPool,
  updateBundle,
} from "../../../../../lib/redux/slices/hubSlice";
import SessionUI from "@eg/tracks/src/components/GenomeView/TabComponents/SessionUI";
import { selectIsNavigatorVisible } from "../../../../../lib/redux/slices/settingsSlice";
import { BundleProps } from "@eg/tracks/src/components/GenomeView/TabComponents/SessionUI";
import DisplayedRegionModel from "@eg/tracks/src/models/DisplayedRegionModel";
import useCurrentGenome from "../../../../../lib/hooks/useCurrentGenome";
import GenomeSerializer from "@eg/tracks/src/genome-hub/GenomeSerializer";
const Session: React.FC = () => {
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
  function onRestoreSession(bundle: any) {
    const curSessionId = bundle.currentId;
    const sessionBundle = bundle.sessionsInBundle[`${curSessionId}`].state;

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
      tracks: sessionBundle.tracks,
      highlights: sessionBundle.highlights ?? [],
      metadataTerms: sessionBundle.metadataTerms ?? [],
      selectedRegionSet: sessionBundle.regionSetView ?? null,
      regionSets: sessionBundle.regionSets ?? [],
    };
    dispatch(updateBundle(bundle));
    dispatch(updateCurrentSession(session));
  }

  //set the bundleid for this session to the retreive id and bundle to new bundle
  function onRetrieveBundle(newBundle: any) {
    console.log(newBundle, "SADDASADSDAASD");
    dispatch(updateBundle(newBundle));
    dispatch(
      updateCurrentSession({
        bundleId: newBundle.bundleId,
      })
    );
  }

  //add or delete session from bundle
  function onUpdateBundle(bundle: any) {
    console.log(bundle);
    dispatch(updateBundle(bundle));
    dispatch(updateCurrentSession({ bundleId: bundle.bundleId }));
  }
  return curUserState ? (
    <SessionUI
      onRestoreSession={onRestoreSession}
      onRetrieveBundle={onRetrieveBundle}
      updateBundle={onUpdateBundle}
      bundleId={bundle.bundleId}
      curBundle={bundle}
      state={curUserState}
    />
  ) : (
    ""
  );
};

export default Session;
