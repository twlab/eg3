import React from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import { scaleLinear } from "d3-scale";
import memoizeOne from "memoize-one";

import Smooth from "array-smooth";

import GenomicCoordinates from "./GenomicCoordinates";

import {
  FeatureAggregator,
  DefaultAggregators,
} from "../../../../../models/FeatureAggregator";
import { ScaleChoices } from "../../../../../models/ScaleChoices";
import { PixiScene } from "./PixiScene";
import TrackLegend from "../TrackLegend";

export const DEFAULT_OPTIONS = {
  aggregateMethod: DefaultAggregators.types.MEAN,
  height: 80,
  yScale: ScaleChoices.AUTO,
  yMax: 10,
  yMin: 0,
  smooth: 0,
  color: "blue",
  backgroundColor: "var(--bg-color)",
  playing: true,
  speed: [10],
  dynamicColors: [],
  useDynamicColors: false,
  dynamicLabels: [],
};

const TOP_PADDING = 2;

interface ViewWindow {
  start: number;
  end: number;
}

import TrackModel from "../../../../../models/TrackModel";
import HoverToolTip from "../HoverToolTips/HoverToolTip";

interface Options {
  aggregateMethod: string;
  height: number;
  yScale: string;
  yMax: number;
  yMin: number;
  smooth: number;
  color: string;
  backgroundColor: string;
  playing: boolean;
  speed: number[];
  steps?: number;
  dynamicColors: string[];
  useDynamicColors: boolean;
  dynamicLabels: string[];
}

interface ViewRegion {
  // Replace with actual structure
}

interface DynamicplotTrackProps {
  data: any[]; // Replace 'any' with the actual type if known
  unit?: string;
  options: Options;
  isLoading?: boolean;
  error?: any;
  viewRegion: any;
  viewWindow: any;
  trackModel: TrackModel;
  width: number;
  updatedLegend: any;
}

interface DynamicplotTrackState {
  xToValue: number[][] | null;
  scales: {
    valueToY: (value: number) => number;
    min: number;
    max: number;
  } | null;
}

class DynamicplotTrackComponent extends React.PureComponent<
  DynamicplotTrackProps,
  DynamicplotTrackState
> {
  static propTypes = {
    data: PropTypes.array.isRequired, // PropTypes.arrayOf(Feature)
    unit: PropTypes.string,
    options: PropTypes.object.isRequired,
    isLoading: PropTypes.bool,
    error: PropTypes.any,
  };

  private xToValue: number[][] | null;
  private scales: {
    valueToY: (value: number) => number;
    min: number;
    max: number;
  } | null;

  constructor(props: DynamicplotTrackProps) {
    super(props);
    this.xToValue = null;
    this.scales = null;

    this.aggregateFeatures = memoizeOne(this.aggregateFeatures);
    this.computeScales = memoizeOne(this.computeScales);

  }

  aggregateFeatures(
    data: any[],
    viewRegion: any,
    width: number,
    aggregatorId: string
  ) {
    const aggregator = new FeatureAggregator();
    const xToFeatures = aggregator.makeXMap(data, viewRegion, width);
    return xToFeatures.map(DefaultAggregators.fromId(aggregatorId));
  }

  computeScales(xToValue: number[][], height: number) {
    const { yScale, yMin, yMax } = this.props.options;
    if (yMin > yMax) {
      console.log("Y-axis min must be less than max", "error", 2000);
    }

    const visibleValues = _.flatten(
      xToValue.map((d) =>
        d.slice(this.props.viewWindow.start, this.props.viewWindow.end)
      )
    );

    let max = _.max(visibleValues) || 0;
    let min = _.min(visibleValues) || 0;

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
   * @return {JSX.Element} tooltip to render
   */
  // renderTooltip(relativeX: number) {
  //   const { trackModel, viewRegion, width, unit } = this.props;
  //   const values =
  //     this.xToValue?.map((value) => value[Math.round(relativeX)]) ?? [];
  //   const stringValues = values.map((value) => {
  //     return typeof value === "number" && !Number.isNaN(value)
  //       ? value.toFixed(2)
  //       : "(no data)";
  //   });
  //   const divs = stringValues.map((value, i) => {
  //     const color = trackModel.tracks[i].options.color || "blue";
  //     return (
  //       <div key={i}>
  //         <span style={{ color: color }}>
  //           {trackModel.tracks[i].label} {value}
  //         </span>
  //         {unit && <span className="Tooltip-minor-text">{unit}</span>}
  //       </div>
  //     );
  //   });
  //   return (
  //     <div>
  //       {divs}
  //       <div className="Tooltip-minor-text">
  //         <GenomicCoordinates
  //           viewRegion={viewRegion}
  //           width={width}
  //           x={relativeX}
  //         />
  //       </div>
  //       <div className="Tooltip-minor-text">{trackModel.getDisplayLabel()}</div>
  //     </div>
  //   );
  // }

  render() {
    const { data, viewRegion, width, trackModel, unit, options, viewWindow, updatedLegend } =
      this.props;

    const {
      height,
      aggregateMethod,
      smooth,
      color,
      backgroundColor,
      playing,
      speed,
      steps,
      dynamicLabels,
      dynamicColors,
      useDynamicColors,

    } = options;
    const aggregatedData = data.map((d) =>
      this.aggregateFeatures(d, viewRegion, width, aggregateMethod)
    );
    this.xToValue =
      smooth === 0
        ? aggregatedData
        : aggregatedData.map((d) => Smooth(d, smooth));
    this.scales = this.computeScales(this.xToValue, height);
    const xToValueZipped = _.zip(...this.xToValue);
    if (updatedLegend) {
      updatedLegend.current = <TrackLegend trackModel={trackModel} height={height} axisScale={this.scales.valueToY as any} axisLegend={unit} />
    }

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
            windowWidth={width}
            trackType={"dynamic"}
            trackModel={trackModel}
            height={height}
            viewRegion={viewRegion}
            unit={unit}
            hasReverse={true}
            options={options}
          />

        </div>
        <PixiScene
          xToValue={xToValueZipped}
          scales={this.scales}
          width={width}
          height={height}
          steps={steps}
          color={color}
          backgroundColor={backgroundColor}
          playing={playing}
          speed={speed}
          dynamicLabels={dynamicLabels}
          viewWindow={viewWindow}
          dynamicColors={dynamicColors}
          useDynamicColors={useDynamicColors}
        />
      </React.Fragment>
    );
    return visualizer;
  }
}

export default DynamicplotTrackComponent;
