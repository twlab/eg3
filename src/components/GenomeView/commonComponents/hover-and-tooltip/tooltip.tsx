import { useEffect, useRef, useState, memo } from "react";
import "./Tooltip.css";

interface MethylcHoverProps {
  data: { [key: string]: any };
  windowWidth: number;
  trackIdx: number;
  length?: number;
  side: string;
}
const TestToolTip: React.FC<MethylcHoverProps> = memo(function TestToolTip({
  data,
  windowWidth,
  trackIdx,
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
    if (Object.keys(data).length > 0) {
      const rect = targetRef.current!.getBoundingClientRect();
      // console.log(e.pageX, rect.left + window.scrollX);
      let dataIdxX = Math.ceil(e.pageX - rect.left);
      let dataIdxY = Math.floor(e.pageY - (window.scrollY + rect.top - 1));
      console.log(e.pageX, rect.left);
      // windowwidth going over by 1 pixel because each region pixel array starts at 0

      // console.log(dataIdxX);
      setPosition({
        ...rectPosition,
        top: rect.bottom,
        left: rect.left,
        right: rect.right,
        dataIdxX: dataIdxX,
        dataIdxY: dataIdxY,
        toolTip: (
          <div>
            <div>Forward</div>
            depth: {data.canvasData[dataIdxX].forward.depth}
            {data.canvasData[dataIdxX].forward.contextValues.map(
              (item, index) => (
                <div key={index}>
                  {item.context}: {item.value}
                </div>
              )
            )}
            <div>________</div>
            <div>Reverse</div>
            depth: {data.canvasData[dataIdxX].reverse.depth}
            {data.canvasData[dataIdxX].reverse.contextValues.map(
              (item, index) => (
                <div key={index}>
                  {item.context}: {item.value}
                </div>
              )
            )}
          </div>
        ),
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
  }, []);

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
            backgroundColor: "black",
            color: "white",
            padding: 8,
            borderRadius: 4,
            fontSize: 14,

            transition: "opacity 0.1s",
          }}
        >
          {trackIdx}
          {rectPosition.toolTip}
        </div>
      ) : (
        " "
      )}
    </div>
  );
});

export default memo(TestToolTip);
