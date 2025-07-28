import React from "react";
import PropTypes from "prop-types";

import DisplayedRegionModel from "../../../../../models/DisplayedRegionModel";
import LinearDrawingModel from "../../../../../models/LinearDrawingModel";
import NavigationContext from "../../../../../models/NavigationContext";

/**
 * Calculates genomic coordinates at a page coordinate and displays them.
 *
 * @author Silas Hsu
 */
interface GenomicCoordinatesProps {
  viewRegion: any;
  width: any;
  x: any;
}
class GenomicCoordinates extends React.Component<GenomicCoordinatesProps> {
  static propTypes = {
    viewRegion: PropTypes.instanceOf(DisplayedRegionModel).isRequired,
    width: PropTypes.number.isRequired,
    x: PropTypes.number.isRequired,
  };

  /**
   * @inheritdoc
   */
  render() {
    const { viewRegion, width, x } = this.props;
    const drawModel = new LinearDrawingModel(viewRegion, width);
    let segment;
    try {
      segment = drawModel.xToSegmentCoordinate(x);
    } catch (error) {
      return null;
    }
    if (NavigationContext.isGapFeature(segment.feature)) {
      return segment.getName();
    } else {
      const locus = segment.getLocus();
      const start = Math.floor(locus.start);
      const end = Math.ceil(start + drawModel.xWidthToBases(1));
      return `${locus.chr}:${start + 1}-${end}`; // web to 1 based
      // return `${locus.chr}:${Math.floor(locus.start)}`;
    }
  }
}

export default GenomicCoordinates;
