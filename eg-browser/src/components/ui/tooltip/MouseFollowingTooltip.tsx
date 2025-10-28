import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import { selectTool, setTool } from "@/lib/redux/slices/utilitySlice";
import { Tool } from "wuepgg3-track";
import {
  selectCurrentSession,
  selectCurrentSessionId,
  updateCurrentSession,
} from "../../../lib/redux/slices/browserSlice";

interface MousePosition {
  x: number;
  y: number;
}

const MouseFollowingTooltip: React.FC = () => {
  const [mousePosition, setMousePosition] = useState<MousePosition>({
    x: 0,
    y: 0,
  });

  const currentSession = useAppSelector(selectCurrentSession);
  const sessionId = useAppSelector(selectCurrentSessionId);
  const selectedTool = useAppSelector(selectTool);
  const dispatch = useAppDispatch();

  // Check if any tracks are selected
  const hasSelectedTracks =
    currentSession?.tracks?.some((track) => track.isSelected) || false;

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
      if (e.key === "Escape") {
        // Clear tool selection
        if (selectedTool !== null) {
          dispatch(setTool(Tool.Drag));
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedTool, dispatch]);
  useEffect(() => {
    if (!sessionId) {
      dispatch(setTool(null));
    }
  }, [sessionId]);
  const toolName = getToolName(selectedTool);

  // Count selected tracks
  const selectedTracksCount =
    currentSession?.tracks?.filter((track) => track.isSelected).length || 0;

  // Only show tooltip when a tool is selected (excluding certain tools that shouldn't show tooltips)
  const shouldShow =
    selectedTool !== null &&
    selectedTool !== Tool.Drag &&
    selectedTool !== Tool.PanLeft &&
    selectedTool !== Tool.PanRight &&
    selectedTool !== Tool.ZoomOutFiveFold &&
    selectedTool !== Tool.ZoomOutOneFold &&
    selectedTool !== Tool.ZoomOutOneThirdFold &&
    selectedTool !== Tool.ZoomInOneThirdFold &&
    selectedTool !== Tool.ZoomInOneFold &&
    selectedTool !== Tool.ZoomInFiveFold &&
    toolName;

  return (
    <AnimatePresence>
      {shouldShow && sessionId && (
        <motion.div
          className="fixed z-[9999] pointer-events-none select-none"
          style={{
            left: mousePosition.x + 16,
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

      {/* Indicator for selected tracks */}
      {hasSelectedTracks && sessionId && (
        <motion.div
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[999] pointer-events-auto select-none cursor-pointer"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.9, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={() => {
            if (currentSession) {
              const updatedTracks = currentSession.tracks.map((track) => ({
                ...track,
                isSelected: false,
              }));

              dispatch(
                updateCurrentSession({
                  ...currentSession,
                  tracks: updatedTracks,
                })
              );
            }
          }}
        >
          <div
            className="px-2 py-1 shadow-lg transition-all hover:shadow-xl"
            style={{
              backgroundColor: "var(--background)",
              color: "var(--foreground)",
              border: "2px solid var(--foreground)",
            }}
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">
                  {selectedTracksCount} track
                  {selectedTracksCount !== 1 ? "s" : ""} selected
                </span>
                <span style={{ opacity: 0.5 }}>•</span>

                <span className="text-xs" style={{ opacity: 0.75 }}>
                  Press{" "}
                  <kbd
                    className="px-1.5 py-0.5 font-mono"
                    style={{
                      backgroundColor: "var(--foreground)",
                      color: "var(--background)",
                      opacity: 0.9,
                    }}
                  >
                    Esc
                  </kbd>{" "}
                  or click to clear
                </span>
              </div>
              <div className="text-xs" style={{ opacity: 0.6 }}>
                Hold{" "}
                <kbd
                  className="px-1 py-0.5 font-mono"
                  style={{
                    backgroundColor: "var(--foreground)",
                    color: "var(--background)",
                    opacity: 0.7,
                  }}
                >
                  Shift
                </kbd>{" "}
                +{" "}
                <kbd
                  className="px-1 py-0.5 font-mono"
                  style={{
                    backgroundColor: "var(--foreground)",
                    color: "var(--background)",
                    opacity: 0.7,
                  }}
                >
                  Left Click
                </kbd>{" "}
                a track to select multiple
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MouseFollowingTooltip;
