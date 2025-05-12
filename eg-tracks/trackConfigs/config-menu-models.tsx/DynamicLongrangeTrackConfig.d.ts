import HeightConfig from "../config-menu-components.tsx/HeightConfig";
import { TrackConfig } from "./TrackConfig";
export declare class DynamicLongrangeTrackConfig extends TrackConfig {
    getMenuComponents(): (typeof HeightConfig)[];
}
