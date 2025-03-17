import React from "react";
import PropTypes from "prop-types";
import { TranslatableG } from "../TrackComponents/geneAnnotationTrackComponents/TranslatableG";
import RulerDesigner from "../TrackComponents/commonComponents/art/RulerDesigner";
import DisplayedRegionModel from "../../../models/DisplayedRegionModel";

const RULER_DESIGNER = new RulerDesigner();

/**
 * Draws a ruler that displays feature coordinates.
 *
 * @author Silas Hsu
 */

interface RulerProps {
  viewRegion: DisplayedRegionModel; // Region to visualize
  width: number; // The width of the ruler
  x?: number; // Optional x coordinate
  y?: number; // Optional y coordinate
}
class Ruler extends React.PureComponent<RulerProps> {
  static propTypes = {
    viewRegion: PropTypes.instanceOf(DisplayedRegionModel).isRequired, // Region to visualize
    width: PropTypes.number.isRequired, // The width of the ruler
    x: PropTypes.number,
    y: PropTypes.number,
  };

  render() {
    const { viewRegion, width, x, y } = this.props;
    return (
      <TranslatableG x={x} y={y}>
        {RULER_DESIGNER.design(viewRegion, width)}
      </TranslatableG>
    );
  }
}

export default Ruler;
