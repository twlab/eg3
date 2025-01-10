import React from "react";

import { ScaleLinear } from "d3-scale";
import { select } from "d3-selection";
import { axisLeft } from "d3-axis";
import { format } from "d3-format";
import { TranslatableG } from "../geneAnnotationTrackComponents/TranslatableG";
import TrackModel from "../../../../models/TrackModel";
import { BASE_COLORS, Sequence } from "../GenomeAlignComponents/Sequence";
import LinearDrawingModel from "../../../../models/LinearDrawingModel";
import DisplayedRegionModel from "../../../../models/DisplayedRegionModel";

import "./TrackLegend.css";

interface TrackLegendProps {
  trackModel: TrackModel; // Track metadata
  width: number; // Legend width
  height: number; // Legend height
  axisScale?: ScaleLinear<number, number>; // A d3 scale function, used for drawing axes
  axisScaleReverse?: ScaleLinear<number, number>; // A d3 scale function, used for drawing axes
  style?: object;
  trackWidth?: number;
  trackViewRegion?: DisplayedRegionModel;
  hideFirstAxisLabel?: boolean;
  noShiftFirstAxisLabel?: boolean;
  selectedRegion?: DisplayedRegionModel; // the region for viewing, without expansion
  axisLegend?: any;
}

// const NUM_TICKS_SUGGESTION = 2;
const AXIS_WIDTH = 42;

/**
 * A box displaying labels, axes, and other important track info.
 *
 * @author Silas Hsu
 */
class TrackLegend extends React.PureComponent<TrackLegendProps> {
  static defaultProps = {
    width: 120,
  };

  private gNode: any;

  constructor(props: TrackLegendProps) {
    super(props);
    this.gNode = null;
    this.handleRef = this.handleRef.bind(this);
    this.plotATCGLegend = this.plotATCGLegend.bind(this);
  }

  componentDidMount() {
    this.drawAxis();
  }

  componentDidUpdate(nextProps: TrackLegendProps) {
    if (
      this.props.axisScale !== nextProps.axisScale ||
      this.props.noShiftFirstAxisLabel !== nextProps.noShiftFirstAxisLabel
    ) {
      this.drawAxis();
    }
  }

  handleRef(node: SVGGElement) {
    this.gNode = node;
  }

  drawAxis() {
    if (this.gNode && this.props.axisScale) {
      while (this.gNode.hasChildNodes()) {
        // Believe it not, there's no function that removes all child nodes.
        (this.gNode.lastChild as Element).remove();
      }

      const axis = axisLeft(this.props.axisScale);
      // axis.ticks(NUM_TICKS_SUGGESTION);
      const axisDomain = this.props.axisScale.domain();
      if (!axisDomain.includes(NaN)) {
        if (axisDomain[0] > 1000) {
          axis.tickValues(axisDomain).tickFormat(format(".3s"));
        } else {
          axis.tickValues(axisDomain); //.tickFormat(format("d"));
        }
      }
      const dy0 =
        this.props.axisScaleReverse || this.props.noShiftFirstAxisLabel
          ? "0.32em"
          : "-0.1em";
      if (axisDomain[0] !== axisDomain[1]) {
        select(this.gNode).append("g").call(axis);
      }
      select(this.gNode)
        .selectAll("text")
        .filter((d, i) => i === 0)
        .attr("dy", "0.6em");
      select(this.gNode)
        .selectAll("text")
        .filter((d, i) => i === 1)
        .attr("dy", dy0);
      if (this.props.hideFirstAxisLabel) {
        select(this.gNode)
          .selectAll(".tick")
          .filter((d, i) => i === 0)
          .remove();
      }
      if (this.props.axisScaleReverse) {
        const axis2 = axisLeft(this.props.axisScaleReverse);
        // axis2.ticks(NUM_TICKS_SUGGESTION);
        const axis2Domain = this.props.axisScaleReverse.domain();
        if (!axis2Domain.includes(NaN)) {
          axis2.tickValues(axis2Domain);
        }
        if (axis2Domain[0] !== axis2Domain[1]) {
          select(this.gNode)
            .append("g")
            .attr(
              "transform",
              "translate(" + 0 + "," + this.props.height * 0.5 + ")"
            )
            .call(axis2)
            .selectAll(".tick")
            .filter((d) => d === 0)
            .remove();
        }
        select(this.gNode)
          .selectAll("text")
          .filter((d, i) => i === 2)
          .attr("dy", "-0.1em");
      }

      select(this.gNode).selectAll("text").attr("class", "svg-text-bg2");
      select(this.gNode).selectAll("line").attr("class", "svg-line-bg2");
      select(this.gNode).selectAll("path").attr("class", "svg-line-bg2");
    }
  }

  getLabelWidth() {
    if (this.props.axisScale) {
      return this.props.trackModel.legendWidth
        ? this.props.trackModel.legendWidth - AXIS_WIDTH
        : this.props.width - AXIS_WIDTH;
    } else {
      return undefined;
    }
  }

  plotATCGLegend() {
    const divs = Object.entries(BASE_COLORS).map((base) => {
      return (
        <div key={base[0]} style={{ backgroundColor: base[1], color: "white" }}>
          {base[0]}
        </div>
      );
    });
    return divs;
  }

  render() {
    const {
      trackModel,
      width,
      height,
      axisScale,
      style,
      axisScaleReverse,
      trackViewRegion,
      trackWidth,
      selectedRegion,
    } = this.props;
    if (height <= 0) {
      return null;
    }
    const axisHeight = axisScaleReverse ? height * 0.5 : height;
    const divStyle = Object.assign(
      {
        display: "flex",
        width,
        minWidth: width,
        height,
        backgroundColor: "white",
        color: "black",
        justifyContent: "space-between",
      },
      style
    );
    const pStyle = {
      width: this.getLabelWidth(),
      maxHeight: height,
    };

    let axis;
    if (axisScale) {
      axis = (
        <svg
          width={AXIS_WIDTH}
          height={axisHeight}
          style={{ overflow: "visible" }}
        >
          <TranslatableG innerRef={this.handleRef} x={AXIS_WIDTH - 1} />
        </svg>
      );
    }

    const label = trackModel.getDisplayLabel();
    let plotLegend = false;
    let chromLabel = "";
    if (trackModel.type === "ruler") {
      const drawModel = new LinearDrawingModel(trackViewRegion!, trackWidth!);
      if (drawModel.basesToXWidth(1) > Sequence.MIN_X_WIDTH_PER_BASE) {
        plotLegend = true;
      } else {
        plotLegend = false;
      }
      const segmentsAll = selectedRegion!.getFeatureSegments();
      // not showing Gap
      const segments = segmentsAll.filter(
        (s) => s && s.feature.getName() !== "Gap"
      );
      if (segments.length === 1) {
        chromLabel = segments[0].feature.getName();
      }
      if (segments.length > 1) {
        chromLabel += `-${segments[segments.length - 1].feature.getName()}`;
      }
    }
    let labelList;
    if (trackModel.type === "matplot") {
      const labels = trackModel.tracks!.map((track, i) => {
        const color = track.options.color || "blue";
        return (
          <div key={i} style={{ color }}>
            {track.label}
          </div>
        );
      });
      labelList = (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto",
            alignItems: "end",
            fontSize: "10px",
          }}
        >
          {labels}
        </div>
      );
    }
    return (
      <div style={divStyle} title={label}>
        <div className="TrackLegend-wrap">
          <p
            className="TrackLegend-label"
            style={{ ...pStyle, wordWrap: "break-word", whiteSpace: "normal" }}
          >
            {label}
          </p>
          <div
            style={{ display: "flex", alignItems: "center", fontSize: "12px" }}
          >
            {plotLegend && this.plotATCGLegend()}
          </div>
          {labelList}
          <div
            style={{ fontSize: "11px", alignSelf: "flex-end" }}
            className="TrackLegend-chrLabel"
          >
            {chromLabel}
          </div>
        </div>
        {axis}
      </div>
    );
  }
}

export default TrackLegend;
