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
import { addCustomGenomeRemote } from "../../../../../lib/redux/thunk/genome-hub";
import useCurrentGenome from "../../../../../lib/hooks/useCurrentGenome";
import { GenomeSerializer } from "wuepgg3-track";
import useExpandedNavigationTab from "../../../../../lib/hooks/useExpandedNavigationTab";
import { useRef } from "react";
const Session: React.FC = () => {
  useExpandedNavigationTab();
  const prevViewRegion = useRef<any>("");
  const dispatch = useAppDispatch();
  const customTracksPool = useAppSelector(selectCustomTracksPool);
  const currentSession = useAppSelector(selectCurrentSession);
  const bundle = useAppSelector(selectBundle);
  const isNavigatorVisible = useAppSelector(selectIsNavigatorVisible);
  const _genomeConfig = useCurrentGenome();

  prevViewRegion.current = currentSession ? currentSession?.viewRegion : "";
  let curUserState: BundleProps | null = null;

  if (currentSession && _genomeConfig && bundle) {
    const highlights = currentSession.highlights;
    const isShowingNavigator = isNavigatorVisible;
    const regionSets = currentSession.regionSets;
    const tracks = currentSession.tracks;
    const selectedRegionSet = currentSession.selectedRegionSet;
    const userViewRegion = currentSession.userViewRegion;

    let curViewInterval;
    if (userViewRegion) {
      curViewInterval = {
        start: userViewRegion?.start,
        end: userViewRegion?.end,
      };
    } else {
      const genomeConfig = GenomeSerializer.deserialize(_genomeConfig);
      const navContext = genomeConfig.navContext;
      curViewInterval = navContext.parse(_genomeConfig.defaultRegion);
    }

    curUserState = {
      bundleId: bundle.bundleId,
      customTracksPool,
      customGenome: currentSession.customGenome,
      darkTheme: false,
      genomeName: _genomeConfig.name
        ? _genomeConfig.name
        : currentSession.genomeId,
      genomeId: currentSession.genomeId,
      highlights,
      isShowingNavigator: isShowingNavigator,
      layout: {},
      chromosomes: currentSession.customGenome
        ? _genomeConfig.chromosomes
        : null,
      metadataTerms: [],
      regionSetView: selectedRegionSet,
      regionSets,
      trackLegendWidth: 120,
      tracks,
      viewInterval: curViewInterval,
    };
  }
  //provide data to genomeTracks to new current bundle session
  function onRestoreSession(sessionBundle: any) {
    if (sessionBundle.customGenome) {
      addCustomGenomeRemote({
        id: sessionBundle.genomeId,
        name: sessionBundle.genomeId,
        chromosomes: sessionBundle.chromosomes,
        defaultTracks: sessionBundle.tracks.map((item: any) => ({
          ...item,
          waitToUpdate: true,
        })),
      });
    }
    const session = {
      genomeId: sessionBundle.genomeId,
      customGenome: sessionBundle.customGenome,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      title: "",
      viewRegion:
        `${sessionBundle.viewInterval.start}` +
        `${sessionBundle.viewInterval.end}`,
      userViewRegion: {
        start: sessionBundle.viewInterval.start,
        end: sessionBundle.viewInterval.end,
      },
      tracks: sessionBundle.tracks.map((item) => ({
        ...item,
        waitToUpdate: true,
      })),
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
      if (newBundle.bundleId !== currentSession?.bundleId) {
        dispatch(
          updateCurrentSession({
            bundleId: newBundle.bundleId,
          })
        );
      }
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
