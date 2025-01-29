import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box } from "grommet";
const SortableItem = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,

    border: "2px solid red",
    backgroundColor: "#cccccc",
    margin: "2px",
    zIndex: isDragging ? "100" : "auto",
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Box>
        <button
          style={{ height: "50px", width: "50px" }}
          {...listeners}
          {...attributes}
        >
          {props.value}
        </button>
      </Box>
    </div>
  );
};

export default SortableItem;
