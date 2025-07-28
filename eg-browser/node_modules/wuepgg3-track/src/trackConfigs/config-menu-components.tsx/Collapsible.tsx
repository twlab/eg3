import React, { useState, CSSProperties, useRef, useEffect } from "react";

interface CollapsibleProps {
  trigger: string;
  children: React.ReactNode;
}

const Collapsible: React.FC<CollapsibleProps> = ({ trigger, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [height, setHeight] = useState("0px");
  const contentRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? `${contentRef.current.scrollHeight}px` : "0px");
    }
  }, [isOpen]);

  const buttonStyle: CSSProperties = {
    // backgroundColor: "#f9f9f9",
    cursor: "pointer",
    padding: "6px",
    border: "none",
    textAlign: "left",
    outline: "none",
    fontSize: "15px",
    width: "100%",
  };

  const buttonHoverStyle: CSSProperties = {
    ...buttonStyle,
    // backgroundColor: "#e0e0e0",
  };

  const contentStyle: CSSProperties = {
    maxHeight: height,
    overflow: "hidden",
    transition: "max-height 0.3s ease",
    // backgroundColor: "white",
    // padding: "0 18px",
  };

  const TrackContextMenuItemStyle: CSSProperties = {
    margin: "10px 0",
  };

  return (
    <div>
      <button
        className="collapsible"
        onClick={toggle}
        style={isOpen ? buttonHoverStyle : buttonStyle}
      >
        {trigger}
      </button>
      <div ref={contentRef} className="content" style={contentStyle}>
        <div
          className="TrackContextMenu-item"
          style={TrackContextMenuItemStyle}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default Collapsible;
