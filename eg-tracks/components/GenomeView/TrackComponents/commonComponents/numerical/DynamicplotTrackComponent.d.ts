import React from "react";
import { ScaleChoices } from "../../../../../models/ScaleChoices";
export declare const DEFAULT_OPTIONS: {
    aggregateMethod: string;
    height: number;
    yScale: ScaleChoices;
    yMax: number;
    yMin: number;
    smooth: number;
    color: string;
    backgroundColor: string;
    playing: boolean;
    speed: number[];
    dynamicColors: never[];
    useDynamicColors: boolean;
    dynamicLabels: never[];
};
import TrackModel from "../../../../../models/TrackModel";
interface Options {
    aggregateMethod: string;
    height: number;
    yScale: string;
    yMax: number;
    yMin: number;
    smooth: number;
    color: string;
    backgroundColor: string;
    playing: boolean;
    speed: number[];
    steps?: number;
    dynamicColors: string[];
    useDynamicColors: boolean;
    dynamicLabels: string[];
}
interface DynamicplotTrackProps {
    data: any[];
    unit?: string;
    options: Options;
    isLoading?: boolean;
    error?: any;
    viewRegion: any;
    viewWindow: any;
    trackModel: TrackModel;
    width: number;
    updatedLegend: any;
}
interface DynamicplotTrackState {
    xToValue: number[][] | null;
    scales: {
        valueToY: (value: number) => number;
        min: number;
        max: number;
    } | null;
}
declare class DynamicplotTrackComponent extends React.PureComponent<DynamicplotTrackProps, DynamicplotTrackState> {
    static propTypes: {
        data: any;
        unit: any;
        options: any;
        isLoading: any;
        error: any;
    };
    private xToValue;
    private scales;
    constructor(props: DynamicplotTrackProps);
    aggregateFeatures(data: any[], viewRegion: any, width: number, aggregatorId: string): any;
    computeScales(xToValue: number[][], height: number): {
        valueToY: import("d3-scale").ScaleLinear<number, number, never>;
        min: any;
        max: any;
    };
    /**
     * Renders the default tooltip that is displayed on hover.
     *
     * @param {number} relativeX - x coordinate of hover relative to the visualizer
     * @return {JSX.Element} tooltip to render
     */
    render(): import("react/jsx-runtime").JSX.Element;
}
export default DynamicplotTrackComponent;
