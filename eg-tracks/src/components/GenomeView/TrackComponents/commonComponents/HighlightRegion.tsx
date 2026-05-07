import React from "react";
import { LinearDrawingModel, OpenInterval } from "../../../../models";

import { ViewExpansion } from "../../../../models/RegionExpander";
import { ChromosomeInterval } from "../../../../models";

import { TrackModel } from "../../../../models";
import { objToInstanceAlign } from "../../TrackManager";
import "./HighlightRegion.css";
import _ from "lodash";

interface HighlightRegionProps {
  y?: number | string; // Relative Y of the top of the selection box; how far from the top of this container
  height?: number | string; // Height of the selection box
  visData: ViewExpansion; // contains data on chromosome start/stop, and window start/stop;
  legendWidth: number; // used in calculation for highlight;
  xOffset: number;
  highlights: any[];
  trackData?: any;
  tracks?: TrackModel[];
  navContextBuilder: any;
}

/**
 * ScreenshotUI will also need use this function, make it exportable
 * @param interval
 * @param visData
 * @param legendWidth
 * @returns
 */
export const getHighlightedXs = (
  interval: OpenInterval,
  visData: ViewExpansion,
  legendWidth: number,
  navContextBuilder: any,
): OpenInterval => {
  const { viewWindowRegion, viewWindow } = visData;
  // console.log(trackData)
  const navBuilds = navContextBuilder;
  let start, end;
  let newIntervalStart = interval.start,
    newIntervalEnd = interval.end;
  // navBuilds.forEach(build => {
  //     newIntervalStart = build.convertOldCoordinates(newIntervalStart);
  //     newIntervalEnd = build.convertOldCoordinates(newIntervalEnd);
  //     return; // only execute once - not working
  // })
  if (navBuilds) {
    newIntervalStart = convertOldCoordinates(
      newIntervalStart,
      navBuilds._gaps,
      navBuilds._cumulativeGapBases,
    );
    newIntervalEnd = convertOldCoordinates(
      newIntervalEnd,
      navBuilds._gaps,
      navBuilds._cumulativeGapBases,
    );
  }
  const drawModel = new LinearDrawingModel(
    objToInstanceAlign(viewWindowRegion),
    viewWindow.end - viewWindow.start,
  );
  const xRegion = drawModel.baseSpanToXSpan(
    new OpenInterval(newIntervalStart, newIntervalEnd),
  );
  start = Math.max(xRegion.start + legendWidth);
  end = xRegion.end + legendWidth;
  if (end <= start) {
    start = -1;
    end = 0;
  }
  return new OpenInterval(start, end);
};

function convertOldCoordinates(
  base: number,
  _gaps,
  _cumulativeGapBases,
): number {
  const index = _.sortedIndexBy(_gaps, { contextBase: base }, "contextBase");
  const gapBases = _cumulativeGapBases[index] || 0; // Out-of-bounds index can happen if there are no gaps.
  return base + gapBases;
}
/**
 * Creates a box that highlight user's entered region, from gene or region locator
 *
 * @author Daofeng Li, modified from Silas Hsu
 */
class HighlightRegion extends React.PureComponent<HighlightRegionProps> {
  static defaultProps: HighlightRegionProps = {
    y: "0px",
    height: "100%",

    legendWidth: 120,
    xOffset: 0,
    highlights: [],
    visData: undefined,
  };

  /**
   * checks every HighlightItem in the highlightItems prop and renders those in the view region;
   * @returns container that has highlight elements in it
   * @inheritdoc
   */
  render(): JSX.Element {
    // console.log(this.props)
    const {
      height,
      y,
      xOffset,
      highlights,
      legendWidth,
      visData,
      navContextBuilder,
    } = this.props;

    if (!visData) {
      return <div />;
    }

    const xS = highlights.map((h) =>
      getHighlightedXs(
        new OpenInterval(h.start, h.end),
        visData,
        legendWidth,
        navContextBuilder,
      ),
    );

    const theBoxes = highlights.map((item, idx) => {
      console.log(xS[idx].start, xOffset);
      const style = {
        left: xS[idx].start + xOffset + "px",
        top: y,
        width: xS[idx].getLength() + "px",
        height,
        backgroundColor: item.color,
        display: item.display ? "unset" : "none",
        willChange: "left, width",
        transition: "left 1s, width 1s",
      };

      return <div key={idx} className="HighlightRegion-box" style={style} />;
    });
    return (
      <div style={{ position: "relative", height: "100%" }}>{theBoxes}</div>
    );
  }
}

export default HighlightRegion;
