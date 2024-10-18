import { AnnotationTrackConfig } from './AnnotationTrackConfig';
export declare class BedTrackConfig extends AnnotationTrackConfig {
    /**
     * Converts BedRecords to Features.
     *
     * @param {BedRecord[]} data - bed records to convert
     * @return {Feature[]} bed records in the form of Feature
     */
    getMenuComponents(): typeof import('../config-menu-components.tsx/LabelConfig').default[];
}
