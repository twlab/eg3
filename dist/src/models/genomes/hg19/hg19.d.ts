import { default as cytobands } from './cytoBand.json';
import { default as annotationTracks } from './annotationTracks.json';
import { default as Genome } from '../../Genome';
import { default as TrackModel } from '../../TrackModel';
export default HG19;
declare namespace HG19 {
    export { genome };
    export { navContext };
    export { cytobands };
    export { defaultRegion };
    export { defaultTracks };
    export { publicHubList };
    export { publicHubData };
    export { annotationTracks };
    export let twoBitURL: string;
}
declare const genome: Genome;
declare const navContext: import('../../NavigationContext').default;
declare const defaultRegion: import('../../OpenInterval').default;
declare const defaultTracks: TrackModel[];
declare const publicHubList: ({
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
        "total number of images": string;
        "hub built notes": string;
        "hub built date"?: undefined;
    };
} | {
    collection: string;
    name: string;
    numTracks: number;
    oldHubFormat: boolean;
    description: string;
    url: string;
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
    };
})[];
declare const publicHubData: {
    "Encyclopedia of DNA Elements (ENCODE)": string;
    "Reference human epigenomes from Roadmap Epigenomics Consortium": string;
    "3D structures": string;
    "Image collection": string;
};
