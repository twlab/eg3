/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import TrackManager from "./TrackManager";
import Drag from "./commonComponents/chr-order/ChrOrder";
import { chrType } from "../../localdata/genomename";
import { SelectDemo } from "./tesShadcn";
import { v4 as uuidv4 } from "uuid";
import useResizeObserver from "./commonComponents/Resize";

import { getGenomeConfig } from "../../models/genomes/allGenomes";
import OpenInterval from "../../models/OpenInterval";
import GenomeNavigator from "./genomeNavigator/GenomeNavigator";
import DisplayedRegionModel from "@/models/DisplayedRegionModel";
import Nav from "./genomeNavigator/Nav";
import {
  createNewTrackState,
  TrackState,
} from "./CommonTrackStateChangeFunctions.tsx/createNewTrackState";
// Import the functions you need from the SDKs you need
import * as firebase from "firebase/app";
import History from "./ToolsComponents/History";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
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

  function addGlobalState(data: any) {
    if (presentStateIdx.current !== stateArr.current.length - 1) {
      stateArr.current.splice(presentStateIdx.current + 1);
    } else if (stateArr.current.length >= 20) {
      stateArr.current.shift();
    }

    stateArr.current.push(data);
    presentStateIdx.current = stateArr.current.length - 1;

    console.log(stateArr.current);
    setViewRegion(data.viewRegion);
  }

  function recreateTrackmanager(trackConfig: { [key: string]: any }) {
    let curGenomeConfig = trackConfig.genomeConfig;
    curGenomeConfig["genomeID"] = uuidv4();
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
    curGenomeConfig.defaultTracks = state.tracks;
    curGenomeConfig.defaultRegion = new OpenInterval(
      state.viewRegion._startBase,
      state.viewRegion._endBase
    );
    if (
      state.viewRegion._startBase === prevState.viewRegion._startBase &&
      state.viewRegion._endBase === prevState.viewRegion._endBase &&
      arraysHaveSameObjects(prevState.tracks, state.tracks)
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

  function onTracksAdded(trackModel: any) {
    trackModel.genomeName =
      stateArr.current[presentStateIdx.current].genomeName;

    let newStateObj = createNewTrackState(
      stateArr.current[presentStateIdx.current],
      {}
    );
    trackModel.id = trackModelId.current;
    trackModelId.current++;
    newStateObj.tracks.push(trackModel);
    addGlobalState(newStateObj);
    let state = stateArr.current[presentStateIdx.current];
    let curGenomeConfig = getGenomeConfig(state.genomeName);
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
    let newTrackState = {
      bundleId: "",
      customTracksPool: [],
      darkTheme: false,
      genomeName: curGenomeConfig.genome.getName(),
      highlights: [
        /* HighlightInterval objects */
      ],
      isShowingNavigator: true,
      layout: {
        global: {}, // Populate based on your need
        layout: {}, // Populate based on your need
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
    curGenomeConfig.defaultTracks = state.tracks;
    curGenomeConfig.defaultRegion = new OpenInterval(
      state.viewRegion._startBase,
      state.viewRegion._endBase
    );
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

    curGenomeConfig.defaultTracks = state.tracks;
    curGenomeConfig.defaultRegion = new OpenInterval(
      state.viewRegion._startBase!,
      state.viewRegion._endBase!
    );
    addGlobalState(state);

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

  useEffect(() => {
    if (size.width !== 0) {
      let curGenome = getGenomeConfig("hg38");
      curGenome["genomeID"] = uuidv4();
      curGenome["windowWidth"] = size.width;
      curGenome["isInitial"] = isInitial.current;
      if (!isInitial.current) {
        curGenome["curState"] = stateArr.current[presentStateIdx.current];
      }
      if (isInitial.current) {
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
      }
      setGenomeList([curGenome]);
      isInitial.current = false;
    }
  }, [size.width]);
  return (
    <div style={{}}>
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
                      selectedRegion={viewRegion}
                      genomeConfig={genomeList[index]}
                      trackLegendWidth={size.width}
                      onRegionSelected={genomeNavigatorRegionSelect}
                      onGenomeSelected={onGenomeSelected}
                      state={stateArr.current[presentStateIdx.current]}
                      onTracksAdded={onTracksAdded}
                      addSessionState={addSessionState}
                      onRetrieveBundle={onRetrieveBundle}
                      onRestoreSession={onRestoreSession}
                      curBundle={curBundle}
                    />
                  ) : (
                    <div>hii2</div>
                  )}
                  {viewRegion ? (
                    <GenomeNavigator
                      selectedRegion={viewRegion}
                      genomeConfig={genomeList[index]}
                      windowWidth={size.width}
                      onRegionSelected={genomeNavigatorRegionSelect}
                    />
                  ) : (
                    <div>hii</div>
                  )}
                  <History
                    state={{
                      past: stateArr.current.slice(
                        0,
                        presentStateIdx.current + 1
                      ),
                      future: stateArr.current.slice(
                        presentStateIdx.current + 1
                      ),
                    }}
                    jumpToPast={jumpToState}
                    jumpToFuture={jumpToState}
                    clearHistory={jumpToState}
                  />
                  <TrackManager
                    key={item.genomeID}
                    genomeIdx={index}
                    recreateTrackmanager={recreateTrackmanager}
                    genomeArr={genomeList}
                    windowWidth={size.width - 120}
                    addGlobalState={addGlobalState}
                    undoRedo={undoRedo}
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
