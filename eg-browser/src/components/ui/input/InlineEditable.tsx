import React, { useState } from "react";

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
    const [value, setValue] = useState(props.value);
    const [hovering, setHovering] = useState(false);

    const handleClick = () => { setValue(props.value); setEditing(true); };
    const handleBlur = () => setEditing(false);
    const handleFinish = () => {
        setEditing(false);
        if (value === props.value) return;
        if (props.prohibitedValues?.includes(value.toLowerCase())) {
            const errorDiv = document.createElement("div");
            errorDiv.className = "fixed bottom-4 left-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg";
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

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => event.target.select();

    const handleMouseEnter = () => setHovering(true);
    const handleMouseLeave = () => setHovering(false);

    const textStyle = props.style || "text-base";

    let body;

    if (editing) {
        body = (
            <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleFinish}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        handleFinish();
                    } else if (e.key === "Escape") {
                        handleBlur();
                    }
                }}
                autoFocus
                onFocus={handleFocus}
                className={`outline-none ${textStyle}`}
                style={{
                    width: `${Math.max(value.length, 5)}ch`,
                    minWidth: "75px",
                }}
            />
        );
    } else {
        body = (
            <span className={textStyle}>
                {props.value}
            </span>
        );
    }

    if (editing) {
        return (
            <div
                onClick={handleClick}
                onBlur={handleBlur}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={`inline-block ${hovering && !editing ? "outline outline-1 outline-gray-300" : ""}`}
            >
                {body}
            </div>
        );
    } else {
        return (
            <div
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="relative inline-block group"
            >
                <div
                    onClick={handleClick}
                    className={`inline-block cursor-pointer ${hovering ? "outline outline-1 outline-gray-300" : ""}`}
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
