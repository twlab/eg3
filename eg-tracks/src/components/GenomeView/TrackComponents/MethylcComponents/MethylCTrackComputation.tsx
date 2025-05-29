import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import memoizeOne from "memoize-one";
import { scaleLinear } from "d3-scale";

// import Track from './commonComponents/Track';
// import TrackLegend from './commonComponents/TrackLegend';
// import configOptionMerging from './commonComponents/configOptionMerging';
// import HoverTooltipContext from './commonComponents/tooltip/HoverTooltipContext';
import GenomicCoordinates from "../commonComponents/HoverToolTips/GenomicCoordinates";
import DesignRenderer, {
  RenderTypes,
} from "../commonComponents/art/DesignRenderer";

import TrackModel from "../../../../models/TrackModel";
import { FeatureAggregator } from "../../../../models/FeatureAggregator";
import MethylCRecord from "../../../../models/MethylCRecord";
import { getContrastingColor } from "../../../../models/util";
import HoverToolTip from "../commonComponents/HoverToolTips/HoverToolTip";
// import "./commonComponents/tooltip/Tooltip.css";
import "./MethylCTrack.css";
import TrackLegend from "../commonComponents/TrackLegend";

const VERTICAL_PADDING = 0;
const PLOT_DOWNWARDS_STRAND = "reverse";
const DEFAULT_COLORS_FOR_CONTEXT = {
  CG: { color: "rgb(100,139,216)", background: "#d9d9d9" },
  CHG: { color: "rgb(255,148,77)", background: "#ffe0cc" },
  CHH: { color: "rgb(255,0,255)", background: "#ffe5ff" },
};
const OVERLAPPING_CONTEXTS_COLORS = DEFAULT_COLORS_FOR_CONTEXT.CG;
const UNKNOWN_CONTEXT_COLORS = DEFAULT_COLORS_FOR_CONTEXT.CG;

export const DEFAULT_OPTIONS = {
  height: 40,
  isCombineStrands: false,
  colorsForContext: DEFAULT_COLORS_FOR_CONTEXT,
  depthColor: "#525252",
  depthFilter: 0,
  maxMethyl: 1,
};

function makeBackgroundColorStyle(color: string) {
  return {
    color: getContrastingColor(color),
    backgroundColor: color,
    padding: "0px 3px", // 3px horizontal padding
    borderRadius: 3,
  };
}

interface MethylCTrackProps {
  data: any[];
  options: {
    isCombineStrands: any;
    aggregateMethod: string;
    height: number;
    color?: string;
    yScale?: string;
    yMin?: number;
    yMax?: number;
    depthColor: any;
    colorsForContext: any;
    depthFilter: any;
    maxMethyl: any;
    forceSvg: boolean;
  };
  isLoading?: boolean;
  error?: any;
  viewRegion: any;
  width: number;
  trackModel: any;
  viewWindow: {
    start: number;
    end: number;
  };
  forceSvg: boolean;
  getNumLegend: any;
  xvaluesData?: any;
}

class MethylCTrack extends PureComponent<MethylCTrackProps> {
  static propTypes = {
    data: PropTypes.array.isRequired,
    options: PropTypes.shape({
      aggregateMethod: PropTypes.string,
      height: PropTypes.number.isRequired,
      color: PropTypes.string,
      isCombineStrands: PropTypes.bool,
    }).isRequired,
    isLoading: PropTypes.bool,
    error: PropTypes.any,
  };

  aggregatedRecords: any[] = [];
  scales: any = null;

  constructor(props: MethylCTrackProps) {
    super(props);
    this.aggregateRecords = memoizeOne(this.aggregateRecords);
    this.computeScales = memoizeOne(this.computeScales);
  }

  aggregateRecords = (data: any[], viewRegion: any, width: number) => {
    const aggregator = new FeatureAggregator();
    const xToRecords = aggregator.makeXMap(data, viewRegion, width);
    return xToRecords.map(MethylCRecord.aggregateByStrand);
  };

  computeScales = (xMap: any[], height: number, maxMethyl: number) => {
    const forwardRecords = xMap.map((record) => record.forward);
    const reverseRecords = xMap.map((record) => record.reverse);
    const maxDepthForward = _.maxBy(forwardRecords, "depth") || { depth: 0 };
    const maxDepthReverse = _.maxBy(reverseRecords, "depth") || { depth: 0 };
    const maxDepth = Math.max(maxDepthForward.depth, maxDepthReverse.depth);
    return {
      methylToY: scaleLinear()
        .domain([maxMethyl, 0])
        .range([VERTICAL_PADDING, height])
        .clamp(true),
      depthToY: scaleLinear()
        .domain([maxDepth, 0])
        .range([VERTICAL_PADDING, height])
        .clamp(true),
    };
  };

  renderVisualizer() {
    let {
      data,
      width,
      options,
      forceSvg,
      viewRegion,
      trackModel,
      getNumLegend,
      viewWindow,
    } = this.props;
    let {
      height,
      colorsForContext,
      depthColor,
      isCombineStrands,
      depthFilter,
    } = options;
    // we only want a section of viewWindow if we take a screenshot

    const childProps = {
      data,
      scales: this.scales,
      htmlType: forceSvg ? RenderTypes.SVG : RenderTypes.CANVAS,
      width,
      height,
      colorsForContext,
      depthColor,
      depthFilter,
      forceSvg: options.forceSvg,
      viewWindow: this.props.viewWindow,
    };

    let legend = (
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <TrackLegend
          trackModel={trackModel}
          height={options.height}
          axisScale={this.scales.methylToY}
          noShiftFirstAxisLabel={!options.isCombineStrands}
        />

        {!options.isCombineStrands && (
          <ReverseStrandLegend
            trackModel={trackModel}
            height={options.height}
            maxMethyl={options.maxMethyl}
          />
        )}
      </div>
    );
    if (getNumLegend) {
      getNumLegend(legend);
    }
    let strandRenderers, tooltipY;
    if (isCombineStrands) {
      strandRenderers = (
        <React.Fragment>
          <div style={{ display: "flex" }}>
            {forceSvg ? legend : ""}

            <div style={{ display: "flex", flexDirection: "column" }}>
              <StrandVisualizer {...childProps} strand="combined" />{" "}
            </div>
          </div>
        </React.Fragment>
      );
      tooltipY = height;
    } else {
      strandRenderers = (
        <React.Fragment>
          <div style={{ display: "flex" }}>
            {forceSvg ? legend : ""}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <StrandVisualizer {...childProps} strand="forward" />
              <StrandVisualizer {...childProps} strand="reverse" />
            </div>
          </div>
        </React.Fragment>
      );
      tooltipY = height * 2;
    }

    return (
      <>
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
              data={this.aggregatedRecords}
              windowWidth={width}
              trackModel={trackModel}
              trackType={"methyc"}
              options={options}
              height={tooltipY}
              viewRegion={viewRegion}
              hasReverse={true}
            />
          </div>
        ) : (
          ""
        )}
        {strandRenderers}
      </>
    );
  }

  render() {
    const {
      data,
      trackModel,
      viewRegion,
      width,
      options,
      getNumLegend,
      xvaluesData,
    } = this.props;
    this.aggregatedRecords = xvaluesData
      ? xvaluesData
      : this.aggregateRecords(data, viewRegion, width);
    this.scales = this.computeScales(
      this.aggregatedRecords,
      options.height,
      options.maxMethyl
    );

    return this.renderVisualizer();
  }
}

export default MethylCTrack;

interface StrandVisualizerProps {
  data: any[];
  strand: string;
  scales: any;
  width: number;
  height: number;
  colorsForContext: { [key: string]: { color: string; background: string } };
  depthColor: string;
  htmlType: any;
  depthFilter: number;
  forceSvg: boolean;
  viewWindow: any;
}

class StrandVisualizer extends PureComponent<StrandVisualizerProps> {
  static propTypes = {
    data: PropTypes.array.isRequired,
    strand: PropTypes.string.isRequired,
    scales: PropTypes.object.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    colorsForContext: PropTypes.object.isRequired,
    depthColor: PropTypes.string.isRequired,
    htmlType: PropTypes.any,
    depthFilter: PropTypes.number,
  };

  getColorsForContext(contextName: string) {
    return this.props.colorsForContext[contextName] || UNKNOWN_CONTEXT_COLORS;
  }

  renderBarElement(x: number) {
    const { data, scales, strand, height, depthFilter } = this.props;
    const pixelData = data[x][strand];

    if (!pixelData) {
      return null;
    }

    if (pixelData.depth < depthFilter) {
      return null;
    }

    let backgroundColor;
    if (pixelData.contextValues.length === 1) {
      const contextName = pixelData.contextValues[0].context;
      backgroundColor = this.getColorsForContext(contextName).background;
    } else {
      backgroundColor = OVERLAPPING_CONTEXTS_COLORS.background;
    }

    let elements = [
      <rect
        key={x + "bg"}
        x={x}
        y={VERTICAL_PADDING}
        width={1}
        height={height}
        fill={backgroundColor}
      />,
    ];
    for (let contextData of pixelData.contextValues) {
      const contextName = contextData.context;
      const drawY = scales.methylToY(contextData.value);
      const drawHeight = height - drawY;
      const color = this.getColorsForContext(contextName).color;
      elements.push(
        <rect
          key={x + contextName}
          x={x}
          y={drawY}
          width={1}
          height={drawHeight}
          fill={color}
          fillOpacity={0.75}
        />
      );
    }

    return elements;
  }

  renderDepthPlot() {
    const { data, scales, strand, depthColor, height, depthFilter } =
      this.props;

    let elements: Array<any> = [];
    for (let x = 0; x < data.length - 1; x++) {
      const currentRecord = data[x][strand];
      const nextRecord = data[x + 1][strand];
      if (currentRecord && nextRecord) {
        if (currentRecord.depth < depthFilter) {
          continue;
        }
        const y1 = scales.depthToY(currentRecord.depth);
        const y2 = scales.depthToY(nextRecord.depth);
        elements.push(
          <line key={x} x1={x} y1={y1} x2={x + 1} y2={y2} stroke={depthColor} />
        );
      }
    }
    if (strand === PLOT_DOWNWARDS_STRAND) {
      const transform = `translate(0, ${height + 1}) scale(1, -1)`;
      return <g transform={transform}>{elements}</g>;
    } else {
      return elements;
    }
  }

  render() {
    const { data, strand, width, height, htmlType, forceSvg, viewWindow } =
      this.props;
    let style =
      strand === PLOT_DOWNWARDS_STRAND
        ? { transform: "scale(1, -1)", borderBottom: "1px solid lightgrey" }
        : undefined;
    let bars: any = [];

    for (let x = 0; x < data.length; x++) {
      bars.push(this.renderBarElement(x));
    }
    if (htmlType === RenderTypes.SVG && strand === PLOT_DOWNWARDS_STRAND) {
      const transform = `translate(0, ${height + 1}) scale(1, -1)`;
      bars = <g transform={transform}>{bars}</g>;
      style = undefined;
    }
    return data.length === 0 ? (
      <div
        style={{
          width: width,
          height: height,
        }}
      ></div>
    ) : (
      <DesignRenderer
        type={htmlType}
        width={width}
        height={height}
        style={style}
        forceSvg={forceSvg}
        viewWindow={viewWindow}
      >
        {bars}
        {this.renderDepthPlot()}
      </DesignRenderer>
    );
  }
}

function ReverseStrandLegend(props) {
  const mockTrackModel = new TrackModel({
    name: " ",
    isSelected: props.trackModel.isSelected,
    id: "mock-id",
    options: {},
  });
  return (
    <TrackLegend
      trackModel={mockTrackModel}
      height={props.height}
      hideFirstAxisLabel={true}
      axisScale={scaleLinear()
        .domain([0, props.maxMethyl])
        .range([0, props.height - VERTICAL_PADDING])}
    />
  );
}
