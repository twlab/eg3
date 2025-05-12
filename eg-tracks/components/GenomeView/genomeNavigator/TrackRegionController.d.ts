import { FC } from "react";
import DisplayedRegionModel from "../../../models/DisplayedRegionModel";
import Genome from "../../../models/Genome";
interface TrackRegionControllerProps {
    selectedRegion: DisplayedRegionModel;
    onRegionSelected: (newStart: number, newEnd: number, toolTitle: number | string, highlightSearch: boolean) => void;
    contentColorSetup: {
        color: string;
        background: string;
    };
    virusBrowserMode?: boolean;
    genomeConfig: Genome;
    genomeArr: any[];
    genomeIdx: number;
    addGlobalState: any;
    trackManagerState: any;
}
declare const TrackRegionController: FC<TrackRegionControllerProps>;
export default TrackRegionController;
