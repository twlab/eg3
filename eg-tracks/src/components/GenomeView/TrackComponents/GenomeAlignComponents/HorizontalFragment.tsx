import "./HorizontalFragment.css";

import React, { Component, MouseEvent } from "react";

const LINE_MARGIN = 1;
const LINE_WIDTH = 2;
const TRIANGLE_SIZE = 10;
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
  windowScrollY: number;
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
      windowScrollY,
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
      lines = <React.Fragment>{null}</React.Fragment>;
    } else {
      const targetXSpan = targetXSpanList[xSpanIndex];
      const queryXSpan = queryXSpanList[xSpanIndex];
      const targetLocus =
        targetLocusList[xSpanIndex] + "(" + lengthList[xSpanIndex] + ")";
      const queryLocus =
        queryLocusList[xSpanIndex] + "(" + queryLengthList[xSpanIndex] + ")";
      //1. The following is not accurate. Should use locus coordinates in alignment segment.
      const queryX =
        strandList[xSpanIndex] === strand
          ? queryXSpan.start +
          ((queryXSpan.end - queryXSpan.start) *
            (relativeX - targetXSpan.start)) /
          (targetXSpan.end - targetXSpan.start)
          : queryXSpan.end -
          ((queryXSpan.end - queryXSpan.start) *
            (relativeX - targetXSpan.start)) /
          (targetXSpan.end - targetXSpan.start);

      lines = (
        <React.Fragment>
          {
            <HorizontalLine
              relativeY={LINE_MARGIN + windowScrollY}
              xSpan={targetXSpan}
              viewWindowStart={viewWindowStart}
              color={primaryColor}
              locus={targetLocus}
              textHeight={10}
            />
          }

          {
            <Triangle
              relativeX={0 - 14}
              relativeY={LINE_MARGIN + LINE_WIDTH + rectHeight + windowScrollY}
              color={primaryColor}
              direction={"down"}
            />
          }
          {// subtrract 14 to center triangle on mouse, because of borderradius = 4  and + 10 to mousePosition to X in hoverToolTip
            <Triangle
              relativeX={queryX - relativeX - 14}
              relativeY={
                height - rectHeight - LINE_MARGIN - LINE_WIDTH - TRIANGLE_SIZE + windowScrollY
              }
              color={queryColor}
              direction={"up"}
            />
          }
          {
            <HorizontalLine
              relativeY={height - LINE_MARGIN + windowScrollY}
              xSpan={queryXSpan}
              viewWindowStart={viewWindowStart}
              color={queryColor}
              locus={queryLocus}
              textHeight={-35}
            />
          }
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
          pointerEvents: "none",
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


  const horizontalLineStyle = {
    top: `${relativeY}px`,
    left: "0px",
    width: `${width}px`,
    height: `${LINE_WIDTH}px`,
    color: color,
    willChange: "top",
    pointerEvents: "none" as const,
  };
  const textStyle = {

    marginTop: `${textHeight}px`,
    whiteSpace: "nowrap" as const,
    marginLeft: "0px",
  };

  return xSpan ? (
    <div className="Fragment-horizontal-line" style={horizontalLineStyle}>
      {" "}
      <p style={textStyle}>{locus}</p>{" "}
    </div>
  ) : null;
}

// function Triangle(props) {
//   const {
//     relativeY,
//     xSpan,
//     viewWindowStart,
//     color,

//     textHeight,
//     direction,
//   } = props;
//   const width = xSpan ? xSpan.end - xSpan.start : 0;

//   const triangleStyle = {
//     top: relativeY + 20,
//     left: 10,
//     // width: width,
//     height: LINE_WIDTH,
//     color: color,
//     willChange: "top",
//   };
//   const textStyle = {
//     marginTop: textHeight,
//     whiteSpace: "nowrap",
//     marginLeft: 0,
//   };
//   const triangeClass = direction === "up" ? "arrow-up" : "arrow-down";
//   return <div className={triangeClass} style={triangleStyle} />;
// }

function Triangle(props) {
  const { relativeX, relativeY, color, direction } = props;

  const triangleStyle = {
    top: relativeY,
    left: relativeX,
    color: color,
    pointerEvents: "none" as const,
  };
  const triangeClass = direction === "up" ? "arrow-up" : "arrow-down";
  return <div className={triangeClass} style={triangleStyle} />;
}

export default HorizontalFragment;
