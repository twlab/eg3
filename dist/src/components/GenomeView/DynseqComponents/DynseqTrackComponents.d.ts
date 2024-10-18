import { PureComponent } from 'react';
import { default as PropTypes } from 'prop-types';
import { ScaleChoices } from '../../../models/ScaleChoices';
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
}
declare class DynseqTrackComponents extends PureComponent<DynseqTrackProps> {
    static propTypes: {
        data: PropTypes.Validator<any[]>;
        unit: PropTypes.Requireable<string>;
        options: PropTypes.Validator<NonNullable<PropTypes.InferProps<{
            aggregateMethod: PropTypes.Requireable<string>;
            height: PropTypes.Validator<number>;
            color: PropTypes.Requireable<string>;
        }>>>;
        isLoading: PropTypes.Requireable<boolean>;
        error: PropTypes.Requireable<any>;
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
        valueToHeight: import('d3-scale').ScaleLinear<number, number, never>;
        valueToY: import('d3-scale').ScaleLinear<number, number, never>;
        axisScale: import('d3-scale').ScaleLinear<number, number, never>;
        valueToYReverse: import('d3-scale').ScaleLinear<number, number, never>;
        valueToOpacity: import('d3-scale').ScaleLinear<number, number, never>;
        valueToOpacityReverse: import('d3-scale').ScaleLinear<number, number, never>;
        min: number;
        max: number;
        zeroLine: number;
    } | {
        valueToHeight: import('d3-scale').ScaleLinear<number, number, never>;
        valueToY: import('d3-scale').ScaleLinear<number, number, never>;
        axisScale: import('d3-scale').ScaleLinear<number, number, never>;
        valueToOpacity: import('d3-scale').ScaleLinear<number, number, never>;
        min: number;
        max: number;
        zeroLine: number;
        valueToYReverse?: undefined;
        valueToOpacityReverse?: undefined;
    };
    render(): import("react/jsx-runtime").JSX.Element;
}
export default DynseqTrackComponents;
