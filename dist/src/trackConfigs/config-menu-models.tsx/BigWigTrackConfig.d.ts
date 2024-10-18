import { TrackConfig } from './TrackConfig';
import { default as TrackModel } from '../../models/TrackModel';
export declare class BigWigTrackConfig extends TrackConfig {
    private numericalTrackConfig;
    constructor(trackModel: TrackModel);
    getMenuComponents(): typeof import('../config-menu-components.tsx/LabelConfig').default[];
}
