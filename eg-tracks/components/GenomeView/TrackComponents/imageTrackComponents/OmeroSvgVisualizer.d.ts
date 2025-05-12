import React from "react";
export declare const MAX_NUMBER_THUMBNAILS = 384;
export declare const THUMBNAIL_PADDING = 2;
export declare const CORS_PROXY = "https://epigenome.wustl.edu/cors";
interface ImageProperties {
    viewWindow: any;
    width: number;
    height: number;
    thumbnailHeight: number;
    imageAspectRatio: number;
    data: any;
    trackModel: any;
}
interface ComponentState {
    imageData: any[];
    isLoading: boolean;
}
export declare class OmeroSvgVisualizer extends React.PureComponent<ImageProperties, ComponentState> {
    static propTypes: {
        options: any;
        data: any;
        viewWindow: any;
        width: any;
        trackModel: any;
        imageAspectRatio: any;
    };
    constructor(props: any);
    componentDidMount(): Promise<void>;
    componentDidUpdate(prevProps: any, prevState: any, snapshot: any): Promise<void>;
    fetchAllImage: () => Promise<void>;
    fetchImageData: (imgId: any) => Promise<any>;
    getBase64: (url: string) => Promise<string>;
    render(): import("react/jsx-runtime").JSX.Element;
}
export {};
