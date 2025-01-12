import { useAppSelector } from "@/lib/redux/hooks";
import { selectCurrentSession } from "@/lib/redux/slices/browserSlice";
import { getGenomeConfig } from "@eg/core/src/eg-lib/models/genomes/allGenomes";
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

  const [highlights, setHighLights] = useState<Array<any>>([
    {
      start: 1259080171,
      end: 1259290270,
      color: "rgba(0, 123, 255, 0.15)",
      display: true,
      tag: "",
    },
    {
      start: 1259215544,
      end: 1259335756,
      color: "rgba(0, 123, 255, 0.15)",
      display: true,
      tag: "",
    },
    {
      start: 1259123220,
      end: 1259227457,
      color: "rgba(0, 123, 255, 0.15)",
      display: true,
      tag: "",
    },
    {
      start: 1259217981,
      end: 1259289458,
      color: "rgba(0, 123, 255, 0.15)",
      display: true,
      tag: "",
    },
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
  function onTrackAdded(trackModels: TrackModel[]) {
    trackModels.map((trackModel) => {
      trackModel.id = trackModelId.current;
      trackModelId.current++;
    });
    let prevTracks =
      tracks.length === 0 ? [...genomeConfig.defaultTracks] : [...tracks];
    setTracks([...prevTracks, ...trackModels]);
  }
  useEffect(() => {
    const newGenomeConfig = getGenomeConfig("hg38");
    newGenomeConfig.defaultTracks.map((trackModel) => {
      trackModel.id = trackModelId.current;
      trackModelId.current++;
    });
    setGenomeConfig(newGenomeConfig);
    const initialView = new DisplayedRegionModel(
      newGenomeConfig.navContext,
      newGenomeConfig.defaultRegion.start,
      newGenomeConfig.defaultRegion.end
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
          viewRegion={viewRegion}
          userViewRegion={userViewRegion}
        />
      ) : (
        ""
      )}
    </div>
  );
}
