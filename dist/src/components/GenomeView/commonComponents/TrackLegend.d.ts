import { default as React } from 'react';
import { ScaleLinear } from 'd3-scale';
import { default as TrackModel } from '../../../models/TrackModel';
import { default as DisplayedRegionModel } from '../../../models/DisplayedRegionModel';
interface TrackLegendProps {
    trackModel: TrackModel;
    width: number;
    height: number;
    axisScale?: ScaleLinear<number, number>;
    axisScaleReverse?: ScaleLinear<number, number>;
    style?: object;
    trackWidth?: number;
    trackViewRegion?: DisplayedRegionModel;
    hideFirstAxisLabel?: boolean;
    noShiftFirstAxisLabel?: boolean;
    selectedRegion?: DisplayedRegionModel;
    axisLegend?: any;
}
/**
 * A box displaying labels, axes, and other important track info.
 *
 * @author Silas Hsu
 */
declare class TrackLegend extends React.PureComponent<TrackLegendProps> {
    static defaultProps: {
        width: number;
    };
    private gNode;
    constructor(props: TrackLegendProps);
    componentDidMount(): void;
    componentDidUpdate(nextProps: TrackLegendProps): void;
    handleRef(node: SVGGElement): void;
    drawAxis(): void;
    getLabelWidth(): number | undefined;
    plotATCGLegend(): import("react/jsx-runtime").JSX.Element[];
    render(): import("react/jsx-runtime").JSX.Element | null;
}
export default TrackLegend;
