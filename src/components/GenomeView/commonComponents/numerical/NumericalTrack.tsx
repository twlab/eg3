import React from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import { scaleLinear } from "d3-scale";
import memoizeOne from "memoize-one";
// import Track from "../Track";
// import TrackLegend from "../TrackLegend";
// import GenomicCoordinates from "../GenomicCoordinates";
// import HoverTooltipContext from "../tooltip/HoverTooltipContext";
// import configOptionMerging from "../configOptionMerging";
import { RenderTypes, DesignRenderer } from "../art/DesignRenderer";
import { NumericalDisplayModes } from "../../../../trackConfigs/config-menu-models.tsx/DisplayModes";
import { DefaultAggregators } from "../../../../models/FeatureAggregator";
import { ScaleChoices } from "../../../../models/ScaleChoices";
import { NumericalAggregator } from "./NumericalAggregator";
import Feature from "../../../../models/Feature";
import HoverToolTip from "../hoverToolTips/hoverToolTip";
import { BackgroundColorConfig } from "../../../../trackConfigs/config-menu-components.tsx/ColorConfig";
import TrackLegend from "../TrackLegend";
// import { withLogPropChanges } from "components/withLogPropChanges";
interface NumericalTrackProps {
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
}
export const DEFAULT_OPTIONS = {
  aggregateMethod: DefaultAggregators.types.MEAN,
  displayMode: NumericalDisplayModes.AUTO,
  height: 40,
  color: "blue",
  colorAboveMax: "red",
  color2: "darkorange",
  color2BelowMin: "darkgreen",
  yScale: ScaleChoices.AUTO,
  yMax: 10,
  yMin: 0,
  smooth: 0,
  ensemblStyle: false,
  backgroundColor: "var(--bg-color)",
};

const AUTO_HEATMAP_THRESHOLD = 21; // If pixel height is less than this, automatically use heatmap
const TOP_PADDING = 2;
const THRESHOLD_HEIGHT = 3; // the bar tip height which represet value above max or below min

/**
 * Track specialized in showing numerical data.
 *
 * @author Silas Hsu
 */
class NumericalTrack extends React.PureComponent<NumericalTrackProps> {
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
        displayMode: PropTypes.oneOf(Object.values(NumericalDisplayModes))
          .isRequired,
        height: PropTypes.number.isRequired, // Height of the track
        // scaleType: PropTypes.any, // Unused for now
        // scaleRange: PropTypes.array, // Unused for now
        color: PropTypes.string, // Color to draw bars, if using the default getBarElement
      }).isRequired,
      isLoading: PropTypes.bool, // If true, applies loading styling
      error: PropTypes.any, // If present, applies error styling
    }
  );
  xToValue: any;
  xToValue2: any;
  scales: any;
  hasReverse: boolean;
  renderTooltip: any;
  aggregator: NumericalAggregator;

  constructor(props) {
    super(props);
    this.xToValue = null;
    this.xToValue2 = null;
    this.scales = null;
    this.hasReverse = false;

    this.computeScales = memoizeOne(this.computeScales);
    // this.renderTooltip = this.renderTooltip.bind(this);
    this.aggregator = new NumericalAggregator();
  }

  computeScales(xToValue, xToValue2, height) {
    const { yScale, yMin, yMax } = this.props.options;
    if (yMin >= yMax) {
      console.log("Y-axis min must less than max", "error", 2000);
    }
    const { trackModel, groupScale } = this.props;
    let gscale: any = {},
      min,
      max,
      xValues2 = [];
    if (groupScale) {
      if (trackModel.options.hasOwnProperty("group")) {
        gscale = groupScale[trackModel.options.group];
      }
    }
    if (!_.isEmpty(gscale)) {
      max = _.max(Object.values(gscale.max));
      min = _.min(Object.values(gscale.min));
    } else {
      const visibleValues = xToValue.slice(
        this.props.viewWindow.start,
        this.props.viewWindow.end
      );
      max = _.max(visibleValues) || 1; // in case undefined returned here, cause maxboth be undefined too
      xValues2 = xToValue2.filter((x) => x);
      min =
        (xValues2.length
          ? _.min(
              xToValue2.slice(
                this.props.viewWindow.start,
                this.props.viewWindow.end
              )
            )
          : 0) || 0;
      const maxBoth = Math.max(Math.abs(max), Math.abs(min));
      max = maxBoth;
      min = xValues2.length ? -maxBoth : 0;
      if (yScale === ScaleChoices.FIXED) {
        max = yMax ? yMax : max;
        min = yMin !== undefined ? yMin : min;
      }
    }
    if (min > max) {
      console.log("Y-axis min should less than Y-axis max", "warning", 5000);
      min = 0;
    }

    const zeroLine =
      min < 0
        ? TOP_PADDING + ((height - 2 * TOP_PADDING) * max) / (max - min)
        : height;

    if (
      xValues2.length &&
      (yScale === ScaleChoices.AUTO ||
        (yScale === ScaleChoices.FIXED && yMin < 0))
    ) {
      return {
        axisScale: scaleLinear()
          .domain([max, min])
          .range([TOP_PADDING, height - TOP_PADDING])
          .clamp(true),
        valueToY: scaleLinear()
          .domain([max, 0])
          .range([TOP_PADDING, zeroLine])
          .clamp(true),
        valueToYReverse: scaleLinear()
          .domain([0, min])
          .range([0, height - zeroLine - TOP_PADDING])
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
        axisScale: scaleLinear()
          .domain([max, min])
          .range([TOP_PADDING, height])
          .clamp(true),
        valueToY: scaleLinear()
          .domain([max, min])
          .range([TOP_PADDING, height])
          .clamp(true),
        valueToOpacity: scaleLinear()
          .domain([min, max])
          .range([0, 1])
          .clamp(true),
        // for group feature when there is only nagetiva data, to be fixed
        valueToYReverse: scaleLinear()
          .domain([0, min])
          .range([0, height - zeroLine - TOP_PADDING])
          .clamp(true),
        valueToOpacityReverse: scaleLinear()
          .domain([0, min])
          .range([0, 1])
          .clamp(true),
        min,
        max,
        zeroLine,
      };
    }
  }

  getEffectiveDisplayMode() {
    const { displayMode, height } = this.props.options;
    if (displayMode === NumericalDisplayModes.AUTO) {
      return height < AUTO_HEATMAP_THRESHOLD
        ? NumericalDisplayModes.HEATMAP
        : NumericalDisplayModes.BAR;
    } else {
      return displayMode;
    }
  }

  /**
   * Renders the default tooltip that is displayed on hover.
   *
   * @param {number} relativeX - x coordinate of hover relative to the visualizer
   * @param {number} value -
   * @return {JSX.Element} tooltip to render
   */

  render() {
    // console.log("render");
    const { data, viewRegion, width, trackModel, unit, options, forceSvg } =
      this.props;
    const { height, color, color2, colorAboveMax, color2BelowMin } = options;

    const xvalues = this.aggregator.xToValueMaker(
      data,
      viewRegion,
      width,
      options
    );

    this.xToValue = xvalues[0];
    this.xToValue2 = xvalues[1];
    this.hasReverse = xvalues[2];
    this.scales = this.computeScales(this.xToValue, this.xToValue2, height);
    const isDrawingBars =
      this.getEffectiveDisplayMode() === NumericalDisplayModes.BAR; // As opposed to heatmap\
    console.log(isDrawingBars ? this.scales.axisScale : undefined, unit);
    const legend = (
      <TrackLegend
        trackModel={trackModel}
        height={height}
        axisScale={isDrawingBars ? this.scales.axisScale : undefined}
        // axisScale={isDrawingBars ? this.scales.valueToY : undefined}
        // axisScaleReverse={isDrawingBars ? this.scales.valueToYReverse : undefined}
        axisLegend={unit}
      />
    );
    const visualizer = this.hasReverse ? (
      <React.Fragment>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            position: "absolute",

            zIndex: 3,
          }}
        >
          {legend}
          <HoverToolTip
            data={this.xToValue}
            data2={this.xToValue2}
            windowWidth={width}
            trackType={"numerical"}
            trackModel={trackModel}
            height={height}
            viewRegion={viewRegion}
            unit={unit}
            hasReverse={true}
          />
        </div>
        <ValuePlot
          xToValue={this.xToValue}
          scales={this.scales}
          height={this.scales.zeroLine}
          color={color}
          colorOut={colorAboveMax}
          isDrawingBars={isDrawingBars}
          forceSvg={forceSvg}
          width={width}
        />
        <hr style={{ marginTop: 0, marginBottom: 0, padding: 0 }} />
        <ValuePlot
          xToValue={this.xToValue2}
          scales={this.scales}
          height={height - this.scales.zeroLine}
          color={color2}
          colorOut={color2BelowMin}
          isDrawingBars={isDrawingBars}
          forceSvg={forceSvg}
          width={width}
        />
      </React.Fragment>
    ) : (
      <React.Fragment>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            position: "absolute",

            zIndex: 3,
          }}
        >
          {legend}
          <HoverToolTip
            data={this.xToValue}
            windowWidth={width}
            trackType={"numerical"}
            trackModel={trackModel}
            height={DEFAULT_OPTIONS.height}
            viewRegion={viewRegion}
            unit={unit}
            hasReverse={false}
          />
        </div>
        <ValuePlot
          xToValue={this.xToValue}
          scales={this.scales}
          height={this.scales.zeroLine}
          color={color}
          colorOut={colorAboveMax}
          isDrawingBars={isDrawingBars}
          forceSvg={forceSvg}
          width={width}
        />
      </React.Fragment>
    );
    return visualizer;
  }
}
interface ValueTrackProps {
  xToValue: any[]; // Replace 'any' with the actual type for xToValue
  scales: Record<string, any>; // Replace 'any' with the actual type for scales
  height: number;
  color?: string;
  isDrawingBars?: boolean;
  colorOut?: any;
  forceSvg?: any;
  width: any;
}
export class ValuePlot extends React.PureComponent<ValueTrackProps> {
  static propTypes = {
    xToValue: PropTypes.array.isRequired,
    scales: PropTypes.object.isRequired,
    height: PropTypes.number.isRequired,
    color: PropTypes.string,
    isDrawingBars: PropTypes.bool,
    width: PropTypes.any,
  };

  constructor(props) {
    super(props);
    this.renderPixel = this.renderPixel.bind(this);
  }

  /**
   * Gets an element to draw for a data record.
   *
   * @param {number} value
   * @param {number} x
   * @return {JSX.Element} bar element to render
   */
  renderPixel(value, x) {
    if (!value || Number.isNaN(value)) {
      return null;
    }
    const { isDrawingBars, scales, height, color, colorOut } = this.props;
    const y =
      value > 0 ? scales.valueToY(value) : scales.valueToYReverse(value);
    let drawY = value > 0 ? y : 0;
    let drawHeight = value > 0 ? height - y : y;
    if (isDrawingBars) {
      // const y = scales.valueToY(value);
      // const drawHeight = height - y;
      if (drawHeight <= 0) {
        return null;
      }
      let tipY;
      if (value > scales.max || value < scales.min) {
        drawHeight -= THRESHOLD_HEIGHT;
        if (value > scales.max) {
          tipY = y;
          drawY += THRESHOLD_HEIGHT;
        } else {
          tipY = drawHeight;
        }
        return (
          <g key={x}>
            <rect
              key={x}
              x={x}
              y={drawY}
              width={1}
              height={drawHeight}
              fill={color}
            />
            <rect
              key={x + "tip"}
              x={x}
              y={tipY}
              width={1}
              height={THRESHOLD_HEIGHT}
              fill={colorOut}
            />
          </g>
        );
      } else {
        return (
          <rect
            key={x}
            x={x}
            y={drawY}
            width={1}
            height={drawHeight}
            fill={color}
          />
        );
      }
    } else {
      // Assume HEATMAP
      const opacity =
        value > 0
          ? scales.valueToOpacity(value)
          : scales.valueToOpacityReverse(value);
      return (
        <rect
          key={x}
          x={x}
          y={0}
          width={1}
          height={height}
          fill={color}
          fillOpacity={opacity}
        />
      );
    }
  }

  render() {
    // console.log("render in valueplot");
    const { xToValue, height, forceSvg, width } = this.props;

    return xToValue.length === 0 ? (
      <div
        style={{
          width: width,
          height: height,
        }}
      ></div>
    ) : (
      <DesignRenderer
        type={forceSvg ? RenderTypes.SVG : RenderTypes.CANVAS}
        width={xToValue.length}
        height={height}
      >
        {this.props.xToValue.map(this.renderPixel)}
      </DesignRenderer>
    );
  }
}

export default NumericalTrack;
// export default withLogPropChanges(withDefaultOptions(NumericalTrack));
