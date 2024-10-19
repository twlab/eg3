import { default as DisplayedRegionModel } from '../../models/DisplayedRegionModel';
import { default as React } from 'react';
export declare function objToInstanceAlign(alignment: any): DisplayedRegionModel;
export declare function bpNavToGenNav(bpNavArr: any, genome: any): any[];
interface TrackManagerProps {
    genomeIdx: number;
    addTrack: (track: any) => void;
    startBp: (bp: string, startNav: number, endNav: number) => void;
    windowWidth: number;
    genomeArr: Array<any>;
}
declare const _default: React.NamedExoticComponent<TrackManagerProps>;
export default _default;
