import { default as cytobands } from './cytoBandIdeo.json';
import { default as annotationTracks } from './annotationTracks.json';
import { default as Genome } from '../../Genome';
import { default as TrackModel } from '../../TrackModel';
export default PANTRO5;
declare namespace PANTRO5 {
    export { genome };
    export { navContext };
    export { cytobands };
    export { defaultRegion };
    export { defaultTracks };
    export let twoBitURL: string;
    export { annotationTracks };
}
declare const genome: Genome;
declare const navContext: import('../../NavigationContext').default;
declare const defaultRegion: import('../../OpenInterval').default;
declare const defaultTracks: TrackModel[];
