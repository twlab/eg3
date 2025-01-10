import { useAppSelector } from "@/lib/redux/hooks";
import { selectCurrentSession } from "@/lib/redux/slices/browserSlice";
import { getGenomeConfig } from "@/lib/eg-lib/model/genomes/allGenomes";
import { ITrackContainerState, TrackContainer } from "@eg/tracks";

import BrowserPlaceholder from "../../assets/browser-placeholder.jpg";
import { GenomeState } from "../../lib/redux/slices/genomeSlice";
import TrackModel from "@eg/core/src/eg-lib/models/TrackModel";
import { useEffect, useState } from "react";
import DisplayedRegionModel from "@eg/core/src/eg-lib/models/DisplayedRegionModel";

export default function GenomeView() {
  const [genomeConfig, setGenomeConfig] = useState<any>(null);
  const currentSession = useAppSelector(selectCurrentSession);

  console.log(currentSession);

  function onNewRegion(startbase: number, endbase: number) {}

  function onNewHighlight(highlightState: Array<any>) {}
  function onTrackSelected(trackSelected: TrackModel[]) {}
  function onTrackDeleted(trackSelected: TrackModel[]) {}
  useEffect(() => {
    const newGenomeConfig = getGenomeConfig("hg38");
    setGenomeConfig(newGenomeConfig);
  }, []);
  return (
    <div className="h-full">
      {genomeConfig ? (
        <TrackContainer
          tracks={[]}
          genomeConfig={{ ...genomeConfig }}
          highlights={[]}
          legendWidth={120}
          showGenomeNav={true}
          onNewRegion={onNewRegion}
          onNewHighlight={onNewHighlight}
          onTrackSelected={onTrackSelected}
          onTrackDeleted={onTrackDeleted}
          viewRegion={
            new DisplayedRegionModel(
              genomeConfig.navContext,
              genomeConfig.defaultRegion.start,
              genomeConfig.defaultRegion.end
            )
          }
        />
      ) : (
        ""
      )}
    </div>
  );
}
