import DisplayedRegionModel from "@eg/core/src/eg-lib/models/DisplayedRegionModel";
import { TrackModel } from "@eg/core/src/eg-lib/models/TrackModel";

// add the same props that were being passed into TrackContainer.tsx
export interface ITrackContainerState {
  tracks: TrackModel[];
  highlights: Array<any>;
  genomeConfig?: any;
  legendWidth: number;
  showGenomeNav: boolean;
  onNewRegion: (startbase: number, endbase: number) => void;
  onNewHighlight: (highlightState: Array<any>) => void;
  onTrackSelected: (trackSelected: TrackModel[]) => void;
  onTrackDeleted: (currenTracks: TrackModel[]) => void;
  onTrackAdded: (trackModels: TrackModel[]) => void;
  onNewRegionSelect: (startbase: number, endbase: number) => void;

  viewRegion: DisplayedRegionModel;
  userViewRegion: DisplayedRegionModel;
  // ...
}

// MARK: - Track Model

export interface TrackOptions {
  label?: string;
  [k: string]: any;
}

interface ITrackModelMetadata {
  "Track Type"?: string;
  genome?: string;
  [k: string]: any;
}

interface QueryEndpoint {
  name?: string;
  endpoint?: string;
}

export interface ITrackModel {
  name: string;
  type?: string;
  filetype?: string;
  options: TrackOptions;
  url: string;
  indexUrl?: string;
  metadata: ITrackModelMetadata;
  fileObj?: Blob;
  queryEndpoint?: QueryEndpoint;
  querygenome?: string;
}
