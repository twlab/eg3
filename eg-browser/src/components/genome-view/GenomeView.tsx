import { useAppSelector } from "@/lib/redux/hooks";
import { selectCurrentSession } from "@/lib/redux/slices/browserSlice";
import { ITrackContainerState, TrackContainer } from "@eg/tracks";

import BrowserPlaceholder from "../../assets/browser-placeholder.jpg";
import { GenomeState } from "../../lib/redux/slices/genomeSlice";
import TrackModel from "@eg/core/src/eg-lib/models/TrackModel";
import { useEffect, useRef, useState } from "react";
import DisplayedRegionModel from "@eg/core/src/eg-lib/models/DisplayedRegionModel";

export default function GenomeView() {
  const [genomeConfig, setGenomeConfig] = useState<any>(null);
  const [tracks, setTracks] = useState<Array<TrackModel>>([]);
  const [viewRegion, setViewRegion] = useState<any>();
  const trackModelId = useRef(0);
  const addedTracks = useRef<Array<TrackModel>>([]);
  const debounceTimeout = useRef<any>(null);
  const [highlights, setHighLights] = useState<Array<any>>([
    // {
    //   start: 1259080171,
    //   end: 1259290270,
    //   color: "rgba(0, 123, 255, 0.15)",
    //   display: true,
    //   tag: "",
    // },
    // {
    //   start: 1259215544,
    //   end: 1259335756,
    //   color: "rgba(0, 123, 255, 0.15)",
    //   display: true,
    //   tag: "",
    // },
    // {
    //   start: 1259123220,
    //   end: 1259227457,
    //   color: "rgba(0, 123, 255, 0.15)",
    //   display: true,
    //   tag: "",
    // },
    // {
    //   start: 1259217981,
    //   end: 1259289458,
    //   color: "rgba(0, 123, 255, 0.15)",
    //   display: true,
    //   tag: "",
    // },
  ]);
  const [userViewRegion, setUserViewRegion] = useState<any>();
  const currentSession = useAppSelector(selectCurrentSession);
  function onNewRegionSelect(startbase: number, endbase: number) {
    setViewRegion(
      new DisplayedRegionModel(genomeConfig.navContext, startbase, endbase)
    );
    setUserViewRegion(
      new DisplayedRegionModel(genomeConfig.navContext, startbase, endbase)
    );
  }
  function onNewRegion(startbase: number, endbase: number) {
    if (startbase && endbase) {
      setUserViewRegion(
        new DisplayedRegionModel(genomeConfig.navContext, startbase, endbase)
      );
    }
  }

  function onNewHighlight(highlightState: Array<any>) {
    setHighLights([...highlights, ...highlightState]);
  }
  function onTrackSelected(trackSelected: TrackModel[]) {}
  function onTrackDeleted(trackSelected: TrackModel[]) {}

  function onTrackAdded(trackModels: Array<TrackModel>) {
    //you should update the tab UI with  new added TrackModels right away so the changes
    //reflects in the UI right away, like if a track is already added
    for (let trackModel of trackModels) {
      trackModel.id = trackModelId.current;
      trackModelId.current++;
      addedTracks.current.push(trackModel);
    }

    // when users add too many single tracks, it will cause too much state changes,
    // so we delay each click by 1 sec until the user stop then process the added tracks
    clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      processTracks();
    }, 1000);
  }

  function processTracks() {
    let prevTracks =
      tracks.length === 0 ? [...genomeConfig.defaultTracks] : [...tracks];
    setTracks([...prevTracks, ...addedTracks.current]);
    addedTracks.current = [];
  }
  useEffect(() => {
    const newGenomeConfig = currentSession?.genomeConfig;

    newGenomeConfig!.defaultTracks.map((trackModel) => {
      trackModel.id = trackModelId.current;
      trackModelId.current++;
    });
    setGenomeConfig(newGenomeConfig);
    const initialView = new DisplayedRegionModel(
      newGenomeConfig!.navContext,
      newGenomeConfig!.defaultRegion.start,
      newGenomeConfig!.defaultRegion.end
    );
    setViewRegion(initialView);
    setUserViewRegion(initialView);
  }, []);
  return (
    <div>
      {genomeConfig ? (
        <TrackContainer
          tracks={tracks}
          genomeConfig={genomeConfig}
          highlights={highlights}
          legendWidth={120}
          showGenomeNav={true}
          onNewRegion={onNewRegion}
          onNewHighlight={onNewHighlight}
          onTrackSelected={onTrackSelected}
          onTrackDeleted={onTrackDeleted}
          onNewRegionSelect={onNewRegionSelect}
          onTrackAdded={onTrackAdded}
          //separate viewRegions
          //viewRegion - for when we need to jump to a nav coordinate: zoom, selecting new region, etc
          // userViewRegion - the current nav coordinate the user is currently viewing
          viewRegion={viewRegion}
          userViewRegion={userViewRegion}
        />
      ) : (
        ""
      )}
    </div>
  );
}
