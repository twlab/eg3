import React from "react";
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
};

type QBed = {
  value: number;
  strand: string;
  annotation: string;
  relativeX?: number;
  relativeY?: number;
};

type QBedTrackProps = {
  data: QBed[];
  options: Options;
  isLoading: boolean;
  error: any;
  viewRegion: any;
  width: number;
  trackModel: any;
  viewWindow: any;
  forceSvg: boolean;
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
class QBedTrackComponents extends React.PureComponent<QBedTrackProps> {
  private xToValue: QBed[][];
  private scales: any;

  constructor(props: QBedTrackProps) {
    super(props);
    this.xToValue = [];
    this.scales = null;
    this.aggregateFeatures = this.aggregateFeatures.bind(this);
    this.renderTooltip = this.renderTooltip.bind(this);
  }

  aggregateFeatures(data: Array<any>, viewRegion: any, width: number) {
    const aggregator = new FeatureAggregator();
    const xToFeatures = aggregator.makeXMap(data, viewRegion, width, true);
    return xToFeatures;
  }

  computeScales(xToValue: any, height: number) {
    const { yScale, yMin, yMax, logScale } = this.props.options;
    if (yMin > yMax) {
      console.log("Y-axis min must less than max", "error", 2000);
    }
    const visibleValues = xToValue.slice(
      this.props.viewWindow.start,
      this.props.viewWindow.end
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
  }

  renderTooltip(relativeX: number, relativeY: number) {
    const { trackModel, viewRegion, width } = this.props;
    const { markerSize } = this.props.options;

    let quanta: QBed[] = [];

    for (let i = relativeX - markerSize; i <= relativeX + markerSize; i++) {
      quanta = quanta.concat(this.xToValue[i]);
    }

    if (quanta !== undefined && quanta.length > 0) {
      const nearest = this.nearestCards(
        quanta,
        relativeX,
        relativeY,
        markerSize
      );
      if (nearest.length > 0) {
        return (
          <div>
            <div className="Tooltip-minor-text">
              <GenomicCoordinates
                viewRegion={viewRegion}
                width={width}
                x={relativeX}
              />
            </div>
            <div className="Tooltip-minor-text">
              {trackModel.getDisplayLabel()}
            </div>
            <div className="Tooltip-minor-text">
              {this.formatCards(nearest)}
            </div>
          </div>
        );
      }
    }
  }

  formatCards = (quanta: QBed[]) => {
    const head = (
      <thead>
        <tr>
          <th scope="col">Value</th>
          <th scope="col">Strand</th>
          <th scope="col">Annotation</th>
        </tr>
      </thead>
    );
    const rows = quanta.slice(0, 10).map((quantum, i) => (
      <tr key={i}>
        <td>{quantum.value}</td>
        <td>{quantum.strand}</td>
        <td>
          {_.truncate(quantum.annotation, {
            length: 75,
            separator: /[,; ]/,
          })}
        </td>
      </tr>
    ));
    return (
      <table className="table table-striped table-sm">
        {head}
        <tbody>{rows}</tbody>
      </table>
    );
  };

  nearestCards = (
    quanta: QBed[],
    relativeX: number,
    relativeY: number,
    radius: number
  ) => {
    const distances = quanta.map(
      (quantum) =>
        Math.pow(relativeX - (quantum.relativeX || 0), 2) +
        Math.pow(relativeY - (quantum.relativeY || 0), 2)
    );

    const mindist = Math.min(...distances);
    if (mindist < radius * radius) {
      return quanta.filter((_, i) => distances[i] === mindist);
    } else {
      return [];
    }
  };

  shuffleArray = (a: any[]) => {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = a[i];
      a[i] = a[j];
      a[j] = x;
    }
    return a;
  };

  randomCards = (quanta: any[], n: number) => {
    return this.shuffleArray(quanta).slice(0, n);
  };

  downSample(xToValue: any[], sampleSize: number) {
    if (xToValue.length === 0) return [];
    let sampled_xToValue: any[] = new Array(xToValue.length).fill([]);
    const randomSample = this.randomCards(xToValue.flat(), sampleSize);
    randomSample.forEach((sample: any) => {
      sampled_xToValue[sample.relativeX] = sampled_xToValue[
        sample.relativeX
      ].concat([sample]);
    });
    return sampled_xToValue;
  }

  render() {
    const {
      data,
      viewRegion,
      width,
      trackModel,
      options,
      forceSvg,
      viewWindow,
    } = this.props;
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
    this.xToValue =
      data.length > 0 ? this.aggregateFeatures(data, viewRegion, width) : [];
    this.scales = this.computeScales(this.xToValue, height);

    for (let i = 0; i < this.xToValue.length; i++) {
      for (let j = 0; j < this.xToValue[i].length; j++) {
        this.xToValue[i][j].relativeX = i;
        this.xToValue[i][j].relativeY = this.scales.valueToY(
          this.xToValue[i][j].value
        );
      }
    }

    if (show === DownsamplingChoices.SAMPLE && data.length > sampleSize) {
      this.xToValue = this.downSample(this.xToValue, sampleSize);
    }

    // const legend = (
    //   <TrackLegend
    //     trackModel={trackModel}
    //     height={height}
    //     axisScale={this.scales.valueToY}
    //   />
    // );
    const visualizer = (
      <QBedPlot
        xToValue={this.xToValue}
        scales={this.scales}
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
    );
    return visualizer;
  }
}

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
