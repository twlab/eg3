import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { updateCurrentSession } from "../../../lib/redux/slices/browserSlice";
import { useAppDispatch } from "../../../lib/redux/hooks";
import { ITrackModel } from "wuepgg3-track";

interface ReorderManyProps {
  tracks: ITrackModel[];
  windowWidth: number;
  handleToolClick: (tool: any) => void;
}

// Sortable Item Component using @dnd-kit
interface SortableItemProps {
  id: string;
  track: ITrackModel;
  index: number;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, track, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: "#e5e5e5",
    cursor: "move",
    opacity: isDragging ? 0.5 : 1,
    padding: "0px 4px",
    border: "1px solid #ccc",
    borderRadius: "1px",
    display: "flex",
    alignItems: "flex-start",
    fontSize: "16px",
  };

  const textStyle: React.CSSProperties = track.options?.color
    ? { color: track.options.color }
    : {};

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <span style={{ ...textStyle, marginRight: "8px" }}>
        {`${index + 1}.`}
      </span>
      <span style={textStyle}>
        {track.options && track.options.label
          ? `${track.options.label}`
          : "Untitled"}
        {track.type && ` (${track.type})`}
      </span>
    </div>
  );
};

// Custom Slider Component
interface CustomSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  windowWidth: number;
}

const CustomSlider: React.FC<CustomSliderProps> = ({
  value,
  onChange,
  min,
  max,
  windowWidth,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const roundedValue = Math.round(parseFloat(e.target.value)); // Ensure the value is an integer
    onChange(roundedValue);
  };

  return (
    <div
      style={{
        width: `${windowWidth / 2}px`,
        marginTop: "20px",
        marginBottom: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <span>{min}</span>
        <span>Columns: {value}</span>
        <span>{max}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
        style={{
          width: "100%",
          height: "8px",
          borderRadius: "5px",
          background: "#ddd",
          outline: "none",
        }}
      />
    </div>
  );
};

// Grid Container Component
interface GridProps {
  items: ITrackModel[];
  colNum: number;
}

const Grid: React.FC<GridProps> = ({ items, colNum }) => {
  const gridStyles: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${colNum}, 1fr)`,
    gap: "4px",
    padding: "5px",
  };

  return (
    <div style={gridStyles}>
      {items.map((track, index) => (
        <SortableItem
          key={
            track.id || `track-${track.type}-${track.options?.label || index}`
          }
          id={`item-${index}`}
          track={track}
          index={index}
        />
      ))}
    </div>
  );
};

const ReorderMany: React.FC<ReorderManyProps> = ({
  tracks,
  handleToolClick,
  windowWidth,
}) => {
  const dispatch = useAppDispatch();
  const [items, setItems] = useState<ITrackModel[]>([]);
  const [columnCount, setColumnCount] = useState<number>(1);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setItems([...tracks]);
  }, [tracks]);

  const handleCloseModal = () => {
    handleToolClick(null);
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(
        (_, index) => `item-${index}` === active.id
      );
      const newIndex = items.findIndex(
        (_, index) => `item-${index}` === over.id
      );

      setItems((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

  const handleColumnChange = (value: number) => {
    setColumnCount(value);
  };

  return (
    <div className="relative">
      <AnimatePresence>
        <motion.div
          className="absolute top-full left-0 mt-4 bg-white border border-gray-300 rounded-lg shadow-lg z-50 overflow-y-auto"
          style={{
            left: `-${windowWidth / 3.2}px`,
            // width: `${windowWidth / 2}px`,
            maxHeight: "500px",
            maxWidth: `${windowWidth}px`,
          }} // Adjusted left alignment
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <div className="p-4">
            <div
              className="flex items-center justify-between mb-3"
              style={{ width: `${windowWidth / 2}px`, fontSize: "16px" }}
            >
              <h5 className="font-semibold text-gray-800">
                Please drag and drop to re-order your tracks. Press the apply
                button after you are done.
              </h5>
              <div className="flex gap-4">
                <button
                  onClick={() =>
                    dispatch(updateCurrentSession({ tracks: items }))
                  }
                  className="px-3 py-1 text-sm border-2 border-blue-500 text-blue-500 bg-transparent rounded hover:bg-blue-50 transition-colors"
                >
                  Apply
                </button>
                <button
                  onClick={handleCloseModal}
                  className="px-3 py-1 text-sm border-2 border-red-500 text-red-500 bg-transparent rounded hover:bg-red-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            <CustomSlider
              value={columnCount}
              onChange={handleColumnChange}
              min={1}
              max={20}
              windowWidth={windowWidth}
            />

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((_, index) => `item-${index}`)}
                strategy={rectSortingStrategy}
              >
                <Grid items={items} colNum={columnCount} />
              </SortableContext>
            </DndContext>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ReorderMany;
