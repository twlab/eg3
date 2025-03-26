import React, { useState } from "react";
import { Box } from "grommet";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

import SortableItem from "./SortableItem";
export function createRange<T>(
  length: number,
  initializer: (index: number) => T
): T[] {
  return [...new Array(length)].map((_, index) => initializer(index));
}

const Drag = (props) => {
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    setActiveId(null);
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = props.items.indexOf(active.id);
      const newIndex = props.items.indexOf(over.id);
      const chrArr = arrayMove(props.items, oldIndex, newIndex);
      props.changeChrOrder(chrArr);
    }
  };

  return (
    <div style={{}}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
      >
        <Box
          flex={true}
          wrap={true}
          direction="row"
          style={{ maxWidth: "100%" }}
        >
          <SortableContext items={props.items} strategy={rectSortingStrategy}>
            {props.items.map((id) => (
              <SortableItem key={id} id={id} handle={true} value={id} />
            ))}
            <DragOverlay>
              {activeId ? (
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    backgroundColor: "red",
                  }}
                ></div>
              ) : null}
            </DragOverlay>
          </SortableContext>
        </Box>
      </DndContext>
    </div>
  );
};

export default Drag;
