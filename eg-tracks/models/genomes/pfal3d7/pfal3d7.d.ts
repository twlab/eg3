export default Pfal3D7;
declare namespace Pfal3D7 {
    export { genome };
    export { navContext };
    export { cytobands };
    export { defaultRegion };
    export { defaultTracks };
    export { publicHubList };
    export { publicHubData };
    export const twoBitURL: string;
    export { annotationTracks };
}
declare const genome: Genome;
declare const navContext: import("../../NavigationContext").default;
declare const defaultRegion: import("../../OpenInterval").default;
declare const defaultTracks: TrackModel[];
declare const publicHubList: ({
    collection: string;
    name: string;
    numTracks: number;
    oldHubFormat: boolean;
    url: string;
    description: string;
} | {
    collection: string;
    name: string;
    numTracks: number;
    oldHubFormat: boolean;
    url: string;
    description?: undefined;
})[];
declare const publicHubData: {
    "Noble lab": string;
    "3D structures": string;
};
import Genome from "../../Genome";
import TrackModel from "../../TrackModel";
