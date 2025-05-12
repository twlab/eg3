import HeightConfig from "../config-menu-components.tsx/HeightConfig";
import { TrackConfig } from "./TrackConfig";
export declare class DynamicHicTrackConfig extends TrackConfig {
    getMenuComponents(): (typeof HeightConfig)[];
}
