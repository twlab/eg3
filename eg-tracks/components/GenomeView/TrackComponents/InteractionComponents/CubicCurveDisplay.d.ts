import React from "react";
import { PlacedInteraction } from "../../../../models/getXSpan/FeaturePlacer";
import OpenInterval from "../../../../models/OpenInterval";
import { ScaleLinear } from "d3-scale";
interface CubicCurveDisplayProps {
    placedInteractions: PlacedInteraction[];
    viewWindow: OpenInterval;
    width: number;
    height: number;
    lineWidth?: number;
    heightScale: ScaleLinear<number, number>;
    color: string;
    color2?: string;
    forceSvg?: boolean;
    bothAnchorsInView?: boolean;
    options?: any;
}
export declare class CubicCurveDisplay extends React.PureComponent<CubicCurveDisplayProps, {}> {
    renderCurve: (placedInteraction: PlacedInteraction, index: number) => import("react/jsx-runtime").JSX.Element | null;
    render(): import("react/jsx-runtime").JSX.Element;
}
export {};
