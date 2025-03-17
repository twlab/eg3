import React from "react";
import PropTypes from "prop-types";
import ButtonGroup from "./ButtonGroup";

export const Tools = {
  DRAG: {
    buttonContent: "✋",
    title: `Drag tool (Alt+H or Alt+D)`,
    cursor: "pointer",
  },
  REORDER: {
    buttonContent: "🔀",
    title: `Reorder tool (Alt+R or Alt+S)`,
    cursor: "all-scroll",
  },
  ZOOM_IN: {
    buttonContent: "⬚🔍+",
    title: `Zoom-in tool (Alt+M)`,
    cursor: "zoom-in",
  },
  HIGHLIGHT: {
    buttonContent: "⛅",
    title: `Highlight tool (Alt+N)`,
    cursor: "ew-resize",
  },
  UNDO: {
    buttonContent: "⟲",
    title: `undo`,
    cursor: "pointer",
  },
  REDO: {
    title: "redo",
    buttonContent: "⟳",
    cursor: "pointer",
  },


};

ToolButtons.propTypes = {
  selectedTool: PropTypes.oneOf(Object.values(Tools)),
  onToolClicked: PropTypes.func.isRequired,
};
interface ToolButtonsProps {
  selectedTool: any;
  onToolClicked: any;
  allTools: any;
}
export function ToolButtons(props: ToolButtonsProps) {
  let buttons: Array<any> = [];
  for (let toolName in Tools) {
    const tool = Tools[toolName];
    buttons.push(
      <button
        key={toolName}
        title={tool.title}
        onClick={() => props.onToolClicked(tool)}
        className={`border border-gray-300 rounded-md p-2 mx-2 ${tool.isSelected ? "bg-gray-500" : ""}`}
      >
        {tool.buttonContent}
      </button>
    );
  }

  return <ButtonGroup buttons={buttons} />;
}
