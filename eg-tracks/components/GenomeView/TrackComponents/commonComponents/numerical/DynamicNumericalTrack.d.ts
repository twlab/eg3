import React from "react";
export declare const DEFAULT_OPTIONS: {
    arrayAggregateMethod: string;
    height: number;
    color: string;
    backgroundColor: string;
    playing: boolean;
    speed: number[];
    dynamicColors: never[];
    useDynamicColors: boolean;
};
interface DynamicNumericalTrackProps {
    data: any[];
    unit?: string;
    options: {
        arrayAggregateMethod: string;
        height: number;
        color?: string;
        backgroundColor?: string;
        playing?: boolean;
        speed?: number[];
        dynamicColors?: string[];
        useDynamicColors?: boolean;
    };
    isLoading?: boolean;
    error?: any;
    trackModel: any;
    viewRegion: any;
    width: number;
    viewWindow: {
        start: number;
        end: number;
    };
    updatedLegend?: any;
}
declare const DynamicNumericalTrack: React.FC<DynamicNumericalTrackProps>;
export default DynamicNumericalTrack;
