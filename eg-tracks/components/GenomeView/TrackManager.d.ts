/// <reference types="react" />
import DisplayedRegionModel from "../../models/DisplayedRegionModel";
import TrackModel from "../../models/TrackModel";
import { GenomeConfig } from "../../models/genomes/GenomeConfig";
export declare const convertTrackModelToITrackModel: (track: TrackModel) => ITrackModel;
export declare function objToInstanceAlign(alignment: {
    [key: string]: any;
}): DisplayedRegionModel;
export declare function bpNavToGenNav(bpNaletr: Array<any>, genome: GenomeConfig): any[];
interface TrackManagerProps {
    windowWidth: number;
    legendWidth: number;
    userViewRegion?: any;
    genomeConfig: any;
    highlights: Array<any>;
    tracks: Array<TrackModel>;
    onNewRegion: (startbase: number, endbase: number) => void;
    onNewHighlight: (highlightState: Array<any>) => void;
    onTrackSelected: (trackSelected: TrackModel[]) => void;
    onTrackDeleted: (currenTracks: TrackModel[]) => void;
    onNewRegionSelect: (startbase: number, endbase: number, highlightSearch: boolean) => void;
    tool: any;
    viewRegion?: any;
    showGenomeNav: boolean;
    setScreenshotData: any;
    isScreenShotOpen: boolean;
    selectedRegionSet: any;
}
declare const _default: import("react").MemoExoticComponent<React.FC<TrackManagerProps>>;
export default _default;
