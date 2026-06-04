import React from "react";
import ReactDOM from "react-dom";

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
  forceSvg: any;
  axisScale?: ScaleLinear<number, number>; // A d3 scale function, used for drawing axes
  axisScaleReverse?: ScaleLinear<number, number>; // A d3 scale function, used for drawing axes
  style?: object;
  trackWidth?: number;
  trackViewRegion?: DisplayedRegionModel;
  hideFirstAxisLabel?: boolean;
  noShiftFirstAxisLabel?: boolean;
  selectedRegion?: DisplayedRegionModel; // the region for viewing, without expansion
  axisLegend?: any;
  label?: string;
}

// const NUM_TICKS_SUGGESTION = 2;
const AXIS_WIDTH = 32;

/**
 * A box displaying labels, axes, and other important track info.
 *
 * @author Chanrung(Chad) Seng, Silas Hsu
 */
class TrackLegend extends React.PureComponent<
  TrackLegendProps,
  { showFull: boolean; clickX: number; clickY: number }
> {
  static defaultProps = {
    width: 120,
    forceSvg: false,
  };

  state = { showFull: false, clickX: 0, clickY: 0 };

  private gNode: any;
  private containerRef = React.createRef<HTMLDivElement>();
  private popupRef = React.createRef<HTMLDivElement>();

  constructor(props: TrackLegendProps) {
    super(props);
    this.gNode = null;
    this.handleRef = this.handleRef.bind(this);
    this.plotATCGLegend = this.plotATCGLegend.bind(this);
    this.handleDocumentMouseDown = this.handleDocumentMouseDown.bind(this);
  }

  componentDidMount() {
    this.drawAxis();
    document.addEventListener("mousedown", this.handleDocumentMouseDown);
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleDocumentMouseDown);
  }

  handleDocumentMouseDown(e: MouseEvent) {
    if (
      this.state.showFull &&
      this.popupRef.current &&
      !this.popupRef.current.contains(e.target as Node) &&
      this.containerRef.current &&
      !this.containerRef.current.contains(e.target as Node)
    ) {
      this.setState({ showFull: false });
    }
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
        .attr("dy", "0.8em");
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
              "translate(" + 0 + "," + this.props.height * 0.5 + ")",
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
      select(this.gNode).selectAll("text").attr("class", "svg-text-bg");
      select(this.gNode).selectAll("line").attr("class", "svg-line-bg");
      select(this.gNode).selectAll("path").attr("class", "svg-line-bg");
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
    const { showFull } = this.state;
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
      label,
      forceSvg,
    } = this.props;
    if (height <= 0) {
      return null;
    }

    const axisHeight = axisScaleReverse ? height * 0.5 : height;
    const styleObj = {
      display: "flex",
      width,
      minWidth: width,
      height: axisHeight,

      zIndex: 10,
      //         backgroundColor: "var(--bg-color)",
      // color: "var(--font-color)",
      justifyContent: "space-between",
    };
    if (forceSvg) {
      styleObj["backgroundColor"] = "var(--bg-color)";
      styleObj["color"] = "var(--font-color)";
    }
    const divStyle = Object.assign(styleObj, style);
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

    let plotLegend = false;
    let chromLabel = "";
    if (trackModel.type === "ruler") {
      if (trackViewRegion) {
        const drawModel = new LinearDrawingModel(trackViewRegion!, trackWidth!);
        if (drawModel.basesToXWidth(1) > Sequence.MIN_X_WIDTH_PER_BASE) {
          plotLegend = true;
        } else {
          plotLegend = false;
        }
        const segmentsAll = selectedRegion!.getFeatureSegments();
        // not showing Gap
        const segments = segmentsAll.filter(
          (s) => s && s.feature.getName() !== "Gap",
        );
        if (segments.length === 1) {
          chromLabel = segments[0].feature.getName();
        }
        if (segments.length > 1) {
          chromLabel += `-${segments[segments.length - 1].feature.getName()}`;
        }
      }
    }
    let labelList;
    if (trackModel.type === "matplot" && trackModel.tracks) {
      const labels = trackModel.tracks.map((track, i) => {
        const color =
          track && track.options && track.options.color
            ? track.options.color
            : "blue";
        return (
          <div
            key={i}
            style={{
              color,
              overflow: showFull ? "visible" : "hidden",
              textOverflow: showFull ? "clip" : "ellipsis",
              whiteSpace: showFull ? "normal" : "nowrap",
              minWidth: 0,
            }}
          >
            {track && track.label ? track.label : ""}
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
    const rect = this.containerRef.current?.getBoundingClientRect();
    const { clickX, clickY } = this.state;
    const popup = showFull
      ? ReactDOM.createPortal(
          <div
            ref={this.popupRef}
            style={{
              position: "fixed",
              top: clickY,
              left: clickX,
              minWidth: rect ? rect.width : 120,
              maxWidth: 240,
              zIndex: 9999,
              backgroundColor: "#fff",
              color: "#000",
              border: "1px solid rgba(0,0,0,0.15)",
              borderRadius: 6,
              padding: "8px 10px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
              fontSize: "x-small",
              lineHeight: 1.4,
              wordWrap: "break-word",
              wordBreak: "break-all",
              whiteSpace: "normal",
            }}
          >
            <p style={{ margin: 0 }}>
              {label
                ? label
                : trackModel.options
                  ? trackModel.options.label
                  : ""}
            </p>
            {labelList}
            {chromLabel ? (
              <div
                style={{ fontSize: "11px", marginTop: 4 }}
                className="TrackLegend-chrLabel"
              >
                {chromLabel}
              </div>
            ) : (
              ""
            )}
          </div>,
          document.body,
        )
      : null;

    return (
      <div
        ref={this.containerRef}
        style={{ ...divStyle, cursor: "pointer" }}
        onClick={(e) =>
          this.setState((s) => ({
            showFull: !s.showFull,
            clickX: e.clientX,
            clickY: e.clientY,
          }))
        }
      >
        <div
          className="TrackLegend-wrap"
          title={trackModel.options ? trackModel.options.label : ""}
        >
          <p
            className="TrackLegend-label"
            style={{ ...pStyle, wordWrap: "break-word", whiteSpace: "normal" }}
          >
            {trackModel?.options?.label
              ? trackModel?.options?.label
              : label
                ? label
                : ""}
          </p>
          <div
            style={{ display: "flex", alignItems: "center", fontSize: "12px" }}
          >
            {plotLegend && this.plotATCGLegend()}
          </div>
          {labelList}

          {chromLabel ? (
            <div
              style={{ fontSize: "11px", alignSelf: "flex-end" }}
              className="TrackLegend-chrLabel"
            >
              {chromLabel}
            </div>
          ) : (
            ""
          )}
        </div>
        {axis}
        {popup}
      </div>
    );
  }
}

export default TrackLegend;
