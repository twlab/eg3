import { default as React } from 'react';
import { ScaleLinear } from 'd3-scale';
import { PlacedInteraction } from '../../../models/getXSpan/FeaturePlacer';
import { default as OpenInterval } from '../../../models/OpenInterval';
interface HeatmapProps {
    placedInteractions: PlacedInteraction[];
    viewWindow: OpenInterval;
    width: number;
    height: number;
    opacityScale: ScaleLinear<number, number>;
    color: any;
    color2: any;
    forceSvg?: boolean;
    bothAnchorsInView?: boolean;
    fetchViewWindowOnly?: boolean;
    legendWidth?: number;
    getBeamRefs: any;
    onSetAnchors3d?: any;
    onShowTooltip?: any;
    onHideTooltip?: any;
    isThereG3dTrack?: boolean;
    clampHeight?: boolean;
    options?: any;
}
declare class HeatmapNoLegendWidth extends React.PureComponent<HeatmapProps> {
    hmData: any[] | undefined;
    beamsRef: any;
    clampScale: ScaleLinear<number, number> | undefined;
    renderRect: (placedInteraction: PlacedInteraction, index: number) => import("react/jsx-runtime").JSX.Element | null;
    /**
     * Renders the default tooltip that is displayed on hover.
     *
     * @param {number} relativeX - x coordinate of hover relative to the visualizer
     * @param {number} relativeY - y coordinate of hover relative to the visualizer
     * @return {JSX.Element} tooltip to render
     */
    set3dAnchors: (anchors: any) => void;
    render(): import("react/jsx-runtime").JSX.Element;
}
export default HeatmapNoLegendWidth;
