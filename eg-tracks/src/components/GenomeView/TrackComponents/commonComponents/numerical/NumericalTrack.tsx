import React, { useCallback, useMemo } from "react";

import _ from "lodash";
import { scaleLinear } from "d3-scale";
import memoizeOne from "memoize-one";
// import Track from "../Track";
// import TrackLegend from "../TrackLegend";
// import GenomicCoordinates from "../GenomicCoordinates";
// import HoverTooltipContext from "../tooltip/HoverTooltipContext";
// import configOptionMerging from "../configOptionMerging";
import { RenderTypes, DesignRenderer } from "../art/DesignRenderer";
import { NumericalDisplayModes } from "../../../../../trackConfigs/config-menu-models.tsx/DisplayModes";
import { DefaultAggregators } from "../../../../../models/FeatureAggregator";
import { ScaleChoices } from "../../../../../models/ScaleChoices";
import { NumericalAggregator } from "./NumericalAggregator";

import TrackLegend from "../TrackLegend";
import HoverToolTip from "../HoverToolTips/HoverToolTip";
// import { withLogPropChanges } from "components/withLogPropChanges";
interface NumericalTrackProps {
  data?: Array<any>;
  unit?: string;
  options?: any;
  isLoading?: boolean;
  error?: any;
  trackModel?: any;
  groupScale?: any;
  viewWindow?: any;
  viewRegion?: any;
  width?: any;
  forceSvg?: any;
  getNumLegend?: any;
  xvaluesData?: Array<any>;
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
 * @author Silas Hsu, Chanrung Seng
 */
const NumericalTrack: React.FC<NumericalTrackProps> = (props) => {
  const {
    data,
    viewRegion,
    width,
    trackModel,
    unit,
    options,
    forceSvg,
    getNumLegend,
    groupScale,
    xvaluesData,
    viewWindow,
  } = props;
  const { height, color, color2, colorAboveMax, color2BelowMin } = options;

  const aggregator = useMemo(() => new NumericalAggregator(), []);

  let xvalues = xvaluesData
    ? xvaluesData
    : aggregator.xToValueMaker(data, viewRegion, width, options, viewWindow);

  let [xToValue, xToValue2, hasReverse] = xvalues;
  const computeScales = useMemo(() => {
    return memoizeOne((xToValue: any[], xToValue2: any[], height: number) => {
      const { yScale, yMin, yMax } = options;
      if (yMin >= yMax) {
        console.log("Y-axis min must less than max", "error", 2000);
      }

      let gscale: any = {},
        min,
        max,
        xValues2: Array<any> = [];
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
          props.viewWindow.start,
          props.viewWindow.end
        );

        max = _.max(visibleValues) || 1;
        xValues2 = xToValue2.filter((x) => x);
        min =
          (xValues2.length
            ? _.min(
                xToValue2.slice(props.viewWindow.start, props.viewWindow.end)
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
        min < 0 && xToValue && xToValue.length > 0
          ? TOP_PADDING + ((height - 2 * TOP_PADDING) * max) / (max - min)
          : xToValue && xToValue.length > 0
          ? height
          : 0;
      if (
        (!xToValue || xToValue.length === 0) &&
        (!xToValue2 || xToValue2.length === 0)
      ) {
        max = 0;
      }
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
    });
  }, [options, props]);

  const scales = computeScales(xToValue, xToValue2, height);

  const getEffectiveDisplayMode = () => {
    const { displayMode, height } = options;
    if (
      displayMode === NumericalDisplayModes.AUTO ||
      displayMode === "density"
    ) {
      return height < AUTO_HEATMAP_THRESHOLD
        ? NumericalDisplayModes.HEATMAP
        : NumericalDisplayModes.BAR;
    } else {
      return displayMode;
    }
  };

  let isDrawingBars = getEffectiveDisplayMode() === NumericalDisplayModes.BAR;

  const legend = (
    <TrackLegend
      trackModel={trackModel}
      height={height}
      axisScale={scales.axisScale}
      axisLegend={unit}
      label={options.label}
      forceSvg={forceSvg}
    />
  );

  if (getNumLegend) {
    getNumLegend(legend);
  }
  let curParentStyle: any = forceSvg
    ? {
        position: "relative",

        overflow: "hidden",
        width: width / 3,
      }
    : {};
  let curEleStyle: any = forceSvg
    ? { position: "relative", transform: `translateX(${-viewWindow.start}px)` }
    : {};
  let hoverStyle: any = options.packageVersion ? { marginLeft: 120 } : {};
  const visualizer = hasReverse ? (
    <React.Fragment>
      {!forceSvg ? (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            position: "absolute",
            zIndex: 3,
            ...hoverStyle,
          }}
        >
          <HoverToolTip
            data={xToValue}
            data2={xToValue2}
            windowWidth={width}
            trackType={"numerical"}
            trackModel={trackModel}
            height={height}
            viewRegion={viewRegion}
            unit={unit}
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
          style={{ display: "flex", flexDirection: "column", ...curEleStyle }}
        >
          {xToValue && xToValue.length > 0 ? (
            <>
              <ValuePlot
                xToValue={xToValue}
                scales={scales}
                height={scales.zeroLine}
                color={color}
                colorOut={colorAboveMax}
                isDrawingBars={isDrawingBars}
                forceSvg={forceSvg}
                width={width}
                viewWindow={props.viewWindow}
              />
              <hr style={{ marginTop: 0, marginBottom: 0, padding: 0 }} />
            </>
          ) : (
            ""
          )}

          <ValuePlot
            xToValue={xToValue2}
            scales={scales}
            height={height - scales.zeroLine}
            color={color2}
            colorOut={color2BelowMin}
            isDrawingBars={isDrawingBars}
            forceSvg={forceSvg}
            width={width}
            viewWindow={props.viewWindow}
          />
        </div>
      </div>
    </React.Fragment>
  ) : (
    <React.Fragment>
      {!forceSvg ? (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            position: "absolute",
            zIndex: 3,
            ...hoverStyle,
          }}
        >
          <HoverToolTip
            data={xToValue}
            data2={xToValue2}
            windowWidth={width}
            trackType={"numerical"}
            trackModel={trackModel}
            height={height}
            viewRegion={viewRegion}
            unit={unit}
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
          <ValuePlot
            xToValue={xToValue}
            scales={scales}
            height={scales.zeroLine}
            color={color}
            colorOut={colorAboveMax}
            isDrawingBars={isDrawingBars}
            forceSvg={forceSvg}
            width={width}
            viewWindow={props.viewWindow}
          />
        </div>
      </div>
    </React.Fragment>
  );

  xvalues = [];
  return visualizer;
};

const ValuePlot = (props) => {
  const renderPixel = useCallback(
    (value, x) => {
      if (!value || Number.isNaN(value)) {
        return null;
      }
      const { isDrawingBars, scales, height, color, colorOut } = props;
      const y =
        value > 0 ? scales.valueToY(value) : scales.valueToYReverse(value);

      let drawY = value > 0 ? y : 0;
      let drawHeight = value > 0 ? height - y : y;

      if (isDrawingBars) {
        if (drawHeight <= 0) {
          return null;
        }
        let tipY;
        if (value > scales.max || value < scales.min) {
          const THRESHOLD_HEIGHT = 5; // Assuming you have a constant for this
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
                x={x}
                y={drawY}
                width={1}
                height={drawHeight}
                fill={color}
              />
              <rect
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
        const opacity =
          value > 0
            ? scales.valueToOpacity(value)
            : scales.valueToOpacityReverse(value);
        const fillOpacity = opacity === 0 ? 1 : opacity;
        return (
          <rect
            key={x}
            x={x}
            y={0}
            width={1}
            height={height}
            fill={color}
            fillOpacity={fillOpacity}
          />
        );
      }
    },
    [
      props.isDrawingBars,
      props.scales,
      props.height,
      props.color,
      props.colorOut,
    ]
  );

  const { xToValue, height, forceSvg, width, viewWindow } = props;

  return xToValue.length === 0 ? (
    <div style={{ width: width, height: height }}></div>
  ) : (
    <DesignRenderer
      type={forceSvg ? RenderTypes.SVG : RenderTypes.CANVAS}
      width={xToValue.length}
      height={height}
      forceSvg={forceSvg}
      viewWindow={viewWindow}
    >
      {xToValue.map(renderPixel)}
    </DesignRenderer>
  );
};

export default NumericalTrack;
// export default withLogPropChanges(withDefaultOptions(NumericalTrack));
