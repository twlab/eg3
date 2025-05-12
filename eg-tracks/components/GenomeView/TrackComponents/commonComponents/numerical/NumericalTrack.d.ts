import React from "react";
import { ScaleChoices } from "../../../../../models/ScaleChoices";
interface NumericalTrackProps {
    data?: Array<any>;
    unit?: string;
    options?: any;
    isLoading?: boolean;
    error?: any;
    trackModel?: any;
    groupScale?: any;
    viewWindow?: any;
    viewRegion?: any;
    width?: any;
    forceSvg?: any;
    getNumLegend?: any;
    xvaluesData?: Array<any>;
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
declare const NumericalTrack: React.FC<NumericalTrackProps>;
export default NumericalTrack;
