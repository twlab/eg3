import DisplayedRegionModel from "../models/DisplayedRegionModel";
import TrackModel from "../models/TrackModel";
import { IGenome } from "./genome-hub";

// add the same props that were being passed into TrackContainer.tsx
export interface ITrackContainerState {
  tracks: TrackModel[];
  highlights: Array<any>;
  genomeConfig?: any;
  legendWidth: number;
  showGenomeNav: boolean;
  onNewRegion: (start: number, end: number) => void;
  onNewHighlight: (highlightState: Array<any>) => void;
  onTrackSelected: (trackSelected: TrackModel[]) => void;
  onTrackDeleted: (currenTracks: TrackModel[]) => void;
  onTrackAdded: (trackModels: TrackModel[]) => void;
  onNewRegionSelect: (start: number, end: number) => void;
  viewRegion: DisplayedRegionModel;
  userViewRegion: DisplayedRegionModel;
  tool: Tool | null | string;
  selectedRegionSet: any;
  setScreenshotData: any;
  isScreenShotOpen: boolean;
}
export interface NavCoord {
  start: number;
  end: number;
  // GenomeCoordinate: GenomeCoordinate;
}
export interface ITrackContainerRepresentableProps {
  tracks: ITrackModel[];
  highlights: IHighlightInterval[];
  genomeConfig: IGenome;
  legendWidth: number;
  showGenomeNav: boolean;
  onNewRegion: (coordinate: NavCoord) => void;
  onNewHighlight: (highlightState: Array<any>) => void;
  onTrackSelected: (trackSelected: ITrackModel[]) => void;
  onTrackDeleted: (currenTracks: ITrackModel[]) => void;
  onTrackAdded: (trackModels: ITrackModel[]) => void;
  onNewRegionSelect: (coordinate: NavCoord) => void;
  viewRegion: NavCoord;
  userViewRegion: NavCoord | null;
  tool: Tool | null;
  Toolbar?: any;
  selectedRegionSet: any;
  setScreenshotData: any;
  isScreenShotOpen: boolean;
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
  highlightMenu,
}
