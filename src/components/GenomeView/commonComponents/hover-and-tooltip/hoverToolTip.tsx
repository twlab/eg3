import { useEffect, useRef, useState, memo } from "react";
import "./Tooltip.css";
import AlignmentSequence from "../../GenomeAlign/AlignmentCoordinate";
import HorizontalFragment from "../../GenomeAlign/HorizontalFragment";
import GenomicCoordinates from "./GenomicCoordinates";
import TrackModel from "../../../../models/TrackModel";

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
}
export const getHoverTooltip = {
  refGene: function getTooltip(dataObj: { [key: string]: any }) {
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
    return (
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
    );
  },
  bed: async function bedFetch(regionData: any) {},

  bigwig: function bigWigFetch(regionData: any) {
    return;
  },

  dynseq: function dynseqFetch(regionData: any) {
    return;
  },
  methylc: function methylcFetch(regionData: any) {
    return;
  },
  hic: function hicFetch(regionData: any) {
    return;
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

    return (
      <AlignmentSequence
        alignment={cusorSegment}
        x={dataObj.relativeX}
        halfLength={sequenceHalfLength}
        target={primaryGenome}
        query={queryGenome}
        basesPerPixel={basesPerPixel}
      />
    );
  },
  genomealignRough: function genomeAlignRoughFetch(dataObj: {
    [key: string]: any;
  }) {
    const RECT_HEIGHT = 15;
    return (
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
    );
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
        hasReverse,
        options,
      });
      setPosition({
        ...rectPosition,
        top: rect.bottom,
        left: rect.left,
        right: rect.right,
        dataIdxX: dataIdxX,
        dataIdxY: dataIdxY,
        toolTip: trackHoverTooltip,
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
        <div
          style={{
            left: rectPosition.dataIdxX,
            top: rectPosition.dataIdxY,
            position: "absolute",
            backgroundColor: "lightBlue",
            // color: "white",
            padding: 8,
            borderRadius: 4,
            fontSize: 14,
          }}
        >
          {rectPosition.dataIdxX}
          {rectPosition.toolTip}
        </div>
      ) : (
        ""
      )}
    </div>
  );
});

export default memo(HoverTooltip);
