export default MERS;
declare namespace MERS {
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
declare const annotationTracks: {
    Ruler: {
        type: string;
        label: string;
        name: string;
    }[];
    Genes: {
        name: string;
        label: string;
        filetype: string;
    }[];
    Assembly: {
        type: string;
        name: string;
        url: string;
    }[];
    Diversity: ({
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
    "Genome Comparison": {
        name: string;
        label: string;
        querygenome: string;
        filetype: string;
        url: string;
    }[];
};
import Genome from "../../Genome";
import TrackModel from "../../TrackModel";
