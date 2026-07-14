import React, { useMemo, useRef, useCallback } from "react";
import _ from "lodash";
import { scaleLinear } from "d3-scale";
import * as d3 from "d3";
import TrackLegend from "../TrackLegend";

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
  data: any;
  viewRegion: DisplayedRegionModel;
  width: number;
  trackModel: TrackModel;
  unit: string;
  options: any;
  forceSvg: boolean;
  viewWindow: any;
  updatedLegend?: any;
  dataIdx?: number;
  initialLoad?: boolean;
  windowWidth?: number;
  legendWidth?: number;
  xvaluesData?: any;
}

const BoxplotTrackComponents: React.FC<BoxplotTrackProps> = (props) => {
  const currentViewDataIdx = useRef(0);

  const currentScale: any = useRef(null);
  const currentViewWindow = useRef({ start: 0, end: 1 });
  const currentVisualizer = useRef(null);
  const currentViewOptions = useRef(null);
  const currentWindowWidth = useRef(0);

  const {
    data,
    viewRegion,
    width,
    trackModel,
    unit,
    options,
    forceSvg,
    viewWindow,
    updatedLegend,
    dataIdx = 0,
    initialLoad = false,
    windowWidth = 0,
    legendWidth,
    xvaluesData,
  } = props;

  const { height, boxColor, lineColor } = options;

  /**
   * make a map for x to the start x of each window, used for tooltip
   */
  const makeXalias = useMemo(() => {
    return (width: number, sizeInput: number) => {
      let size;
      if (sizeInput < 1) {
        console.log("window size cannot less than 1", "warning", 5000);
        size = 1;
      } else if (sizeInput > width) {
        console.log(
          "window size cannot larger than curent view width",
          "warning",
          5000,
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
  }, []);

  const computeBoxStats = useCallback((features: any[]) => {
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
  }, []);

  const aggregateFeatures = useMemo(() => {
    return (
      data: any[],
      viewRegion: DisplayedRegionModel,
      width: number,
      useCenter: boolean,
      windowSize: number,
    ) => {
      const aggregator = new FeatureAggregator();
      const xToFeatures = aggregator.makeXWindowMap(
        data,
        viewRegion,
        width,
        useCenter,
        windowSize,
      );
      const hash = {};
      Object.keys(xToFeatures).forEach((x) => {
        hash[x] = computeBoxStats(xToFeatures[x]);
      });

      return hash;
    };
  }, [computeBoxStats]);

  const computeScales = useMemo(() => {
    return (xMap: any, xAlias: any, height: number, viewWindow: any) => {
      const visibleXs = Object.keys(xAlias).slice(
        viewWindow.start,
        viewWindow.end,
      );
      const visibleValues: Array<any> = [];
      Object.keys(xMap).forEach((x) => {
        if (visibleXs.includes(x)) {
          visibleValues.push(xMap[x]);
        }
      });
      const maxValue = _.maxBy(visibleValues, "max");
      const minValue = _.minBy(visibleValues, "min");
      const max = maxValue ? maxValue.max : 1;
      const min = minValue ? minValue.min : 0;
      return {
        valueToY: scaleLinear()
          .domain([max, min])
          .range([TOP_PADDING, height])
          .clamp(true),
        min,
        max,
      };
    };
  }, []);

  const xAlias = makeXalias(width, options.windowSize);

  let xvalues =
    xvaluesData && options.usePrimaryNav
      ? xvaluesData
      : aggregateFeatures(data, viewRegion, width, false, options.windowSize);

  const scales = computeScales(xvalues, xAlias, height, viewWindow);

  let visualizer;

  if (
    initialLoad ||
    options.forceSvg ||
    (dataIdx === currentViewDataIdx.current &&
      !_.isEqual(viewWindow, currentViewWindow.current) &&
      (!(scales.max === currentScale.current?.max) ||
        !(scales.min === currentScale.current?.min))) ||
    !_.isEqual(options, currentViewOptions.current) ||
    dataIdx !== currentViewDataIdx.current ||
    !options.usePrimaryNav ||
    windowWidth !== currentWindowWidth.current
  ) {
    const legendProps = {
      trackModel,
      height,
      axisScale: scales.valueToY,
      axisLegend: unit,
      label: options.label,
      forceSvg,
      legendWidth,
    };
    if (updatedLegend) {
      updatedLegend.current = legendProps;
    }
    const legend =
      forceSvg || options.packageVersion ? (
        <div style={{ display: "flex" }}>
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

    visualizer = (
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
              data={xvalues}
              scale={scales}
              windowWidth={width}
              trackType={"boxplot"}
              trackModel={trackModel}
              height={height}
              viewRegion={viewRegion}
              unit={unit ? unit : ""}
              hasReverse={true}
              options={options}
              xAlias={xAlias}
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
            <Boxplot
              xMap={xvalues}
              scales={scales}
              height={height}
              width={width}
              windowSize={options.windowSize}
              boxColor={boxColor}
              lineColor={lineColor}
              forceSvg={forceSvg}
            />
          </div>
        </div>
      </React.Fragment>
    );
  } else {
    visualizer = currentVisualizer.current;
  }

  currentVisualizer.current = visualizer;
  currentViewDataIdx.current = dataIdx;
  currentViewWindow.current = viewWindow;

  currentScale.current = scales;
  currentViewOptions.current = options;
  currentWindowWidth.current = windowWidth;

  return visualizer;
};
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

const Boxplot = (props: BoxplotProps) => {
  const {
    xMap,
    scales,
    height,
    width,
    windowSize,
    boxColor,
    lineColor,
    forceSvg,
  } = props;

  /**
   * Gets an element to draw for a data record.
   *
   * @param {number} value
   * @param {number} x
   * @return {JSX.Element} bar element to render
   */
  const renderBox = useCallback(
    (value: any, x1: string) => {
      if (!value) {
        return null;
      }
      const x = Number.parseInt(x1);
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
    },
    [scales, boxColor, lineColor, windowSize],
  );

  return (
    <DesignRenderer
      type={forceSvg ? RenderTypes.SVG : RenderTypes.CANVAS}
      width={width}
      height={height}
    >
      {Object.keys(xMap).map((x) => renderBox(xMap[x], x))}
    </DesignRenderer>
  );
};

export default BoxplotTrackComponents;
