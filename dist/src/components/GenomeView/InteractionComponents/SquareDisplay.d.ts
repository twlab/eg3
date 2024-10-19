import { default as React } from 'react';
import { ScaleLinear } from 'd3-scale';
import { PlacedInteraction } from '../../../models/getXSpan/FeaturePlacer';
import { default as OpenInterval } from '../../../models/OpenInterval';
interface SquareDisplayProps {
    placedInteractions: PlacedInteraction[];
    viewWindow: OpenInterval;
    width: number;
    height: number;
    opacityScale: ScaleLinear<number, number>;
    color: string;
    color2?: string;
    forceSvg?: boolean;
    bothAnchorsInView?: boolean;
    options: any;
}
export declare class SquareDisplay extends React.PureComponent<SquareDisplayProps, {}> {
    static getHeight(props: SquareDisplayProps): number;
    hmData: any[];
    renderRect: (placedInteraction: PlacedInteraction, index: number) => import("react/jsx-runtime").JSX.Element | null;
    /**
     * Renders the default tooltip that is displayed on hover.
     *
     * @param {number} relativeX - x coordinate of hover relative to the visualizer
     * @param {number} relativeY - y coordinate of hover relative to the visualizer
     * @return {JSX.Element} tooltip to render
     */
    renderTooltip: (relativeX: number, relativeY: number) => import("react/jsx-runtime").JSX.Element | null;
    findPolygon: (x: number, y: number) => any;
    render(): import("react/jsx-runtime").JSX.Element;
}
export {};
