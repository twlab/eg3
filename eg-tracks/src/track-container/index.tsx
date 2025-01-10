import { ITrackContainerState } from "../types";
import TracksPlaceholder from "../assets/tracks-placeholder.jpg";
import GenomeRoot from "@eg/tracks/src/components/GenomeView/GenomeRoot";
import TrackModel from "@eg/core/src/eg-lib/models/TrackModel";
export function TrackContainer(props: ITrackContainerState) {
  return (
    <GenomeRoot
      tracks={props.tracks}
      genomeConfig={props.genomeConfig}
      highlights={props.highlights}
      legendWidth={props.legendWidth}
      showGenomeNav={props.showGenomeNav}
      onNewRegion={props.onNewRegion}
      onNewHighlight={props.onNewHighlight}
      onTrackSelected={props.onTrackSelected}
      onTrackDeleted={props.onTrackDeleted}
      viewRegion={props.viewRegion}
      userViewRegion={props.userViewRegion}
    />
  );
}
