import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CSSProperties, PropsWithChildren } from "react";
import type {
  DraggableSyntheticListeners,
  UniqueIdentifier,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import "./SortableItem.css";

interface Props {
  id: UniqueIdentifier;
  onMouseDown?: React.MouseEventHandler<HTMLDivElement>;
  onContextMenu?: React.MouseEventHandler<HTMLDivElement>;
  selectedTool: any;
}

interface Context {
  attributes: Record<string, any>;
  listeners: DraggableSyntheticListeners;
  ref(node: HTMLElement | null): void;
}

const SortableItemContext = createContext<Context>({
  attributes: {},
  listeners: undefined,
  ref() { },
});

export function SortableItem({
  children,
  id,
  onMouseDown,
  onContextMenu,
  selectedTool,
}: PropsWithChildren<Props>) {
  const [disableDnD, setDisableDnD] = useState(true);
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({ id, disabled: disableDnD });
  const context = useMemo(
    () => ({
      attributes,
      listeners,
      ref: setActivatorNodeRef,
    }),
    [attributes, listeners, setActivatorNodeRef]
  );
  const style: CSSProperties = {
    opacity: isDragging ? 0.4 : undefined,
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const handleMouseDown = (event) => {
    if (onMouseDown) {
      onMouseDown(event);
    }
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
    if (onContextMenu) {
      onContextMenu(event);
    }
  };
  useEffect(() => {
    if (!(selectedTool.title === 1 && selectedTool.isSelected)) {
      setDisableDnD(true);
    } else {
      setDisableDnD(false);
    }
  }, [selectedTool]);
  return (
    <SortableItemContext.Provider value={context}>
      <li
        className="SortableItem"
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
      >
        {children}
      </li>
    </SortableItemContext.Provider>
  );
}
