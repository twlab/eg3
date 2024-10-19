import { TrackConfig } from './TrackConfig';
import { default as TrackModel } from '../../models/TrackModel';
export declare class MatplotTrackConfig extends TrackConfig {
    constructor(trackModel: TrackModel);
    getMenuComponents(): typeof import('../config-menu-components.tsx/LabelConfig').default[];
}
