export default galGal5;
declare namespace galGal5 {
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
    "4D Nucleome Network": string;
};
declare const publicHubList: {
    collection: string;
    name: string;
    numTracks: number;
    oldHubFormat: boolean;
    url: string;
    description: {
        "hub built by": string;
        "last update": string;
        "hub built notes": string;
    };
}[];
import Genome from "../../Genome";
import TrackModel from "../../TrackModel";
