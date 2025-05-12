export default Ebola;
declare namespace Ebola {
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
declare namespace annotationTracks {
    const Ruler: {
        type: string;
        label: string;
        name: string;
    }[];
    const Genes: {
        name: string;
        label: string;
        filetype: string;
    }[];
    const Assembly: {
        type: string;
        name: string;
        url: string;
    }[];
    const Diversity: ({
        type: string;
        name: string;
        url: string;
        options: {
            aggregateMethod: string;
            height: number;
        };
    } | {
        type: string;
        name: string;
        url: string;
        options?: undefined;
    })[];
}
import Genome from "../../Genome";
import TrackModel from "../../TrackModel";
