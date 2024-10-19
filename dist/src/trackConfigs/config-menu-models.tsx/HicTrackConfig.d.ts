import { default as LabelConfig } from '../config-menu-components.tsx/LabelConfig';
import { TrackConfig } from './TrackConfig';
import { default as TrackModel } from '../../models/TrackModel';
export declare class HicTrackConfig extends TrackConfig {
    constructor(trackModel: TrackModel);
    getMenuComponents(): (typeof LabelConfig)[];
}
