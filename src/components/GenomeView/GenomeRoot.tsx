import DisplayedRegionModel from "@/models/DisplayedRegionModel";
import { FeatureSegment } from "@/models/FeatureSegment";
import _ from "lodash";

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { useGenome } from "../../lib/contexts/GenomeContext";
import { chrType } from "../../localdata/genomename";
import { getGenomeConfig } from "../../models/genomes/allGenomes";
import OpenInterval from "../../models/OpenInterval";
import GenomeNavigator from "./genomeNavigator/GenomeNavigator";
import Nav from "./genomeNavigator/Nav";
import { SelectDemo } from "./tesShadcn";
// Import the functions you need from the SDKs you need
import History from "./ToolComponents/History";
import Drag from "./TrackComponents/commonComponents/chr-order/ChrOrder";
import useResizeObserver from "./TrackComponents/commonComponents/Resize";
import { createNewTrackState } from "./TrackComponents/CommonTrackStateChangeFunctions.tsx/createNewTrackState";
import TrackManager from "./TrackManager";

export const AWS_API = "https://lambda.epigenomegateway.org/v2";

function GenomeHub() {
  const {
    addGlobalState,
    genomeList,
    setGenomeList,
    viewRegion,
    showGenNav,
    setShowGenNav,
    legendWidth,
    setLegendWidth,
    publicTracksPool,
    setPublicTracksPool,
    customTracksPool,
    setCustomTracksPool,
    suggestedMetaSets,
    setSuggestedMetaSets,
    selectedSet,
    setSelectedSet,
    regionSets,
    setRegionSets,
    setCurBundle,
    onTracksLoaded,
    setItems,
    stateArr,
    presentStateIdx,
    trackModelId,
    isInitial,
    selectedGenome,
    genomeConfigInHub,
    recreateTrackmanager,
    setViewRegion,
  } = useGenome();
  const debounceTimeout = useRef<any>(null);

  const [resizeRef, size] = useResizeObserver();
  const [restoreViewRefresh, setRestoreViewRefresh] = useState<boolean>(true);

  // function addGlobalState(data: any) {
  //   if (presentStateIdx.current !== stateArr.current.length - 1) {
  //     stateArr.current.splice(presentStateIdx.current + 1);
  //   } else if (stateArr.current.length >= 20) {
  //     stateArr.current.shift();
  //   }

  //   stateArr.current.push(data);
  //   presentStateIdx.current = stateArr.current.length - 1;

  // }

  function undoRedo(triggerType: string) {
    let prevState = stateArr.current[presentStateIdx.current];
    if (triggerType === "undo" && presentStateIdx.current > 0) {
      presentStateIdx.current--;
    } else if (
      triggerType === "redo" &&
      presentStateIdx.current < stateArr.current.length - 1
    ) {
      presentStateIdx.current++;
    } else {
      return;
    }
    let state = stateArr.current[presentStateIdx.current];
    let curGenomeConfig;

    if (state.genomeName !== genomeConfigInHub.current.genome._name) {
      curGenomeConfig = getGenomeConfig(state.genomeName);
      curGenomeConfig["genomeID"] = genomeConfigInHub.current.genomeID;
      isInitial.current = true;
      genomeConfigInHub.current = curGenomeConfig;
    } else {
      curGenomeConfig = genomeConfigInHub.current;
    }

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
    let curGenomeConfig = genomeConfigInHub.current;
    curGenomeConfig.navContext = state["viewRegion"]._navContext;
    curGenomeConfig.defaultTracks = state.tracks;
    curGenomeConfig.defaultRegion = new OpenInterval(
      state.viewRegion._startBase,
      state.viewRegion._endBase
    );
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
    let curGenomeConfig = genomeConfigInHub.current;
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

  //Control and manage the state of Hub and facet table
  //_________________________________________________________________________________________________________________________
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

  //Control and manage the state of genomeNavigator, restoreview, and legend Width
  //_________________________________________________________________________________________________________________________

  useEffect(() => {
    if (size.width > 0) {
      debounceTimeout.current = setTimeout(() => {
        let curGenome;
        if (selectedGenome.length > 0) {
          genomeConfigInHub.current = selectedGenome[0];
        } else {
          genomeConfigInHub.current = getGenomeConfig("hg38");
        }
        curGenome = genomeConfigInHub.current;
        curGenome["isInitial"] = isInitial.current;
        console.log(genomeConfigInHub.current, selectedGenome);
        if (!isInitial.current) {
          curGenome["curState"] = stateArr.current[presentStateIdx.current];
          curGenome.defaultRegion = new OpenInterval(
            curGenome["curState"].viewRegion._startBase,
            curGenome["curState"].viewRegion._endBase
          );
          curGenome["sizeChange"] = true;
        } else {
          curGenome["genomeID"] = uuidv4();
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
      }, 300);
    }
  }, [size.width, selectedGenome]);

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
                  {viewRegion && showGenNav && selectedGenome.length > 0 ? (
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
                    onTracksLoaded={onTracksLoaded}
                    selectedRegion={viewRegion}
                  />
                </div>
              );
            })
          : null}
      </div>
    </div>
  );
}

export default GenomeHub;
