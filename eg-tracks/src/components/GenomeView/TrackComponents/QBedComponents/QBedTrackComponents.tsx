import React, { JSX, useMemo, useRef } from "react";
import _ from "lodash";
import { scaleLinear, scaleLog } from "d3-scale";
import GenomicCoordinates from "../commonComponents/numerical/GenomicCoordinates";
import {
  RenderTypes,
  DesignRenderer,
} from "../commonComponents/art/DesignRenderer";
import { LogChoices } from "../../../../models/LogChoices";
import { DownsamplingChoices } from "../../../../models/DownsamplingChoices";
import { FeatureAggregator } from "../../../../models/FeatureAggregator";
import { ScaleChoices } from "../../../../models/ScaleChoices";
import TrackLegend from "../commonComponents/TrackLegend";
import { NumericalAggregator } from "../commonComponents/numerical/NumericalAggregator";
import HoverToolTip from "../commonComponents/HoverToolTips/HoverToolTip";

type Options = {
  height: number;
  color: string;
  color2: string;
  yScale: string;
  logScale: string;
  show: string;
  sampleSize: number;
  opacity: number[];
  yMax: number;
  yMin: number;
  markerSize: number;
  showHorizontalLine: boolean;
  horizontalLineValue: number;
  packageVersion?: boolean;
  label?: string;
  usePrimaryNav?: boolean;
  forceSvg?: boolean;
};

type QBed = {
  value: number;
  strand: string;
  annotation: string;
  relativeX?: number;
  relativeY?: number;
};

type QBedTrackProps = {
  data: Array<any>;
  options: Options;
  isLoading: boolean;
  error: any;
  viewRegion: any;
  width: number;
  trackModel: any;
  viewWindow: any;
  forceSvg: boolean;
  getNumLegend: any;
  xvaluesData?: Array<any>;
  dataIdx: number;
  initialLoad: boolean;
};

export const DEFAULT_OPTIONS = {
  height: 40,
  color: "blue",
  color2: "red",
  yScale: ScaleChoices.AUTO,
  logScale: LogChoices.AUTO,
  show: "all",
  sampleSize: 1000,
  opacity: [100],
  yMax: 10,
  yMin: 0,
  markerSize: 3,
  showHorizontalLine: false,
  horizontalLineValue: 1,
};

const TOP_PADDING = 5;

/**
 * Track specialized in showing qBED data.
 */
const QBedTrackComponents: React.FC<QBedTrackProps> = (props) => {
  const scalesRef = useRef<any>(null);
  const currentVisualizer = useRef<JSX.Element | null>(null);
  const currentViewDataIdx = useRef<number | null>(null);
  const currentViewWindow = useRef<any | null>(null);
  const currentScale = useRef<any | null>(null);
  const initialRender = useRef(true);
  const currentViewOptions = useRef({});
  const computeScales = (xToValue: any, height: number) => {
    const { yScale, yMin, yMax, logScale } = props.options;
    if (yMin > yMax) {
      console.log("Y-axis min must less than max", "error", 2000);
    }
    const visibleValues = xToValue.slice(
      props.viewWindow.start,
      props.viewWindow.end
    );
    let max = _.max(_.flatten(visibleValues).map((x: any) => x.value)) || 0;
    let min = 0;
    if (yScale === ScaleChoices.FIXED) {
      max = yMax ? yMax : max;
      min = yMin ? yMin : min;
    }
    if (min > max) {
      min = max;
    }

    let transformer = logScale === LogChoices.BASE10 ? scaleLog : scaleLinear;
    if (logScale === LogChoices.BASE10) {
      min = 1;
    }

    return {
      valueToY: transformer()
        .domain([max, min])
        .range([TOP_PADDING, height])
        .clamp(true),
      min,
      max,
    };
  };

  const downSample = (xToValue: any[], sampleSize: number) => {
    if (xToValue.length === 0) return [];
    let sampled_xToValue: any[] = new Array(xToValue.length).fill([]);
    const randomSample = shuffleArray(xToValue.flat()).slice(0, sampleSize);
    randomSample.forEach((sample: any) => {
      sampled_xToValue[sample.relativeX] = sampled_xToValue[
        sample.relativeX
      ].concat([sample]);
    });
    return sampled_xToValue;
  };

  const shuffleArray = (a: any[]) => {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = a[i];
      a[i] = a[j];
      a[j] = x;
    }
    return a;
  };

  const {
    data,
    viewRegion,
    width,
    trackModel,
    options,
    forceSvg,
    viewWindow,
    xvaluesData,
    dataIdx,
    initialLoad,
  } = props;
  const {
    height,
    color,
    color2,
    markerSize,
    opacity,
    show,
    sampleSize,
    showHorizontalLine,
    horizontalLineValue,
  } = options;

  const aggregator = useMemo(() => new FeatureAggregator(), []);
  let xToValue: Array<any> = xvaluesData && options.usePrimaryNav
    ? xvaluesData
    : aggregator.makeXMap(data, viewRegion, width, true).xToFeaturesForward;
  scalesRef.current = computeScales(xToValue, height);
  for (let i = 0; i < xToValue.length; i++) {
    for (let j = 0; j < xToValue[i].length; j++) {
      xToValue[i][j].relativeX = i;
      xToValue[i][j].relativeY = scalesRef.current.valueToY(
        xToValue[i][j].value
      );
    }
  }

  if (show === DownsamplingChoices.SAMPLE && xToValue.length > sampleSize) {
    xToValue = downSample(xToValue, sampleSize);
  }

  const legend = (
    <div
      style={{
        display: "flex",
      }}
    >
      <TrackLegend
        trackModel={trackModel}
        height={height}
        axisScale={scalesRef.current.valueToY}
        label={options.label}
        forceSvg={forceSvg}
      />
    </div>
  );
  if (props.getNumLegend) {
    props.getNumLegend(legend);
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
  let hoverStyle: any = options.packageVersion ? { marginLeft: 120 } : {};

  let visualizer;

  if (
    initialLoad ||
    options.forceSvg ||
    (dataIdx === currentViewDataIdx.current &&
      !_.isEqual(viewWindow, currentViewWindow.current) &&
      (!(scalesRef.current.max === currentScale.current?.max) ||
        !(scalesRef.current.min === currentScale.current?.min))) ||
    dataIdx !== currentViewDataIdx.current ||
    !_.isEqual(options, currentViewOptions.current) ||
    !options.usePrimaryNav
  ) {
    visualizer = (
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
              windowWidth={width}
              trackType={"qbed"}
              trackModel={trackModel}
              height={height}
              viewRegion={viewRegion}
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
            <QBedPlot
              xToValue={xToValue}
              scales={scalesRef.current}
              height={height}
              color={color}
              color2={color2}
              forceSvg={forceSvg}
              markerSize={markerSize}
              alpha={opacity[0] / 100}
              show={show}
              sampleSize={sampleSize}
              showHorizontalLine={showHorizontalLine}
              horizontalLineValue={horizontalLineValue}
              viewWindow={viewWindow}
            />
          </div>{" "}
        </div>
      </React.Fragment>
    );
  } else {
    visualizer = currentVisualizer.current;
  }
  currentVisualizer.current = visualizer;
  currentViewDataIdx.current = dataIdx;
  currentViewWindow.current = viewWindow;
  initialRender.current = false;
  currentScale.current = scalesRef.current;
  currentViewOptions.current = options;
  xToValue = [];
  return visualizer;
};

type QBedPlotProps = {
  xToValue: QBed[][];
  scales: any;
  height: number;
  color?: string;
  color2?: string;
  markerSize: number;
  alpha: number;
  show: string;
  sampleSize: number;
  showHorizontalLine: boolean;
  horizontalLineValue: number;
  forceSvg: boolean;
  viewWindow: any;
};

class QBedPlot extends React.PureComponent<QBedPlotProps> {
  renderPixel(value: QBed[], x: number) {
    if (value.length === 0) {
      return null;
    }
    const { scales, color, color2, markerSize, alpha } = this.props;
    return value.map((quantum, idx) => {
      const y = scales.valueToY(quantum.value);
      const key = `${x}-${idx}`;
      const colorToUse = quantum.strand === "-" ? color2 : color;
      return (
        <circle
          key={key}
          cx={x}
          cy={y}
          r={markerSize}
          fill="none"
          stroke={colorToUse}
          strokeOpacity={alpha}
        />
      );
    });
  }

  renderHorizontalLine = () => {
    const { showHorizontalLine, horizontalLineValue, scales, viewWindow } =
      this.props;
    if (!showHorizontalLine) {
      return null;
    }
    const y = scales.valueToY(horizontalLineValue);
    return (
      <line
        stroke="black"
        strokeWidth={1}
        x1={viewWindow.start}
        y1={y}
        x2={viewWindow.end}
        y2={y}
      />
    );
  };

  render() {
    const { xToValue, height, forceSvg } = this.props;
    return (
      <DesignRenderer
        type={forceSvg ? RenderTypes.SVG : RenderTypes.CANVAS}
        width={xToValue.length}
        height={height}
      >
        {xToValue.map(this.renderPixel.bind(this))}
        {this.renderHorizontalLine()}
      </DesignRenderer>
    );
  }
}

export default QBedTrackComponents;
