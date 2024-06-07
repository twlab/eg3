import { useEffect, useRef, useState, memo } from 'react';
import './Tooltip.css';

interface MethylcHoverProps {
  data: { [key: string]: any };
  windowWidth: number;
  trackIdx: number;
}
const TestToolTip: React.FC<MethylcHoverProps> = memo(function TestToolTip({
  data,
  windowWidth,
  trackIdx,
}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    right: 0,
    toolTip: <></>,
  });
  const handleMouseEnter = (e) => {
    if (Object.keys(data).length > 0) {
      const rect = targetRef.current!.getBoundingClientRect();
      console.log(rect);
      let dataIdx = Math.floor(e.pageX - rect.left);
      let dataIdxY = Math.floor(e.pageY - (window.scrollY + rect.top - 1));

      // windowwidth going over by 1 pixel because each region pixel array starts at 0
      if (dataIdx < windowWidth * 2) {
        setPosition({
          ...position,
          top: rect.bottom,
          left: rect.left,
          right: rect.right,
          toolTip: (
            <div>
              <div>Forward</div>
              depth: {data.canvasData[dataIdx].forward.depth}
              {data.canvasData[dataIdx].forward.contextValues.map(
                (item, index) => (
                  <div key={index}>
                    {item.context}: {item.value}
                  </div>
                )
              )}
              <div>________</div>
              <div>Reverse</div>
              depth: {data.canvasData[dataIdx].reverse.depth}
              {data.canvasData[dataIdx].reverse.contextValues.map(
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
      targetRef.current.addEventListener('mousemove', handleMouseEnter);
      targetRef.current.addEventListener('mouseleave', handleMouseLeave);
    }
    return () => {
      if (targetRef.current !== null) {
        targetRef.current.removeEventListener('mousemove', handleMouseEnter);
        targetRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    //Need to have two separate div for hovering area and tooltip or else when tooltip is being displayed based on track actual x position it will also move the hovering area when using
    // absolute display and left in css styling
    <div>
      <div
        key={`tooltip-${trackIdx}`} // Use a unique key
        ref={targetRef}
        style={{
          width: windowWidth * 2,
          height: 80,
        }}
      ></div>

      <div
        style={{
          opacity: isVisible ? 1 : 0,
          display: 'flex',

          left: -position.left + windowWidth / 3 + trackIdx * windowWidth * 2,
          position: 'absolute',
          backgroundColor: '#333',
          color: '#fff',
          padding: 8,
          borderRadius: 4,
          fontSize: 14,

          transition: 'opacity 0.1s',
        }}
      >
        {trackIdx}
        {position.toolTip}
      </div>
    </div>
  );
});

export default memo(TestToolTip);
