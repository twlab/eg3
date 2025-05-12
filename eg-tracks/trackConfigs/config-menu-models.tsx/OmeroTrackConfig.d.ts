import { AnnotationDisplayModeConfig } from "../config-menu-components.tsx/DisplayModeConfig";
import { TrackConfig } from "./TrackConfig";
export declare class OmeroTrackConfig extends TrackConfig {
    getMenuComponents(): (typeof AnnotationDisplayModeConfig)[];
}
