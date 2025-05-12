export default sacCer3;
declare namespace sacCer3 {
    export { genome };
    export { navContext };
    export { cytobands };
    export { defaultRegion };
    export { defaultTracks };
    export const twoBitURL: string;
    export { publicHubData };
    export { publicHubList };
    export { annotationTracks };
}
declare const genome: Genome;
declare const navContext: import("../../NavigationContext").default;
declare const defaultRegion: import("../../OpenInterval").default;
declare const defaultTracks: TrackModel[];
declare const publicHubData: {
    "3D structures": string;
};
declare const publicHubList: {
    collection: string;
    name: string;
    numTracks: number;
    oldHubFormat: boolean;
    url: string;
}[];
import Genome from "../../Genome";
import TrackModel from "../../TrackModel";
