export default HG38;
declare namespace HG38 {
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
    "Encyclopedia of DNA Elements (ENCODE)": string;
    "SARS-CoV-2 Host Transcriptional Responses (Blanco-Melo, et al. 2020) Database": string;
    "Reference human epigenomes from Roadmap Epigenomics Consortium": string;
    "Image collection": string;
    "Human Pangenome Reference Consortium (HPRC)": string;
};
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
    description: {
        "hub built by": string;
        "total number of images": number;
        "hub built notes": string;
        "last update"?: undefined;
        "hub built date"?: undefined;
        "hub info"?: undefined;
        values?: undefined;
    };
} | {
    collection: string;
    name: string;
    numTracks: number;
    oldHubFormat: boolean;
    url: string;
    description: {
        "hub built by": string;
        "last update": string;
        "hub built notes": string;
        "total number of images"?: undefined;
        "hub built date"?: undefined;
        "hub info"?: undefined;
        values?: undefined;
    };
} | {
    collection: string;
    name: string;
    numTracks: number;
    oldHubFormat: boolean;
    url: string;
    description: {
        "hub built by": string;
        "hub built date": string;
        "hub built notes": string;
        "total number of images"?: undefined;
        "last update"?: undefined;
        "hub info"?: undefined;
        values?: undefined;
    };
} | {
    collection: string;
    name: string;
    numTracks: number;
    oldHubFormat: boolean;
    url: string;
    description?: undefined;
} | {
    collection: string;
    name: string;
    numTracks: number;
    oldHubFormat: boolean;
    url: string;
    description: {
        "hub built by": string;
        "hub info": string;
        values: string;
        "total number of images"?: undefined;
        "hub built notes"?: undefined;
        "last update"?: undefined;
        "hub built date"?: undefined;
    };
})[];
import Genome from "../../Genome";
import TrackModel from "../../TrackModel";
