import React from "react";

import { TranslatableG } from "../geneAnnotationTrackComponents/TranslatableG";
import RulerDesigner from "../commonComponents/art/RulerDesigner";
import DisplayedRegionModel from "../../../../models/DisplayedRegionModel";

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
