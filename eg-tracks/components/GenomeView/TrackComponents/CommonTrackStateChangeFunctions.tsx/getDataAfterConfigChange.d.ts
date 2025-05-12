interface GetConfigChangeDataParams {
    fetchedDataCache: any;
    dataIdx: number;
    createSVGOrCanvas: (trackState: any, viewData: any[], isError: boolean, trackIndex: number, xvalues: any) => void;
    trackType: string;
    usePrimaryNav: boolean;
    signal?: any;
    trackState: any;
}
export declare function getConfigChangeData({ fetchedDataCache, dataIdx, trackState, createSVGOrCanvas, trackType, usePrimaryNav, }: GetConfigChangeDataParams): void;
export {};
