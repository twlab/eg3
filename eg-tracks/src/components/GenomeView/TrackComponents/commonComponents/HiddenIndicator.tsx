import React, { useState, useRef, useEffect } from "react";
import "./loading.css";

interface HiddenIndicatorProps {
  numHidden: any;
  height: number;
  xOffset?: number;
  isVisible?: boolean;
  color: string;
  legendWidth?: number;
  /** In the pangenome view's glass header (TrackHeader.tsx): a small chip
      after the track's label, which opens in place to say more. */
  chip?: boolean;
}

const HiddenIndicator: React.FC<HiddenIndicatorProps> = ({
  numHidden,
  height,
  xOffset = 0,
  isVisible = false,
  color,
  legendWidth,
  chip = false,
}) => {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(true);
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
    return dismissed ? (
      <button
        type="button"
        className="TrackHeader-glass TrackHeader-chip"
        onClick={() => setDismissed(false)}
      >
        {numHidden} items hidden
      </button>
    ) : (
      <span className="TrackHeader-glass TrackHeader-chip">
        {numHidden} items hidden - zoom in to view them
        <button
          type="button"
          className="TrackHeader-chipLink"
          onClick={() => setDismissed(true)}
        >
          dismiss
        </button>
      </span>
    );
  }

  return (
    <div
      ref={popoverRef}
      style={{
        position: "absolute",
        top: height - 16, // 16 is the height of the loading but
        left: dismissed ? 0 : xOffset,
        visibility: isVisible ? "visible" : "hidden", // Control visibility
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      {dismissed ? (
        // Small tab indicator when dismissed - click to restore full component

        <div
          onClick={() => setDismissed(false)}
          className={`popover-btn`}
          style={{
            width: legendWidth,
            gap: "0.5em",
            position: "relative",
            verticalAlign: "top",
            padding: "0 7px 0 5px",
            fontStyle: "italic",
            pointerEvents: "auto",
          }}
        >
          <span style={{ textAlign: "left" }}>{numHidden} items hidden</span>
          <span className={`popover-arrow${open ? " open" : ""}`} />
        </div>
      ) : (
        // Full component when not dismissed
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              gap: "0.8em",
              alignItems: "center",
              color: color,
              fontFamily:
                "BlinkMacSystemFont, -apple-system, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: "0.8rem",
              height: "16px",
              position: "relative",
              verticalAlign: "top",
              whiteSpace: "nowrap",
              pointerEvents: "none",
            }}
          >
            <div style={{ fontStyle: "italic", pointerEvents: "none" }}>
              {numHidden} items hidden - zoom in to view them
              <span
                onClick={() => setDismissed(true)}
                style={{
                  fontSize: "12px",
                  color: "#007acc",
                  cursor: "pointer",
                  textDecoration: "underline",
                  pointerEvents: "auto",
                }}
              >
                dismiss
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HiddenIndicator;
