import { ITrackContainerState } from "../types";
import TracksPlaceholder from "../assets/tracks-placeholder.jpg";
import GenomeRoot from "@eg/tracks/src/components/GenomeView/GenomeRoot";
import TrackModel from "@eg/core/src/eg-lib/models/TrackModel";
export function TrackContainer(props: ITrackContainerState) {
  return (
    <GenomeRoot
      tracks={[]}
      genomeConfig={props.genomeConfig}
      highlights={[]}
      legendWidth={0}
      showGenomeNav={false}
      onNewRegion={function (startbase: number, endbase: number): void {
        throw new Error("Function not implemented.");
      }}
      onNewHighlight={function (highlightState: Array<any>): void {
        throw new Error("Function not implemented.");
      }}
      onTrackSelected={function (trackSelected: TrackModel[]): void {
        throw new Error("Function not implemented.");
      }}
      onTrackDeleted={function (currenTracks: TrackModel[]): void {
        throw new Error("Function not implemented.");
      }}
      viewRegion={props.viewRegion}
    />
  );
}
