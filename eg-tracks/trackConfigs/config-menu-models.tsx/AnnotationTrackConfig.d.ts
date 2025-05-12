import { TrackConfig } from "./TrackConfig";
export declare const DEFAULT_OPTIONS: {
    displayMode: string;
    color: string;
    color2: string;
    maxRows: number;
    height: number;
    hideMinimalItems: boolean;
    sortItems: boolean;
    aggregateMethod: string;
};
import TrackModel from "../../models/TrackModel";
export declare class AnnotationTrackConfig extends TrackConfig {
    constructor(trackModel: TrackModel);
    getMenuComponents(): any[];
}
