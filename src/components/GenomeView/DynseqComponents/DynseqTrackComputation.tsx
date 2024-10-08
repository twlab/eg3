import { PureComponent } from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import { scaleLinear } from "d3-scale";
import memoizeOne from "memoize-one";

// import HoverTooltipContext from "../commonComponents/tooltip/HoverTooltipContext";
// import Chromosomes from "components/genomeNavigator/Chromosomes";
// import withCurrentGenome from "components/withCurrentGenome";
import {
  DefaultAggregators,
  FeatureAggregator,
} from "../../../models/FeatureAggregator";
// import Track from "../commonComponents/Track";
// import GenomicCoordinates from "../commonComponents/GenomicCoordinates";
// import configOptionMerging from "../commonComponents/configOptionMerging";
import { ScaleChoices } from "../../../models/ScaleChoices";
import { getGenomeConfig } from "../../../models/genomes/allGenomes";
// import TrackLegend from "../commonComponents/TrackLegend";
import NumericalTrack from "../commonComponents/numerical/NumericalTrack";
import TrackLegend from "../commonComponents/TrackLegend";
import HoverToolTip from "../commonComponents/hoverToolTips/hoverToolTip";
import Chromosomes from "../genomeNavigator/Chromosomes";
import React from "react";
const CHROMOSOMES_Y = 60;
const TOP_PADDING = 2;
export const MAX_PIXELS_PER_BASE_NUMERIC = 0.5;

export const DEFAULT_OPTIONS = {
  aggregateMethod: DefaultAggregators.types.MEAN,
  height: 100,
  color: "blue",
  color2: "darkorange",
  yScale: ScaleChoices.AUTO,
  yMax: 0.25,
  yMin: -0.25,
};

interface DynseqTrackProps {
  data: any[];
  unit?: string;
  options: {
    aggregateMethod: string;
    height: number;
    color?: string;
    yScale?: string;
    yMin?: number;
    yMax?: number;
    displayMode: string;
  };
  isLoading?: boolean;
  error?: any;
  viewRegion: any;
  width: number;
  trackModel: any;
  viewWindow: {
    start: number;
    end: number;
  };
  forceSvg: boolean;
  getNumLegend: any;
  basesByPixel: number;
  genomeConfig: any;
}

class DynseqTrackComputation extends PureComponent<DynseqTrackProps> {
  static propTypes = {
    data: PropTypes.array.isRequired,
    unit: PropTypes.string,
    options: PropTypes.shape({
      aggregateMethod: PropTypes.oneOf(Object.values(DefaultAggregators.types)),
      height: PropTypes.number.isRequired,
      color: PropTypes.string,
    }).isRequired,
    isLoading: PropTypes.bool,
    error: PropTypes.any,
  };

  xToValue: Array<any> | null = null;
  xToValue2: Array<any> | null = null;
  allValues: Array<any> = [];
  drawHeights: Array<any> = [];
  scales: any = null;
  hasReverse: boolean = false;

  constructor(props: DynseqTrackProps) {
    super(props);
    this.aggregateFeatures = memoizeOne(this.aggregateFeatures);
    this.computeScales = memoizeOne(this.computeScales);
  }

  aggregateFeatures = (
    data: any[],
    viewRegion: any,
    width: number,
    aggregatorId: string
  ) => {
    const aggregator = new FeatureAggregator();
    const xToFeatures = aggregator.makeXMap(data, viewRegion, width);
    return xToFeatures.map(DefaultAggregators.fromId(aggregatorId));
  };

  computeScales = (xToValue: number[], xToValue2: number[], height: number) => {
    const { yScale, yMin, yMax } = this.props.options;

    const visibleValues = xToValue.slice(
      this.props.viewWindow.start,
      this.props.viewWindow.end
    );
    let max = _.max(visibleValues) || 0;
    let min =
      (xToValue2.length > 0
        ? _.min(
            xToValue2.slice(
              this.props.viewWindow.start,
              this.props.viewWindow.end
            )
          )
        : 0) || 0;

    if (yScale === ScaleChoices.FIXED) {
      max = yMax ? yMax : max;
      min = yMin ? yMin : min;
    }

    if (min > max) {
      min = 0;
    }

    const zeroLine =
      min < 0
        ? TOP_PADDING + ((height - 2 * TOP_PADDING) * max) / (max - min)
        : height;

    if (xToValue2.length > 0) {
      return {
        valueToHeight: scaleLinear()
          .domain([min, max])
          .range([zeroLine - height + TOP_PADDING, zeroLine - TOP_PADDING]),
        valueToY: scaleLinear()
          .domain([max, 0])
          .range([TOP_PADDING, zeroLine])
          .clamp(true),
        axisScale: scaleLinear()
          .domain([max, min])
          .range([TOP_PADDING, height - TOP_PADDING])
          .clamp(true),
        valueToYReverse: scaleLinear()
          .domain([0, min])
          .range([0, zeroLine - TOP_PADDING])
          .clamp(true),
        valueToOpacity: scaleLinear()
          .domain([0, max])
          .range([0, 1])
          .clamp(true),
        valueToOpacityReverse: scaleLinear()
          .domain([0, min])
          .range([0, 1])
          .clamp(true),
        min,
        max,
        zeroLine,
      };
    } else {
      return {
        valueToHeight: scaleLinear()
          .domain([min, max])
          .range([0, height - TOP_PADDING]),
        valueToY: scaleLinear()
          .domain([max, min])
          .range([TOP_PADDING, height])
          .clamp(true),
        axisScale: scaleLinear()
          .domain([max, min])
          .range([TOP_PADDING, height])
          .clamp(true),
        valueToOpacity: scaleLinear()
          .domain([min, max])
          .range([0, 1])
          .clamp(true),
        min,
        max,
        zeroLine,
      };
    }
  };

  render() {
    const {
      data,
      viewRegion,
      width,
      options,
      trackModel,
      unit,
      genomeConfig,
      basesByPixel,
    } = this.props;
    const { height, aggregateMethod } = options;
    const dataForward = data.filter(
      (feature) => feature.value === undefined || feature.value >= 0
    );
    const dataReverse = data.filter((feature) => feature.value < 0);

    if (dataReverse.length > 0) {
      this.hasReverse = true;
      this.xToValue2! = this.aggregateFeatures(
        dataReverse,
        viewRegion,
        width,
        aggregateMethod
      );
    } else {
      this.xToValue2 = [];
    }

    this.xToValue! =
      dataForward.length > 0
        ? this.aggregateFeatures(
            dataForward,
            viewRegion,
            width,
            aggregateMethod
          )
        : [];

    this.scales = this.computeScales(this.xToValue!, this.xToValue2!, height);
    this.drawHeights = this.xToValue!.map(
      (x) => this.scales.valueToHeight(x) || 0
    );
    this.allValues = this.xToValue!.map((x) => x || 0);

    if (this.xToValue2!.length > 0) {
      const negHeights = this.xToValue2!.map(
        (x) => this.scales.valueToHeight(x) || 0
      );
      this.drawHeights = this.drawHeights.map(
        (num, idx) => num + negHeights[idx]
      );
      this.allValues = this.allValues.map(
        (num, idx) => num + (this.xToValue2![idx] || 0)
      );
    }

    if (basesByPixel <= MAX_PIXELS_PER_BASE_NUMERIC) {
      const legend = (
        <TrackLegend
          trackModel={trackModel}
          height={height}
          axisScale={this.scales.axisScale}
          axisLegend={unit}
        />
      );

      const visualizer = (
        <React.Fragment>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              position: "absolute",

              zIndex: 3,
            }}
          >
            <HoverToolTip
              data={this.xToValue}
              data2={this.xToValue2}
              windowWidth={width}
              trackType={"numerical"}
              trackModel={trackModel}
              height={DEFAULT_OPTIONS.height}
              viewRegion={viewRegion}
              unit={unit}
              hasReverse={true}
            />{" "}
          </div>
          <svg width={width} height={height} style={{ display: "block" }}>
            {" "}
            <Chromosomes
              genomeConfig={genomeConfig}
              viewRegion={viewRegion}
              width={width}
              labelOffset={CHROMOSOMES_Y}
              hideChromName={true}
              drawHeights={this.drawHeights}
              zeroLine={this.scales.zeroLine}
              height={height}
              hideCytoband={true}
              minXwidthPerBase={2}
            />
          </svg>
        </React.Fragment>
      );
      return visualizer;
    } else {
      return <NumericalTrack {...this.props} />;
    }
  }
}

export default DynseqTrackComputation;
