import React, { useState, useRef, useEffect } from "react";
import "./loading.css";

interface HiddenIndicatorProps {
  numHidden: any;
  height: number;
  xOffset?: number;
}

const HiddenIndicator: React.FC<HiddenIndicatorProps> = ({
  numHidden,
  height,
  xOffset = 0,
}) => {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div
      ref={popoverRef}
      style={{
        position: "absolute",
        top: height - 16, // 16 is the height of the button, shift it up to align
        left: xOffset,
      }}
    >
      <button
        type="button"
        className={`popover-btn${open ? " open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        style={{ zIndex: 9994 }}
      >
        <div style={{ fontStyle: "italic" }}>
          {numHidden} items hidden - zoom{" "}
        </div>
        {/* <div className="loader"></div> */}
        {/* <span className={`popover-arrow${open ? " open" : ""}`} /> */}
      </button>
    </div>
  );
};

export default HiddenIndicator;
