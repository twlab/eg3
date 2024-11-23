/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import TrackManager from "./TrackManager";
import Drag from "./TrackComponents/commonComponents/chr-order/ChrOrder";
import { chrType } from "../../localdata/genomename";
import { SelectDemo } from "./tesShadcn";
import { v4 as uuidv4 } from "uuid";
import useResizeObserver from "./TrackComponents/commonComponents/Resize";

import { getGenomeConfig } from "../../models/genomes/allGenomes";
import OpenInterval from "../../models/OpenInterval";
import GenomeNavigator from "./genomeNavigator/GenomeNavigator";
import DisplayedRegionModel from "@/models/DisplayedRegionModel";
import Nav from "./genomeNavigator/Nav";
import querySting from "query-string";
import {
  createNewTrackState,
  TrackState,
} from "./TrackComponents/CommonTrackStateChangeFunctions.tsx/createNewTrackState";
// Import the functions you need from the SDKs you need
import * as firebase from "firebase/app";
import History from "./ToolComponents/History";
import _ from "lodash";
import { FeatureSegment } from "@/models/FeatureSegment";

// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_FIREBASE_KEY,
//   authDomain: import.meta.env.VITE_FIREBASE_DOMAIN,
//   databaseURL: import.meta.env.VITE_FIREBASE_DATABASE,
//   storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
// };
// for testing iam going to setup a test server here
const firebaseConfig = {
  apiKey: "AIzaSyBvzikxx1wSAoVp_4Ra2IlktJFCwq8NAnk",
  authDomain: "chadeg3-83548.firebaseapp.com",
  databaseURL: "https://chadeg3-83548-default-rtdb.firebaseio.com",
  storageBucket: "chadeg3-83548.firebasestorage.app",
};

// Initialize Firebase

firebase.initializeApp(firebaseConfig);

// function writeUserData() {
//   const db = getDatabase();
//   set(ref(db), {
//     "12312432542": "JSON",
//     "657765675756675657": "JSON2",
//   });
//
export const AWS_API = "https://lambda.epigenomegateway.org/v2";

function GenomeHub(props: any) {
  const [stateBrowser, setStateBrowser] = useState<{ [key: string]: any }>({
    future: new Array(),
    past: new Array(),
    index: 0,
    limit: 1,
    present: null,
    group: null,
  });
  const scrollYPos = useRef(0);

  const [items, setItems] = useState(chrType);

  const isInitial = useRef<boolean>(true);
  const [genomeList, setGenomeList] = useState<Array<any>>([]);

  const [resizeRef, size] = useResizeObserver();

  const stateArr = useRef<Array<any>>([]);

  const presentStateIdx = useRef(0);
  const trackModelId = useRef(0);
  const [viewRegion, setViewRegion] = useState<DisplayedRegionModel | null>(
    null
  );
  const [curBundle, setCurBundle] = useState<{ [key: string]: any } | null>();
  const [publicTracksPool, setPublicTracksPool] = useState<Array<any>>([]);
  const [suggestedMetaSets, setSuggestedMetaSets] = useState<any>(new Set());
  const [customTracksPool, setCustomTracksPool] = useState<Array<any>>([]);
  const [selectedSet, setSelectedSet] = useState<any>();
  const [regionSets, setRegionSets] = useState<Array<any>>([]);

  const [showGenNav, setShowGenNav] = useState<boolean>(true);
  const [restoreViewRefresh, setRestoreViewRefresh] = useState<boolean>(true);
  const [legendWidth, setLegendWidth] = useState<number>(120);
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
    // curGenomeConfig["genomeID"] = uuidv4();
    curGenomeConfig["isInitial"] = isInitial.current;
    curGenomeConfig["curState"] = stateArr.current[presentStateIdx.current];
    setGenomeList(new Array<any>(curGenomeConfig));
  }

  function undoRedo(triggerType: string) {
    let prevState = stateArr.current[presentStateIdx.current];
    if (triggerType === "undo" && presentStateIdx.current > 0) {
      presentStateIdx.current--;
    } else if (
      triggerType === "redo" &&
      presentStateIdx.current < stateArr.current.length - 1
    ) {
      presentStateIdx.current++;
    }
    let state = stateArr.current[presentStateIdx.current];
    let curGenomeConfig = getGenomeConfig(state.genomeName);
    curGenomeConfig.navContext = state["viewRegion"]._navContext;
    curGenomeConfig.defaultTracks = state.tracks;
    curGenomeConfig.defaultRegion = new OpenInterval(
      state.viewRegion._startBase,
      state.viewRegion._endBase
    );
    setLegendWidth(state.trackLegendWidth);
    setShowGenNav(state.isShowingNavigator);
    if (
      state.viewRegion._startBase === prevState.viewRegion._startBase &&
      state.viewRegion._endBase === prevState.viewRegion._endBase &&
      arraysHaveSameObjects(prevState.tracks, state.tracks) &&
      prevState.trackLegendWidth === state.trackLegendWidth
    ) {
      return state;
    } else {
      recreateTrackmanager({ genomeConfig: curGenomeConfig });
    }
  }

  function changeChrOrder(chrArr: any) {
    let newList = { ...genomeList[0] };
    newList.chrOrder = chrArr;
    setItems([...chrArr]);
    setGenomeList([...newList]);
    const serializedArray = JSON.stringify(chrArr);
    sessionStorage.setItem("chrOrder", serializedArray);
  }

  function objectExistsInArray(arr: any, obj: any): boolean {
    return arr.some((item) => item.id === obj.id);
  }

  function arraysHaveSameObjects(array1: any, array2: any): boolean {
    for (const obj of array1) {
      if (!objectExistsInArray(array2, obj)) {
        return false;
      }
    }

    for (const obj of array2) {
      if (!objectExistsInArray(array1, obj)) {
        return false;
      }
    }

    return true;
  }

  function getSelectedGenome(windowWidth: number) {
    if (props.selectedGenome.length > 0) {
      let tempGeneArr: Array<any> = props.selectedGenome.map(
        (genome, index) => {
          genome["genomeID"] = uuidv4();
          genome["windowWidth"] = windowWidth;
          return genome;
        }
      );
      const serializedArray = JSON.stringify(props.selectedGenome);
      sessionStorage.setItem("myArray", serializedArray);
      setGenomeList(tempGeneArr);
    }
  }

  function onTracksAdded(trackModels: any) {
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

  function genomeNavigatorRegionSelect(startbase, endbase, isHighlight) {
    let newStateObj = createNewTrackState(
      stateArr.current[presentStateIdx.current],
      {
        viewRegion: new DisplayedRegionModel(
          genomeList[0].navContext,
          startbase,
          endbase
        ),
        highlights: isHighlight
          ? [
              {
                start: startbase,
                end: endbase,
                display: true,
                color: "rgba(0, 123, 255, 0.15)",
                tag: "",
              },
            ]
          : undefined,
      }
    );
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

  function onGenomeSelected(name: any) {
    let curGenomeConfig = getGenomeConfig(name);
    curGenomeConfig.defaultTracks.map((item, index) => {
      item.id = trackModelId.current;
      trackModelId.current++;
    });
    curGenomeConfig["genomeID"] = genomeList[0]["genomeID"];
    let newTrackState = {
      bundleId: "",
      customTracksPool: [],
      darkTheme: false,
      genomeName: curGenomeConfig.genome.getName(),
      highlights: [],
      isShowingNavigator: true,
      layout: {
        global: {},
        layout: {},
        borders: [],
      },
      metadataTerms: [],
      regionSetView: null,
      regionSets: [],
      viewRegion: new DisplayedRegionModel(
        curGenomeConfig.navContext,
        curGenomeConfig.defaultRegion.start,
        curGenomeConfig.defaultRegion.end
      ),
      trackLegendWidth: 120,
      tracks: curGenomeConfig.defaultTracks,
    };

    setLegendWidth(120);
    setShowGenNav(true);
    addGlobalState(newTrackState);

    recreateTrackmanager({ genomeConfig: curGenomeConfig });
  }

  function jumpToState(actionType, index = 0) {
    let curPresentIdx = 0;
    if (actionType === "clear") {
      stateArr.current = new Array();
      presentStateIdx.current = 0;

      return;
    } else if (actionType === "past") {
      curPresentIdx = index;
    } else if (actionType === "future") {
      curPresentIdx = index + presentStateIdx.current + 1;
    }
    presentStateIdx.current = curPresentIdx;
    let state = stateArr.current[presentStateIdx.current];
    let curGenomeConfig = getGenomeConfig(state.genomeName);
    curGenomeConfig.navContext = state["viewRegion"]._navContext;
    curGenomeConfig.defaultTracks = state.tracks;
    curGenomeConfig.defaultRegion = new OpenInterval(
      state.viewRegion._startBase,
      state.viewRegion._endBase
    );
    setLegendWidth(state.trackLegendWidth);
    setShowGenNav(state.isShowingNavigator);
    recreateTrackmanager({ genomeConfig: curGenomeConfig });
  }

  //Control and manage the state of user's sessions
  //_________________________________________________________________________________________________________________________
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

  //Control and manage the state of Hub and facet table
  //_________________________________________________________________________________________________________________________
  function onHubUpdated(addedPublicTrackPool, trackModels, poolType) {
    if (poolType === "public") {
      setPublicTracksPool([...publicTracksPool, ...trackModels]);
    } else {
      setCustomTracksPool([...customTracksPool, ...trackModels]);
    }
  }
  function addTermToMetaSets(term) {
    const toBeAdded = Array.isArray(term) ? term : [term];
    setSuggestedMetaSets(new Set([...suggestedMetaSets, ...toBeAdded]));
  }

  function initializeMetaSets(tracks: any[]) {
    const allKeys = tracks.map((track) => Object.keys(track.metadata));
    const metaKeys = _.union(...allKeys);
    addTermToMetaSets(metaKeys);
  }
  //Control and manage the state RegionSetSelect, gene plot, scatter plot
  //_________________________________________________________________________________________________________________________
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
  //Control and manage the state of genomeNavigator, restoreview, and legend Width
  //_________________________________________________________________________________________________________________________
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
  useEffect(() => {
    if (size.width > 0) {
      let curGenome;
      if (props.selectedGenome.length > 0) {
        curGenome = getGenomeConfig(props.name);
      } else {
        curGenome = getGenomeConfig("hg38");
      }

      curGenome["windowWidth"] = size.width;
      curGenome["isInitial"] = isInitial.current;
      if (!isInitial.current) {
        curGenome["curState"] = stateArr.current[presentStateIdx.current];
      } else {
        curGenome["genomeID"] = uuidv4();
        const { query } = querySting.parseUrl(window.location.href);

        let bundleId = uuidv4();

        setCurBundle({
          bundleId: bundleId,
          currentId: "",
          sessionsInBundle: {},
        });
        curGenome["bundleId"] = bundleId;
        curGenome.defaultTracks.map((trackModel) => {
          trackModel.id = trackModelId.current;
          trackModelId.current++;
        });

        initializeMetaSets(curGenome.defaultTracks);
      }
      setGenomeList([curGenome]);
      isInitial.current = false;
    }
  }, [size.width]);
  return (
    <div style={{ paddingLeft: "1%", paddingRight: "1%" }}>
      <div ref={resizeRef as React.RefObject<HTMLDivElement>}>
        {size.width > 0
          ? genomeList.map((item, index) => {
              return (
                <div
                  key={index}
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  {viewRegion ? (
                    <Nav
                      isShowingNavigator={showGenNav}
                      selectedRegion={viewRegion}
                      genomeConfig={genomeList[index]}
                      trackLegendWidth={legendWidth}
                      onRegionSelected={genomeNavigatorRegionSelect}
                      onGenomeSelected={onGenomeSelected}
                      state={stateArr.current[presentStateIdx.current]}
                      onTracksAdded={onTracksAdded}
                      addSessionState={addSessionState}
                      onRetrieveBundle={onRetrieveBundle}
                      onRestoreSession={onRestoreSession}
                      curBundle={curBundle}
                      onHubUpdated={onHubUpdated}
                      publicTracksPool={publicTracksPool}
                      customTracksPool={customTracksPool}
                      addTermToMetaSets={addTermToMetaSets}
                      onSetsChanged={onSetsChanged}
                      onSetSelected={onSetsSelected}
                      onTabSettingsChange={onTabSettingsChange}
                      sets={regionSets}
                      selectedSet={selectedSet}
                    />
                  ) : (
                    ""
                  )}
                  {viewRegion && showGenNav ? (
                    <GenomeNavigator
                      selectedRegion={viewRegion}
                      genomeConfig={genomeList[index]}
                      windowWidth={size.width}
                      onRegionSelected={genomeNavigatorRegionSelect}
                    />
                  ) : (
                    ""
                  )}

                  <TrackManager
                    key={item.genomeID}
                    legendWidth={legendWidth}
                    genomeIdx={index}
                    recreateTrackmanager={recreateTrackmanager}
                    genomeArr={genomeList}
                    windowWidth={size.width - legendWidth}
                    addGlobalState={addGlobalState}
                    undoRedo={undoRedo}
                    jumpToState={jumpToState}
                    stateArr={stateArr.current}
                    presentStateIdx={presentStateIdx.current}
                  />
                </div>
              );
            })
          : ""}
      </div>
    </div>
  );
}

export default GenomeHub;
