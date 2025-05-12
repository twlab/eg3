export default MM10;
declare namespace MM10 {
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
    "Toxicant Exposures and Responses by Genomic and Epigenomic Regulators of Transcription (TaRGET)": string;
    "3D structures": string;
    "Image collection": string;
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
        "last update": string;
        "hub built notes": string;
        "hub built date"?: undefined;
        "total number of images"?: undefined;
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
        "last update"?: undefined;
        "hub built notes"?: undefined;
        "total number of images"?: undefined;
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
        "total number of images": number;
        "hub built notes": string;
        "last update"?: undefined;
        "hub built date"?: undefined;
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
        "last update"?: undefined;
        "total number of images"?: undefined;
    };
})[];
import Genome from "../../Genome";
import TrackModel from "../../TrackModel";
