import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import { selectTool, setTool } from "@/lib/redux/slices/utilitySlice";
import { Tool } from "wuepgg3-track";

interface MousePosition {
  x: number;
  y: number;
}

const MouseFollowingTooltip: React.FC = () => {
  const [mousePosition, setMousePosition] = useState<MousePosition>({
    x: 0,
    y: 0,
  });
  const selectedTool = useAppSelector(selectTool);
  const dispatch = useAppDispatch();

  // Get tool name for display
  const getToolName = (tool: Tool | null): string | null => {
    switch (tool) {
      case Tool.Drag:
        return "Drag Tool";
      case Tool.Zoom:
        return "Zoom Tool";
      case Tool.Reorder:
        return "Reorder Tool";
      case Tool.ReorderMany:
        return "Reorder Many Tool";
      case Tool.PanLeft:
        return "Pan Left";
      case Tool.PanRight:
        return "Pan Right";
      case Tool.ZoomOutFiveFold:
        return "Zoom Out 5x";
      case Tool.ZoomOutOneFold:
        return "Zoom Out 1x";
      case Tool.ZoomOutOneThirdFold:
        return "Zoom Out ⅓";
      case Tool.ZoomInOneThirdFold:
        return "Zoom In ⅓";
      case Tool.ZoomInOneFold:
        return "Zoom In 1x";
      case Tool.ZoomInFiveFold:
        return "Zoom In 5x";
      case Tool.Highlight:
        return "Highlight Tool";
      case Tool.highlightMenu:
        return "Highlight Menu";
      default:
        return null;
    }
  };

  // Track mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedTool !== null) {
        dispatch(setTool(Tool.Drag));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedTool, dispatch]);

  const toolName = getToolName(selectedTool);

  // Only show tooltip when a tool is selected (and not the default Drag tool)
  const shouldShow =
    selectedTool !== null && selectedTool !== Tool.Drag && toolName;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          className="fixed z-[9999] pointer-events-none select-none"
          style={{
            left: mousePosition.x + 15,
            top: mousePosition.y - 10,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">
            <div className="flex flex-col gap-1">
              <span>{toolName}</span>
              <span className="text-xs opacity-60">Press Esc to unselect</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MouseFollowingTooltip;
