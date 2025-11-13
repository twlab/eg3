import React from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import { scaleLinear } from "d3-scale";
import * as d3 from "d3";
import memoizeOne from "memoize-one";
import TrackLegend from "../TrackLegend";
import GenomicCoordinates from "../HoverToolTips/GenomicCoordinates";

import { RenderTypes, DesignRenderer } from "../art/DesignRenderer";
import { FeatureAggregator } from "../../../../../models/FeatureAggregator";
import TrackModel from "../../../../../models/TrackModel";
import DisplayedRegionModel from "../../../../../models/DisplayedRegionModel";
import HoverToolTip from "../HoverToolTips/HoverToolTip";
export const DEFAULT_OPTIONS = {
  height: 100,
  boxColor: "#36558F",
  lineColor: "#dd2c00",
  windowSize: 5,
};

const TOP_PADDING = 2;

/**
 * Track showing numerical data as boxplots.
 *
 * @author Daofeng Li
 */

interface BoxplotTrackProps {
  data: any; // You can specify a more detailed type if you know the structure of your data
  viewRegion: DisplayedRegionModel; // Assuming this is a string, adjust as needed
  width: number;
  trackModel: TrackModel; // Adjust type if necessary
  unit: string;
  options: any; // Specify a more detailed type if you have one
  forceSvg: boolean;
  viewWindow: any;
  getNumLegend: any;
}
class BoxplotTrackComponents extends React.PureComponent<BoxplotTrackProps> {
  xMap: {};
  xAlias: {};
  scales;

  constructor(props) {
    super(props);
    this.xMap = {}; // x to value array map
    this.xAlias = {}; // x in each widow map to the start of the window x
    this.scales = null;
    this.computeScales = memoizeOne(this.computeScales);
    this.renderTooltip = this.renderTooltip.bind(this);
    this.aggregateFeatures = memoizeOne(this.aggregateFeatures);
    this.makeXalias = memoizeOne(this.makeXalias);
  }

  /**
   * make a map for x to the start x of each window, used for tooltip
   * @param {number} width
   * @param {number} size
   * @returns
   */
  makeXalias = (width, sizeInput) => {
    let size;
    if (sizeInput < 1) {
      console.log("window size cannot less than 1", "warning", 5000);
      size = 1;
    } else if (sizeInput > width) {
      console.log(
        "window size cannot larger than curent view width",
        "warning",
        5000
      );
      size = width;
    } else {
      size = sizeInput;
    }
    const alias = {};
    for (let x = 0; x < width; x += size) {
      for (let y = 0; y < size; y++) {
        alias[x + y] = x;
      }
    }
    return alias;
  };

  computeBoxStats = (features) => {
    const data = features.map((f) => f.value);
    if (!data || !data.length) {
      return null;
    }
    const data_sorted = data.sort(d3.ascending);
    const q1 = d3.quantile(data_sorted, 0.25);
    const median = d3.quantile(data_sorted, 0.5);
    const q3 = d3.quantile(data_sorted, 0.75);
    const interQuantileRange = q3! - q1!;
    const min = q1! - 1.5 * interQuantileRange;
    const max = q1! + 1.5 * interQuantileRange;
    return { q1, q3, median, min, max, count: data.length };
  };

  aggregateFeatures(data, viewRegion, width, useCenter, windowSize) {
    const aggregator = new FeatureAggregator();
    const xToFeatures = aggregator.makeXWindowMap(
      data,
      viewRegion,
      width,
      useCenter,
      windowSize
    );
    const hash = {};
    Object.keys(xToFeatures).forEach((x) => {
      hash[x] = this.computeBoxStats(xToFeatures[x]);
    });
    return hash;
  }

  computeScales(xMap, xAlias, height) {
    const visibleXs = Object.keys(xAlias).slice(
      this.props.viewWindow.start,
      this.props.viewWindow.end
    );
    const visibleValues: Array<any> = [];
    Object.keys(xMap).forEach((x) => {
      if (visibleXs.includes(x)) {
        visibleValues.push(xMap[x]);
      }
    });
    // console.log(visibleXs)
    // console.log(visibleValues)
    const maxValue = _.maxBy(visibleValues, "max");
    const minValue = _.minBy(visibleValues, "min");
    const max = maxValue ? maxValue.max : 1; // in case undefined returned here, cause maxboth be undefined too
    const min = minValue ? minValue.min : 0;
    // console.log(max, min)
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
    const value = this.xMap[this.xAlias[Math.round(relativeX)]];
    const content = value ? (
      <div className="Tooltip-major-text" style={{ marginRight: 3 }}>
        <div>Total values: {value.count}</div>
        <div>Low: {value.min}</div>
        <div>High: {value.max}</div>
        <div>Quantile 1: {value.q1}</div>
        <div>Quantile 3: {value.q3}</div>
        <div>Median: {value.median}</div>
      </div>
    ) : (
      "(no data)"
    );
    return (
      <div>
        <div>
          {content}
          {unit && <span className="Tooltip-minor-text">{unit}</span>}
        </div>
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
      viewWindow,
    } = this.props;
    const { height, boxColor, lineColor } = options;
    this.xAlias = this.makeXalias(width, options.windowSize);
    this.xMap = this.aggregateFeatures(
      data,
      viewRegion,
      width,
      false,
      options.windowSize
    );
    // console.log(this.xMap);
    // console.log(this.xAlias)
    this.scales = this.computeScales(this.xMap, this.xAlias, height);
    const legend = (
      <TrackLegend
        trackModel={trackModel}
        height={height}
        axisScale={this.scales.valueToY}
        axisLegend={unit}
        label={options.label}
        forceSvg={forceSvg}
      />
    );

    if (this.props.getNumLegend) {
      this.props.getNumLegend(legend);
    }
    let curParentStyle: any = forceSvg
      ? {
          position: "relative",

          overflow: "hidden",
          width: width / 3,
        }
      : {};
    let curEleStyle: any = forceSvg
      ? {
          position: "relative",
          transform: `translateX(${-viewWindow.start}px)`,
        }
      : {};
    const visualizer = (
      //   <HoverTooltipContext
      //     tooltipRelativeY={height}
      //     getTooltipContents={this.renderTooltip}
      //   >
      <React.Fragment>
        <div style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              position: "absolute",
              zIndex: 3,
            }}
          >
            {!forceSvg ? (
              <HoverToolTip
                data={this.xMap}
                scale={this.scales}
                windowWidth={width}
                trackType={"boxplot"}
                trackModel={trackModel}
                height={height}
                viewRegion={viewRegion}
                unit={unit ? unit : ""}
                hasReverse={true}
                options={options}
                xAlias={this.xAlias}
              />
            ) : (
              ""
            )}
          </div>
          <div style={{ display: "flex", ...curParentStyle }}>
            {forceSvg || options.packageVersion ? legend : ""}{" "}
            <div
              style={{
                ...curEleStyle,
              }}
            >
              <Boxplot
                xMap={this.xMap}
                scales={this.scales}
                height={height}
                width={width}
                windowSize={options.windowSize}
                boxColor={boxColor}
                lineColor={lineColor}
                forceSvg={forceSvg}
              />
            </div>
          </div>{" "}
        </div>
      </React.Fragment>
    );
    return visualizer;
  }
}
interface BoxplotProps {
  xMap: object; // You can specify a more detailed type if you know the structure
  scales: any; // Specify a more detailed type if necessary
  height: number;
  width: number;
  windowSize: number;
  boxColor?: string; // Optional property
  lineColor?: string; // Optional property
  forceSvg?: boolean; // Optional property
}

export class Boxplot extends React.PureComponent<BoxplotProps> {
  static propTypes = {
    xMap: PropTypes.object.isRequired,
    scales: PropTypes.object.isRequired,
    height: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    windowSize: PropTypes.number.isRequired,
    boxColor: PropTypes.string,
    lineColor: PropTypes.string,
    forceSvg: PropTypes.bool,
  };

  /**
   * Gets an element to draw for a data record.
   *
   * @param {number} value
   * @param {number} x
   * @return {JSX.Element} bar element to render
   */
  renderBox = (value, x1) => {
    if (!value) {
      return null;
    }
    const x = Number.parseInt(x1);
    const { scales, boxColor, lineColor, windowSize } = this.props;
    const lowY = scales.valueToY(value.min);
    const highY = scales.valueToY(value.max);
    const q1Y = scales.valueToY(value.q1);
    const q3Y = scales.valueToY(value.q3);
    const medianY = scales.valueToY(value.median);
    return (
      <g key={x}>
        <line
          key={x + "vline"}
          x1={x + windowSize * 0.5}
          y1={highY}
          x2={x + windowSize * 0.5}
          y2={lowY}
          stroke={lineColor}
        />
        <rect
          key={x + "box"}
          x={x}
          y={q3Y}
          width={windowSize}
          height={q1Y - q3Y}
          fill={boxColor}
        />
        <line
          key={x + "medianline"}
          x1={x}
          y1={medianY}
          x2={x + windowSize}
          y2={medianY}
          stroke={lineColor}
        />
      </g>
    );
  };

  render() {
    const { xMap, height, width, forceSvg } = this.props;
    return (
      <DesignRenderer
        type={forceSvg ? RenderTypes.SVG : RenderTypes.CANVAS}
        width={width}
        height={height}
      >
        {Object.keys(xMap).map((x) => this.renderBox(xMap[x], x))}
      </DesignRenderer>
    );
  }
}

export default BoxplotTrackComponents;
