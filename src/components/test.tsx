// testToolTip.tsx (Parent Component)
import React, { FC, useEffect, useRef, useState } from 'react';
import './Tooltip.css';
interface TooltipProps {
  targetRef: React.RefObject<HTMLElement>;
  data: { [key: string]: any };
  windowWidth: number;
  trackIdx: number;
}

// TO: DO; NEED TO KEEP TRACK OF DATA IN ARRAY MATCHING THE TRACK GENE OR ELSE DATA GET REPLACE WITH THE SAME TYPE OF DATA WHEN NEW TRACK AND WHEN GOING BACK TO OLD TRACK
// PREV HOVER TRACK ARE REPLACE WITH NEW DATA
function TestToolTip(props) {
  const targetRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      <div
        ref={targetRef}
        style={{
          width: props.windowWidth * 2,
        }}
      >
        <Tooltip
          trackIdx={props.trackIdx}
          targetRef={targetRef}
          windowWidth={props.windowWidth}
          data={props.data}
        />
      </div>
    </div>
  );
}

const Tooltip: FC<TooltipProps> = ({
  targetRef,
  data,
  windowWidth,
  trackIdx,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    right: 0,
    toolTip: <></>,
  });
  console.log(data);
  useEffect(() => {
    const targetElement = targetRef.current;
    if (!targetElement) return;

    const handleMouseEnter = (e) => {
      if (Object.keys(data).length > 0) {
        const rect = targetElement.getBoundingClientRect();
        const dataIdx = Math.floor(e.pageX - rect.left);
        setPosition({
          top: rect.bottom,
          left: rect.left,
          right: rect.right,
          toolTip: (
            <div>
              <div>Forward</div>
              depth: {data.canvasData[dataIdx].forward.depth}
              {data.canvasData[dataIdx].forward.contextValues.map(
                (item, index) => (
                  <div>
                    {item.context}: {item.value}
                  </div>
                )
              )}
              <div>________</div>
              <div>Reverse</div>
              depth: {data.canvasData[dataIdx].reverse.depth}
              {data.canvasData[dataIdx].reverse.contextValues.map(
                (item, index) => (
                  <div>
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

    const handleMouseLeave = () => {
      setIsVisible(false);
    };
    targetElement.addEventListener('mousemove', handleMouseEnter);
    targetElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      targetElement.addEventListener('mousemove', handleMouseEnter);
      targetElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [targetRef]);

  return (
    <div
      className={`tooltip ${isVisible ? 'visible' : ''}`}
      style={{
        display: 'flex',
        left: -position.left + trackIdx * windowWidth * 2,
        width: windowWidth * 2,
      }}
    >
      {position.toolTip}
    </div>
  );
};

export default TestToolTip;
