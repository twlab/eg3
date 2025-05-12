import { PureComponent } from "react";
export declare const DEFAULT_OPTIONS: {
    height: number;
    isCombineStrands: boolean;
    colorsForContext: {
        CG: {
            color: string;
            background: string;
        };
        CHG: {
            color: string;
            background: string;
        };
        CHH: {
            color: string;
            background: string;
        };
    };
    depthColor: string;
    depthFilter: number;
    maxMethyl: number;
};
interface MethylCTrackProps {
    data: any[];
    options: {
        isCombineStrands: any;
        aggregateMethod: string;
        height: number;
        color?: string;
        yScale?: string;
        yMin?: number;
        yMax?: number;
        depthColor: any;
        colorsForContext: any;
        depthFilter: any;
        maxMethyl: any;
        forceSvg: boolean;
    };
    isLoading?: boolean;
    error?: any;
    viewRegion: any;
    width: number;
    trackModel: any;
    viewWindow: {
        start: number;
        end: number;
    };
    forceSvg: boolean;
    getNumLegend: any;
    xValuesData?: any;
    xvaluesData?: any;
}
declare class MethylCTrack extends PureComponent<MethylCTrackProps> {
    static propTypes: {
        data: any;
        options: any;
        isLoading: any;
        error: any;
    };
    aggregatedRecords: any[];
    scales: any;
    constructor(props: MethylCTrackProps);
    aggregateRecords: (data: any[], viewRegion: any, width: number) => any;
    computeScales: (xMap: any[], height: number, maxMethyl: number) => {
        methylToY: import("d3-scale").ScaleLinear<number, number, never>;
        depthToY: import("d3-scale").ScaleLinear<number, number, never>;
    };
    renderVisualizer(): import("react/jsx-runtime").JSX.Element;
    render(): import("react/jsx-runtime").JSX.Element;
}
export default MethylCTrack;
