import { TrackConfig } from './TrackConfig';
import { default as TrackModel } from '../../models/TrackModel';
export declare const DEFAULT_OPTIONS: {
    displayMode: string;
    color: string;
    color2: string;
    maxRows: number;
    height: number;
    hideMinimalItems: boolean;
    sortItems: boolean;
};
export declare class AnnotationTrackConfig extends TrackConfig {
    constructor(trackModel: TrackModel);
    getMenuComponents(): typeof import('../config-menu-components.tsx/LabelConfig').default[];
}
