import { useEffect, useRef, useState, memo } from "react";
import "./Tooltip.css";
import AlignmentSequence from "../../GenomeAlignComponents/AlignmentCoordinate";
import HorizontalFragment from "../../GenomeAlignComponents/HorizontalFragment";
import GenomicCoordinates from "../numerical/GenomicCoordinates";
import TrackModel from "../../../../../models/TrackModel";
import { getContrastingColor } from "../../../../../models/util";
import _ from "lodash";
import pointInPolygon from "point-in-polygon";
interface HoverToolTipProps {
  data: any;
  windowWidth: number;
  trackIdx?: number;
  length?: number;
  side?: string;
  trackType: string;
  trackModel?: TrackModel;
  height: number;
  viewRegion?: any;
  unit?: string | undefined;
  data2?: any;
  hasReverse?: boolean;
  options?: any;
  legendWidth?: any;
  viewWindow?: any;
}
import { sameLoci } from "../../../../../models/util";
import { arc } from "d3";
import ReactDOM from "react-dom";
function getAbsolutePosition(element) {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.pageYOffset,
    left: rect.left + window.pageXOffset,
    height: rect.height,
  };
}
export const getHoverTooltip = {
  numerical: function getTooltip(dataObj: { [key: string]: any }) {
    const value = dataObj.data[Math.round(dataObj.relativeX)];
    const value2 = dataObj.hasReverse
      ? dataObj.data2[Math.round(dataObj.relativeX)]
      : null;
    const stringValue =
      typeof value === "number" && !Number.isNaN(value)
        ? value.toFixed(2)
        : "(no data)";
    const stringValue2 =
      typeof value2 === "number" && !Number.isNaN(value2)
        ? value2.toFixed(2)
        : "(no data)";
    return {
      toolTip: (
        <div>
          <div>
            <span className="Tooltip-major-text" style={{ marginRight: 3 }}>
              {dataObj.hasReverse && "Forward: "} {stringValue}
            </span>
            {dataObj.unit && (
              <span className="Tooltip-minor-text">{dataObj.unit}</span>
            )}
          </div>
          {dataObj.hasReverse && (
            <div>
              <span className="Tooltip-major-text" style={{ marginRight: 3 }}>
                Reverse: {stringValue2}
              </span>
              {dataObj.unit && (
                <span className="Tooltip-minor-text">{dataObj.unit}</span>
              )}
            </div>
          )}
          <div className="Tooltip-minor-text">
            <GenomicCoordinates
              viewRegion={dataObj.viewRegion}
              width={dataObj.width}
              x={dataObj.relativeX}
            />
          </div>
          <div className="Tooltip-minor-text">
            {dataObj.trackModel.getDisplayLabel()}
          </div>
        </div>
      ),
    };
  },
  methyc: function getTooltip(dataObj: { [key: string]: any }) {
    const { trackModel, viewRegion, width, options } = dataObj;
    const strandsAtPixel = dataObj.data[Math.round(dataObj.relativeX)];

    return {
      toolTip: (
        <div>
          {renderTooltipContentsForStrand(
            strandsAtPixel,
            options.isCombineStrands ? "combined" : "forward"
          )}
          {!options.isCombineStrands &&
            renderTooltipContentsForStrand(strandsAtPixel, "reverse")}
          <div className="Tooltip-minor-text">
            <GenomicCoordinates
              viewRegion={viewRegion}
              width={width}
              x={dataObj.relativeX}
            />
          </div>
          <div className="Tooltip-minor-text">
            {trackModel.getDisplayLabel()}
          </div>
        </div>
      ),
    };
    function getColorsForContext(contextName: string) {
      return (
        dataObj.options.colorsForContext[contextName] || dataObj.options.CG
      );
    }

    function makeBackgroundColorStyle(color: string) {
      return {
        color: getContrastingColor(color),
        backgroundColor: color,
        padding: "0px 3px", // 3px horizontal padding
        borderRadius: 3,
      };
    }

    function renderTooltipContentsForStrand(strandsAtPixel, strand) {
      const { depthColor, colorsForContext, depthFilter } = dataObj.options;
      const dataAtPixel = strandsAtPixel[strand];

      let details;
      if (dataAtPixel) {
        if (dataAtPixel.depth < depthFilter) {
          return null;
        }
        let dataElements: Array<any> = [];
        // Sort alphabetically by context name first
        const contextValues = _.sortBy(dataAtPixel.contextValues, "context");
        for (let contextData of contextValues) {
          const contextName = contextData.context;
          const color = (colorsForContext[contextName] || dataObj.options.CG)
            .color;
          dataElements.push(
            <div
              key={contextName + "label"}
              style={makeBackgroundColorStyle(color)}
            >
              {contextName}
            </div>,
            <div key={contextName + "value"}>
              {contextData.value.toFixed(2)}
            </div>
          );
        }
        details = (
          <div className="MethylCTrack-tooltip-strand-details">
            <div style={makeBackgroundColorStyle(depthColor)}>Depth</div>
            <div>{Math.round(dataAtPixel.depth)}</div>
            {dataElements}
          </div>
        );
      }

      return (
        <div key={strand} className="MethylCTrack-tooltip-strand">
          <span className="MethylCTrack-tooltip-strand-title">{strand}</span>
          {details || <div className="Tooltip-minor-text">(No data)</div>}
        </div>
      );
    }
  },
  interactionHeatmap: function getToolTip(dataObj) {
    const polygon = findPolygon(dataObj.relativeX, dataObj.relativeY);
    function renderTooltip() {
      if (polygon) {
        let { xSpan1, xSpan2 } = polygon;
        const parentPos = getAbsolutePosition(dataObj.targetRef.current);

        const left = xSpan1.start;
        const right = xSpan2.start;
        const leftWidth = Math.max(xSpan1.getLength(), 1);
        const rightWidth = Math.max(xSpan2.getLength(), 1);

        return (
          <>
            <div
              id="beamLeft"
              style={{
                position: "absolute",
                display: "block",
                // 10 is the padding in genome Root  and 2 is the border width tomato red in trackmanager
                left: parentPos.left + left - 12 + "px",
                width: leftWidth + "px",
                height: "100%",

                zIndex: 1000,
              }}
            >
              <div id="beamLeftInner"></div>
            </div>
            <div
              id="beamRight"
              style={{
                position: "absolute",
                display: "block",
                // 10 is the padding in genome Root  and 2 is the border width tomato red in trackmanager
                left: parentPos.left + right - 12 + "px",
                width: rightWidth + "px",
                height: "1000",
                zIndex: 1000,
              }}
            >
              <div id="beamRightInner"></div>
            </div>
          </>
        );
      } else {
        return null;
      }
    }

    function findPolygon(x, y) {
      for (const item of dataObj.data) {
        if (pointInPolygon([x, y], item.points)) {
          return item;
        }
      }
      return null;
    }

    let beamElements = renderTooltip();

    return beamElements
      ? {
          beams: beamElements,
          toolTip: (
            <div>
              <div>Locus1: {polygon.interaction.locus1.toString()}</div>
              <div>Locus2: {polygon.interaction.locus2.toString()}</div>
              <div>Score: {polygon.interaction.score}</div>
            </div>
          ),
        }
      : "";
  },
  interactionArc: function getToolTip(dataObj: { [key: string]: any }) {
    function renderTooltip(relativeX: number, relativeY: number) {
      if (dataObj.options.greedyTooltip) {
        const arcs = findArcs(relativeX, relativeY);
        if (arcs.length) {
          const sortedArcs = _.sortBy(arcs, (arc) => arc[4].score);
          // const tops =
          //     sortedArcs.length > 2
          //         ? sortedArcs.slice(sortedArcs.length - 3, sortedArcs.length).reverse()
          //         : sortedArcs.reverse();
          const tops: any = [];
          for (
            let j = sortedArcs.length - 1;
            j >= sortedArcs.length - 6 && j >= 0;
            j--
          ) {
            if (tops.length > 2) {
              break;
            }
            if (tops.length > 0) {
              if (
                sameLoci(
                  sortedArcs[j][4].locus1,
                  tops[tops.length - 1][4].locus2
                ) &&
                sameLoci(
                  sortedArcs[j][4].locus2,
                  tops[tops.length - 1][4].locus1
                )
              ) {
                continue;
              }
            }
            tops.push(sortedArcs[j]);
          }
          const divs = tops.map((arc: any, i: number) => {
            return (
              <div key={i}>
                {arc[4].name && <div>{arc[4].name}</div>}
                <div>Locus1: {arc[4].locus1.toString()}</div>
                <div>Locus2: {arc[4].locus2.toString()}</div>
                <div>Score: {arc[4].score}</div>
              </div>
            );
          });
          return (
            <div>
              <div>{arcs.length} interactions found. Showing top 3:</div>
              <div>{divs}</div>
            </div>
          );
        } else {
          return null;
        }
      } else {
        const arc = findArc(relativeX, relativeY);

        if (arc) {
          return (
            <div>
              {arc[4].name && <div>{arc[4].name}</div>}
              <div>Locus1: {arc[4].locus1.toString()}</div>
              <div>Locus2: {arc[4].locus2.toString()}</div>
              <div>Score: {arc[4].score}</div>
            </div>
          );
        } else {
          return null;
        }
      }
    }
    function findArc(x: number, y: number) {
      for (const item of dataObj.data) {
        if (
          Math.abs(
            Math.sqrt(Math.pow(x - item[0], 2) + Math.pow(y - item[1], 2)) -
              item[2]
          ) <=
          0.5 * item[3]
        ) {
          return item;
        }
      }
      return null;
    }

    function findArcs(x: number, y: number) {
      const items: Array<any> = [];
      for (const item of dataObj.data) {
        if (
          Math.abs(
            Math.sqrt(Math.pow(x - item[0], 2) + Math.pow(y - item[1], 2)) -
              item[2]
          ) <=
          0.5 * item[3]
        ) {
          items.push(item);
        }
      }
      return items;
    }
    let arcElement = renderTooltip(dataObj.relativeX, dataObj.relativeY);

    return arcElement ? { toolTip: arcElement } : "";
  },

  interactionSquareDisplay: function getToolTip(dataObj: {
    [key: string]: any;
  }) {
    const polygon = findPolygon(dataObj.relativeX, dataObj.relativeY);

    let interaction;
    let xSpan1;
    let xSpan2;
    if (polygon) {
      xSpan1 = polygon.xSpan1;
      xSpan2 = polygon.xSpan2;
      interaction = polygon.interaction;
    }

    function findPolygon(x: number, y: number) {
      for (const item of dataObj.data) {
        if (
          pointInPolygon([x, y], item.pointLeft) ||
          pointInPolygon([x, y], item.pointRight)
        ) {
          return item;
        }
      }
      return null;
    }

    return polygon
      ? {
          toolTip: (
            <div>
              <div>Locus1: {interaction.locus1.toString()}</div>
              <div>Locus2: {interaction.locus2.toString()}</div>
              <div>Score: {interaction.score}</div>
            </div>
          ),
        }
      : "";
  },
  genomealignFine: function genomeAlignFetch(dataObj: { [key: string]: any }) {
    const { basesPerPixel, primaryGenome, queryGenome } = dataObj.data;
    const drawData = dataObj.data.drawData;

    // Which segment in drawData cusor lands on:
    const indexOfCusorSegment = drawData.reduce(
      (iCusor, x, i) =>
        x.targetXSpan.start < dataObj.relativeX &&
        x.targetXSpan.end >= dataObj.relativeX
          ? i
          : iCusor,
      NaN
    );
    const cusorSegment = drawData[indexOfCusorSegment];

    const sequenceHalfLength = 10; // The length of alignment in the hoverbox.

    return {
      toolTip: (
        <AlignmentSequence
          alignment={cusorSegment}
          x={dataObj.relativeX}
          halfLength={sequenceHalfLength}
          target={primaryGenome}
          query={queryGenome}
          basesPerPixel={basesPerPixel}
        />
      ),
    };
  },
  genomealignRough: function genomeAlignRoughFetch(dataObj: {
    [key: string]: any;
  }) {
    const RECT_HEIGHT = 15;
    return {
      toolTip: (
        <HorizontalFragment
          height={dataObj.options.height}
          rectHeight={RECT_HEIGHT}
          primaryColor={dataObj.options.primaryColor}
          queryColor={dataObj.options.queryColor}
          segmentArray={dataObj.data}
          strand={dataObj.data.plotStrand}
          viewWindowStart={dataObj.width}
          relativeX={dataObj.relativeX}
        />
      ),
    };
  },
};
function isObjectNotEmpty(data: any): boolean {
  return (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    Object.keys(data).length > 0
  );
}

function isArrayNotEmpty(data: any): boolean {
  return Array.isArray(data) && data.length > 0;
}
function isDataValid(data: any): boolean {
  return isObjectNotEmpty(data) || isArrayNotEmpty(data);
}

const HoverTooltip: React.FC<HoverToolTipProps> = memo(function tooltip({
  data,
  windowWidth,
  trackIdx,
  trackType,
  height,
  trackModel,
  viewRegion,
  unit,
  data2,
  hasReverse,
  options,
  viewWindow,
  legendWidth,
}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [rectPosition, setPosition] = useState({
    top: 0,
    left: 0,
    right: 0,
    dataIdxX: 0,
    dataIdxY: 0,
    toolTip: <></>,
    beams: <></>,
  });
  const handleMouseEnter = (e) => {
    if (
      isArrayNotEmpty(data) ||
      (isObjectNotEmpty(data) && isDataValid(data))
    ) {
      const rect = targetRef.current!.getBoundingClientRect();

      let dataIdxX = Math.round(e.pageX - rect.left);
      let dataIdxY = Math.round(e.pageY - (window.scrollY + rect.top - 1));
      // windowwidth going over by 1 pixel because each region pixel array starts at 0

      let trackHoverTooltip = getHoverTooltip[trackType]({
        data,
        trackModel,
        data2,
        viewRegion,
        width: windowWidth,
        unit,
        relativeX: dataIdxX,
        relativeY: dataIdxY,
        hasReverse,
        options,
        viewWindow,
        legendWidth,
        targetRef,
      });

      setPosition({
        ...rectPosition,
        top: rect.bottom,
        left: rect.left,
        right: rect.right,
        dataIdxX: dataIdxX,
        dataIdxY: dataIdxY,
        toolTip: trackHoverTooltip.toolTip,
        beams: trackHoverTooltip.beams ? trackHoverTooltip.beams : <></>,
      });
      setIsVisible(true);
    }
  };
  // when creating mouse behavior and events for separate component you have to create handler function outside the useeffect or else state is based
  // of data in the element in array.  For example, hovering only works on the latest region of the track because the targetRef doesn't have any handler function to call
  // in the previous regions
  const handleMouseLeave = () => {
    setIsVisible(false);
  };
  useEffect(() => {
    setIsVisible(false);
    if (targetRef.current !== null) {
      targetRef.current.addEventListener("mousemove", handleMouseEnter);
      targetRef.current.addEventListener("mouseleave", handleMouseLeave);
    }
    return () => {
      if (targetRef.current !== null) {
        targetRef.current.removeEventListener("mousemove", handleMouseEnter);
        targetRef.current.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [data]);

  return (
    <div
      key={`tooltip-${trackIdx}`} // Use a unique key
      ref={targetRef}
      style={{
        width: windowWidth,
        height: height,
        position: "relative",
        zIndex: -1,
      }}
    >
      {isVisible ? (
        <>
          {"trackManagerRef" in options
            ? ReactDOM.createPortal(
                rectPosition.beams,
                options.trackManagerRef.current
              )
            : ""}

          {ReactDOM.createPortal(
            <div
              style={{
                position: "absolute",
                top: rectPosition.top + window.scrollY,
                left: rectPosition.left + rectPosition.dataIdxX,
                backgroundColor: "lightBlue",
                borderRadius: 4,
                padding: 8,
                fontSize: 14,
                zIndex: 1000,
                // prevent the tooltip from getting clipped off the edge of the screen viewport
              }}
            >
              {rectPosition.dataIdxX}
              {rectPosition.toolTip}
            </div>,
            document.body
          )}
        </>
      ) : (
        ""
      )}
    </div>
  );
});

export default memo(HoverTooltip);
