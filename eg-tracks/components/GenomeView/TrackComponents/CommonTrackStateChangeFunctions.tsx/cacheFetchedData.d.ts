export declare function getDeDupeArrMatPlot(data: Array<any>, isError: any): any[] | undefined;
interface cacheFetchedDataParams {
    id: string;
    trackData: any;
    trackFetchedDataCache: any;
    trackState: any;
    trackType: string;
    usePrimaryNav: boolean;
    metadata: any;
    navContext: any;
    bpRegionSize: number;
}
export declare const trackUsingExpandedLoci: {
    biginteract: string;
    dynamichic: string;
    dynamiclongrange: string;
    hic: string;
    longrange: string;
    genomealign: string;
};
export declare function cacheFetchedData({ id, trackData, trackFetchedDataCache, trackState, trackType, usePrimaryNav, metadata, navContext, bpRegionSize, }: cacheFetchedDataParams): void;
export declare function transformArray(arr: any[][][]): any[][][];
export {};
