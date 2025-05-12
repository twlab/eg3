import React from "react";
import { LogChoices } from "../../../../models/LogChoices";
import { ScaleChoices } from "../../../../models/ScaleChoices";
type Options = {
    height: number;
    color: string;
    color2: string;
    yScale: string;
    logScale: string;
    show: string;
    sampleSize: number;
    opacity: number[];
    yMax: number;
    yMin: number;
    markerSize: number;
    showHorizontalLine: boolean;
    horizontalLineValue: number;
};
type QBed = {
    value: number;
    strand: string;
    annotation: string;
    relativeX?: number;
    relativeY?: number;
};
type QBedTrackProps = {
    data: QBed[];
    options: Options;
    isLoading: boolean;
    error: any;
    viewRegion: any;
    width: number;
    trackModel: any;
    viewWindow: any;
    forceSvg: boolean;
    getNumLegend: any;
};
export declare const DEFAULT_OPTIONS: {
    height: number;
    color: string;
    color2: string;
    yScale: ScaleChoices;
    logScale: LogChoices;
    show: string;
    sampleSize: number;
    opacity: number[];
    yMax: number;
    yMin: number;
    markerSize: number;
    showHorizontalLine: boolean;
    horizontalLineValue: number;
};
/**
 * Track specialized in showing qBED data.
 */
declare class QBedTrackComponents extends React.PureComponent<QBedTrackProps> {
    private xToValue;
    private scales;
    constructor(props: QBedTrackProps);
    aggregateFeatures(data: Array<any>, viewRegion: any, width: number): any;
    computeScales(xToValue: any, height: number): {
        valueToY: import("d3-scale").ScaleLinear<number, number, never>;
        min: number;
        max: any;
    };
    renderTooltip(relativeX: number, relativeY: number): import("react/jsx-runtime").JSX.Element | undefined;
    formatCards: (quanta: QBed[]) => import("react/jsx-runtime").JSX.Element;
    nearestCards: (quanta: QBed[], relativeX: number, relativeY: number, radius: number) => QBed[];
    shuffleArray: (a: any[]) => any[];
    randomCards: (quanta: any[], n: number) => any[];
    downSample(xToValue: any[], sampleSize: number): any[];
    render(): import("react/jsx-runtime").JSX.Element;
}
export default QBedTrackComponents;
