import React, { useState, useRef, useEffect } from "react";
import "./loading.css";

interface PopoverProps {
  buttonLabel: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  height: number;
  xOffset?: number;
  isVisible?: boolean;
  color: string;
  legendWidth: number;
  /** In the pangenome view's glass header (TrackHeader.tsx): a small chip
      after the track's label, in place of the button at the foot of the
      legend column, and nothing at all while there is nothing loading. */
  chip?: boolean;
}

const Loading: React.FC<PopoverProps> = ({
  buttonLabel,
  children,
  className,
  height,
  xOffset = 0,
  isVisible = true,
  color,
  legendWidth,
  chip = false,
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

  if (chip) {
    if (!isVisible) return null;
    return (
      <div ref={popoverRef} className="TrackHeader-chipRoot">
        <button
          type="button"
          className="TrackHeader-glass TrackHeader-chip"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="TrackHeader-spinner" aria-hidden="true" />
          {buttonLabel}
        </button>
        {open ? (
          <div
            className="popover-panel open"
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              zIndex: 10,
              maxWidth: "300px",
              maxHeight: "200px",
              overflow: "auto",
              backgroundColor: "white",
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            {children}
          </div>
        ) : null}
      </div>
    );
  }

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
        style={{ zIndex: 10, width: legendWidth }}
      >
        <div style={{ fontStyle: "italic" }}>{buttonLabel} </div>
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
                zIndex: 10,
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

export default Loading;
