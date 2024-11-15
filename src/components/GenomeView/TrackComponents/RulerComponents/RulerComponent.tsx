import React from "react";
import PropTypes from "prop-types";

// import Track from "./commonComponents/Track";
// import HoverTooltipContext from "./commonComponents/tooltip/HoverTooltipContext";
import Chromosomes from "../../genomeNavigator/Chromosomes";
import Ruler from "./Ruler";
import GenomicCoordinates from "../commonComponents/numerical/GenomicCoordinates";
// import TrackLegend from "./commonComponents/TrackLegend";

import DisplayedRegionModel from "../../../../models/DisplayedRegionModel";
import { getGenomeConfig } from "../../../../models/genomes/allGenomes";
import TrackModel from "../../../../models/TrackModel";
import TrackLegend from "../commonComponents/TrackLegend";

const CHROMOSOMES_Y = 60;
const RULER_Y = 20;
const HEIGHT = 40;

/**
 * A ruler display.
 *
 * @author Silas Hsu
 */

interface RulerVisualizerProps {
  viewRegion: DisplayedRegionModel; // Region to visualize
  width: number; // The width of the ruler
  x?: number; // Optional x coordinate
  y?: number; // Optional y coordinate'
  genomeConfig?: any;
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
  getNumLegend: any;
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
      />
    );
    if (this.props.getNumLegend) {
      this.props.getNumLegend(legend);
    }
    return (
      <RulerVisualizer
        genomeConfig={this.props.genomeConfig}
        viewRegion={this.props.viewRegion}
        width={this.props.width}
      />
    );
  }
}

export default RulerComponent;
