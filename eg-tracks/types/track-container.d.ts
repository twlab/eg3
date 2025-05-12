import DisplayedRegionModel from "../models/DisplayedRegionModel";
import TrackModel from "../models/TrackModel";
import { IGenome } from "./genome-hub";
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
    onNewRegionSelect: (startbase: number, endbase: number, highlightSearch?: boolean) => void;
    viewRegion: DisplayedRegionModel | undefined;
    userViewRegion: DisplayedRegionModel;
    tool: Tool | null | string;
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
    onNewRegion: (startbase: number, endbase: number) => void;
    onNewHighlight: (highlightState: Array<any>) => void;
    onTrackSelected: (trackSelected: ITrackModel[]) => void;
    onTrackDeleted: (currenTracks: ITrackModel[]) => void;
    onTrackAdded: (trackModels: ITrackModel[]) => void;
    onNewRegionSelect: (startbase: number, endbase: number, coordinate: GenomeCoordinate) => void;
    viewRegion: GenomeCoordinate | null;
    userViewRegion: {
        start: number;
        end: number;
    } | null;
    tool: Tool | null;
    Toolbar?: any;
    selectedRegionSet: any;
    setScreenshotData: any;
    isScreenShotOpen: boolean;
    overrideViewRegion: GenomeCoordinate | null;
    currentState: any;
}
export type GenomeCoordinate = `chr${number | string}:${number}-${number}` | `chr${number | string}:${number}-chr${number | string}-${number}`;
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
export declare enum Tool {
    Drag = 0,
    Reorder = 1,
    Highlight = 2,
    Zoom = 3,
    PanLeft = 4,
    PanRight = 5,
    ZoomOutOneThirdFold = 6,
    ZoomOutOneFold = 7,
    ZoomOutFiveFold = 8,
    ZoomInOneThirdFold = 9,
    ZoomInOneFold = 10,
    ZoomInFiveFold = 11,
    highlightMenu = 12
}
