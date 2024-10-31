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
import { createNewTrackState } from "./CommonTrackStateChangeFunctions.tsx/createNewTrackState";
// Import the functions you need from the SDKs you need
import * as firebase from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
  //data that changes the page based on the global state and what the user
  // interactions with
  const curTestId = useRef(0);
  const stateArr = useRef<Array<any>>([]);
  const presentStateIdx = useRef(0);
  const trackModelId = useRef(0);
  const [viewRegion, setViewRegion] = useState<DisplayedRegionModel | null>(
    null
  );
  function addSessionState(data: any) {
    // Check if stateArr.current has reached the maximum length
    if (presentStateIdx.current !== stateArr.current.length - 1) {
      // Remove all values higher than the presentIndex
      stateArr.current.splice(presentStateIdx.current + 1);
    } else if (stateArr.current.length >= 20) {
      stateArr.current.shift();
    }
    stateArr.current.push(data);
    // Update the presentStateIdx to point to the latest entry
    presentStateIdx.current = stateArr.current.length - 1;

    setViewRegion(data.viewRegion);

    console.log(stateArr.current, presentStateIdx.current);
  }

  function addTrack(curGen: any) {
    curGen.genome.defaultRegion = curGen.region;
    curGen.genome.defaultTracks = [
      ...curGen.genome.defaultTracks,
      {
        name: "bigWig",
        genome: "hg19",
        url: "https://vizhub.wustl.edu/hubSample/hg19/GSM429321.bigWig",
      },
    ];
    let newList = curGen.genome;

    const serializedArray = JSON.stringify(newList);

    sessionStorage.setItem("myArray", serializedArray);

    setGenomeList(new Array<any>(newList));
  }

  function recreateTrackmanager(trackConfig: { [key: string]: any }) {
    let curGenomeConfig = trackConfig.genomeConfig;
    // setRegion(tmpObj);
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
          // need to account for when chr changes order so we can change the nav coord order and change featureStart so everything is still in order
          // (genome["chrOrder"] = items);

          return genome;
        }
      );
      const serializedArray = JSON.stringify(props.selectedGenome);
      sessionStorage.setItem("myArray", serializedArray);

      setGenomeList(tempGeneArr);
    }
  }
  function onTracksAdded(trackModel: any) {
    let newStateObj = createNewTrackState(
      stateArr.current[presentStateIdx.current],
      {}
    );
    trackModel.id = trackModelId.current;
    trackModelId.current++;
    newStateObj.tracks.push(trackModel);

    addSessionState(newStateObj);
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
    addSessionState(newStateObj);
    let state = stateArr.current[presentStateIdx.current];
    let curGenomeConfig = getGenomeConfig(state.genomeName);

    curGenomeConfig.defaultTracks = state.tracks;
    curGenomeConfig.defaultRegion = new OpenInterval(
      state.viewRegion._startBase,
      state.viewRegion._endBase
    );

    recreateTrackmanager({ genomeConfig: curGenomeConfig });
  }
  function onGenomeSelected() {
    console.log("ASDADAS");
  }

  useEffect(() => {
    if (size.width !== 0) {
      // getSession("958ffc3f-d543-4a4f-99e5-273ef5778276");
      let curGenome = getGenomeConfig("hg38");
      curGenome["genomeID"] = uuidv4();

      curGenome["windowWidth"] = size.width;
      curGenome["isInitial"] = isInitial.current;

      if (!isInitial.current) {
        curGenome["curState"] = stateArr.current[presentStateIdx.current];
      }
      if (isInitial.current) {
        curGenome.defaultTracks.map((trackModel) => {
          trackModel.id = trackModelId.current;
          trackModelId.current++;
        });
      }
      setGenomeList([curGenome]);
      isInitial.current = false;
    }
  }, [size.width]);
  // useEffect(() => {
  //   if (!isInitial) {
  //     window.scrollTo({ top: scrollYPos.current, behavior: "smooth" });
  //   }
  // }, [isInitial, size.height]);

  return (
    <div
      style={{
        paddingLeft: "1%",
        paddingRight: "1%",
      }}
    >
      <div ref={resizeRef as React.RefObject<HTMLDivElement>}>
        {/* <div style={{ display: "flex" }}>
        <Drag items={items} changeChrOrder={changeChrOrder} />
      </div> */}

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
                      tracks={stateArr.current[presentStateIdx.current].tracks}
                      onTracksAdded={onTracksAdded}
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

                  <TrackManager
                    key={item.genomeID}
                    genomeIdx={index}
                    addTrack={addTrack}
                    recreateTrackmanager={recreateTrackmanager}
                    genomeArr={genomeList}
                    windowWidth={size.width - 120}
                    addSessionState={addSessionState}
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
