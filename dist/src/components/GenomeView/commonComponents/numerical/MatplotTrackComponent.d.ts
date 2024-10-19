import { default as React } from 'react';
import { default as PropTypes } from 'prop-types';
import { ScaleChoices } from '../../../../models/ScaleChoices';
import { default as Feature } from '../../../../models/Feature';
export declare const DEFAULT_OPTIONS: {
    aggregateMethod: string;
    height: number;
    yScale: ScaleChoices;
    yMax: number;
    yMin: number;
    smooth: number;
    lineWidth: number;
};
interface MatplotTrackProps {
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
    getNumLegend: any;
}
/**
 * Track specialized in showing numerical data in matplot style, aka. lineplot
 *
 * @author Daofeng Li
 */
declare class MatplotTrackComponent extends React.PureComponent<MatplotTrackProps> {
    /**
     * Don't forget to look at NumericalFeatureProcessor's propTypes!
     */
    static propTypes: {
        /**
         * NumericalFeatureProcessor provides these.  Parents should provide an array of NumericalFeature.
         */
        data: PropTypes.Validator<any[]>;
        unit: PropTypes.Requireable<string>;
        options: PropTypes.Validator<NonNullable<PropTypes.InferProps<{
            aggregateMethod: PropTypes.Requireable<string>;
            height: PropTypes.Validator<number>;
        }>>>;
        isLoading: PropTypes.Requireable<boolean>;
        error: PropTypes.Requireable<any>;
    };
    xToValue: any;
    scales: any;
    constructor(props: any);
    aggregateFeatures(data: any, viewRegion: any, width: any, aggregatorId: any): any;
    computeScales(xToValue: any, height: any): {
        valueToY: import('d3-scale').ScaleLinear<number, number, never>;
        min: any;
        max: any;
    };
    /**
     * Renders the default tooltip that is displayed on hover.
     *
     * @param {number} relativeX - x coordinate of hover relative to the visualizer
     * @param {number} value -
     * @return {JSX.Element} tooltip to render
     */
    renderTooltip(relativeX: any): import("react/jsx-runtime").JSX.Element;
    render(): import("react/jsx-runtime").JSX.Element;
}
export default MatplotTrackComponent;
