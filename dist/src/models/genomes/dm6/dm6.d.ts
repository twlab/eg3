import { default as cytobands } from './cytoBandIdeo.json';
import { default as annotationTracks } from './annotationTracks.json';
import { default as Genome } from '../../Genome';
import { default as TrackModel } from '../../TrackModel';
export default DM6;
declare namespace DM6 {
    export { genome };
    export { navContext };
    export { cytobands };
    export { defaultRegion };
    export { defaultTracks };
    export let twoBitURL: string;
    export { publicHubData };
    export { publicHubList };
    export { annotationTracks };
}
declare const genome: Genome;
declare const navContext: import('../../NavigationContext').default;
declare const defaultRegion: import('../../OpenInterval').default;
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
