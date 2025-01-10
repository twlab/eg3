import { useAppSelector } from "@/lib/redux/hooks";
import { selectCurrentSession } from "@/lib/redux/slices/browserSlice";
import { getGenomeConfig } from "@eg/core/src/eg-lib/models/genomes/allGenomes";
import { ITrackContainerState, TrackContainer } from "@eg/tracks";

import BrowserPlaceholder from "../../assets/browser-placeholder.jpg";
import { GenomeState } from "../../lib/redux/slices/genomeSlice";
import TrackModel from "@eg/core/src/eg-lib/models/TrackModel";
import { useEffect, useState } from "react";
import DisplayedRegionModel from "@eg/core/src/eg-lib/models/DisplayedRegionModel";

export default function GenomeView() {
  const [genomeConfig, setGenomeConfig] = useState<any>(null);
  const [viewRegion, setViewRegion] = useState<any>();
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

  function onNewRegion(startbase: number, endbase: number) {
    setUserViewRegion(
      new DisplayedRegionModel(genomeConfig.navContext, startbase, endbase)
    );
  }

  function onNewHighlight(highlightState: Array<any>) {}
  function onTrackSelected(trackSelected: TrackModel[]) {}
  function onTrackDeleted(trackSelected: TrackModel[]) {}
  useEffect(() => {
    const newGenomeConfig = getGenomeConfig("hg38");
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
    <div className="h-full">
      {genomeConfig ? (
        <TrackContainer
          tracks={genomeConfig.defaultTracks}
          genomeConfig={genomeConfig}
          highlights={highlights}
          legendWidth={120}
          showGenomeNav={true}
          onNewRegion={onNewRegion}
          onNewHighlight={onNewHighlight}
          onTrackSelected={onTrackSelected}
          onTrackDeleted={onTrackDeleted}
          viewRegion={viewRegion}
          userViewRegion={userViewRegion}
        />
      ) : (
        ""
      )}
    </div>
  );
}
