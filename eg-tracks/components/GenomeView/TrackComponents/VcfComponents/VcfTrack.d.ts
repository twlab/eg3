import React from "react";
import { PlacedFeatureGroup } from "../../../../models/FeatureArranger";
import OpenInterval from "../../../../models/OpenInterval";
import DisplayedRegionModel from "../../../../models/DisplayedRegionModel";
import Vcf from "./Vcf";
export declare const DEFAULT_OPTIONS: {
    highValueColor: string;
    lowValueColor: string;
    maxRows: number;
    rowHeight: number;
    hiddenPixels: number;
    colorScaleKey: string;
    displayMode: string;
    ensemblStyle: boolean;
};
interface VcfTrackProps {
    data: Vcf[];
    viewRegion: DisplayedRegionModel;
    viewWindow: OpenInterval;
    trackState: any;
    width: number;
    options: {
        highValueColor?: any;
        lowValueColor?: any;
        maxRows?: number;
        rowHeight: number;
        alwaysDrawLabel?: boolean;
        hiddenPixels?: number;
        colorScaleKey: string;
        displayMode?: string;
    };
    renderTooltip: any;
    svgHeight: any;
    trackModel: any;
    updatedLegend: any;
    getGenePadding: any;
    getHeight: any;
    xvaluesData?: any;
    getNumLegend: any;
}
/**
 * Track component for VCF annotations.
 *
 * @author Daofeng Li
 */
declare class VcfTrack extends React.Component<VcfTrackProps> {
    static displayName: string;
    scales: any;
    constructor(props: VcfTrackProps);
    computeColorScales: (data: Vcf[], colorKey: string, lowValueColor: any, highValueColor: any) => import("d3-scale").ScaleLinear<number, number, never>;
    /**
     * Renders the tooltip for a feature.
     *
     * @param {React.MouseEvent} event - mouse event that triggered the tooltip request
     * @param {Vcf} vcf - vcf for which to display details
     */
    /**
     * Renders one annotation.
     *
     * @param {PlacedFeature} - feature and drawing info
     * @param {number} y - y coordinate to render the annotation
     * @param {boolean} isLastRow - whether the annotation is assigned to the last configured row
     * @param {number} index - iteration index
     * @return {JSX.Element} element visualizing the feature
     */
    renderAnnotation(placedGroup: PlacedFeatureGroup, y: number, isLastRow: boolean, index: number): import("react/jsx-runtime").JSX.Element[];
    render(): any;
}
export default VcfTrack;
