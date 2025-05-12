import { TrackConfig } from "./TrackConfig";
import TrackModel from "../../models/TrackModel";
export declare class DynseqTrackConfig extends TrackConfig {
    private bigWigTrackConfig;
    constructor(trackModel: TrackModel);
    getMenuComponents(basesPerPixel?: number): any[];
}
