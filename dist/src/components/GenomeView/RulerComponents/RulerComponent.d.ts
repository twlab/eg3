import { default as React } from 'react';
import { default as DisplayedRegionModel } from '../../../models/DisplayedRegionModel';
import { default as TrackModel } from '../../../models/TrackModel';
interface RulerComponentProps {
    viewRegion: DisplayedRegionModel;
    width: number;
    x?: number;
    y?: number;
    genomeConfig?: any;
    trackModel: TrackModel;
    selectedRegion: DisplayedRegionModel;
    getNumLegend: any;
}
declare class RulerComponent extends React.Component<RulerComponentProps> {
    render(): import("react/jsx-runtime").JSX.Element;
}
export default RulerComponent;
