import React from "react";
import OpenInterval from "../../../../models/OpenInterval";
import TrackModel from "../../../../models/TrackModel";
interface ObjectAsTableProps {
    title?: string;
    content: any;
}
interface OmeroHtmlVisualizerProps {
    options?: any;
    data: {
        images: {
            imageId: string;
        }[];
    }[];
    viewWindow: OpenInterval;
    trackModel: TrackModel;
    imageAspectRatio: number;
    layout?: any;
    layoutModel: any;
    thumbnailHeight: any;
    height: any;
    onSetImageInfo: any;
    onSetLayout?: (layout: any) => void;
    onShowTooltip?: (tooltip: React.ReactNode) => void;
    onHideTooltip?: () => void;
    isThereG3dTrack: boolean;
}
export declare function ObjectAsTable(props: ObjectAsTableProps): import("react/jsx-runtime").JSX.Element;
declare class OmeroHtmlVisualizer extends React.PureComponent<OmeroHtmlVisualizerProps> {
    static propTypes: {
        options: any;
        data: any;
        viewWindow: any;
        trackModel: any;
        imageAspectRatio: any;
    };
    newPanelWithImage: (imageId: string, imageUrl: string, imageUrlSuffix: string, detailUrl: string) => void;
    renderTooltip: (event: React.MouseEvent, imgHash: Record<string, any>, imgId: string, imageUrl: string, imageUrlSuffix: string, detailUrl: string) => void;
    render(): import("react/jsx-runtime").JSX.Element;
}
export default OmeroHtmlVisualizer;
