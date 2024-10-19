import { default as NavigationContext } from './NavigationContext';
export interface Gap {
    contextBase: number;
    length: number;
}
export declare class NavContextBuilder {
    private _baseNavContext;
    private _gaps;
    private _cumulativeGapBases;
    constructor(baseNavContext: NavigationContext);
    /**
     * @param gaps
     */
    setGaps(gaps: Array<any>): void;
    build(): NavigationContext;
    convertOldCoordinates(base: number): number;
}
