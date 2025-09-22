import React, { useState, useEffect } from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
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
import {
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * a component to drag and drop tracks using @dnd-kit
 * @author Daofeng Li
 */

// TypeScript interfaces
interface TrackOptions {
    color?: string;
}

interface Track {
    label: string;
    type: string;
    options?: TrackOptions;
}

interface ReorderManyProps {
    tracks: Track[];
    showReorderManyModal: boolean;
    onOpenReorderManyModal: () => void;
    onCloseReorderManyModal: () => void;
    onTracksChange: (tracks: Track[]) => void;
}

// Sortable Item Component using @dnd-kit
interface SortableItemProps {
    id: string;
    track: Track;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, track }) => {
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
        height: "24px",
        backgroundColor: "#e5e5e5",
        cursor: "move",
        opacity: isDragging ? 0.5 : 1,
        padding: "2px 8px",
        border: "1px solid #ccc",
        borderRadius: "2px",
        display: "flex",
        alignItems: "center",
    };

    const textStyle: React.CSSProperties = track.options?.color ? { color: track.options.color } : {};

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <span style={textStyle}>
                {track.label} ({track.type})
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
}

const CustomSlider: React.FC<CustomSliderProps> = ({ value, onChange, min, max }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(parseInt(e.target.value, 10));
    };

    return (
        <div style={{ width: "100%", marginTop: "20px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
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
    items: Track[];
    colNum: number;
}

const Grid: React.FC<GridProps> = ({ items, colNum }) => {
    const gridStyles: React.CSSProperties = {
        display: "grid",
        gridTemplateColumns: `repeat(${colNum}, 1fr)`,
        gap: "8px",
        padding: "10px",
    };

    return (
        <div style={gridStyles}>
            {items.map((track, index) => (
                <SortableItem key={`item-${index}`} id={`item-${index}`} track={track} />
            ))}
        </div>
    );
};

const ReorderMany: React.FC<ReorderManyProps> = ({
    tracks,

    selectedTool,
    onTracksChange,
}) => {
    const [items, setItems] = useState<Track[]>([]);
    const [columnCount, setColumnCount] = useState<number>(4);
    const [showTab, setShowTab] = useState<boolean>(false);
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        setItems([...tracks]);
    }, [tracks]);
    useEffect(() => {
        if (selectedTool.title === 13) {
            setShowTab(true);
        }
        else {
            setShowTab(false);
        }

    }, [selectedTool]);

    const handleCloseModal = () => {
        setShowTab(false);
    };
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((item, index) => `item-${index}` === active.id);
            const newIndex = items.findIndex((item, index) => `item-${index}` === over.id);

            setItems((items) => arrayMove(items, oldIndex, newIndex));
        }
    };

    const handleColumnChange = (value: number) => {
        setColumnCount(value);
    };


    return (
        <div className="relative">
            <AnimatePresence>
                {showTab === true && (
                    <motion.div
                        className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[600px]"
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h5 className="text-xl font-semibold text-gray-800">
                                    Please drag and drop to re-order your tracks. Press the apply button after you are done.
                                </h5>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onTracksChange(items)}
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

                            <p className="mb-3 text-sm text-gray-600">You can adjust column numbers using the slider below:</p>

                            <CustomSlider
                                value={columnCount}
                                onChange={handleColumnChange}
                                min={1}
                                max={20}
                            />

                            <div className="max-h-80 overflow-y-auto">
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
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReorderMany;
