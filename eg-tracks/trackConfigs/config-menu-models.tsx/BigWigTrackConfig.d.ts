import { TrackConfig } from "./TrackConfig";
import TrackModel from "../../models/TrackModel";
export declare class BigWigTrackConfig extends TrackConfig {
    private numericalTrackConfig;
    constructor(trackModel: TrackModel);
    getMenuComponents(): any[];
}
