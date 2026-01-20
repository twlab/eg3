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
} from "../../../../models/FeatureAggregator";
// import Track from "../commonComponents/Track";
// import GenomicCoordinates from "../commonComponents/GenomicCoordinates";
// import configOptionMerging from "../commonComponents/configOptionMerging";
import { ScaleChoices } from "../../../../models/ScaleChoices";

// import TrackLegend from "../commonComponents/TrackLegend";
import NumericalTrack from "../commonComponents/numerical/NumericalTrack";
import TrackLegend from "../commonComponents/TrackLegend";
import HoverToolTip from "../commonComponents/HoverToolTips/HoverToolTip";
import Chromosomes from "../../genomeNavigator/Chromosomes";
import React from "react";
import { NumericalAggregator } from "../commonComponents/numerical/NumericalAggregator";

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
    forceSvg: boolean;
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
  updatedLegend: any;
  basesByPixel: number;
  genomeConfig: any;
  xvaluesData: any;
  dataIdx: number;
  initialLoad: boolean;
}

class DynseqTrackComponents extends PureComponent<DynseqTrackProps> {
  allValues: Array<any> = [];
  drawHeights: Array<any> = [];
  scales: any = null;

  constructor(props: DynseqTrackProps) {
    super(props);

    this.computeScales = memoizeOne(this.computeScales);
  }

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
      xvaluesData,
      forceSvg,
      viewWindow,
    } = this.props;
    const { height } = options;
    let xToValue: Array<any>;
    let xToValue2: Array<any>;
    let hasReverse: boolean;
    let hasForward: boolean;
    if (!xvaluesData) {
      const aggregator = new NumericalAggregator();
      [xToValue, xToValue2, hasReverse, hasForward] = aggregator.xToValueMaker(
        data,
        viewRegion,
        width,
        options
      );
    } else {
      [xToValue, xToValue2, hasReverse, hasForward] = xvaluesData;
    }
    this.scales = this.computeScales(xToValue, xToValue2, height);

    this.drawHeights = xToValue.map((x) => this.scales.valueToHeight(x) || 0);
    this.allValues = xToValue.map((x) => x || 0);

    if (xToValue2.length > 0) {
      const negHeights = xToValue2.map(
        (x) => this.scales.valueToHeight(x) || 0
      );
      this.drawHeights = this.drawHeights.map(
        (num, idx) => num + negHeights[idx]
      );
      this.allValues = this.allValues.map(
        (num, idx) => num + (xToValue2[idx] || 0)
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

      if (this.props.updatedLegend) {
        this.props.updatedLegend.current = legend;
      }

      const visualizer = (
        <React.Fragment>
          {forceSvg === false ? (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                position: "absolute",

                zIndex: 3,
              }}
            >
              <HoverToolTip
                data={xToValue}
                data2={xToValue2}
                windowWidth={width}
                trackType={"numerical"}
                trackModel={trackModel}
                height={DEFAULT_OPTIONS.height}
                viewRegion={viewRegion}
                unit={unit}
                hasReverse={true}
                options={options}
              />
            </div>
          ) : (
            ""
          )}
          <div style={{ display: "flex" }}>
            {forceSvg ? legend : ""}

            <svg width={width} height={height} style={{ display: "block" }}>
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
          </div>
        </React.Fragment>
      );
      return visualizer;
    } else {
      return (
        <NumericalTrack
          {...this.props}
          xvaluesData={[xToValue, xToValue2, hasReverse, hasForward]}
        />
      );
    }
  }
}

export default DynseqTrackComponents;
