import React from "react";
export declare const MAX_NUMBER_THUMBNAILS = 384;
export declare const THUMBNAIL_PADDING = 2;
export declare const DEFAULT_OPTIONS: {
    imageHeight: number[];
    backgroundColor: string;
    fetchViewWindowOnly: boolean;
    imageAspectRatio: number;
    displayMode: string;
    height: number;
};
interface OmeroTrackProps {
    data: {
        images: any[];
    }[];
    options: typeof DEFAULT_OPTIONS;
    viewWindow: {
        start: number;
        end: number;
    };
    trackModel: any;
    forceSvg: boolean;
    width: number;
    layoutModel: any;
    isThereG3dTrack: boolean;
    onSetImageInfo: any;
    heightObj: any;
}
declare class OmeroTrackComponents extends React.PureComponent<OmeroTrackProps> {
    constructor(props: OmeroTrackProps);
    render(): import("react/jsx-runtime").JSX.Element;
}
export default OmeroTrackComponents;
