import React, { useState, useRef, useEffect } from "react";
import "./loading.css";

interface PopoverProps {
  buttonLabel: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const Loading: React.FC<PopoverProps> = ({
  buttonLabel,
  children,
  className,
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
    <div ref={popoverRef} className={`popover-root ${className || ""}`}>
      <button
        type="button"
        className={`popover-btn${open ? " open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        style={{ position: "relative", zIndex: 9994 }}
      >
        {buttonLabel}
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
