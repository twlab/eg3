import TrackModel from "../../models/TrackModel";
import HeightConfig from "../config-menu-components.tsx/HeightConfig";
import { TrackConfig } from "./TrackConfig";
export declare class BoxplotTrackConfig extends TrackConfig {
    private trackConfig;
    constructor(trackModel: TrackModel);
    getMenuComponents(): (typeof HeightConfig)[];
}
