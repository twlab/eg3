import TrackModel from "../../../models/TrackModel";
import { NumericalAggregator } from "./commonComponents/numerical/NumericalAggregator";
import OpenInterval from "../../../models/OpenInterval";
export declare const numericalTracks: {
    bigwig: string;
    bedgraph: string;
    methylc: string;
    boxplot: string;
    qbed: string;
    vcf: string;
    dynseq: string;
    matplot: string;
    longrange: string;
    hic: string;
};
export declare const possibleNumericalTracks: {
    bigbed: string;
    geneannotation: string;
    modbed: string;
    refbed: string;
    bed: string;
    repeatmasker: string;
    omeroidr: string;
    bam: string;
    snp: string;
};
export declare const numericalTracksGroup: {
    bigwig: string;
    bedgraph: string;
};
export declare class GroupedTrackManager {
    /**
     * @returns list of groups found in the track list, their data, and their original indicies
     */
    aggregator: NumericalAggregator;
    dynseqAggregator: (data: any[], viewRegion: any, width: number, aggregatorId: string) => any;
    aggregateRecords: (data: any[], viewRegion: any, width: number) => any;
    aggregateFeaturesMatplot: (data: any, viewRegion: any, width: any, aggregatorId: any) => any;
    constructor();
    getGroupScale(tracks: TrackModel[], trackData: any, width: number, viewWindow: OpenInterval, dataIdx: number, trackFetchedDataCache: any): {
        [groupId: number]: {
            scale: TrackModel;
            min: {};
            max: {};
        };
    };
    getGroupScaleWithXvalues(tracks: TrackModel[], trackData: any, viewWindow: OpenInterval): {
        [groupId: number]: {
            scale: TrackModel;
            min: {};
            max: {};
        };
    };
}
