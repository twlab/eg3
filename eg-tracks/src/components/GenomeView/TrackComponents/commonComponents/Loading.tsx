import React, { useState, useRef, useEffect } from "react";
import "./loading.css";

interface PopoverProps {
  buttonLabel: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  height: number;
  xOffset: number;
}

const Loading: React.FC<PopoverProps> = ({
  buttonLabel,
  children,
  className,
  height,
  xOffset,
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
  console.log("height", height);
  return (
    <div
      ref={popoverRef}
      className={`popover-root ${className || ""}`}
      //need to margin left the
      style={{
        position: "absolute",
        marginTop: height - 16,
        marginLeft: xOffset,
      }}
    >
      <button
        type="button"
        className={`popover-btn${open ? " open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        style={{ zIndex: 9994 }}
      >
        <div style={{ fontStyle: "italic" }}>Loading </div>
        <div className="loader"></div>
        <span className={`popover-arrow${open ? " open" : ""}`} />
      </button>
      <div
        className={`popover-panel${open ? " open" : ""}`}
        style={open ? { position: "relative", zIndex: 9999 } : {}}
      >
        {children}
      </div>
    </div>
  );
};

export default Loading;
