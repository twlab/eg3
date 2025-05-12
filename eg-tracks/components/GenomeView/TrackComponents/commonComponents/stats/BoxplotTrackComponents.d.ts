import React from "react";
import * as d3 from "d3";
import TrackModel from "../../../../../models/TrackModel";
import DisplayedRegionModel from "../../../../../models/DisplayedRegionModel";
export declare const DEFAULT_OPTIONS: {
    height: number;
    boxColor: string;
    lineColor: string;
    windowSize: number;
};
/**
 * Track showing numerical data as boxplots.
 *
 * @author Daofeng Li
 */
interface BoxplotTrackProps {
    data: any;
    viewRegion: DisplayedRegionModel;
    width: number;
    trackModel: TrackModel;
    unit: string;
    options: any;
    forceSvg: boolean;
    viewWindow: any;
    getNumLegend: any;
}
declare class BoxplotTrackComponents extends React.PureComponent<BoxplotTrackProps> {
    /**
     */
    static propTypes: {
        /**
         * NumericalFeatureProcessor provides these.  Parents should provide an array of NumericalFeature.
         */
        data: any;
        unit: any;
        options: any;
        isLoading: any;
        error: any;
    };
    xMap: {};
    xAlias: {};
    scales: any;
    constructor(props: any);
    /**
     * make a map for x to the start x of each window, used for tooltip
     * @param {number} width
     * @param {number} size
     * @returns
     */
    makeXalias: (width: any, sizeInput: any) => {};
    computeBoxStats: (features: any) => {
        q1: number | undefined;
        q3: number | undefined;
        median: number | undefined;
        min: number;
        max: number;
        count: any;
    } | null;
    aggregateFeatures(data: any, viewRegion: any, width: any, useCenter: any, windowSize: any): {};
    computeScales(xMap: any, xAlias: any, height: any): {
        valueToY: d3.ScaleLinear<number, number, never>;
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
interface BoxplotProps {
    xMap: object;
    scales: any;
    height: number;
    width: number;
    windowSize: number;
    boxColor?: string;
    lineColor?: string;
    forceSvg?: boolean;
}
export declare class Boxplot extends React.PureComponent<BoxplotProps> {
    static propTypes: {
        xMap: any;
        scales: any;
        height: any;
        width: any;
        windowSize: any;
        boxColor: any;
        lineColor: any;
        forceSvg: any;
    };
    /**
     * Gets an element to draw for a data record.
     *
     * @param {number} value
     * @param {number} x
     * @return {JSX.Element} bar element to render
     */
    renderBox: (value: any, x1: any) => import("react/jsx-runtime").JSX.Element | null;
    render(): import("react/jsx-runtime").JSX.Element;
}
export default BoxplotTrackComponents;
