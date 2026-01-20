import React from "react";
import PropTypes from "prop-types";

// import Track from "./commonComponents/Track";
// import HoverTooltipContext from "./commonComponents/tooltip/HoverTooltipContext";
import Chromosomes from "../../genomeNavigator/Chromosomes";
import Ruler from "./Ruler";
import GenomicCoordinates from "../commonComponents/numerical/GenomicCoordinates";
// import TrackLegend from "./commonComponents/TrackLegend";

import DisplayedRegionModel from "../../../../models/DisplayedRegionModel";
import TrackModel from "../../../../models/TrackModel";
import TrackLegend from "../commonComponents/TrackLegend";
import { config } from "process";
import HoverToolTip from "../commonComponents/HoverToolTips/HoverToolTip";

const CHROMOSOMES_Y = 60;
const RULER_Y = 20;
const HEIGHT = 40;

/**
 * A ruler display.
 *
 * @author Chanrung(Chad) Seng, Silas Hsu
 */

interface RulerVisualizerProps {
  viewRegion: DisplayedRegionModel; // Region to visualize
  width: number; // The width of the ruler
  x?: number; // Optional x coordinate
  y?: number; // Optional y coordinate'
  genomeConfig?: any;
  options: any;
  viewWindow: any;
}
class RulerVisualizer extends React.PureComponent<RulerVisualizerProps> {
  constructor(props) {
    super(props);
    this.getTooltipContents = this.getTooltipContents.bind(this);
  }

  getTooltipContents(relativeX) {
    const { viewRegion, width } = this.props;
    return (
      <GenomicCoordinates viewRegion={viewRegion} width={width} x={relativeX} />
    );
  }

  render() {
    const { viewRegion, width } = this.props;
    const genomeConfig = this.props.genomeConfig;

    if (this.props.options && this.props.options.forceSvg) {
      return (
        <svg width={this.props.width} height={HEIGHT} display={"block"}>
          <Chromosomes
            genomeConfig={genomeConfig}
            viewRegion={viewRegion}
            width={width}
            labelOffset={CHROMOSOMES_Y}
            hideChromName={true}
          />
          <Ruler viewRegion={viewRegion} width={width} y={RULER_Y} />
        </svg>
      );
    }
    return (
      <svg width={width} height={HEIGHT} style={{ display: "block" }}>
        <Chromosomes
          genomeConfig={genomeConfig}
          viewRegion={viewRegion}
          width={width}
          labelOffset={CHROMOSOMES_Y}
          hideChromName={true}
        />
        <Ruler viewRegion={viewRegion} width={width} y={RULER_Y} />
      </svg>
    );
    {
      /* </HoverTooltipContext> */
    }
  }
}

// const Visualizer = withCurrentGenome(RulerVisualizer);
interface RulerComponentProps {
  viewRegion: DisplayedRegionModel; // Region to visualize
  width: number; // The width of the ruler
  x?: number; // Optional x coordinate
  y?: number; // Optional y coordinate'
  genomeConfig?: any;
  trackModel: TrackModel;
  selectedRegion: DisplayedRegionModel;
  updatedLegend: any;
  options: any;
  viewWindow: any;
}
class RulerComponent extends React.Component<RulerComponentProps> {
  render() {
    let legend = (
      <TrackLegend
        height={HEIGHT}
        trackModel={this.props.trackModel}
        trackViewRegion={this.props.viewRegion}
        selectedRegion={this.props.selectedRegion}
        trackWidth={this.props.width}
        forceSvg={this.props.options.forceSvg}
      />
    );
    if (this.props.updatedLegend) {
      this.props.updatedLegend.current = legend;
    }
    const forceSvg = this.props.options.forceSvg;

    let curParentStyle: any = forceSvg
      ? {
        position: "relative",

        overflow: "hidden",
        width: this.props.width / 3,
      }
      : {};
    let curEleStyle: any = forceSvg
      ? {
        position: "relative",
        transform: `translateX(${-this.props.viewWindow.start}px)`,
      }
      : {};

    let hoverStyle: any = this.props.options.packageVersion
      ? { marginLeft: 120 }
      : {};

    return (
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
              data={new Array()}
              windowWidth={this.props.width}
              trackType={"ruler"}
              height={40}
              viewRegion={this.props.viewRegion}
            />
          </div>
        ) : (
          ""
        )}
        <div style={{ display: "flex", ...curParentStyle }}>
          {forceSvg || this.props.options.packageVersion ? legend : ""}
          <div
            style={{
              ...curEleStyle,
            }}
          >
            <RulerVisualizer
              genomeConfig={this.props.genomeConfig}
              viewRegion={this.props.viewRegion}
              viewWindow={this.props.viewWindow}
              width={this.props.width}
              options={this.props.options}
            />
          </div>
        </div>
      </React.Fragment>
    );
  }
}
export default RulerComponent;
