import "./HorizontalFragment.css";

import React, { Component, MouseEvent } from "react";

const LINE_MARGIN = 1;
const LINE_WIDTH = 2;
const TRIANGLE_SIZE = 5;
const FONT_SIZE = 10;

interface HorizontalFragmentProps {
  relativeY?: number;
  xSpanList?: any[];
  height: number;
  segmentArray: any;
  strand: string;
  viewWindowStart: number;
  primaryColor: string;
  queryColor: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  rectHeight: number;
  relativeX: number;
}

class HorizontalFragment extends Component<HorizontalFragmentProps> {
  constructor(props: HorizontalFragmentProps) {
    super(props);
  }

  render() {
    const {
      height,
      segmentArray,
      strand,
      viewWindowStart,
      primaryColor,
      queryColor,
      style,
      children,
      rectHeight,
      relativeX,
      ...otherProps
    } = this.props;

    const strandList = segmentArray.strandList;
    const targetXSpanList = segmentArray.targetXSpanList;
    const queryXSpanList = segmentArray.queryXSpanList;
    const targetLocusList = segmentArray.targetLocusList;

    const queryLocusList = segmentArray.queryLocusList;
    const lengthList = segmentArray.lengthList;
    const queryLengthList = segmentArray.queryLengthList;

    const xSpanIndex = targetXSpanList.reduce(
      (iCusor, x, i) =>
        x.start < relativeX! && x.end >= relativeX! ? i : iCusor,
      NaN
    );

    let lines;
    if (isNaN(xSpanIndex)) {
      lines = (
        <div
          style={{
            padding: "8px 12px",
            fontSize: "16",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
          }}
        >
          No data
        </div>
      );
    } else {
      const targetXSpan = targetXSpanList[xSpanIndex];
      const queryXSpan = queryXSpanList[xSpanIndex];
      const targetLocus = `${targetLocusList[xSpanIndex]} (${lengthList[xSpanIndex]})`;
      const queryLocus = `${queryLocusList[xSpanIndex]} (${queryLengthList[xSpanIndex]})`;

      const queryX =
        strandList[xSpanIndex] === strand
          ? queryXSpan.start +
            ((queryXSpan.end - queryXSpan.start) *
              (relativeX! - targetXSpan.start)) /
              (targetXSpan.end - targetXSpan.start)
          : queryXSpan.end -
            ((queryXSpan.end - queryXSpan.start) *
              (relativeX! - targetXSpan.start)) /
              (targetXSpan.end - targetXSpan.start);
      lines = (
        <React.Fragment>
          <HorizontalLine
            relativeY={LINE_MARGIN}
            xSpan={targetXSpan}
            viewWindowStart={viewWindowStart}
            color={primaryColor}
            locus={targetLocus}
            textHeight={10}
          />
          <Triangle
            relativeX={relativeX! - TRIANGLE_SIZE}
            relativeY={LINE_MARGIN + LINE_WIDTH + rectHeight}
            color={primaryColor}
            direction="down"
          />
          <Triangle
            relativeX={queryX - TRIANGLE_SIZE}
            relativeY={
              height - rectHeight - LINE_MARGIN - LINE_WIDTH - TRIANGLE_SIZE
            }
            color={queryColor}
            direction="up"
          />
          <HorizontalLine
            relativeY={height - LINE_MARGIN - LINE_WIDTH}
            xSpan={queryXSpan}
            viewWindowStart={viewWindowStart}
            color={queryColor}
            locus={queryLocus}
            textHeight={-35}
          />
        </React.Fragment>
      );
    }

    return (
      <div
        style={{
          position: "relative",
          width: 225,
          height,
          overflow: "visible",
        }}
        {...otherProps}
      >
        {children}
        {lines}
      </div>
    );
  }
}

/**
 * The actual horizontal line that covers an alignment segment.
 *
 * @param {Object} props - props as specified by React
 * @return {JSX.Element} - element to render
 */
function HorizontalLine(props) {
  const { relativeY, xSpan, viewWindowStart, color, locus, textHeight } = props;
  const width = xSpan ? xSpan.end - xSpan.start : 0;
  const locusTextSpan = locus.length * FONT_SIZE;

  const horizontalLineStyle = {
    top: relativeY,
    left: 0,
    width: width,
    height: 2,
    color: color,
    willChange: "top",
  };
  const textStyle = {
    marginTop: textHeight,
    whiteSpace: "nowrap",
    marginLeft: 0,
  };

  return xSpan ? (
    <div className="Fragment-horizontal-line" style={horizontalLineStyle}>
      {" "}
      <p style={textStyle}>{locus}</p>{" "}
    </div>
  ) : null;
}

function Triangle(props) {
  const { relativeX, relativeY, color, direction } = props;
  const triangleStyle = {
    top: relativeY,
    left: 0,
    color: color,
  };
  const triangeClass = direction === "up" ? "arrow-up" : "arrow-down";
  return <div className={triangeClass} style={triangleStyle} />;
}

export default HorizontalFragment;
