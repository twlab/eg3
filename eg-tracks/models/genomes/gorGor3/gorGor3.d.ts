export default GORGOR3;
declare namespace GORGOR3 {
    export { genome };
    export { navContext };
    export const cytobands: {};
    export { defaultRegion };
    export { defaultTracks };
    export const twoBitURL: string;
    export { annotationTracks };
}
declare const genome: Genome;
declare const navContext: import("../../NavigationContext").default;
declare const defaultRegion: import("../../OpenInterval").default;
declare const defaultTracks: TrackModel[];
import Genome from "../../Genome";
import TrackModel from "../../TrackModel";
