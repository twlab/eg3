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
import type { LegendRow } from "../PangenomeComponents/Visualization/legendRows";

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
  legendWidth?: number;
  /** A short line under the label. Only the pangenome gives one: below a
      pixel a base, how many deletions in view are too small to see. */
  note?: string;
  /** The pangenome's rows (PLAN-legend.md): one per row of the
      haplotype's lane, level with its bar, the stretch of the walk on
      screen. With rows the note goes under the last of them. */
  rows?: LegendRow[];
}

// const NUM_TICKS_SUGGESTION = 2;
export const AXIS_WIDTH = 32;

/** What a legend's y-axis is drawn from. */
export interface LegendAxisProps {
  height: number;
  axisScale?: ScaleLinear<number, number>;
  axisScaleReverse?: ScaleLinear<number, number>;
  hideFirstAxisLabel?: boolean;
  noShiftFirstAxisLabel?: boolean;
}

/**
 * Draws a legend's y-axis into an svg group: d3's left axis on the scale,
 * labelled at its two ends, and a second, reversed axis under it for a
 * track drawn on two strands. Shared by the legend column (TrackLegend)
 * and the pangenome view's glass header (TrackHeader.tsx), so both draw
 * the same axis.
 */
export function drawLegendAxis(gNode: any, props: LegendAxisProps) {
  if (gNode && props.axisScale) {
    while (gNode.hasChildNodes()) {
      // Believe it not, there's no function that removes all child nodes.
      (gNode.lastChild as Element).remove();
    }

    const axis = axisLeft(props.axisScale);
    // axis.ticks(NUM_TICKS_SUGGESTION);
    const axisDomain = props.axisScale.domain();

    if (!axisDomain.includes(NaN)) {
      if (axisDomain[0] > 1000) {
        axis.tickValues(axisDomain).tickFormat(format(".3s"));
      } else {
        axis.tickValues(axisDomain); //.tickFormat(format("d"));
      }
    }
    const dy0 =
      props.axisScaleReverse || props.noShiftFirstAxisLabel
        ? "0.32em"
        : "-0.1em";
    if (axisDomain[0] !== axisDomain[1]) {
      select(gNode).append("g").call(axis);
    }
    select(gNode)
      .selectAll("text")
      .filter((d, i) => i === 0)
      .attr("dy", "0.8em");
    select(gNode)
      .selectAll("text")
      .filter((d, i) => i === 1)
      .attr("dy", dy0);
    if (props.hideFirstAxisLabel) {
      select(gNode)
        .selectAll(".tick")
        .filter((d, i) => i === 0)
        .remove();
    }
    if (props.axisScaleReverse) {
      const axis2 = axisLeft(props.axisScaleReverse);
      // axis2.ticks(NUM_TICKS_SUGGESTION);
      const axis2Domain = props.axisScaleReverse.domain();
      if (!axis2Domain.includes(NaN)) {
        axis2.tickValues(axis2Domain);
      }
      if (axis2Domain[0] !== axis2Domain[1]) {
        select(gNode)
          .append("g")
          .attr("transform", "translate(" + 0 + "," + props.height * 0.5 + ")")
          .call(axis2)
          .selectAll(".tick")
          .filter((d) => d === 0)
          .remove();
      }
      select(gNode)
        .selectAll("text")
        .filter((d, i) => i === 2)
        .attr("dy", "-0.1em");
    }
    select(gNode).selectAll("text").attr("class", "svg-text-bg");
    select(gNode).selectAll("line").attr("class", "svg-line-bg");
    select(gNode).selectAll("path").attr("class", "svg-line-bg");
  }
}

/**
 * A box displaying labels, axes, and other important track info.
 *
 * @author Chanrung(Chad) Seng, Silas Hsu
 */
class TrackLegend extends React.PureComponent<
  TrackLegendProps,
  { showFull: boolean; clickX: number; clickY: number }
> {
  state = { showFull: false, clickX: 0, clickY: 0 };

  private gNode: any;
  private containerRef = React.createRef<HTMLDivElement>();
  private popupRef = React.createRef<HTMLDivElement>();
  private hoverTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(props: TrackLegendProps) {
    super(props);
    this.gNode = null;
    this.handleRef = this.handleRef.bind(this);
    this.plotATCGLegend = this.plotATCGLegend.bind(this);
  }

  componentDidMount() {
    this.drawAxis();
  }

  componentWillUnmount() {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
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
    drawLegendAxis(this.gNode, this.props);
  }

  getLabelWidth() {
    if (this.props.axisScale) {
      return (
        (this.props.legendWidth ? this.props.legendWidth : 120) - AXIS_WIDTH
      );
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
      note,
      rows,
    } = this.props;
    if (height <= 0) {
      return null;
    }

    const axisHeight = axisScaleReverse ? height * 0.5 : height;
    const styleObj = {
      display: "flex",
      position: "relative" as const,
      width: this.props.legendWidth ? this.props.legendWidth : 120,
      minWidth: 120,
      height: axisHeight + (trackModel?.type === "methylc" ? 0 : 2),

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
    let subTrackLabels: string[] = [];

    if (
      trackModel.type in { matplot: "", dynamic: "", dynamicbed: "" } &&
      trackModel.tracks?.length
    ) {
      const labels = trackModel.tracks.map((track, i) => {
        const color =
          track && track.options && track.options.color
            ? track.options.color
            : "blue";
        const trackLabel =
          track?.label || track?.options?.label || track?.name || "";
        subTrackLabels.push(trackLabel);
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
            {trackLabel}
          </div>
        );
      });
      labelList = (
        <div
          className="TrackLegend-subLabels"
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

    const labelText = (
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
    );
    const noteText =
      note && !rows?.length ? (
        <div className="TrackLegend-note">{note}</div>
      ) : null;
    /* The pangenome's rows, each level with its row of the drawing; the
       note under the last. Under a three-line region (a long contig name)
       the note has one line of room: "13 deletions hidden", its full
       words in the hover title. */
    const last = (rows?.length ?? 0) - 1;
    const rowTexts = rows?.length ? (
      <div className="TrackLegend-rows">
        {rows.map((row, i) => {
          const withNote = note && i === last;
          const short = withNote && row.lines.length >= 3;
          return (
            <div
              key={i}
              className={`TrackLegend-row${row.dim ? " TrackLegend-row-dim" : ""}`}
              style={{ top: row.top }}
              title={withNote ? `${row.title} · ${note}` : row.title}
            >
              {row.lines.map((line, j) => (
                <div key={j}>{line}</div>
              ))}
              {withNote ? (
                <div className={`TrackLegend-note${short ? " TrackLegend-note-short" : ""}`}>
                  {short ? note.replace(" too small to see", " hidden") : note}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    ) : null;

    return (
      <div ref={this.containerRef} style={{ ...divStyle, cursor: "pointer" }}>
        <div
          className="TrackLegend-wrap"
          title={[
            trackModel.options ? trackModel.options.label : "",
            ...subTrackLabels,
          ]
            .filter(Boolean)
            .join("\n")}
        >
          {noteText ? (
            <div>
              {labelText}
              {noteText}
            </div>
          ) : (
            labelText
          )}
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
        {rowTexts}
        {axis}
      </div>
    );
  }
}

export default TrackLegend;
