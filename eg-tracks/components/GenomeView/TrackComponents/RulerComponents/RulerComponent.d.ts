import React from "react";
import DisplayedRegionModel from "../../../../models/DisplayedRegionModel";
import TrackModel from "../../../../models/TrackModel";
interface RulerComponentProps {
    viewRegion: DisplayedRegionModel;
    width: number;
    x?: number;
    y?: number;
    genomeConfig?: any;
    trackModel: TrackModel;
    selectedRegion: DisplayedRegionModel;
    getNumLegend: any;
    options: any;
    viewWindow: any;
}
declare class RulerComponent extends React.Component<RulerComponentProps> {
    render(): import("react/jsx-runtime").JSX.Element;
}
export default RulerComponent;
