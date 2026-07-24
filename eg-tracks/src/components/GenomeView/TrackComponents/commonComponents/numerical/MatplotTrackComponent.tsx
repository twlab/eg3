import React, { useCallback, useMemo, useRef } from "react";

import _ from "lodash";
import { scaleLinear } from "d3-scale";
import memoizeOne from "memoize-one";
import Smooth from "array-smooth";
// import Track from '../Track';
// import TrackLegend from '../TrackLegend';
// import GenomicCoordinates from "./GenomicCoordinates";
// import HoverTooltipContext from '../tooltip/HoverTooltipContext';

import { RenderTypes, DesignRenderer } from "../art/DesignRenderer";
import { DefaultAggregators } from "../../../../../models/FeatureAggregator";
import { ScaleChoices } from "../../../../../models/ScaleChoices";
import Feature from "../../../../../models/Feature";
import TrackModel from "../../../../../models/TrackModel";
import TrackLegend from "../TrackLegend";
import HoverToolTip from "../HoverToolTips/HoverToolTip";
import { NumericalAggregator } from "./NumericalAggregator";

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

  xvaluesData?: any;
  dataIdx: number;
  initialLoad;
  updatedLegend?: any;
  windowWidth?: number;
  legendWidth: number;
}
const TOP_PADDING = 2;

/**
 * Track specialized in showing numerical data in matplot style, aka. lineplot
 *
 * @author Daofeng Li
 */
const MatplotTrackComponent: React.FC<MatplotTrackProps> = (props) => {
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
    forceSvg,
    updatedLegend,
    xvaluesData,
    viewWindow,
    dataIdx,
    initialLoad,
    windowWidth,
    legendWidth,
  } = props;

  const { height, smooth, lineWidth } = options;

  const aggregator = useMemo(() => new NumericalAggregator(), []);

  const xToValue = xvaluesData
    ? xvaluesData
    : smooth === 0
      ? data.map((d) => aggregator.xToValueMaker(d, viewRegion, width, options)[0])
      : Smooth(
          data.map(
            (d) => aggregator.xToValueMaker(d, viewRegion, width, options)[0],
          ),
          smooth,
        );

  const computeScales = useMemo(() => {
    return memoizeOne((xToValue: any[], height: number) => {
      const { yScale, yMin, yMax } = options;

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
          d.slice(props.viewWindow.start, props.viewWindow.end),
        ),
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
    });
  }, [options, props]);

  const scales = computeScales(xToValue, height);

  const legendProps = {
    trackModel,
    height,
    axisScale: scales.valueToY,
    axisLegend: unit,
    forceSvg,
    legendWidth,
  };

  if (updatedLegend) {
    updatedLegend.current = legendProps;
  }

  const legend =
    forceSvg || options.packageVersion ? (
      <div
        style={{
          display: "flex",
        }}
      >
        <TrackLegend {...legendProps} />
      </div>
    ) : null;
  let curParentStyle: any = forceSvg
    ? {
        position: "relative",

        overflow: "hidden",
        width: windowWidth,
      }
    : {};
  let curEleStyle: any = forceSvg
    ? {
        position: "relative",
        transform: `translateX(${-viewWindow.start}px)`,
      }
    : {};

  let visualizer;

  if (
    initialLoad ||
    options.forceSvg ||
    (dataIdx === currentViewDataIdx.current &&
      !_.isEqual(viewWindow, currentViewWindow.current) &&
      (!(scales.max === currentScale.current?.max) ||
        !(scales.min === currentScale.current?.min))) ||
    dataIdx !== currentViewDataIdx.current ||
    !_.isEqual(options, currentViewOptions.current) ||
    windowWidth !== currentWindowWidth.current
  ) {
    visualizer = (
      // <HoverTooltipContext tooltipRelativeY={height} getTooltipContents={this.renderTooltip} >
      <React.Fragment>
        {!forceSvg ? (
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
              scale={scales}
              windowWidth={width}
              trackType={"matplot"}
              trackModel={trackModel}
              height={height}
              viewRegion={viewRegion}
              unit={unit ? unit : ""}
              hasReverse={true}
              options={options}
            />
          </div>
        ) : (
          ""
        )}

        <div style={{ display: "flex", ...curParentStyle }}>
          {forceSvg || options.packageVersion ? legend : ""}
          <div
            style={{
              ...curEleStyle,
            }}
          >
            <LinePlot
              trackModel={trackModel}
              xToValue={xToValue}
              scales={scales}
              height={height}
              forceSvg={forceSvg}
              lineWidth={lineWidth}
              width={width}
              viewWindow={viewWindow}
            />
          </div>
        </div>
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

interface LinePlotTrackProps {
  height: any; // Replace 'Feature' with the actual type of your dat
  width: any;
  scales: any;
  lineWidth: any;
  xToValue: any;
  trackModel: TrackModel;
  forceSvg?: any;
  viewWindow?: any;
}

const LinePlot: React.FC<LinePlotTrackProps> = (props) => {
  const { xToValue, height, width, forceSvg, viewWindow, scales, trackModel, lineWidth } =
    props;

  /**
   * draw a line for an array of numbers.
   *
   * @param {number[]} values
   * @return {JSX.Element} line element to render
   */
  const renderLine = useCallback(
    (values, trackIndex) => {
      // eslint-disable-next-line array-callback-return
      const points = values
        .map((value, x) => {
          if (value && !Number.isNaN(value)) {
            const y = scales.valueToY(value);
            return `${x},${y}`;
          }
        })
        .filter((value) => value); // removes null from original

      const color =
        trackModel.tracks &&
        trackModel.tracks[trackIndex] &&
        trackModel.tracks[trackIndex].options
          ? trackModel.tracks[trackIndex].options.color || "blue"
          : "blue";
      return (
        <polyline
          key={trackIndex}
          points={points.join(" ")}
          stroke={color}
          strokeWidth={lineWidth}
          fill="none"
        />
      );
    },
    [scales, trackModel, lineWidth],
  );

  return xToValue.length === 0 ? (
    <div
      style={{
        width: width,
        height: height,
      }}
    ></div>
  ) : (
    <DesignRenderer
      type={RenderTypes.SVG}
      width={width}
      height={height}
      forceSvg={forceSvg}
      viewWindow={viewWindow}
      style={{}}
    >
      {xToValue.map(renderLine)}
    </DesignRenderer>
  );
};

export default MatplotTrackComponent;
