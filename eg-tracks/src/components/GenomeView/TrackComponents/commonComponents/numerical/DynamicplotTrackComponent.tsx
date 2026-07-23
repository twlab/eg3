import React, { useMemo, useRef } from "react";
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
  backgroundColor: "white",
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
import { NumericalAggregator } from "./NumericalAggregator";

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
  xvaluesData?: any;
  dataIdx: number;
  initialLoad?: any;
  windowWidth?: number;
  legendWidth?: number;
}

const DynamicplotTrackComponent: React.FC<DynamicplotTrackProps> = (props) => {
  const currentViewDataIdx = useRef(0);
  const currentScale: any = useRef(null);
  const currentViewWindow = useRef({ start: 0, end: 1 });
  const currentVisualizer = useRef(null);
  const currentViewOptions = useRef({});
  const currentWindowWidth = useRef<any>(0);

  const {
    data,
    viewRegion,
    width,
    trackModel,
    unit,
    options,
    viewWindow,
    updatedLegend,
    xvaluesData,
    dataIdx,
    initialLoad,
    windowWidth,
    legendWidth,
  } = props;

  const {
    height,
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

  const aggregator = useMemo(() => new NumericalAggregator(), []);

  const xToValue = xvaluesData
    ? xvaluesData
    : smooth === 0
      ? data.map(
          (d) => aggregator.xToValueMaker(d, viewRegion, width, options)[0],
        )
      : data.map((d) =>
          Smooth(
            aggregator.xToValueMaker(d, viewRegion, width, options)[0],
            smooth,
          ),
        );

  const computeScales = useMemo(() => {
    return memoizeOne((xToValue: number[][], height: number) => {
      const { yScale, yMin, yMax } = options;
      if (yMin > yMax) {
        console.log("Y-axis min must be less than max", "error", 2000);
      }

      const visibleValues = _.flatten(
        xToValue.map((d) => d.slice(viewWindow.start, viewWindow.end)),
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
    });
  }, [options, props]);

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

  const scales = computeScales(xToValue, height);
  const xToValueZipped = _.zip(...xToValue);

  if (updatedLegend) {
    updatedLegend.current = {
      trackModel,
      height,
      axisScale: scales.valueToY as any,
      axisLegend: unit,
      legendWidth,
    };
  }

  let visualizer;

  if (
    initialLoad ||
    (options as any).forceSvg ||
    (dataIdx === currentViewDataIdx.current &&
      !_.isEqual(viewWindow, currentViewWindow.current) &&
      (!(scales.max === currentScale.current?.max) ||
        !(scales.min === currentScale.current?.min))) ||
    dataIdx !== currentViewDataIdx.current ||
    !_.isEqual(options, currentViewOptions.current) ||
    windowWidth !== currentWindowWidth.current
  ) {
    visualizer = (
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
            data={xToValue}
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
          scales={scales}
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
  } else {
    visualizer = currentVisualizer.current;
  }

  currentWindowWidth.current = windowWidth;
  currentVisualizer.current = visualizer;
  currentViewDataIdx.current = dataIdx;
  currentViewWindow.current = viewWindow;
  currentScale.current = scales;
  currentViewOptions.current = options;

  return visualizer;
};

export default DynamicplotTrackComponent;
