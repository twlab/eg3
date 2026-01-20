import DisplayedRegionModel from "../models/DisplayedRegionModel";
import TrackModel from "../models/TrackModel";
import { IGenome } from "./genome-hub";

// add the same props that were being passed into TrackContainer.tsx
export interface ITrackContainerState {
  tracks: TrackModel[];
  highlights: Array<any>;
  genomeConfig?: any;
  legendWidth: number;
  showGenomeNav?: boolean;
  showToolBar?: boolean;
  onNewRegion: (startbase: number, endbase: number) => void;
  onNewHighlight: (highlightState: Array<any>) => void;
  onTracksChange: (trackSelected: TrackModel[]) => void;
  onSetSelected: (set: any, genomeCoordinate: GenomeCoordinate | null) => void;
  onNewRegionSelect: (
    startbase: number,
    endbase: number,
    highlightSearch?: boolean
  ) => void;
  viewRegion: DisplayedRegionModel | undefined | null;
  userViewRegion: DisplayedRegionModel | undefined | null;
  tool: Tool | null | string;
  Toolbar: { [key: string]: any };
  selectedRegionSet: any;
  setScreenshotData: any;
  isScreenShotOpen: boolean;
  currentState: any;
  darkTheme: boolean;
  width?: number;
  height?: number;
}

export interface ITrackContainerRepresentableProps {
  tracks: ITrackModel[];
  genomeName: string;
  highlights: IHighlightInterval[];
  genomeConfig: IGenome;
  legendWidth: number;
  showGenomeNav: boolean;
  showToolBar: boolean;
  onNewRegion: (genomeCoordinate: GenomeCoordinate) => void | null | undefined;
  onNewHighlight: (highlightState: Array<any>) => void | null | undefined;
  onTracksChange: (trackSelected: ITrackModel[]) => void | null | undefined;
  onSetSelected: (
    set: any,
    genomeCoordinate: GenomeCoordinate | null
  ) => void | null | undefined;
  onNewRegionSelect: (
    genomeCoordinate: GenomeCoordinate
  ) => void | null | undefined;
  viewRegion: GenomeCoordinate | null;
  userViewRegion: GenomeCoordinate | null;
  tool: Tool | null;
  Toolbar?: any;
  selectedRegionSet: any;
  setScreenshotData: any;
  isScreenShotOpen: boolean;
  overrideViewRegion: GenomeCoordinate | null;
  currentState: any;
  darkTheme: boolean;
  height?: number;
  width?: number;
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
  files?: Blob;
  queryEndpoint?: QueryEndpoint;
  querygenome?: string;
  id: number | string;
  isSelected: boolean;
  tracks?: ITrackModel[];
  changeConfigInitial?: boolean;
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
  ReorderMany,
}
