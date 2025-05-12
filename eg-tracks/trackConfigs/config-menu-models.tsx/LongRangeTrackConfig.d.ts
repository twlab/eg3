import { TrackConfig } from "./TrackConfig";
import BothAnchorsInViewConfig from "../config-menu-components.tsx/BothAnchorsInViewConfig";
export declare class LongRangeTrackConfig extends TrackConfig {
    constructor(props: any);
    getMenuComponents(): (typeof BothAnchorsInViewConfig)[];
}
