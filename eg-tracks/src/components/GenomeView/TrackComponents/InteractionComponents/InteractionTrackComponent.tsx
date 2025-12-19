import React, { JSX } from "react";
// import _ from "lodash";
import memoizeOne from "memoize-one";
import { scaleLinear } from "d3-scale";
import percentile from "percentile";

import Heatmap from "./Heatmap";
import { ArcDisplay } from "./ArcDisplay";
import { CubicCurveDisplay } from "./CubicCurveDisplay";
import { SquareDisplay } from "./SquareDisplay";

// import Track, { PropsFromTrackContainer } from "../commonComponents/Track";
// import TrackLegend from "../commonComponents/TrackLegend";

import { InteractionDisplayMode } from "../../../../trackConfigs/config-menu-models.tsx/DisplayModes";
import { FeaturePlacer } from "../../../../models/getXSpan/FeaturePlacer";
import { GenomeInteraction } from "../../../../getRemoteData/GenomeInteraction";
import { ScaleChoices } from "../../../../models/ScaleChoices";
import TrackModel from "../../../../models/TrackModel";
import OpenInterval from "../../../../models/OpenInterval";
import DisplayedRegionModel from "../../../../models/DisplayedRegionModel";
import {
  BinSize,
  NormalizationMode,
} from "../../../../getRemoteData/HicDataModes";
import TrackLegend from "../commonComponents/TrackLegend";

const TOP_PADDING = 2;

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
  trackModel: TrackModel; // Track metadata
  width: number; // Width of the visualizer
  viewWindow: OpenInterval; // Visible portion of the visualizer
  visRegion: DisplayedRegionModel;
  getNumLegend: any;
}

export const DEFAULT_OPTIONS = {
  color: "#B8008A",
  color2: "#006385",
  backgroundColor: "var(--bg-color)",
  displayMode: InteractionDisplayMode.HEATMAP,
  scoreScale: ScaleChoices.AUTO,
  scoreMax: 10,
  scalePercentile: 95,
  scoreMin: 0,
  height: 500,
  lineWidth: 2,
  greedyTooltip: false,
  fetchViewWindowOnly: false,
  bothAnchorsInView: false,
  isThereG3dTrack: false,
  clampHeight: false,
  // for hic
  binSize: BinSize.AUTO,
  normalization: NormalizationMode.NONE,
};

class InteractionTrackComponent extends React.PureComponent<
  InteractionTrackProps,
  {}
> {
  public featurePlacer: FeaturePlacer;

  scales: any;

  constructor(props: InteractionTrackProps) {
    super(props);
    this.scales = null;
    this.featurePlacer = new FeaturePlacer();
    this.featurePlacer.placeInteractions = memoizeOne(
      this.featurePlacer.placeInteractions
    );
  }

  computeScale = () => {
    const { data } = this.props;
    const { scoreScale, scoreMin, scoreMax, height, scalePercentile } =
      this.props.options;
    
    // Safety check: handle null, undefined, or empty data
    const safeData = data || [];
    
    if (scoreScale === ScaleChoices.AUTO) {
      // const maxScore = this.props.data.length > 0 ? _.maxBy(this.props.data, "score").score : 10;
      const item = percentile(scalePercentile!, safeData, (item) => item.score);
      // console.log(item)
      const maxScore = safeData.length > 0 ? (item as GenomeInteraction).score : 10;
      // console.log(maxScore)
      return {
        opacityScale: scaleLinear()
          .domain([0, maxScore])
          .range([0, 1])
          .clamp(true),
        heightScale: scaleLinear()
          .domain([0, maxScore])
          .range([0, height - TOP_PADDING])
          .clamp(true),
        min: 0,
        max: maxScore,
      };
    } else {
      if (scoreMin! >= scoreMax!) {
        // notify.show("Score min cannot be greater than Score max", "error", 2000);
        return {
          opacityScale: scaleLinear()
            .domain([scoreMax! - 1, scoreMax!])
            .range([0, 1])
            .clamp(true),
          heightScale: scaleLinear()
            .domain([scoreMax! - 1, scoreMax!])
            .range([0, height - TOP_PADDING])
            .clamp(true),
          min: scoreMax! - 1,
          max: scoreMax,
        };
      }
      return {
        opacityScale: scaleLinear()
          .domain([scoreMin!, scoreMax!])
          .range([0, 1])
          .clamp(true),
        heightScale: scaleLinear()
          .domain([scoreMin!, scoreMax!])
          .range([0, height - TOP_PADDING])
          .clamp(true),
        min: scoreMin,
        max: scoreMax,
      };
    }
  };

  //   showTooltip(event: React.MouseEvent, interaction: GenomeInteraction) {
  //     const tooltip = (
  //       <Tooltip pageX={event.pageX} pageY={event.pageY} ignoreMouse={true}>
  //         <div>
  //           <div>Locus1: {interaction.locus1.toString()}</div>
  //           <div>Locus2: {interaction.locus2.toString()}</div>
  //           <div>Score: {interaction.score}</div>
  //         </div>
  //       </Tooltip>
  //     );
  //     this.props.onShowTooltip(tooltip);
  //   }

  //   hideTooltip() {
  //     this.props.onHideTooltip();
  //   }

  filterData = (data: GenomeInteraction[]): GenomeInteraction[] => {
    // Safety check: handle null or undefined data
    if (!data) {
      return [];
    }
    
    const { minValueFilter, maxValueFilter } = this.props.options;
    let filteredData: GenomeInteraction[] = [];
    if (maxValueFilter && !isNaN(maxValueFilter)) {
      filteredData = data.filter((d) => d.score <= maxValueFilter);
    } else {
      filteredData = data;
    }
    if (minValueFilter && !isNaN(minValueFilter)) {
      filteredData = filteredData.filter((d) => d.score >= minValueFilter);
    }
    return filteredData;
  };

  render(): JSX.Element {
    const {
      data,
      trackModel,
      visRegion,
      width,
      viewWindow,
      options,
      forceSvg,
      getBeamRefs,
      onSetAnchors3d,
      isThereG3dTrack,
      getNumLegend,
    } = this.props;

    // Safety check: ensure data is always an array
    const safeData = data || [];
    const filteredData = this.filterData(safeData);

    this.scales = this.computeScale();

    let interactionData = this.featurePlacer.placeInteractions(
      filteredData,
      visRegion,
      width
    );
    const visualizerProps = {
      placedInteractions: interactionData,
      viewWindow,
      options,
      width,
      height: options.height,
      opacityScale: this.scales.opacityScale,
      heightScale: this.scales.heightScale,
      color: options.color,
      color2: options.color2,
      lineWidth: options.lineWidth,
      binSize: options.binSize,
      onSetAnchors3d,
      forceSvg,
      greedyTooltip: options.greedyTooltip,
      bothAnchorsInView: options.bothAnchorsInView,
      fetchViewWindowOnly: options.fetchViewWindowOnly,
      isThereG3dTrack,
      clampHeight: options.clampHeight,
    };
    let visualizer;
    const legend = (
      <TrackLegend
        trackModel={trackModel}
        height={options.height}
        axisScale={
          options.displayMode === InteractionDisplayMode.FLATARC
            ? this.scales.heightScale
            : undefined
        }
        forceSvg={forceSvg}
      />
    );
    if (getNumLegend) {
      getNumLegend(legend);
    }
    switch (options.displayMode) {
      case InteractionDisplayMode.HEATMAP:
        visualizer = (
          <Heatmap
            {...visualizerProps}
            getBeamRefs={getBeamRefs}
            legend={legend}
          />
        );
        break;
      case InteractionDisplayMode.FLATARC:
        visualizer = <CubicCurveDisplay {...visualizerProps} legend={legend} />;
        break;
      case InteractionDisplayMode.ARC:
        visualizer = <ArcDisplay {...visualizerProps} legend={legend} />;
        break;
      case InteractionDisplayMode.SQUARE:
        visualizer = <SquareDisplay {...visualizerProps} legend={legend} />;
        break;
      default:
        visualizer = <ArcDisplay {...visualizerProps} legend={legend} />;
    }

    return visualizer;
  }
}

export default InteractionTrackComponent;
