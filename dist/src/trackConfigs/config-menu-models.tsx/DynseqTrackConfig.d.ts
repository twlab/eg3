import { TrackConfig } from './TrackConfig';
import { default as LabelConfig } from '../config-menu-components.tsx/LabelConfig';
import { default as TrackModel } from '../../models/TrackModel';
export declare class DynseqTrackConfig extends TrackConfig {
    private bigWigTrackConfig;
    constructor(trackModel: TrackModel);
    getMenuComponents(basesPerPixel?: number): (typeof LabelConfig)[];
}
