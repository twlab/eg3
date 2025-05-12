import React from "react";
import { ScaleLinear } from "d3-scale";
import { PlacedInteraction } from "../../../../models/getXSpan/FeaturePlacer";
import OpenInterval from "../../../../models/OpenInterval";
interface ArcDisplayProps {
    placedInteractions: PlacedInteraction[];
    viewWindow: OpenInterval;
    width: number;
    height: number;
    lineWidth?: number;
    opacityScale: ScaleLinear<number, number>;
    color: string;
    color2?: string;
    forceSvg?: boolean;
    greedyTooltip?: boolean;
    bothAnchorsInView?: boolean;
    fetchViewWindowOnly?: boolean;
    onSetAnchors3d?: any;
    onShowTooltip?: any;
    onHideTooltip?: any;
    isThereG3dTrack?: boolean;
    clampHeight?: boolean;
    options?: any;
}
export declare class ArcDisplay extends React.PureComponent<ArcDisplayProps, {}> {
    arcData: any[];
    clampScale: ScaleLinear<number, number>;
    renderArc: (placedInteraction: PlacedInteraction, index: number) => import("react/jsx-runtime").JSX.Element | null;
    renderTooltip: (relativeX: number, relativeY: number) => import("react/jsx-runtime").JSX.Element | null;
    findArc: (x: number, y: number) => any;
    findArcs: (x: number, y: number) => any;
    set3dAnchors: (anchors: any) => void;
    render(): import("react/jsx-runtime").JSX.Element;
}
export declare function moveTo(x: number, y: number): string;
export declare function cubicCurveTo(controlX1: number, controlY1: number, controlX2: number, controlY2: number, x: number, y: number): string;
export {};
