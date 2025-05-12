import TrackModel from "../../models/TrackModel";
import { AnnotationTrackConfig } from "./AnnotationTrackConfig";
export declare class BamTrackConfig extends AnnotationTrackConfig {
    constructor(trackModel: TrackModel);
    getMenuComponents(): any[];
}
