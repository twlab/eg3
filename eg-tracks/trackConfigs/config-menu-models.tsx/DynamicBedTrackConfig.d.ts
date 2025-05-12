import HiddenPixelsConfig from "../config-menu-components.tsx/HiddenPixelsConfig";
import { TrackConfig } from "./TrackConfig";
export declare class DynamicBedTrackConfig extends TrackConfig {
    getMenuComponents(): (typeof HiddenPixelsConfig)[];
}
