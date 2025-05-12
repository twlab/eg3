import React, { JSX } from "react";
import { InteractionDisplayMode } from "../../../../trackConfigs/config-menu-models.tsx/DisplayModes";
import { FeaturePlacer } from "../../../../models/getXSpan/FeaturePlacer";
import { GenomeInteraction } from "../../../../getRemoteData/GenomeInteraction";
import { ScaleChoices } from "../../../../models/ScaleChoices";
import TrackModel from "../../../../models/TrackModel";
import OpenInterval from "../../../../models/OpenInterval";
import DisplayedRegionModel from "../../../../models/DisplayedRegionModel";
import { NormalizationMode } from "../../../../getRemoteData/HicDataModes";
interface InteractionTrackProps {
    data: GenomeInteraction[];
    options: {
        color: string;
        color2?: string;
        backgroundColor?: string;
        displayMode: InteractionDisplayMode;
        binSize?: number;
        scoreScale?: string;
        scalePercentile?: number;
        scoreMax?: number;
        scoreMin?: number;
        height: number;
        lineWidth?: number;
        greedyTooltip?: boolean;
        fetchViewWindowOnly?: boolean;
        maxValueFilter?: number;
        minValueFilter?: number;
        bothAnchorsInView?: boolean;
        clampHeight?: boolean;
        getNumLegend?: any;
    };
    forceSvg?: boolean;
    getBeamRefs?: any;
    onSetAnchors3d?: any;
    isThereG3dTrack?: boolean;
    trackModel: TrackModel;
    width: number;
    viewWindow: OpenInterval;
    visRegion: DisplayedRegionModel;
    getNumLegend: any;
}
export declare const DEFAULT_OPTIONS: {
    color: string;
    color2: string;
    backgroundColor: string;
    displayMode: InteractionDisplayMode;
    scoreScale: ScaleChoices;
    scoreMax: number;
    scalePercentile: number;
    scoreMin: number;
    height: number;
    lineWidth: number;
    greedyTooltip: boolean;
    fetchViewWindowOnly: boolean;
    bothAnchorsInView: boolean;
    isThereG3dTrack: boolean;
    clampHeight: boolean;
    binSize: number;
    normalization: NormalizationMode;
};
declare class InteractionTrackComponent extends React.PureComponent<InteractionTrackProps, {}> {
    featurePlacer: FeaturePlacer;
    scales: any;
    constructor(props: InteractionTrackProps);
    computeScale: () => {
        opacityScale: import("d3-scale").ScaleLinear<number, number, never>;
        heightScale: import("d3-scale").ScaleLinear<number, number, never>;
        min: any;
        max: any;
    };
    filterData: (data: GenomeInteraction[]) => GenomeInteraction[];
    render(): JSX.Element;
}
export default InteractionTrackComponent;
