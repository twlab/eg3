import { default as TrackModel } from '../../../../models/TrackModel';
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
}
export declare const getHoverTooltip: {
    numerical: (dataObj: {
        [key: string]: any;
    }) => {
        toolTip: import("react/jsx-runtime").JSX.Element;
    };
    methyc: (dataObj: {
        [key: string]: any;
    }) => {
        toolTip: import("react/jsx-runtime").JSX.Element;
    };
    interactionHeatmap: (dataObj: {
        [key: string]: any;
    }) => "" | {
        beams: import("react/jsx-runtime").JSX.Element | null;
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
declare const _default: import('react').NamedExoticComponent<HoverToolTipProps>;
export default _default;
