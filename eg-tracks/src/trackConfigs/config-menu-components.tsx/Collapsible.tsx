import React, { useState, CSSProperties, useRef, useEffect } from "react";
import OutsideClickDetector from "../../components/GenomeView/TrackComponents/commonComponents/OutsideClickDetector";

interface CollapsibleProps {
  trigger: string;
  children: React.ReactNode;
  anchorPosition?: { left: number; top: number; pageX?: number; pageY?: number };
}

const Collapsible: React.FC<CollapsibleProps> = ({ trigger, children, anchorPosition }) => {
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

  const TrackContextMenuItemStyle: CSSProperties = {};

  // If an anchorPosition is provided, render the collapsible content as a fixed-position popup
  return (
    <div>
      <button
        className="collapsible"
        onClick={toggle}
        style={isOpen ? buttonHoverStyle : buttonStyle}
      >
        {trigger}
      </button>
      {anchorPosition ? (
        isOpen && (
          (() => {
            const winW = typeof window !== "undefined" ? window.innerWidth : 1024;
            const calcLeft = Math.max(
              8,
              Math.min(anchorPosition.left + 120, winW - 320),
            );
            // move popup up by 19px relative to previous placement
            return (
              <OutsideClickDetector onOutsideClick={() => setIsOpen(false)}>
                  <div
                    style={{
                      position: "fixed",
                      left: calcLeft,
                      top: anchorPosition.top + 5,
                      transform: "translateY(-100%)",
                      zIndex: 99999,
                      background: "white",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                      maxHeight: "80vh",
                      overflow: "auto",
                    }}
                  >
                  <div className="TrackContextMenu-item" style={TrackContextMenuItemStyle}>
                    {children}
                  </div>
                </div>
              </OutsideClickDetector>
            );
          })()
        )
      ) : (
        <div ref={contentRef} className="content" style={contentStyle}>
          <div className="TrackContextMenu-item" style={TrackContextMenuItemStyle}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default Collapsible;
