import React, { useState, useRef, useEffect } from "react";
import "./loading.css";

interface HiddenIndicatorProps {
  viewComponent: number;
  children: React.ReactNode;
  className?: string;
  height: number;
  xOffset?: number;
  isVisible?: boolean;
}

const HiddenIndicator: React.FC<HiddenIndicatorProps> = ({
  viewComponent,
  children,
  className,
  height,
  xOffset = 0,
  isVisible = true,
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
      className={`popover-root ${className || ""}`}
      //need to margin left the
      style={{
        position: "absolute",
        top: height - 16, // 16 is the height of the button, shift it up to align
        left: xOffset,
        visibility: isVisible ? "visible" : "hidden", // Control visibility
        pointerEvents: isVisible ? "auto" : "none", // Make uninteractable when hidden
        opacity: isVisible ? 1 : 0, // Smooth visual transition
      }}
    >
      <button
        type="button"
        className={`popover-btn${open ? " open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        style={{ zIndex: 9994 }}
      >
        <div style={{ fontStyle: "italic" }}>{viewComponent} </div>
        <div className="loader"></div>
        <span className={`popover-arrow${open ? " open" : ""}`} />
      </button>
      <div
        className={`popover-panel${open ? " open" : ""}`}
        style={
          open
            ? {
                position: "absolute",
                top: "100%", // Position below the button
                left: 0,
                zIndex: 9999,
                maxWidth: "300px", // Limit width
                maxHeight: "200px", // Limit height
                overflow: "auto", // Add scrolling if content is too large
                backgroundColor: "white",
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }
            : { display: "none" }
        }
      >
        {children}
      </div>
    </div>
  );
};

export default HiddenIndicator;
