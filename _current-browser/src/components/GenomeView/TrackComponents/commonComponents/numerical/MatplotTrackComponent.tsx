import React from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import { scaleLinear } from "d3-scale";
import memoizeOne from "memoize-one";
import Smooth from "array-smooth";
// import Track from '../Track';
// import TrackLegend from '../TrackLegend';
import GenomicCoordinates from "./GenomicCoordinates";
// import HoverTooltipContext from '../tooltip/HoverTooltipContext';

import { RenderTypes, DesignRenderer } from "../art/DesignRenderer";
import {
  FeatureAggregator,
  DefaultAggregators,
} from "../../../../../models/FeatureAggregator";
import { ScaleChoices } from "../../../../../models/ScaleChoices";
import Feature from "../../../../../models/Feature";
import TrackModel from "../../../../../models/TrackModel";
import TrackLegend from "../TrackLegend";

export const DEFAULT_OPTIONS = {
  aggregateMethod: DefaultAggregators.types.MEAN,
  height: 60,
  yScale: ScaleChoices.AUTO,
  yMax: 10,
  yMin: 0,
  smooth: 0,
  lineWidth: 2,
};

interface MatplotTrackProps {
  data: Feature[]; // Replace 'Feature' with the actual type of your data
  unit?: string;
  options: any;
  isLoading?: boolean;
  error?: any;
  trackModel?: any;
  groupScale?: any;
  viewWindow: any;
  viewRegion: any;
  width: any;
  forceSvg: any;
  getNumLegend: any;
}
const TOP_PADDING = 2;

/**
 * Track specialized in showing numerical data in matplot style, aka. lineplot
 *
 * @author Daofeng Li
 */
class MatplotTrackComponent extends React.PureComponent<MatplotTrackProps> {
  /**
   * Don't forget to look at NumericalFeatureProcessor's propTypes!
   */
  static propTypes = Object.assign(
    {},
    {
      /**
       * NumericalFeatureProcessor provides these.  Parents should provide an array of NumericalFeature.
       */
      data: PropTypes.array.isRequired, // PropTypes.arrayOf(Feature)
      unit: PropTypes.string, // Unit to display after the number in tooltips
      options: PropTypes.shape({
        aggregateMethod: PropTypes.oneOf(
          Object.values(DefaultAggregators.types)
        ),
        height: PropTypes.number.isRequired, // Height of the track
      }).isRequired,
      isLoading: PropTypes.bool, // If true, applies loading styling
      error: PropTypes.any, // If present, applies error styling
    }
  );
  xToValue: any;
  scales: any;

  constructor(props) {
    super(props);
    this.xToValue = null;
    this.scales = null;

    this.aggregateFeatures = memoizeOne(this.aggregateFeatures);
    this.computeScales = memoizeOne(this.computeScales);
    this.renderTooltip = this.renderTooltip.bind(this);
  }

  aggregateFeatures(data, viewRegion, width, aggregatorId) {
    const aggregator = new FeatureAggregator();
    const xToFeatures = aggregator.makeXMap(data, viewRegion, width);
    return xToFeatures.map(DefaultAggregators.fromId(aggregatorId));
  }

  computeScales(xToValue, height) {
    const { yScale, yMin, yMax } = this.props.options;
    if (yMin > yMax) {
      // notify.show('Y-axis min must less than max', 'error', 2000);
    }
    /*
        All tracks get `PropsFromTrackContainer` (see `Track.ts`).

        `props.viewWindow` contains the range of x that is visible when no dragging.  
            It comes directly from the `ViewExpansion` object from `RegionExpander.ts`
        */
    const visibleValues = _.flatten(
      xToValue.map((d) =>
        d.slice(this.props.viewWindow.start, this.props.viewWindow.end)
      )
    );
    let max: any = _.max(visibleValues) || 0; // in case undefined returned here, cause maxboth be undefined too
    let min: any = _.min(visibleValues) || 0;
    if (yScale === ScaleChoices.FIXED) {
      max = yMax ? yMax : max;
      min = yMin ? yMin : min;
    }
    if (min > max) {
      min = max;
    }
    return {
      valueToY: scaleLinear()
        .domain([max, min])
        .range([TOP_PADDING, height])
        .clamp(true),
      min,
      max,
    };
  }

  /**
   * Renders the default tooltip that is displayed on hover.
   *
   * @param {number} relativeX - x coordinate of hover relative to the visualizer
   * @param {number} value -
   * @return {JSX.Element} tooltip to render
   */
  renderTooltip(relativeX) {
    const { trackModel, viewRegion, width, unit } = this.props;
    const values = this.xToValue.map((value) => value[Math.round(relativeX)]);
    const stringValues = values.map((value) => {
      return typeof value === "number" && !Number.isNaN(value)
        ? value.toFixed(2)
        : "(no data)";
    });

    const divs = stringValues.map((value, i) => {
      const color = trackModel.tracks[i].options.color || "blue";
      return (
        <div key={i}>
          <span style={{ color: color }}>
            {trackModel.tracks[i].label} {value}
          </span>
          {unit && <span className="Tooltip-minor-text">{unit}</span>}
        </div>
      );
    });
    return (
      <div>
        {divs}
        <div className="Tooltip-minor-text">
          <GenomicCoordinates
            viewRegion={viewRegion}
            width={width}
            x={relativeX}
          />
        </div>
        <div className="Tooltip-minor-text">{trackModel.getDisplayLabel()}</div>
      </div>
    );
  }

  render() {
    const {
      data,
      viewRegion,
      width,
      trackModel,
      unit,
      options,
      forceSvg,
      getNumLegend,
    } = this.props;

    const { height, aggregateMethod, smooth, lineWidth } = options;
    const aggreagatedData = data.map((d) =>
      this.aggregateFeatures(d, viewRegion, width, aggregateMethod)
    );
    this.xToValue =
      smooth === 0
        ? aggreagatedData
        : aggreagatedData.map((d) => Smooth(d, smooth));
    this.scales = this.computeScales(this.xToValue, height);
    const legend = (
      <TrackLegend
        trackModel={trackModel}
        height={height}
        axisScale={this.scales.valueToY}
        axisLegend={unit}
      />
    );
    if (getNumLegend) {
      getNumLegend(legend);
    }

    const visualizer = (
      // <HoverTooltipContext tooltipRelativeY={height} getTooltipContents={this.renderTooltip} >
      <LinePlot
        trackModel={trackModel}
        xToValue={this.xToValue}
        scales={this.scales}
        height={height}
        forceSvg={forceSvg}
        lineWidth={lineWidth}
        width={width}
      />
    );
    // </HoverTooltipContext>
    return visualizer;
  }
}
interface LinePlotTrackProps {
  height: any; // Replace 'Feature' with the actual type of your dat
  width: any;
  scales: any;
  lineWidth: any;
  xToValue: any;
  trackModel: TrackModel;
}
class LinePlot extends React.PureComponent<LinePlotTrackProps> {
  static propTypes = {
    xToValue: PropTypes.array.isRequired,
    scales: PropTypes.object.isRequired,
    height: PropTypes.number.isRequired,
    lineWidth: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    trackModel: PropTypes.any.isRequired,
    forceSvg: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    this.renderLine = this.renderLine.bind(this);
  }

  /**
   * draw a line for an array of numbers.
   *
   * @param {number[]} values
   * @return {JSX.Element} line element to render
   */
  renderLine(values, trackIndex) {
    const { scales, trackModel, lineWidth } = this.props;
    // eslint-disable-next-line array-callback-return

    const points = values
      .map((value, x) => {
        if (value && !Number.isNaN(value)) {
          const y = scales.valueToY(value);
          return `${x},${y}`;
        }
      })
      .filter((value) => value); // removes null from original
    const color = trackModel.tracks![trackIndex].options.color || "blue";
    return (
      <polyline
        key={trackIndex}
        points={points.join(" ")}
        stroke={color}
        strokeWidth={lineWidth}
        fill="none"
      />
    );
  }

  render() {
    const { xToValue, height, width } = this.props;

    return xToValue.length === 0 ? (
      <div
        style={{
          width: width,
          height: height,
        }}
      ></div>
    ) : (
      <DesignRenderer
        type={1 ? RenderTypes.SVG : RenderTypes.CANVAS}
        width={width}
        height={height}
      >
        {xToValue.map(this.renderLine)}
      </DesignRenderer>
    );
  }
}

export default MatplotTrackComponent;
