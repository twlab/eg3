import React from "react";
import PropTypes from "prop-types";
import ButtonGroup from "./ButtonGroup";

export const Tools = {
  DRAG: {
    buttonContent: "✋",
    title: `Drag tool
(Alt+H or Alt+D)`,
    cursor: "pointer",
  },
  REORDER: {
    buttonContent: "🔀",
    title: `Reorder tool
(Alt+R or Alt+S)`,
    cursor: "all-scroll",
  },
  ZOOM_IN: {
    buttonContent: "⬚🔍+",
    title: `Zoom-in tool
(Alt+M)`,
    cursor: "zoom-in",
  },
  HIGHLIGHT: {
    buttonContent: "⛅",
    title: `Highlight tool
(Alt+N)`,
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
    const className =
      tool === props.selectedTool ? "btn btn-primary" : "btn btn-light";
    buttons.push(
      <button
        key={toolName}
        className={className}
        title={tool.title}
        onClick={() => props.onToolClicked(tool)}
        style={{ margin: "0 10px", border: "1px solid black", padding: "5px" }}
      >
        {tool.buttonContent}
      </button>
    );
  }

  return <ButtonGroup label="Tools:" buttons={buttons} />;
}
