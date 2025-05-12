import React from "react";
export declare const MIN_VIEW_REGION_SIZE = 5;
import OpenInterval from "../../../models/OpenInterval";
import DisplayedRegionModel from "../../../models/DisplayedRegionModel";
interface SelectableGenomeAreaProps {
    selectableRegion: DisplayedRegionModel;
    dragLimits: OpenInterval;
    y?: number | string;
    height?: number | string;
    children?: React.ReactNode;
    /**
     * Callback for when a region is selected.
     *
     * @param {number} start - context coordinate of the start of the new region
     * @param {number} end - context coordinate of the end of the new region
     */
    onRegionSelected?(start: number, end: number, selectedTool: number | string): void;
    selectedTool?: any;
}
/**
 * A SelectableArea, but also displays the selected length in base pairs, and puts a limit on the selected size.
 *
 * @author Silas Hsu
 */
export declare class SelectableGenomeArea extends React.PureComponent<SelectableGenomeAreaProps> {
    constructor(props: SelectableGenomeAreaProps);
    getSelectedBases(xSpan: OpenInterval): OpenInterval;
    getIsBaseSpanValid(baseSpan: OpenInterval): boolean;
    getIsAreaValid(xSpan: OpenInterval): boolean;
    getBoxCaption(xSpan: OpenInterval): import("react/jsx-runtime").JSX.Element;
    handleAreaSelect(xSpan: OpenInterval): void;
    render(): import("react/jsx-runtime").JSX.Element;
}
export {};
