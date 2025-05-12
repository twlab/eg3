import { TrackModel, TrackOptions } from "../../models/TrackModel";
export declare class TrackConfig {
    trackModel: TrackModel;
    isImageTrack(): void;
    isBigwigTrack(): void;
    defaultOptions: TrackOptions;
    constructor(trackModel: TrackModel);
    getOptions(): TrackOptions;
    setDefaultOptions(defaults: TrackOptions): TrackOptions;
    getMenuComponents(): any;
}
