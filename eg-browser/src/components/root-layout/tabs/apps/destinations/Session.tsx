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
import {
  DisplayedRegionModel,
  GenomeCoordinate,
  GenomeSerializer,
  getGenomeConfig,
} from "wuepgg3-track";
import useExpandedNavigationTab from "../../../../../lib/hooks/useExpandedNavigationTab";
import NavigationContext from "wuepgg3-track/src/models/NavigationContext";
import { GenomeConfig } from "wuepgg3-track/src/models/genomes/GenomeConfig";

const Session: React.FC = () => {
  useExpandedNavigationTab();
  const dispatch = useAppDispatch();

  const customTracksPool = useAppSelector(selectCustomTracksPool);
  const currentSession = useAppSelector(selectCurrentSession);
  const bundle = useAppSelector(selectBundle);
  const isNavigatorVisible = useAppSelector(selectIsNavigatorVisible);
  const _genomeConfig = useCurrentGenome();

  // Early return if required data is not available
  if (!currentSession || !_genomeConfig) {
    return null;
  }

  let curUserState: BundleProps | undefined = undefined;

  if (
    currentSession &&
    _genomeConfig &&
    bundle &&
    currentSession.genomeId === _genomeConfig.name
  ) {
    const highlights = currentSession.highlights;
    const isShowingNavigator = isNavigatorVisible;
    const regionSets = currentSession.regionSets;
    const tracks = currentSession.tracks;
    const selectedRegionSet = currentSession.selectedRegionSet;
    const userViewRegion = currentSession.userViewRegion;

    let curViewInterval;
    const genomeConfig = GenomeSerializer.deserialize(_genomeConfig);
    if (userViewRegion) {
      const navContext = genomeConfig.navContext as NavigationContext;
      const parsed = navContext.parse(userViewRegion);
      const { start, end } = parsed;

      curViewInterval = {
        start,
        end,
      };
    } else {
      curViewInterval = genomeConfig.defaultRegion;
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
      viewRegion: userViewRegion,
      viewInterval: curViewInterval,
    };
  }
  //provide data to genomeTracks to new current bundle session
  function onRestoreSession(sessionBundle: any) {
    let newGenomeConfig: GenomeConfig | null = null;
    let coordinate: GenomeCoordinate | null = null;

    if (sessionBundle.chromosomes && sessionBundle.chromosomes.length > 0) {
      const _newGenomeConfig = {
        id: sessionBundle.genomeId,
        name: sessionBundle.genomeId,
        chromosomes: sessionBundle.chromosomes,
        defaultTracks: sessionBundle.tracks.map((item: any) => ({
          ...item,
          waitToUpdate: true,
        })),
      };

      dispatch(addCustomGenomeRemote(_newGenomeConfig));
      newGenomeConfig = GenomeSerializer.deserialize(_newGenomeConfig);
    } else if (getGenomeConfig(sessionBundle.genomeId)) {
      newGenomeConfig = getGenomeConfig(sessionBundle.genomeId);
    } else if (
      sessionBundle.viewRegion &&
      typeof sessionBundle.viewRegion === "object"
    ) {
      newGenomeConfig = getGenomeConfig(
        sessionBundle.viewRegion._navContext._name
      );
    }
    if (
      newGenomeConfig &&
      sessionBundle.viewRegion &&
      typeof sessionBundle.viewRegion === "object"
    ) {
      coordinate = new DisplayedRegionModel(
        newGenomeConfig?.navContext,
        sessionBundle.viewRegion._startBase,
        sessionBundle.viewRegion._endBase
      ).currentRegionAsString() as GenomeCoordinate | null;
    } else if (newGenomeConfig && sessionBundle.viewRegion !== undefined) {
      coordinate = sessionBundle.viewRegion;
    } else if (newGenomeConfig && sessionBundle.viewInterval) {
      coordinate = new DisplayedRegionModel(
        newGenomeConfig?.navContext,
        sessionBundle.viewInterval.start,
        sessionBundle.viewInterval.end
      ).currentRegionAsString() as GenomeCoordinate | null;
    }

    const session = {
      genomeId: newGenomeConfig
        ? newGenomeConfig?.genome.getName()
        : sessionBundle.genomeId
          ? sessionBundle.genomeId
          : null,
      customGenome: sessionBundle.customGenome,
      chromosomes: sessionBundle.chromosomes ? sessionBundle.chromosomes : null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      title: sessionBundle.title ? sessionBundle.title : "Untitled Session",
      viewRegion: coordinate,
      userViewRegion: coordinate,
      tracks: sessionBundle.tracks.map((item: any) => ({
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
    let title = "Untitled Session";
    if (bundle.sessionsInBundle && bundle.sessionsInBundle[`${bundle.currentId}`]) {
      title = bundle.sessionsInBundle[`${bundle.currentId}`].label
    }
    dispatch(updateBundle(bundle));
    dispatch(updateCurrentSession({ bundleId: bundle.bundleId, title }));
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
