import { useAppSelector, useAppDispatch, useUndoRedo } from "@/lib/redux/hooks";
import { selectTool, setTool } from "@/lib/redux/slices/utilitySlice";
import {
  selectNavigationTab,
  selectSessionPanelOpen,
  setNavigationTab,
} from "@/lib/redux/slices/navigationSlice";
import { selectCurrentState } from "@/lib/redux/selectors";

import {
  BoltIcon,
  LightBulbIcon,
  HandRaisedIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
  ArrowsUpDownIcon,
  ArrowPathRoundedSquareIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
} from "@heroicons/react/24/outline";
import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "../../ui/button/Button";
import IconButton from "../../ui/button/IconButton";
import History from "../../navbar/History";
import SearchBar from "./SearchBar";
import { GenomeSerializer, Tool } from "wuepgg3-track";
import HighlightMenu from "./HighlightMenu";
import useCurrentGenome from "../../../lib/hooks/useCurrentGenome";
import ReorderMany from "./ReorderMany";
import { selectCurrentSession } from "../../../lib/redux/slices/browserSlice";
interface ToolbarProps {
  onNewRegionSelect: (
    start: number,
    end: number,
    highlightSearch?: boolean,
  ) => void;
  windowWidth?: number;
  buttonPadding?: number;
  gapSize?: number;
  fontSize?: number;
  viewRegion?: any;
}
const Toolbar: React.FC<ToolbarProps> = ({
  onNewRegionSelect,
  windowWidth,
  gapSize = 8,
  fontSize = 16,
  buttonPadding = 6,
}) => {
  const tool = useAppSelector(selectTool);
  const dispatch = useAppDispatch();
  const currentSession = useAppSelector(selectCurrentSession);

  const currentState = useAppSelector(selectCurrentState);
  const sessionPanelOpen = useAppSelector(selectSessionPanelOpen);
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    jumpToPast,
    jumpToFuture,
    clearHistory,
  } = useUndoRedo();
  const _genomeConfig = useCurrentGenome();
  const genomeConfig = useMemo(() => {
    return _genomeConfig ? GenomeSerializer.deserialize(_genomeConfig) : null;
  }, [_genomeConfig]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey) {
        switch (event.key.toLowerCase()) {
          case "h":
          case "d":
            event.preventDefault();
            handleToolClick(Tool.Drag);
            break;
          case "r":
          case "s":
            event.preventDefault();
            handleToolClick(Tool.Reorder);
            break;
          case "m":
            event.preventDefault();
            handleToolClick(Tool.Zoom);
            break;
          case "n":
            event.preventDefault();
            handleToolClick(Tool.Highlight);
            break;
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        handleToolClick(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tool, dispatch]);

  // Helper functions for responsive sizing
  const getIconSize = () => {
    return Math.max(16, Math.min(24, (windowWidth || 1920) * 0.012));
  };

  const iconSizeStyle = {
    width: `${getIconSize()}px`,
    height: `${getIconSize()}px`,
  };

  const getButtonClass = (buttonTool?: Tool) => {
    return `hover:bg-gray-300 dark:hover:bg-dark-secondary active:bg-gray-400 dark:active:bg-gray-600 rounded-md transition-colors duration-150 cursor-pointer ${
      tool === buttonTool ? "bg-gray-300 dark:bg-dark-secondary" : ""
    }`;
  };

  const handleToolClick = (selectedTool: Tool | null): any => {
    console.log(tool, selectedTool);
    if (tool === selectedTool) {
      dispatch(setTool(null));
    } else {
      dispatch(setTool(selectedTool));
    }
  };

  return (
    <div className="flex flex-row ">
      {/* Combined Search Bar and Toolbar Container */}
      <motion.div
        className="bg-white/80 dark:bg-dark-background/80 backdrop-blur-md flex flex-row items-center"
        style={{
          height: `${Math.max(
            30,
            Math.min(15, (windowWidth || 1920) * 0.01),
          )}px`,
          // gap: `${Math.max(8, Math.min(16, (windowWidth || 1920) * 0.008))}px`,
          // padding: `${Math.max(
          //   6,
          //   Math.min(12, (windowWidth || 1920) * 0.006)
          // )}px ${Math.max(8, Math.min(16, (windowWidth || 1920) * 0.008))}px`,
          borderRadius: `${Math.max(
            6,
            Math.min(10, (windowWidth || 1920) * 0.005),
          )}px`,
        }}
        animate={{
          opacity: 1,
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Toolbar Buttons */}
        <motion.div
          className="flex flex-row items-center"
          // animate={{
          //   opacity: isSearchFocused ? 0.5 : 1,
          //   scale: isSearchFocused ? 0.95 : 1,
          // }}
          // transition={{ duration: 0.2 }}
        >
          <motion.div
            className="flex flex-row items-center"
            style={{ gap: gapSize }}
          >
            <button
              onClick={() => handleToolClick(Tool.Drag)}
              className={getButtonClass(Tool.Drag)}
              style={{ padding: "7px 8px" }}
              title="Drag tool
(Alt+H or Alt+D)"
            >
              <span
                className="text-gray-600 dark:text-dark-primary flex items-center justify-center"
                style={{ ...iconSizeStyle, fontSize: `${fontSize}px` }}
              >
                ✋
              </span>
            </button>
            <button
              onClick={() => handleToolClick(Tool.Reorder)}
              className={getButtonClass(Tool.Reorder)}
              style={{ padding: "9px" }}
              title="Reorder tool
(Alt+R or Alt+S)"
            >
              <span
                className="text-gray-600 dark:text-dark-primary flex items-center justify-center"
                style={{ ...iconSizeStyle, fontSize: `${fontSize}px` }}
              >
                🔀
              </span>
            </button>
            <button
              onClick={() => handleToolClick(Tool.Zoom)}
              className={getButtonClass(Tool.Zoom)}
              style={{ padding: "7px 8px" }}
              title="Zoom-in tool
(Alt+M)"
            >
              <span
                className="flex flex-row items-center justify-center text-gray-600 dark:text-dark-primary"
                style={{
                  height: `${getIconSize()}px`,
                  fontSize: `${Math.round(fontSize * 0.9)}px`,
                  gap: 0,
                }}
              >
                <span>⬚</span>
                <span style={{ marginLeft: "-1px" }}>🔍</span>
                <span style={{ marginLeft: "-2px" }}>+</span>
              </span>
            </button>

            <button
              onClick={() => handleToolClick(Tool.Highlight)}
              className={getButtonClass(Tool.Highlight)}
              style={{ padding: "7px 8px" }}
              title="Highlight tool (Alt+N)"
            >
              <span
                className="text-gray-600 dark:text-dark-primary flex items-center justify-center"
                style={{ ...iconSizeStyle, fontSize: `${fontSize}px` }}
              >
                ⛅
              </span>
            </button>

            <button
              onClick={() => handleToolClick(Tool.ReorderMany)}
              className={getButtonClass(Tool.ReorderMany)}
              style={{ padding: "7px 8px" }}
              title="Re-order Many"
            >
              <span
                className="text-gray-600 dark:text-dark-primary flex items-center justify-center"
                style={{ ...iconSizeStyle, fontSize: `${fontSize}px` }}
              >
                🔃
              </span>
            </button>

            <div className="h-full border-r border-gray-400" />

            <div className="flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
              <button
                onClick={() => handleToolClick(Tool.PanLeft)}
                className={`${getButtonClass(Tool.PanLeft)} border-r border-gray-300 dark:border-gray-600 !rounded-none`}
                style={{ padding: "7px 8px" }}
                title="Pan left"
              >
                <span
                  className="text-gray-600 dark:text-dark-primary flex items-center justify-center"
                  style={{ ...iconSizeStyle, fontSize: `${fontSize}px` }}
                >
                  ◀
                </span>
              </button>
              <button
                onClick={() => handleToolClick(Tool.ZoomInFiveFold)}
                className={`${getButtonClass(Tool.ZoomInFiveFold)} border-r border-gray-300 dark:border-gray-600 !rounded-none`}
                style={{ padding: "7px 8px" }}
                title="Zoom in 5x"
              >
                <span
                  className="text-gray-600 dark:text-dark-primary flex items-center justify-center"
                  style={{ ...iconSizeStyle, fontSize: `${fontSize}px` }}
                >
                  +5
                </span>
              </button>
              <button
                onClick={() => handleToolClick(Tool.ZoomInOneFold)}
                className={`${getButtonClass(Tool.ZoomInOneFold)} border-r border-gray-300 dark:border-gray-600 !rounded-none`}
                style={{ padding: "7px 8px" }}
                title="Zoom in 1x"
              >
                <span
                  className="text-gray-600 dark:text-dark-primary flex items-center justify-center"
                  style={{ ...iconSizeStyle, fontSize: `${fontSize}px` }}
                >
                  +1
                </span>
              </button>
              <button
                onClick={() => handleToolClick(Tool.ZoomInOneThirdFold)}
                className={`${getButtonClass(Tool.ZoomInOneThirdFold)} border-r border-gray-300 dark:border-gray-600 !rounded-none`}
                style={{ padding: "7px 8px" }}
                title="Zoom in ⅓"
              >
                <span
                  className="text-gray-600 dark:text-dark-primary flex items-center justify-center"
                  style={{ ...iconSizeStyle, fontSize: `${fontSize}px` }}
                >
                  +⅓
                </span>
              </button>
              <button
                onClick={() => handleToolClick(Tool.ZoomOutOneThirdFold)}
                className={`${getButtonClass(Tool.ZoomOutOneThirdFold)} border-r border-gray-300 dark:border-gray-600 !rounded-none`}
                style={{ padding: "7px 8px" }}
                title="Zoom out ⅓"
              >
                <span
                  className="text-gray-600 dark:text-dark-primary flex items-center justify-center"
                  style={{ ...iconSizeStyle, fontSize: `${fontSize}px` }}
                >
                  -⅓
                </span>
              </button>
              <button
                onClick={() => handleToolClick(Tool.ZoomOutOneFold)}
                className={`${getButtonClass(Tool.ZoomOutOneFold)} border-r border-gray-300 dark:border-gray-600 !rounded-none`}
                style={{ padding: "7px 8px" }}
                title="Zoom out 1x"
              >
                <span
                  className="text-gray-600 dark:text-dark-primary flex items-center justify-center"
                  style={{ ...iconSizeStyle, fontSize: `${fontSize}px` }}
                >
                  -1
                </span>
              </button>
              <button
                onClick={() => handleToolClick(Tool.ZoomOutFiveFold)}
                className={`${getButtonClass(Tool.ZoomOutFiveFold)} border-r border-gray-300 dark:border-gray-600 !rounded-none`}
                style={{ padding: "7px 8px" }}
                title="Zoom out 5x"
              >
                <span
                  className="text-gray-600 dark:text-dark-primary flex items-center justify-center"
                  style={{ ...iconSizeStyle, fontSize: `${fontSize}px` }}
                >
                  -5
                </span>
              </button>
              <button
                onClick={() => handleToolClick(Tool.PanRight)}
                className={`${getButtonClass(Tool.PanRight)} !rounded-none`}
                style={{ padding: "7px 8px" }}
                title="Pan right"
              >
                <span
                  className="text-gray-600 dark:text-dark-primary flex items-center justify-center"
                  style={{ ...iconSizeStyle, fontSize: `${fontSize}px` }}
                >
                  ▶
                </span>
              </button>
            </div>

            <div className="h-full border-r border-gray-400" />

            {currentSession !== null && (
              <>
                <IconButton
                  onClick={undo}
                  disabled={!canUndo}
                  title="Undo"
                  className={`hover:bg-gray-300 dark:hover:bg-dark-secondary active:bg-gray-400 transition-colors duration-150 !rounded-md ${!canUndo ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <span
                    className="text-gray-600 dark:text-dark-primary flex items-center justify-center"
                    style={{ ...iconSizeStyle, fontSize: `${fontSize}px` }}
                  >
                    ⟲
                  </span>
                </IconButton>
                <IconButton
                  onClick={redo}
                  disabled={!canRedo}
                  title="Redo"
                  className={`hover:bg-gray-300 dark:hover:bg-dark-secondary active:bg-gray-400 transition-colors duration-150 !rounded-md ${!canRedo ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <span
                    className="text-gray-600 dark:text-dark-primary flex items-center justify-center"
                    style={{ ...iconSizeStyle, fontSize: `${fontSize}px` }}
                  >
                    ⟳
                  </span>
                </IconButton>
                <History
                  state={{
                    past: currentState ? currentState.past : [],
                    future: currentState ? currentState.future : [],
                  }}
                  jumpToPast={jumpToPast}
                  jumpToFuture={jumpToFuture}
                  clearHistory={clearHistory}
                />
              </>
            )}

            <IconButton
              onClick={() => handleToolClick(Tool.highlightMenu)}
              title="Highlight list"
              className={`${getButtonClass(Tool.highlightMenu)} !rounded-md`}
            >
              <span
                className="text-gray-600 dark:text-dark-primary flex items-center justify-center"
                style={{ ...iconSizeStyle, fontSize: `${fontSize}px` }}
              >
                ⚡
              </span>
            </IconButton>
          </motion.div>

          {tool === Tool.highlightMenu ? (
            <HighlightMenu
              selectedTool={tool}
              onNewRegion={onNewRegionSelect}
              handleToolClick={handleToolClick}
              genomeConfig={genomeConfig}
              windowWidth={windowWidth ? windowWidth : 400}
            />
          ) : null}

          {tool === Tool.ReorderMany ? (
            <ReorderMany
              tracks={currentSession ? currentSession.tracks : []}
              handleToolClick={handleToolClick}
              windowWidth={windowWidth ? windowWidth : 400}
            />
          ) : (
            ""
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Toolbar;
