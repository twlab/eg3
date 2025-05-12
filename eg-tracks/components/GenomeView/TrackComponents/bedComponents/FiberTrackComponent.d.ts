import React from "react";
import { PropsFromTrackContainer } from "../commonComponents/Track";
import { Fiber } from "../../../../models/Feature";
import OpenInterval from "../../../../models/OpenInterval";
import DisplayedRegionModel from "../../../../models/DisplayedRegionModel";
import { FiberDisplayModes } from "../../../../trackConfigs/config-menu-models.tsx/DisplayModes";
export declare const FIBER_DENSITY_CUTOFF_LENGTH = 300000;
interface FiberTrackProps extends PropsFromTrackContainer {
    data: Fiber[];
    options: {
        color?: string;
        color2?: string;
        hiddenPixels?: number;
        rowHeight: number;
        height: number;
        maxRows: number;
        displayMode: FiberDisplayModes;
        hideMinimalItems: boolean;
        pixelsPadding?: number;
    };
    forceSvg?: boolean;
    visRegion: DisplayedRegionModel;
    getNumLegend: any;
    getAnnotationTrack: any;
    trackState: any;
    renderTooltip: any;
    svgHeight: any;
    updatedLegend: any;
    getGenePadding: any;
    getHeight: any;
    ROW_HEIGHT: any;
    onClose: any;
    xvaluesData?: any;
}
interface AggregatedFiber {
    on: number;
    off: number;
    count: number;
}
export declare const DEFAULT_OPTIONS: {
    hiddenPixels: number;
    rowHeight: number;
    color: string;
    color2: string;
    height: number;
    maxRows: number;
    displayMode: FiberDisplayModes;
    hideMinimalItems: boolean;
    pixelsPadding: number;
};
/**
 * Track component for fibers/methylmod.
 *
 * @author Daofeng Li
 */
declare class FiberTrackComponent extends React.Component<FiberTrackProps> {
    static displayName: string;
    xMap: AggregatedFiber[] | undefined;
    scales: any;
    constructor(props: FiberTrackProps);
    paddingFunc: (feature: Fiber, xSpan: OpenInterval) => number;
    /**
     * Renders one annotation.
     *
     * @param {PlacedFeature} - feature and drawing info
     * @param {number} y - y coordinate to render the annotation
     * @param {boolean} isLastRow - whether the annotation is assigned to the last configured row
     * @param {number} index - iteration index
     * @return {JSX.Element} element visualizing the feature
     */
    /**
     *
     * @param data
     * @param viewRegion
     * @param width
     * @returns
     */
    aggregateFibers: (data: Fiber[], viewRegion: DisplayedRegionModel, width: number) => any[];
    computeScales: () => {
        pctToY: import("d3-scale").ScaleLinear<number, number, never>;
        countToY: import("d3-scale").ScaleLinear<number, number, never>;
        pcts: number[];
        maxPct: any;
        counts: number[];
    };
    renderTooltipContents: (x: number) => import("react/jsx-runtime").JSX.Element | null;
    visualizer: () => import("react/jsx-runtime").JSX.Element;
    render(): any;
}
export default FiberTrackComponent;
