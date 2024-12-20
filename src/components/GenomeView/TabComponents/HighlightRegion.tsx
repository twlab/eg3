import React from "react";
import OpenInterval from "@/models/OpenInterval";
import LinearDrawingModel from "@/models/LinearDrawingModel";

import { ViewExpansion } from "@/models/RegionExpander";
import ChromosomeInterval from "@/models/ChromosomeInterval";
import { HighlightInterval } from "../ToolComponents/HighlightMenu";

import TrackModel from "@/models/TrackModel";
import "./HighlightRegion.css";

interface HighlightRegionProps {
  y?: number | string; // Relative Y of the top of the selection box; how far from the top of this container
  height?: number | string; // Height of the selection box
  visData: any; // contains data on chromosome start/stop, and window start/stop;
  legendWidth: number; // used in calculation for highlight;
  xOffset: number;
  viewRegion: ChromosomeInterval | null;
  highlights: any;
  trackData?: any;
  tracks?: any;
  children: React.ReactNode;
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
  tracks?: TrackModel[],
  trackData?: any
): OpenInterval => {
  const { viewWindowRegion, viewWindow } = visData;
  // console.log(trackData)
  const navBuilds = tracks
    ? tracks
        .map((k) => trackData[k.getId()].alignment)
        .filter((x) => x)
        .map((x) => x.navContextBuilder)
        .filter((x) => x)
    : []; //remove rough mode adjustment
  // console.log(navBuilds)
  let start, end;
  let newIntervalStart = interval.start,
    newIntervalEnd = interval.end;
  // navBuilds.forEach(build => {
  //     newIntervalStart = build.convertOldCoordinates(newIntervalStart);
  //     newIntervalEnd = build.convertOldCoordinates(newIntervalEnd);
  //     return; // only execute once - not working
  // })
  if (navBuilds.length) {
    newIntervalStart = navBuilds[0].convertOldCoordinates(newIntervalStart);
    newIntervalEnd = navBuilds[0].convertOldCoordinates(newIntervalEnd);
  }
  const drawModel = new LinearDrawingModel(
    viewWindowRegion,
    viewWindow.getLength()
  );
  const xRegion = drawModel.baseSpanToXSpan(
    new OpenInterval(newIntervalStart, newIntervalEnd)
  );
  start = Math.max(legendWidth, xRegion.start + legendWidth);
  end = xRegion.end + legendWidth;
  if (end <= start) {
    start = -1;
    end = 0;
  }
  return new OpenInterval(start, end);
};

/**
 * Creates a box that highlight user's entered region, from gene or region locator
 *
 * @author Daofeng Li, modified from Silas Hsu
 */
class HighlightRegion extends React.PureComponent<HighlightRegionProps> {
  static defaultProps: HighlightRegionProps = {
    y: "0px",
    height: "100%",
    visData: null,
    legendWidth: 120,
    xOffset: 0,
    viewRegion: null,
    highlights: [],
    children: undefined,
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
      children,
      xOffset,
      highlights,
      legendWidth,
      visData,
      tracks,
      trackData,
    } = this.props;

    const xS = highlights.map((h) =>
      getHighlightedXs(
        new OpenInterval(h.start, h.end),
        visData,
        legendWidth,
        tracks,
        trackData
      )
    );
    const theBoxes = highlights.map((item, idx) => {
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
      <div style={{ position: "relative" }}>
        {theBoxes}
        {children}
      </div>
    );
  }
}

export default HighlightRegion;
