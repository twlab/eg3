import { TrackConfig } from './TrackConfig';
import { default as TrackModel } from '../../models/TrackModel';
export declare const DEFAULT_OPTIONS: {
    height: number;
    color: string;
    maxRows: number;
    hiddenPixels: number;
    alwaysDrawLabel: boolean;
    category: {};
};
export declare class CategoricalTrackConfig extends TrackConfig {
    constructor(trackModel: TrackModel);
    getMenuComponents(): typeof import('../config-menu-components.tsx/LabelConfig').default[];
}
