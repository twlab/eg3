import React from "react";
interface Feature {
    getName: () => string;
    ons: number[];
    offs: number[];
    strand: string;
}
interface Placement {
    feature: Feature;
    xSpan: [number, number];
    visiblePart: {
        relativeStart: number;
        relativeEnd: number;
    };
}
interface FiberAnnotationProps {
    placement: Placement;
    y?: number;
    color?: string;
    color2?: string;
    rowHeight?: any;
    isMinimal?: boolean;
    displayMode?: string;
    hiddenPixels?: number;
    hideMinimalItems?: boolean;
    pixelsPadding?: number;
    renderTooltip?: any;
    onHideTooltip?: any;
}
declare class FiberAnnotation extends React.Component<FiberAnnotationProps> {
    render(): import("react/jsx-runtime").JSX.Element | null;
}
export default FiberAnnotation;
