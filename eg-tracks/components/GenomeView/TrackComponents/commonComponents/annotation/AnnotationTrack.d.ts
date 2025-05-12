import React from "react";
export declare const DEFAULT_OPTIONS: {
    displayMode: string;
    color: string;
    color2: string;
    maxRows: number;
    height: number;
    hideMinimalItems: boolean;
    sortItems: boolean;
};
/**
 * A component that visualizes annotations or Features.
 *
 * @author Silas Hsu
 */
interface AnnotationTrackProps {
    options: {
        displayMode: string;
        [key: string]: any;
    };
}
export declare class AnnotationTrack extends React.PureComponent<AnnotationTrackProps> {
    render(): import("react/jsx-runtime").JSX.Element;
}
export default AnnotationTrack;
