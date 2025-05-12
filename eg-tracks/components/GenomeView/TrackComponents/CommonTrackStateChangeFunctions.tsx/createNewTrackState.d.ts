import DisplayedRegionModel from "../../../models/DisplayedRegionModel";
import TrackModel from "../../../models/TrackModel";
import { HighlightInterval } from "../../ToolComponents/HighlightMenu";
export interface TrackState {
    bundleId: string;
    customTracksPool: any[];
    darkTheme: boolean;
    genomeName: string;
    highlights: HighlightInterval[];
    isShowingNavigator: boolean;
    layout: any;
    metadataTerms: any[];
    regionSetView: any | null;
    regionSets: any[];
    viewRegion: DisplayedRegionModel;
    trackLegendWidth: number;
    tracks: Array<TrackModel>;
}
export declare function createNewTrackState(existingState: TrackState, updates?: Partial<TrackState>): TrackState;
