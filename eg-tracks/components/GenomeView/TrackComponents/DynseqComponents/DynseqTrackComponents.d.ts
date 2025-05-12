import { PureComponent } from "react";
import { ScaleChoices } from "../../../../models/ScaleChoices";
export declare const MAX_PIXELS_PER_BASE_NUMERIC = 0.5;
export declare const DEFAULT_OPTIONS: {
    aggregateMethod: string;
    height: number;
    color: string;
    color2: string;
    yScale: ScaleChoices;
    yMax: number;
    yMin: number;
};
interface DynseqTrackProps {
    data: any[];
    unit?: string;
    options: {
        aggregateMethod: string;
        height: number;
        color?: string;
        yScale?: string;
        yMin?: number;
        yMax?: number;
        displayMode: string;
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
    basesByPixel: number;
    genomeConfig: any;
    xvaluesData: any;
}
declare class DynseqTrackComponents extends PureComponent<DynseqTrackProps> {
    static propTypes: {
        data: any;
        unit: any;
        options: any;
        isLoading: any;
        error: any;
    };
    xToValue: Array<any> | null;
    xToValue2: Array<any> | null;
    allValues: Array<any>;
    drawHeights: Array<any>;
    scales: any;
    hasReverse: boolean;
    constructor(props: DynseqTrackProps);
    aggregateFeatures: (data: any[], viewRegion: any, width: number, aggregatorId: string) => any;
    computeScales: (xToValue: number[], xToValue2: number[], height: number) => {
        valueToHeight: import("d3-scale").ScaleLinear<number, number, never>;
        valueToY: import("d3-scale").ScaleLinear<number, number, never>;
        axisScale: import("d3-scale").ScaleLinear<number, number, never>;
        valueToYReverse: import("d3-scale").ScaleLinear<number, number, never>;
        valueToOpacity: import("d3-scale").ScaleLinear<number, number, never>;
        valueToOpacityReverse: import("d3-scale").ScaleLinear<number, number, never>;
        min: any;
        max: any;
        zeroLine: number;
    } | {
        valueToHeight: import("d3-scale").ScaleLinear<number, number, never>;
        valueToY: import("d3-scale").ScaleLinear<number, number, never>;
        axisScale: import("d3-scale").ScaleLinear<number, number, never>;
        valueToOpacity: import("d3-scale").ScaleLinear<number, number, never>;
        min: any;
        max: any;
        zeroLine: number;
        valueToYReverse?: undefined;
        valueToOpacityReverse?: undefined;
    };
    render(): import("react/jsx-runtime").JSX.Element;
}
export default DynseqTrackComponents;
