import React from "react";
import type { ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
} from "@dnd-kit/core";
import type { UniqueIdentifier } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import "./SortableList.css";
import { SortableItem } from "./SortableItem";

interface BaseItem {
  id: UniqueIdentifier;
}

interface Props<T extends BaseItem> {
  items: T[];
  onChange(items: T[]): void;
  renderItem(item: T): ReactNode;
  selectedTracks?: any;
}

export function SortableList<T extends BaseItem>({
  items,
  onChange,
  renderItem,
  selectedTracks,
}: Props<T>) {
  const pointerSensor = useSensor(PointerSensor);
  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });

  const sensors = [pointerSensor, keyboardSensor];

  return (
    <div>
      <DndContext
        sensors={sensors}
        onDragEnd={({ active, over }) => {
          if (over && active.id !== over.id) {
            const activeIndex = items.findIndex(({ id }) => id === active.id);
            const overIndex = items.findIndex(({ id }) => id === over.id);

            // Collect ids of items to be moved
            const selectedItems = items.filter(
              (item) => item.trackModel.isSelected
            );

            if (selectedItems.length > 0) {
              const nonSelectedItems = items.filter(
                (item) => !item.trackModel.isSelected
              );

              const newItemsArray = [
                ...nonSelectedItems.slice(0, overIndex),
                ...selectedItems,
                ...nonSelectedItems.slice(overIndex),
              ];

              onChange(newItemsArray);
            } else {
              onChange(arrayMove(items, activeIndex, overIndex));
            }
          }
        }}
      >
        <SortableContext items={items}>
          <ul
            className="SortableList"
            role="application"
            style={{ padding: 0, margin: 0 }}
          >
            {items.map((item) => (
              <React.Fragment key={item.id}>{renderItem(item)}</React.Fragment>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

SortableList.Item = SortableItem;
