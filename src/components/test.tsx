// testToolTip.tsx (Parent Component)
import React, { FC, useEffect, useRef, useState } from 'react';
import './Tooltip.css';
interface TooltipProps {
  targetRef: React.RefObject<HTMLElement>;
  content: string;
}
function TestToolTip(props) {
  const targetRef = useRef<HTMLDivElement>(null);
  console.log(props.data);
  return (
    <div>
      <div
        ref={targetRef}
        style={{
          width: '100px',
          height: '50px',
          backgroundColor: 'lightblue',
          position: 'relative',
        }}
      >
        Hover over me!
      </div>
      <Tooltip targetRef={targetRef} content="Hello, I'm a tooltip!" />
    </div>
  );
}

const Tooltip: FC<TooltipProps> = ({ targetRef, content }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const targetElement = targetRef.current;
    if (!targetElement) return;

    const handleMouseEnter = () => {
      const rect = targetElement.getBoundingClientRect();
      console.log(rect);
      setPosition({ top: rect.bottom, left: rect.left });
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    targetElement.addEventListener('mouseenter', handleMouseEnter);
    targetElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      targetElement.removeEventListener('mouseenter', handleMouseEnter);
      targetElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [targetRef]);

  return (
    <div
      className={`tooltip ${isVisible ? 'visible' : ''}`}
      style={{ top: position.top, left: position.left }}
    >
      {content}
    </div>
  );
};

export default TestToolTip;
