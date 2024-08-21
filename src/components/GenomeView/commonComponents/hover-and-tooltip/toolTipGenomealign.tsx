import { useEffect, useRef, useState, memo } from "react";
import "./Tooltip.css";
import AlignmentSequence from "./AlignmentCoordinate";
import { Manager, Reference, Popper } from "react-popper";
import OutsideClickDetector from "../OutsideClickDetector";
import GeneDetail from "../../geneAnnotationTrack/GeneDetail";
import ReactDOM from "react-dom";

const BACKGROUND_COLOR = "rgba(173, 216, 230, 0.9)"; // lightblue with opacity adjustment
const ARROW_SIZE = 16;

interface MethylcHoverProps {
  data: any;
  windowWidth: number;
  trackIdx?: number;
  length?: number;
  side: string;
  trackType: string;
}
export const getToolTip: { [key: string]: any } = {
  refGene: function refGeneFetch(gene: any, pageX, pageY, name, onClose) {
    const contentStyle = Object.assign({
      marginTop: ARROW_SIZE,
      pointerEvents: "none",
    });

    return ReactDOM.createPortal(
      <Manager>
        <Reference>
          {({ ref }) => (
            <div
              ref={ref}
              style={{ position: "absolute", left: pageX - 8 * 2, top: pageY }}
            />
          )}
        </Reference>
        <Popper
          placement="bottom-start"
          modifiers={[{ name: "flip", enabled: false }]}
        >
          {({ ref, style, placement, arrowProps }) => (
            <div
              ref={ref}
              style={{
                ...style,
                ...contentStyle,
              }}
              className="Tooltip"
            >
              <OutsideClickDetector onOutsideClick={onClose}>
                <GeneDetail
                  gene={gene}
                  collectionName={name}
                  queryEndpoint={{}}
                />
              </OutsideClickDetector>
              {ReactDOM.createPortal(
                <div
                  ref={arrowProps.ref}
                  style={{
                    ...arrowProps.style,
                    width: 0,
                    height: 0,
                    position: "absolute",
                    left: pageX - 8,
                    top: pageY,
                    borderLeft: `${ARROW_SIZE / 2}px solid transparent`,
                    borderRight: `${ARROW_SIZE / 2}px solid transparent`,
                    borderBottom: `${ARROW_SIZE}px solid ${BACKGROUND_COLOR}`,
                  }}
                />,
                document.body
              )}
            </div>
          )}
        </Popper>
      </Manager>,
      document.body
    );
  },
  bed: async function bedFetch(regionData: any) {},

  bigWig: function bigWigFetch(regionData: any) {
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
  genomealign: function genomeAlignFetch(alignment: any, relativeX: number) {
    const { basesPerPixel, primaryGenome, queryGenome } = alignment;
    const drawData = alignment.drawData;

    // Which segment in drawData cusor lands on:
    const indexOfCusorSegment = drawData.reduce(
      (iCusor, x, i) =>
        x.targetXSpan.start < relativeX && x.targetXSpan.end >= relativeX
          ? i
          : iCusor,
      NaN
    );
    const cusorSegment = drawData[indexOfCusorSegment];

    const sequenceHalfLength = 10; // The length of alignment in the hoverbox.

    return (
      <AlignmentSequence
        alignment={cusorSegment}
        x={relativeX}
        halfLength={sequenceHalfLength}
        target={primaryGenome}
        query={queryGenome}
        basesPerPixel={basesPerPixel}
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

const TooltipGenomealign: React.FC<MethylcHoverProps> = memo(function tooltip({
  data,
  windowWidth,
  trackIdx,
  trackType,
  length = 0,
  side,
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

      let dataIdxX = Math.floor(e.pageX - rect.left);
      let dataIdxY = Math.floor(e.pageY - (window.scrollY + rect.top - 1));

      // windowwidth going over by 1 pixel because each region pixel array starts at 0
      let tooltipsv = getToolTip[trackType](data, e.pageX - rect.left);

      if (dataIdxX < windowWidth) {
        setPosition({
          ...rectPosition,
          top: rect.bottom,
          left: rect.left,
          right: rect.right,
          dataIdxX: dataIdxX,
          dataIdxY: dataIdxY,
          toolTip: tooltipsv,
        });
        setIsVisible(true);
      }
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
        height: 80,
        position: "relative",
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

export default memo(TooltipGenomealign);
