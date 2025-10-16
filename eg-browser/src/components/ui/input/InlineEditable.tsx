import React, { useState, useRef, useEffect } from "react";
import Session from "../../root-layout/tabs/apps/destinations/Session";


/**
 * A component that allows inline editing of text.
 * @author Shane Liu (original)
 */

interface InlineEditableProps {
  value: string;
  onChange: (value: string) => void;
  style?: string;
  prohibitedValues?: string[];
  tooltip?: string;
}

function InlineEditable(props: InlineEditableProps) {


  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [hovering, setHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    setValue(props.value);
    setEditing(true);
  };
  useEffect(() => {
    setValue(props.value);
  }, [props.value]);
  // Handle clicks outside the component to close editing
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        handleFinish();
      }
    };

    if (editing) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editing]);

  const handleFinish = () => {
    setEditing(false);
    if (value === props.value) return;
    if (props.prohibitedValues?.includes(value.toLowerCase())) {
      const errorDiv = document.createElement("div");
      errorDiv.className =
        "fixed bottom-4 left-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg";
      errorDiv.textContent = "You can't set to this reserved value!";
      document.body.appendChild(errorDiv);
      setTimeout(() => {
        document.body.removeChild(errorDiv);
      }, 3000);
      return;
    }
    props.onChange(value);

    setHovering(false);
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) =>
    event.target.select();

  const handleMouseEnter = () => setHovering(true);
  const handleMouseLeave = () => setHovering(false);

  const textStyle = props.style || "text-base";

  let body;

  const commonStyle = {
    width: `${Math.max(props.value.length, 10)}ch`,
    minWidth: "75px",
  };

  if (editing) {
    body = (
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleFinish();


          } else if (e.key === "Escape") {
            setEditing(false);
          }
        }}
        autoFocus
        onFocus={handleFocus}
        className={`outline-none ${textStyle}`}
        style={commonStyle}
      />
    );
  } else {
    body = (
      <span className={`${textStyle} inline-block`} style={commonStyle}>
        {props.value}
      </span>
    );
  }

  if (editing) {
    return (
      <div
        ref={containerRef}
        className={`relative inline-block ${hovering && !editing ? "outline outline-1 outline-gray-300" : ""
          }`}
      >
        {body}
        <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-gray-200 shadow-lg rounded">
          <Session />
        </div>
      </div>
    );
  } else {
    return (
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        <div
          onClick={handleClick}
          className={`inline-block cursor-pointer ${hovering ? "outline outline-1 outline-gray-300" : ""
            }`}
        >
          {body}
          <div className="absolute invisible group-hover:visible top-full mt-1 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10 before:content-[''] before:absolute before:bottom-full before:left-1/2 before:-ml-1 before:border-4 before:border-transparent before:border-b-gray-800">
            {props.tooltip ?? "Click to edit"}
          </div>
        </div>
      </div>
    );
  }
}

export default InlineEditable;
