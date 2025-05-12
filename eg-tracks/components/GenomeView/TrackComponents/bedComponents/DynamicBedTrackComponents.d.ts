import React from "react";
export declare const TOP_PADDING = 2;
export declare const ROW_VERTICAL_PADDING = 2;
export declare const DEFAULT_OPTIONS: {
    color: string;
    color2: string;
    rowHeight: number;
    maxRows: number;
    hiddenPixels: number;
    speed: number[];
    playing: boolean;
    dynamicColors: never[];
    useDynamicColors: boolean;
};
interface DynamicBedTrackProps {
    data: any[];
    visRegion: any;
    viewWindow: {
        start: number;
    };
    width: number;
    options: any;
    trackModel: any;
    svgHeight?: any;
    updatedLegend?: any;
}
declare const DynamicBedTrackComponents: React.FC<DynamicBedTrackProps>;
export default DynamicBedTrackComponents;
