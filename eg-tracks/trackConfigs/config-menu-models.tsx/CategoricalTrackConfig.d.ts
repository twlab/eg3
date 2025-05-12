import { TrackConfig } from "./TrackConfig";
export declare const DEFAULT_OPTIONS: {
    height: number;
    color: string;
    maxRows: number;
    hiddenPixels: number;
    alwaysDrawLabel: boolean;
    category: {};
};
export declare class CategoricalTrackConfig extends TrackConfig {
    getMenuComponents(): any[];
}
