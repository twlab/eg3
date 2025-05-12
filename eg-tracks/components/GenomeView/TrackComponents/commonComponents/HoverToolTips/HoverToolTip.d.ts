/// <reference types="react" />
import TrackModel from "../../../../../models/TrackModel";
interface HoverToolTipProps {
    data: any;
    windowWidth: number;
    trackIdx?: number;
    length?: number;
    side?: string;
    trackType: string;
    trackModel?: TrackModel;
    height: number;
    viewRegion?: any;
    unit?: string | undefined;
    data2?: any;
    hasReverse?: boolean;
    options?: any;
    legendWidth?: any;
    viewWindow?: any;
    scale?: any;
    xAlias?: any;
}
export declare const getHoverTooltip: {
    numerical: (dataObj: {
        [key: string]: any;
    }) => {
        toolTip: import("react/jsx-runtime").JSX.Element;
    };
    dbedgraph: (dataObj: {
        [key: string]: any;
    }) => {
        toolTip: import("react/jsx-runtime").JSX.Element;
    } | null;
    dynamichic: (dataObj: {
        [key: string]: any;
    }) => {
        toolTip: import("react/jsx-runtime").JSX.Element;
    } | undefined;
    dynamic: (dataObj: {
        [key: string]: any;
    }) => {
        toolTip: import("react/jsx-runtime").JSX.Element;
    } | null;
    modbed: (dataObj: {
        [key: string]: any;
    }) => {
        toolTip: import("react/jsx-runtime").JSX.Element;
    } | null;
    matplot: (dataObj: {
        [key: string]: any;
    }) => {
        toolTip: import("react/jsx-runtime").JSX.Element;
    } | null;
    boxplot: (dataObj: {
        [key: string]: any;
    }) => {
        toolTip: import("react/jsx-runtime").JSX.Element;
    } | null;
    methyc: (dataObj: {
        [key: string]: any;
    }) => {
        toolTip: import("react/jsx-runtime").JSX.Element;
    };
    interactionHeatmap: (dataObj: any) => "" | {
        beams: import("react/jsx-runtime").JSX.Element;
        toolTip: import("react/jsx-runtime").JSX.Element;
    };
    interactionArc: (dataObj: {
        [key: string]: any;
    }) => "" | {
        toolTip: import("react/jsx-runtime").JSX.Element;
    };
    interactionSquareDisplay: (dataObj: {
        [key: string]: any;
    }) => "" | {
        toolTip: import("react/jsx-runtime").JSX.Element;
    };
    genomealignFine: (dataObj: {
        [key: string]: any;
    }) => {
        toolTip: import("react/jsx-runtime").JSX.Element;
    };
    genomealignRough: (dataObj: {
        [key: string]: any;
    }) => {
        toolTip: import("react/jsx-runtime").JSX.Element;
    };
};
declare const _default: import("react").NamedExoticComponent<HoverToolTipProps>;
export default _default;
