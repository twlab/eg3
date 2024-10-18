import { default as LabelConfig } from '../config-menu-components.tsx/LabelConfig';
import { TrackModel, TrackOptions } from '../../models/TrackModel';
export declare class TrackConfig {
    trackModel: TrackModel;
    isImageTrack(): void;
    isBigwigTrack(): void;
    defaultOptions: TrackOptions;
    constructor(trackModel: TrackModel);
    getOptions(): TrackOptions;
    setDefaultOptions(defaults: TrackOptions): TrackOptions;
    getMenuComponents(basesPerPixel?: number): (typeof LabelConfig)[];
}
