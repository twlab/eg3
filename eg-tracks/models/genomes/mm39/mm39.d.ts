export default MM39;
declare namespace MM39 {
    export { genome };
    export { navContext };
    export { cytobands };
    export { defaultRegion };
    export { defaultTracks };
    export const twoBitURL: string;
    export { publicHubList };
    export { annotationTracks };
}
declare const genome: Genome;
declare const navContext: import("../../NavigationContext").default;
declare const defaultRegion: import("../../OpenInterval").default;
declare const defaultTracks: TrackModel[];
declare const publicHubList: {
    collection: string;
    name: string;
    numTracks: number;
    oldHubFormat: boolean;
    url: string;
    description: string;
}[];
import Genome from "../../Genome";
import TrackModel from "../../TrackModel";
