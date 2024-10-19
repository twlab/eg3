import { TrackConfig } from './TrackConfig';
import { default as HeightConfig } from '../config-menu-components.tsx/HeightConfig';
export declare class BigInteractTrackConfig extends TrackConfig {
    constructor(props: any);
    /**
     * Converts DASFeatures to Feature.
     *
     * @param {DASFeature[]} data - DASFeatures to convert
     * @return {Feature[]} Features made from the input
     */
    getMenuComponents(): (typeof HeightConfig)[];
}
