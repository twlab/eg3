import { default as Genome } from '../../Genome';
import { default as TrackModel } from '../../TrackModel';
export default TbruceiLister427;
declare namespace TbruceiLister427 {
    export { genome };
    export { navContext };
    export let cytobands: {};
    export { defaultRegion };
    export { defaultTracks };
    export let twoBitURL: string;
    export { annotationTracks };
}
declare const genome: Genome;
declare const navContext: import('../../NavigationContext').default;
declare const defaultRegion: import('../../OpenInterval').default;
declare const defaultTracks: TrackModel[];
declare namespace annotationTracks {
    let Ruler: {
        type: string;
        label: string;
        name: string;
    }[];
    let Genes: {
        name: string;
        label: string;
        filetype: string;
        queryEndpoint: {
            name: string;
            endpoint: string;
        };
    }[];
}
