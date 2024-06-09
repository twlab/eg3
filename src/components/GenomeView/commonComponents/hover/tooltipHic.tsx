import { useEffect, useRef, useState, memo } from 'react';
import './Tooltip.css';
import pointInPolygon from 'point-in-polygon';
import React from 'react';

interface HicHoverProp {
  data: any;
  windowWidth: number;
  trackIdx: number;
}
const TestToolTipHic: React.FC<HicHoverProp> = memo(function TestToolTipHic({
  data,
  windowWidth,
  trackIdx,
}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [toolTip, setToolTip] = useState({
    top: 0,
    left: 0,
    right: 0,
    toolTip: <></>,
    beamRight: <></>,
    beamLeft: <></>,
  });

  function findPolygon(x: number, y: number): any {
    for (let i = 0; i < data.polyCoord.length; i++) {
      if (pointInPolygon([x, y], data.polyCoord[i].points)) {
        return data.placedInteraction[i];
      }
    }

    return null;
  }
  const handleMouseEnter = (e) => {
    if (Object.keys(data.polyCoord).length > 0) {
      const rect = targetRef.current!.getBoundingClientRect();
      let legendWidth = 120;
      let dataIdxX = Math.floor(e.pageX - rect.left);
      let dataIdxY = Math.floor(e.pageY - (window.scrollY + rect.top - 1));

      if (dataIdxX < windowWidth * 2 && dataIdxY < 1000) {
        const curPlacedInteraction = findPolygon(dataIdxX, dataIdxY);
        if (curPlacedInteraction) {
          const { xSpan1, xSpan2, interaction } = curPlacedInteraction;
          const left = xSpan1.start;
          const right = xSpan2.start;
          const leftWidth = Math.max(xSpan1.end - xSpan1.start, 1);
          const rightWidth = Math.max(xSpan2.end - xSpan2.start, 1);

          setToolTip({
            ...toolTip,
            top: rect.top,
            left: rect.left,
            right: rect.right,
            toolTip: (
              <div>
                {interaction.name && <div>{interaction.name}</div>}
                <div>
                  Locus1: {interaction.locus1.chr}
                  {interaction.locus1.start}
                  {interaction.locus1.end}
                </div>
                Locus2: {interaction.locus2.chr}
                {interaction.locus2.start}
                {interaction.locus2.end}
                <div>Score: {interaction.score}</div>
              </div>
            ),
            beamRight: (
              <div
                style={{
                  position: 'absolute',

                  left: right,
                  width: rightWidth,
                  backgroundColor: 'green',
                  height: 1000,
                }}
              ></div>
            ),
            beamLeft: (
              <div
                style={{
                  position: 'absolute',
                  backgroundColor: 'red',
                  left: left,
                  width: leftWidth,
                  height: 1000,
                }}
              ></div>
            ),
          });
          setIsVisible(true);
        }
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
    //Need to have two separate div for hovering area and tooltip or else when tooltip is being displayed based on track actual x toolTip it will also move the hovering area when using
    // absolute display and left in css styling
    // using opacity will block mouse event because element is on top of hoverzone which will not register mouse event
    <div
      style={{
        width: windowWidth * 2,
        height: 1000,
      }}
    >
      {isVisible ? (
        <div
          style={{
            display: 'flex',

            position: 'absolute',
            width: windowWidth * 2,
            height: 1000,
          }}
        >
          {toolTip.beamRight}

          {toolTip.beamLeft}
        </div>
      ) : (
        ' '
      )}

      <div
        style={{
          opacity: isVisible ? 1 : 0,
          display: 'flex',

          left: -toolTip.left + windowWidth / 3 + trackIdx * windowWidth * 2,
          position: 'absolute',
          backgroundColor: '#333',
          color: '#fff',

          fontSize: 14,
          top: toolTip.top - 200,
          transition: 'opacity 0.1s',
        }}
      >
        {trackIdx}
        {toolTip.toolTip}
      </div>
      <div
        key={`tooltipHic-${trackIdx}`} // Use a unique key
        ref={targetRef}
        style={{
          position: 'absolute',
          width: windowWidth * 2,
          height: 1000,
        }}
      ></div>
    </div>
  );
});

export default memo(TestToolTipHic);
