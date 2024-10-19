import { default as cytobands } from './cytoBandIdeo.json';
import { default as annotationTracks } from './annotationTracks.json';
import { Genome } from '../../Genome';
import { default as TrackModel } from '../../TrackModel';
export default DAN_RER11;
declare namespace DAN_RER11 {
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
