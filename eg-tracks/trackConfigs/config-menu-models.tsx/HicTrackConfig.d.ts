import { TrackConfig } from "./TrackConfig";
import TrackModel from "../../models/TrackModel";
import BothAnchorsInViewConfig from "../config-menu-components.tsx/BothAnchorsInViewConfig";
export declare class HicTrackConfig extends TrackConfig {
    constructor(trackModel: TrackModel);
    getMenuComponents(): (typeof BothAnchorsInViewConfig)[];
}
