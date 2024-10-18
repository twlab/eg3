import { default as Genome } from '../../Genome';
import { default as TrackModel } from '../../TrackModel';
export default SARS;
declare namespace SARS {
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
