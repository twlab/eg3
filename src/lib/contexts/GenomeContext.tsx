import {
  createNewTrackState,
  TrackState,
} from "@/components/GenomeView/TrackComponents/CommonTrackStateChangeFunctions.tsx/createNewTrackState";
import OpenInterval from "@/models/OpenInterval";
import { getSecondaryGenomes } from "@/models/util";
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import _ from "lodash";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useRef, useState } from "react";

import { chrType } from "../../localdata/genomename";
import { treeOfLifeObj } from "../../localdata/treeoflife";
import DisplayedRegionModel from "../../models/DisplayedRegionModel";
import {
  genomeNameToConfig,
  getGenomeConfig,
} from "../../models/genomes/allGenomes";

function useGenomeState(isLocal = 1) {
  const [selectedGenome, setSelectedGenome] = useState<Array<any>>([]);
  const [allGenome, setAllGenome] = useState<{ [key: string]: any }>({});
  const [treeOfLife, setTreeOfLife] = useState<{ [key: string]: any }>({});
  const [currSelectGenome, setCurrSelectGenome] = useState({});
  const [loading, setLoading] = useState<boolean>(true);
  const [genomeList, setGenomeList] = useState<Array<any>>([]);
  const [items, setItems] = useState(chrType);
  const [viewRegion, setViewRegion] = useState<DisplayedRegionModel | null>(
    null
  );

  const [screenshotData, setScreenshotData] = useState<{ [key: string]: any }>(
    {}
  );
  const [screenshotOpen, setScreenshotOpen] = useState<boolean>(false);
  const [showGenNav, setShowGenNav] = useState<boolean>(true);
  const [legendWidth, setLegendWidth] = useState<number>(120);
  const [restoreViewRefresh, setRestoreViewRefresh] = useState<boolean>(true);
  const [publicTracksPool, setPublicTracksPool] = useState<Array<any>>([]);
  const [customTracksPool, setCustomTracksPool] = useState<Array<any>>([]);
  const [suggestedMetaSets, setSuggestedMetaSets] = useState<any>(new Set());
  const [selectedSet, setSelectedSet] = useState<any>();
  const [regionSets, setRegionSets] = useState<Array<any>>([]);
  const [curBundle, setCurBundle] = useState<{ [key: string]: any } | null>();

  const isInitial = useRef<boolean>(true);
  const stateArr = useRef<Array<any>>([]);
  const presentStateIdx = useRef(0);
  const trackModelId = useRef(0);

  async function fetchGenomeData(s3Config?: S3Client) {
    let tempTree: { [key: string]: any } = {};
    let tempObj: { [key: string]: any } = {};

    for (const key in treeOfLifeObj) {
      tempTree[key] = {
        assemblies: [...treeOfLifeObj[key].assemblies],
        color: treeOfLifeObj[key].color,
        logoUrl: treeOfLifeObj[key].logoUrl,
      };
    }

    if (!isLocal) {
      if (!s3Config) {
        s3Config = new S3Client({
          region: "abc",
          credentials: {
            accessKeyId: "123",
            secretAccessKey: "123",
          },
        });
      }

      var command = new ListObjectsV2Command({
        Bucket: "GenomeViews",
        StartAfter: "/",
        MaxKeys: 1000,
      });

      var isTruncated = true;

      while (isTruncated) {
        var { Contents, IsTruncated, NextContinuationToken } =
          await s3Config.send(command);
        for (var i = 0; i < Contents!.length; i++) {
          var arrStr = Contents![i].Key?.split(/[//]/);
          if (!tempObj[arrStr![1]] && arrStr![1] !== "") {
            var awsApiPathUrl = "/" + arrStr![0] + "/" + arrStr![1] + "/";
            tempTree[arrStr![0]]["assemblies"].push(arrStr![1]);
            tempObj[arrStr![1]] = {
              name: arrStr![1],
              species: arrStr![0],
              cytoBandUrl: awsApiPathUrl + "cytoBand.json",
              annotationUrl: awsApiPathUrl + "annotationTracks.json",
              genomeDataUrl: awsApiPathUrl + arrStr![1] + ".json",
            };
          }
        }
        const updatedData = {
          ...genomeNameToConfig,
        };
        const updatedTree = {
          ...treeOfLife,
          ...tempTree,
        };
        setTreeOfLife(updatedTree);
        setAllGenome(updatedData);
        isTruncated = IsTruncated!;
        command.input.ContinuationToken = NextContinuationToken;
      }
    } else {
      const updatedData = {
        ...genomeNameToConfig,
      };
      const updatedTree = {
        ...treeOfLife,
        ...tempTree,
      };
      setTreeOfLife(updatedTree);
      setAllGenome(updatedData);
    }
  }

  function addGenomeView(obj: any) {
    sessionStorage.clear();

    if (
      !currSelectGenome[obj.genome.getName() as keyof typeof currSelectGenome]
    ) {
      if (selectedGenome.length < 1) {
        setSelectedGenome((prevList: any) => [...prevList, obj]);
      }
      let newObj: { [key: string]: any } = currSelectGenome;
      newObj[obj.name as keyof typeof newObj] = " ";
      setCurrSelectGenome(newObj);
    }
  }

  useEffect(() => {
    fetchGenomeData();
  }, []);

  function addGlobalState(data: any) {
    if (presentStateIdx.current !== stateArr.current.length - 1) {
      stateArr.current.splice(presentStateIdx.current + 1);
    } else if (stateArr.current.length >= 20) {
      stateArr.current.shift();
    }

    stateArr.current.push(data);
    presentStateIdx.current = stateArr.current.length - 1;

    setViewRegion(data.viewRegion);
  }

  function recreateTrackmanager(trackConfig: { [key: string]: any }) {
    let curGenomeConfig = trackConfig.genomeConfig;
    curGenomeConfig["isInitial"] = isInitial.current;
    curGenomeConfig["sizeChange"] = true;
    curGenomeConfig["curState"] = stateArr.current[presentStateIdx.current];
    setGenomeList(new Array<any>(curGenomeConfig));
  }

  // MARK: - Computed

  const state = stateArr.current[presentStateIdx.current];

  const genomeConfig = useMemo(() => genomeList[0], [genomeList]);

  const secondaryGenomes = useMemo(() => {
    if (!state || !genomeConfig || !state.tracks) return [];

    const secondaryGenomes = getSecondaryGenomes(
      genomeConfig.genome.getName(),
      state.tracks
    );
    return secondaryGenomes.map((g) => getGenomeConfig(g));
  }, [state && state.tracks, genomeConfig]);

  // MARK: - Actions

  function onTracksAdded(trackModels: any) {
    console.log(trackModels);
    let newStateObj = createNewTrackState(
      stateArr.current[presentStateIdx.current],
      {}
    );

    for (let trackModel of trackModels) {
      trackModel.genomeName =
        stateArr.current[presentStateIdx.current].genomeName;
      trackModel.id = trackModelId.current;
      trackModelId.current++;
      newStateObj.tracks.push(trackModel);
    }

    addGlobalState(newStateObj);
    let state = stateArr.current[presentStateIdx.current];
    let curGenomeConfig = getGenomeConfig(state.genomeName);
    curGenomeConfig.navContext = state["viewRegion"]._navContext;
    curGenomeConfig.defaultTracks = state.tracks;
    curGenomeConfig.defaultRegion = new OpenInterval(
      state.viewRegion._startBase,
      state.viewRegion._endBase
    );
    recreateTrackmanager({ genomeConfig: curGenomeConfig });
  }

  const addTermToMetaSets = useCallback((term: string) => {
    setSuggestedMetaSets((prev) => {
      const newSet = new Set(prev);
      newSet.add(term);
      return newSet;
    });
  }, []);

  const onHubUpdated = useCallback(
    (hubs: any[], publicTracks: any[], type: string) => {
      if (type === "public") {
        setPublicTracksPool(publicTracks);
      } else {
        setCustomTracksPool(publicTracks);
      }
    },
    []
  );

  function onSetsChanged(sets) {
    let state = createNewTrackState(
      stateArr.current[presentStateIdx.current],
      {}
    );
    state["regionSetView"] = selectedSet;
    state["regionSet"] = sets;
    state["viewRegion"] = new DisplayedRegionModel(sets[0].makeNavContext());

    addGlobalState(state);
    setRegionSets([...regionSets, ...sets]);
  }

  function onSetsSelected(sets) {
    setSelectedSet(sets);

    let state = createNewTrackState(
      stateArr.current[presentStateIdx.current],
      {}
    );
    state["regionSetView"] = selectedSet;
    state["regionSet"] = sets;
    state["viewRegion"] = new DisplayedRegionModel(sets.makeNavContext());

    addGlobalState(state);

    let curGenomeConfig = getGenomeConfig(state.genomeName);
    curGenomeConfig.navContext = state["viewRegion"]._navContext;

    curGenomeConfig.defaultTracks = state.tracks;
    curGenomeConfig.defaultRegion = new OpenInterval(
      state.viewRegion._startBase!,
      state.viewRegion._endBase!
    );
    curGenomeConfig["regionSetView"] = [sets];

    recreateTrackmanager({ genomeConfig: curGenomeConfig });
  }

  function onTabSettingsChange(setting: { [key: string]: any }) {
    let state = createNewTrackState(
      stateArr.current[presentStateIdx.current],
      {}
    );
    if (setting.type === "switchNavigator") {
      setShowGenNav(setting.val);
      state.isShowingNavigator = setting.val;
      addGlobalState(state);
    } else if (setting.type === "cacheToggle") {
      setRestoreViewRefresh(setting.val);
    } else if (setting.type === "legendWidth") {
      state.trackLegendWidth = setting.val;

      addGlobalState(state);

      let curGenomeConfig = getGenomeConfig(state.genomeName);
      curGenomeConfig.navContext = state["viewRegion"]._navContext;

      curGenomeConfig.defaultTracks = state.tracks;
      curGenomeConfig.defaultRegion = new OpenInterval(
        state.viewRegion._startBase!,
        state.viewRegion._endBase!
      );

      setLegendWidth(setting.val);
      recreateTrackmanager({ genomeConfig: curGenomeConfig });
    }
  }

  function addSessionState(bundle) {
    setCurBundle(bundle);
  }
  function onRestoreSession(bundle) {
    let state: TrackState = createNewTrackState(
      bundle.sessionsInBundle[`${bundle.currentId}`].state,
      {}
    );
    state.tracks.map((trackModel) => {
      trackModel.id = trackModelId.current;
      trackModelId.current++;
    });
    let curGenomeConfig = getGenomeConfig(state.genomeName);

    curGenomeConfig.navContext = state["viewRegion"]._navContext;
    curGenomeConfig.defaultTracks = state.tracks;
    curGenomeConfig.defaultRegion = new OpenInterval(
      state.viewRegion._startBase!,
      state.viewRegion._endBase!
    );
    addGlobalState(state);
    setLegendWidth(state.trackLegendWidth);
    setShowGenNav(state.isShowingNavigator);
    recreateTrackmanager({ genomeConfig: curGenomeConfig });

    setCurBundle(bundle);
  }

  function onRetrieveBundle(bundle) {
    bundle.currentId = "none";
    setCurBundle(bundle);
    let newState = createNewTrackState(
      stateArr.current[presentStateIdx.current],
      {}
    );
    newState.bundleId = bundle.bundleId;
    addGlobalState(newState);
  }

  function onTracksLoaded(isLoading: boolean) {
    console.log(isLoading);
    setLoading(isLoading);
  }

  // MARK: - Return

  return {
    screenshotOpen,
    selectedGenome,
    allGenome,
    treeOfLife,
    genomeList,
    viewRegion,
    showGenNav,
    legendWidth,
    publicTracksPool,
    customTracksPool,
    suggestedMetaSets,
    selectedSet,
    regionSets,
    curBundle,
    items,
    onTracksLoaded,
    fetchGenomeData,
    addGenomeView,
    addGlobalState,
    recreateTrackmanager,
    setGenomeList,
    setShowGenNav,
    setLegendWidth,
    setPublicTracksPool,
    setCustomTracksPool,
    setSuggestedMetaSets,
    setSelectedSet,
    setRegionSets,
    setCurBundle,
    setItems,
    setViewRegion,
    setLoading,
    stateArr,
    presentStateIdx,
    trackModelId,
    isInitial,

    state,
    genomeConfig,
    secondaryGenomes,
    onTracksAdded,
    addTermToMetaSets,
    onHubUpdated,
    onSetsChanged,
    onSetsSelected,
    onTabSettingsChange,
    onRestoreSession,
    onRetrieveBundle,
    addSessionState,
    setScreenshotOpen,
    setScreenshotData,
    screenshotData,
  };
}

const GenomeContext = createContext<
  ReturnType<typeof useGenomeState> | undefined
>(undefined);

export function GenomeProvider({
  children,
  isLocal = 1,
}: {
  children: ReactNode;
  isLocal?: number;
}) {
  const genomeState = useGenomeState(isLocal);

  return (
    <GenomeContext.Provider value={genomeState}>
      {children}
    </GenomeContext.Provider>
  );
}

export function useGenome() {
  const context = useContext(GenomeContext);
  if (context === undefined) {
    throw new Error("useGenome must be used within a GenomeProvider");
  }
  return context;
}
