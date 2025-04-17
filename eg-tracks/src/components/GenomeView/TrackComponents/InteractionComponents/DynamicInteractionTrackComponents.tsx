import React, { MouseEvent } from "react";
import _ from "lodash";
import { scaleLinear } from "d3-scale";
import { PixiHeatmap } from "./PixiHeatmap";
import PixiArc from "./PixiArc";
import { FeaturePlacer } from "../../../../models/getXSpan/FeaturePlacer";
import { GenomeInteraction } from "../../../../getRemoteData/GenomeInteraction";
import { ScaleChoices } from "../../../../models/ScaleChoices";
import { DynamicInteractionDisplayMode } from "../../../../trackConfigs/config-menu-models.tsx/DisplayModes";
import TrackLegend from "../commonComponents/TrackLegend";

interface DynamicInteractionTrackComponentsProps {
  data: GenomeInteraction[];
  options: {
    color: string;
    color2?: string;
    backgroundColor?: string;
    binSize?: number;
    scoreScale?: string;
    scoreMax?: number;
    scoreMin?: number;
    height: number;
    playing?: boolean;
    speed?: number[];
    lineWidth?: number;
    displayMode: DynamicInteractionDisplayMode;
    dynamicColors?: any[];
    useDynamicColors?: boolean;
  };
  viewer3dNumFrames?: any;
  trackModel: any;
  visRegion: any;
  width: number;
  viewWindow: any; updatedLegend?: any
}

export const DEFAULT_OPTIONS = {
  color: "#B8008A",
  color2: "#006385",
  backgroundColor: "var(--bg-color)",
  scoreScale: ScaleChoices.AUTO,
  scoreMax: 10,
  scoreMin: 0,
  height: 500,
  playing: true,
  speed: [5],
  lineWidth: 1,
  useDynamicColors: false,
  dynamicColors: [] as any[],
  displayMode: DynamicInteractionDisplayMode.HEATMAP,
};

class DynamicInteractionTrackComponents extends React.PureComponent<DynamicInteractionTrackComponentsProps> {
  public featurePlacer: FeaturePlacer;
  scales: any;

  constructor(props: DynamicInteractionTrackComponentsProps) {
    super(props);
    this.scales = null;
    this.featurePlacer = new FeaturePlacer();
    // this.featurePlacer.placeInteractions = memoizeOne(this.featurePlacer.placeInteractions);
    // this.computeScale = memoizeOne(this.computeScale);
  }

  computeScale = () => {
    const { scoreScale, scoreMin, scoreMax } = this.props.options;
    const maxValues = this.props.data.map((d: any) => {
      const maxObj: any = _.maxBy(d, "score");
      return maxObj ? maxObj.score : 1;
    });
    const maxScore = _.max(maxValues);
    if (scoreScale === ScaleChoices.AUTO) {
      return {
        opacityScale: scaleLinear()
          .domain([0, maxScore])
          .range([0, 1])
          .clamp(true),
        min: 0,
        max: maxScore,
      };
    } else {
      if (
        scoreMin !== undefined &&
        scoreMax !== undefined &&
        scoreMin >= scoreMax
      ) {
        console.error("Score min cannot be greater than Score max");
        return {
          opacityScale: scaleLinear()
            .domain([scoreMax - 1, scoreMax])
            .range([0, 1])
            .clamp(true),
          min: scoreMax - 1,
          max: scoreMax,
        };
      }
      return {
        opacityScale: scaleLinear()
          .domain([scoreMin!, scoreMax!])
          .range([0, 1])
          .clamp(true),
        min: scoreMin,
        max: scoreMax,
      };
    }
  };

  showTooltip(event: MouseEvent, interaction: GenomeInteraction) {
    // Implement your tooltip logic here
    const tooltip = (
      <div>
        <div>Locus1: {interaction.locus1.toString()}</div>
        <div>Locus2: {interaction.locus2.toString()}</div>
        <div>Score: {interaction.score}</div>
      </div>
    );
    // Render tooltip as needed
  }

  render(): JSX.Element {
    const {
      data,
      trackModel,
      visRegion,
      width,
      viewWindow,
      options,
      viewer3dNumFrames,
      updatedLegend,
    } = this.props;
    this.scales = this.computeScale();

    const visualizerProps = {
      placedInteractionsArray: data.map((d: any) =>
        this.featurePlacer.placeInteractions(d, visRegion, width)
      ),
      viewWindow,
      width,
      height: options.height,
      opacityScale: this.scales.opacityScale,
      color: options.color,
      color2: options.color2,
      backgroundColor: options.backgroundColor,
      binSize: options.binSize,


      playing: options.playing,
      speed: options.speed,
      trackModel,
      lineWidth: options.lineWidth,
      dynamicColors: options.dynamicColors,
      useDynamicColors: options.useDynamicColors,
      viewer3dNumFrames,
    };
    let visualizer;
    if (updatedLegend) {
      updatedLegend.current = (
        <TrackLegend trackModel={trackModel} height={options.height} />
      );
    }

    if (options.displayMode === DynamicInteractionDisplayMode.ARC) {
      visualizer =
        <PixiArc {...visualizerProps} />;
    } else {
      visualizer = <PixiHeatmap {...visualizerProps} />;
    }

    return visualizer;
  }
}

export default DynamicInteractionTrackComponents;
