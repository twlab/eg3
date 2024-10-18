import { default as React } from 'react';
import { default as PropTypes } from 'prop-types';
import { ScaleChoices } from '../../../../models/ScaleChoices';
import { NumericalAggregator } from './NumericalAggregator';
import { default as Feature } from '../../../../models/Feature';
interface NumericalTrackProps {
    data: Feature[];
    unit?: string;
    options: any;
    isLoading?: boolean;
    error?: any;
    trackModel?: any;
    groupScale?: any;
    viewWindow: any;
    viewRegion: any;
    width: any;
    forceSvg: any;
    getNumLegend?: any;
}
export declare const DEFAULT_OPTIONS: {
    aggregateMethod: string;
    displayMode: string;
    height: number;
    color: string;
    colorAboveMax: string;
    color2: string;
    color2BelowMin: string;
    yScale: ScaleChoices;
    yMax: number;
    yMin: number;
    smooth: number;
    ensemblStyle: boolean;
    backgroundColor: string;
};
/**
 * Track specialized in showing numerical data.
 *
 * @author Silas Hsu
 */
declare class NumericalTrack extends React.PureComponent<NumericalTrackProps> {
    /**
     * Don't forget to look at NumericalFeatureProcessor's propTypes!
     */
    xToValue: any;
    xToValue2: any;
    scales: any;
    hasReverse: boolean;
    renderTooltip: any;
    aggregator: NumericalAggregator;
    constructor(props: any);
    computeScales(xToValue: any, xToValue2: any, height: any): {
        axisScale: import('d3-scale').ScaleLinear<number, number, never>;
        valueToY: import('d3-scale').ScaleLinear<number, number, never>;
        valueToYReverse: import('d3-scale').ScaleLinear<number, number, never>;
        valueToOpacity: import('d3-scale').ScaleLinear<number, number, never>;
        valueToOpacityReverse: import('d3-scale').ScaleLinear<number, number, never>;
        min: any;
        max: any;
        zeroLine: any;
    };
    getEffectiveDisplayMode(): any;
    /**
     * Renders the default tooltip that is displayed on hover.
     *
     * @param {number} relativeX - x coordinate of hover relative to the visualizer
     * @param {number} value -
     * @return {JSX.Element} tooltip to render
     */
    render(): import("react/jsx-runtime").JSX.Element;
}
interface ValueTrackProps {
    xToValue: any[];
    scales: Record<string, any>;
    height: number;
    color?: string;
    isDrawingBars?: boolean;
    colorOut?: any;
    forceSvg?: any;
    width: any;
}
export declare class ValuePlot extends React.PureComponent<ValueTrackProps> {
    static propTypes: {
        xToValue: PropTypes.Validator<any[]>;
        scales: PropTypes.Validator<object>;
        height: PropTypes.Validator<number>;
        color: PropTypes.Requireable<string>;
        isDrawingBars: PropTypes.Requireable<boolean>;
        width: PropTypes.Requireable<any>;
    };
    constructor(props: any);
    /**
     * Gets an element to draw for a data record.
     *
     * @param {number} value
     * @param {number} x
     * @return {JSX.Element} bar element to render
     */
    renderPixel(value: any, x: any): import("react/jsx-runtime").JSX.Element | null;
    render(): import("react/jsx-runtime").JSX.Element;
}
export default NumericalTrack;
