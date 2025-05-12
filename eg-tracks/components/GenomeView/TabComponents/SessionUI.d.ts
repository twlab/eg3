import React from "react";
import TrackModel from "../../../models/TrackModel";
import DisplayedRegionModel from "../../../models/DisplayedRegionModel";
import { HighlightInterval } from "../ToolComponents/HighlightMenu";
import { ITrackModel } from "../../../types";
export interface BundleProps {
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
    viewRegion: DisplayedRegionModel | null;
    trackLegendWidth: number;
    tracks: Array<TrackModel> | Array<ITrackModel>;
    onRestoreBundle: any;
}
interface HasBundleId {
    bundleId: string;
}
interface SessionUIProps extends HasBundleId {
    onRestoreSession: (session: object) => void;
    onRetrieveBundle: (newBundle: any) => void;
    updateBundle: (bundle: any) => void;
    withGenomePicker?: boolean;
    state?: BundleProps;
    curBundle: any;
    onRestoreBundle: any;
}
export declare const onRetrieveSession: (retrieveId: string) => Promise<any>;
declare const SessionUI: React.FC<SessionUIProps>;
export default SessionUI;
