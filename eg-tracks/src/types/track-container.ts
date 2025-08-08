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
  onNewRegion: (startbase: number, endbase: number) => void;
  onNewHighlight: (highlightState: Array<any>) => void;
  onTracksChange: (trackSelected: TrackModel[]) => void;
  onSetSelected: (set: any) => void;
  onNewRegionSelect: (
    startbase: number,
    endbase: number,
    highlightSearch?: boolean
  ) => void;
  viewRegion: DisplayedRegionModel | undefined;
  userViewRegion: DisplayedRegionModel;
  tool: Tool | null | string;
  Toolbar: { [key: string]: any };
  selectedRegionSet: any;
  setScreenshotData: any;
  isScreenShotOpen: boolean;
  currentState: any;
}

export interface ITrackContainerRepresentableProps {
  tracks: ITrackModel[];
  genomeName: string;
  highlights: IHighlightInterval[];
  genomeConfig: IGenome;
  legendWidth: number;
  showGenomeNav: boolean;
  onNewRegion: (startbase: number, endbase: number) => void | null | undefined;
  onNewHighlight: (highlightState: Array<any>) => void | null | undefined;
  onTracksChange: (trackSelected: ITrackModel[]) => void | null | undefined;
  onSetSelected: (set: any) => void | null | undefined;
  onNewRegionSelect: (
    startbase: number,
    endbase: number,
    coordinate: GenomeCoordinate
  ) => void | null | undefined;
  viewRegion: GenomeCoordinate | null;
  userViewRegion: { start: number; end: number } | null;
  tool: Tool | null;
  Toolbar?: any;
  selectedRegionSet: any;
  setScreenshotData: any;
  isScreenShotOpen: boolean;
  overrideViewRegion: GenomeCoordinate | null;
  currentState: any;
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
  options?: TrackOptions;
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
