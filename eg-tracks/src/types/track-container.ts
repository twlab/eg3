import DisplayedRegionModel from "@eg/core/src/eg-lib/models/DisplayedRegionModel";
import TrackModel from "@eg/core/src/eg-lib/models/TrackModel";

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
  tool: { title: Tool };
}

export interface ITrackContainerRepresentableProps {
  tracks: ITrackModel[];
  highlights: IHighlightInterval[];
  genomeConfig?: any;
  legendWidth: number;
  showGenomeNav: boolean;
  onNewRegion: (coordinate: GenomeCoordinate) => void;
  onNewHighlight: (highlightState: Array<any>) => void;
  onTrackSelected: (trackSelected: ITrackModel[]) => void;
  onTrackDeleted: (currenTracks: ITrackModel[]) => void;
  onTrackAdded: (trackModels: ITrackModel[]) => void;
  onNewRegionSelect: (coordinate: GenomeCoordinate) => void;
  viewRegion: GenomeCoordinate;
  userViewRegion: null | GenomeCoordinate;
  tool: { title: Tool };
}

// MARK: Track Model

export type GenomeCoordinate =
  | `chr${number | string}:${number}-${number}`
  | `chr${number | string}:${number}-chr${number | string}-${number}`;

export interface TrackOptions {
  label?: string;
  [k: string]: any;
}

export interface ITrackModelMetadata {
  "Track Type"?: string;
  genome?: string;
  [k: string]: any;
}

export interface QueryEndpoint {
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
  id: number | string;
  isSelected: boolean;
}

export interface IHighlightInterval {
  start: number;
  end: number;
  display: boolean;
  color: string;
  tag: string;
}

// MARK: Utility

export enum Tool {
  Drag,
  Reorder,
  Highlight,
  Zoom,
  PanLeft,
  PanRight,
  ZoomOutOneThirdFold,
  ZoomOutOneFold,
  ZoomOutFiveFold,
  ZoomInOneThirdFold,
  ZoomInOneFold,
  ZoomInFiveFold,
  highlightMenu
}
