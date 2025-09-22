import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import { selectTool, setTool } from "@/lib/redux/slices/utilitySlice";

import {
  BoltIcon,
  LightBulbIcon,
  HandRaisedIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
  ArrowsUpDownIcon,

} from "@heroicons/react/24/outline";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SearchBar from "./SearchBar";
import { Tool } from "wuepgg3-track";
import HighlightMenu, { HighlightInterval } from "./HighlightMenu";

enum MagnifyingDirection {
  In,
  Out,
}
interface ToolbarProps {
  onNewRegionSelect: (
    start: number,
    end: number,
    highlightSearch?: boolean
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
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [hoveredMagnifyingDirection, setHoveredMagnifyingDirection] =
    useState<MagnifyingDirection | null>(null);

  // Helper functions for responsive sizing
  const getIconSize = () => {
    return Math.max(16, Math.min(24, (windowWidth || 1920) * 0.012));
  };

  const iconSizeStyle = {
    width: `${getIconSize()}px`,
    height: `${getIconSize()}px`,
  };

  const getButtonClass = (buttonTool?: Tool) => {
    return `hover:bg-gray-200 dark:hover:bg-dark-secondary rounded-md ${tool === buttonTool ? "bg-secondary dark:bg-dark-secondary" : ""
      }`;
  };

  const getButtonStyle = () => ({
    padding: `${buttonPadding}px`,
  });


  const handleToolClick = (selectedTool: Tool): any => {
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
            Math.min(15, (windowWidth || 1920) * 0.01)
          )}px`,
          gap: `${Math.max(8, Math.min(16, (windowWidth || 1920) * 0.008))}px`,
          padding: `${Math.max(
            6,
            Math.min(12, (windowWidth || 1920) * 0.006)
          )}px ${Math.max(8, Math.min(16, (windowWidth || 1920) * 0.008))}px`,
          borderRadius: `${Math.max(
            6,
            Math.min(10, (windowWidth || 1920) * 0.005)
          )}px`,
        }}
        animate={{
          opacity: 1,
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Search Bar */}

        <SearchBar
          isSearchFocused={isSearchFocused}
          onSearchFocusChange={setIsSearchFocused}
          onNewRegionSelect={onNewRegionSelect}
          windowWidth={windowWidth}
          fontSize={fontSize}
          buttonPadding={buttonPadding}
          gapSize={gapSize}
        />


        <div className="h-5 border-r border-gray-400" />
        {/* Toolbar Buttons */}
        <motion.div
          className="flex flex-row items-center"
          style={{ gap: gapSize }}
          animate={{
            opacity: isSearchFocused ? 0.5 : 1,
            scale: isSearchFocused ? 0.95 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="flex flex-row items-center"
            style={{ gap: gapSize }}
            animate={{
              opacity: hoveredMagnifyingDirection !== null ? 0 : 1,
              scale: hoveredMagnifyingDirection !== null ? 0.95 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={() => handleToolClick(Tool.Drag)}
              className={getButtonClass(Tool.Drag)}
              style={getButtonStyle()}
              title="Drag"
            >
              <HandRaisedIcon
                className="text-gray-600 dark:text-dark-primary"
                style={iconSizeStyle}
              />
            </button>

            <button
              onClick={() => handleToolClick(Tool.Zoom)}
              className={getButtonClass(Tool.Zoom)}
              style={getButtonStyle()}
              title="Zoom in Selected Area"
            >
              <span
                className="flex flex-row items-center justify-center text-gray-600 dark:text-dark-primary"
                style={{ fontSize: fontSize }}
              >
                <span>⬚</span>
                <span>+</span>
              </span>
            </button>
            <button
              onClick={() => handleToolClick(Tool.Reorder)}
              className={getButtonClass(Tool.Reorder)}
              style={getButtonStyle()}
              title="Re-order"
            >
              <ArrowsUpDownIcon
                className="text-gray-600 dark:text-dark-primary"
                style={iconSizeStyle}
              />
            </button>
            <button
              onClick={() => handleToolClick(Tool.ReorderMany)}
              className={getButtonClass(Tool.ReorderMany)}
              style={getButtonStyle()}
              title="Re-order Many"
            >
              <ArrowsUpDownIcon
                className="text-gray-600 dark:text-dark-primary"
                style={iconSizeStyle}
              />
            </button>

            <div className="h-full border-r border-gray-400" />
          </motion.div>

          <motion.div
            className="flex flex-row items-center"
            style={{ gap: gapSize }}
            animate={{
              opacity: hoveredMagnifyingDirection !== null ? 0 : 1,
              scale: hoveredMagnifyingDirection !== null ? 0.95 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={() => handleToolClick(Tool.PanLeft)}
              className={getButtonClass(Tool.PanLeft)}
              style={getButtonStyle()}
              title="Pan left"
            >
              <ArrowLeftCircleIcon
                className="text-gray-600 dark:text-dark-primary"
                style={iconSizeStyle}
              />
            </button>
          </motion.div>
          <motion.div
            className="relative"
            animate={{
              opacity:
                hoveredMagnifyingDirection === MagnifyingDirection.Out
                  ? 1
                  : hoveredMagnifyingDirection !== null
                    ? 0
                    : 1,
              scale:
                hoveredMagnifyingDirection === MagnifyingDirection.Out
                  ? 1
                  : hoveredMagnifyingDirection !== null
                    ? 0.95
                    : 1,
            }}
            transition={{ duration: 0.2 }}
            onMouseEnter={() =>
              setHoveredMagnifyingDirection(MagnifyingDirection.Out)
            }
            onMouseLeave={() => setHoveredMagnifyingDirection(null)}
          >
            <button
              className={
                getButtonClass() +
                ` relative rounded-none ${hoveredMagnifyingDirection === MagnifyingDirection.Out
                  ? "z-20"
                  : ""
                }`
              }
              style={getButtonStyle()}
              onClick={() => handleToolClick(Tool.ZoomOutOneFold)}
              title="Zoom out"
            >
              <MagnifyingGlassMinusIcon
                className="text-gray-600 dark:text-dark-primary"
                style={iconSizeStyle}
              />
            </button>
            <AnimatePresence>
              {hoveredMagnifyingDirection === MagnifyingDirection.Out && (
                <motion.div
                  className="absolute top-0 left-0 h-full border border-gray-secondary rounded-full flex flex-row justify-between items-center z-10"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "300%", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ translateX: "-100%" }}
                >
                  <button
                    onClick={() => handleToolClick(Tool.ZoomOutOneThirdFold)}
                    className={
                      getButtonClass() +
                      " text-gray-600 dark:text-dark-primary rounded-l-full pr-1 -mr-1 w-[33%] text-xs"
                    }
                  >
                    -⅓
                  </button>
                  <button
                    onClick={() => handleToolClick(Tool.ZoomOutOneFold)}
                    className={
                      getButtonClass() +
                      " text-gray-600 dark:text-dark-primary rounded-l-full pr-1 -mr-1 w-[33%] text-xs"
                    }
                  >
                    -1
                  </button>
                  <button
                    onClick={() => handleToolClick(Tool.ZoomOutFiveFold)}
                    className={
                      getButtonClass() +
                      " text-gray-600 dark:text-dark-primary rounded-r-full pl-1 -ml-1 w-[33%] text-xs"
                    }
                  >
                    -5
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            className="relative"
            animate={{
              opacity:
                hoveredMagnifyingDirection === MagnifyingDirection.In
                  ? 1
                  : hoveredMagnifyingDirection !== null
                    ? 0
                    : 1,
              scale:
                hoveredMagnifyingDirection === MagnifyingDirection.In
                  ? 1
                  : hoveredMagnifyingDirection !== null
                    ? 0.95
                    : 1,
            }}
            transition={{ duration: 0.2 }}
            onMouseEnter={() =>
              setHoveredMagnifyingDirection(MagnifyingDirection.In)
            }
            onMouseLeave={() => setHoveredMagnifyingDirection(null)}
          >
            <button
              className={
                getButtonClass() +
                ` relative rounded-none ${hoveredMagnifyingDirection === MagnifyingDirection.In
                  ? "z-20"
                  : ""
                }`
              }
              style={getButtonStyle()}
              onClick={() => handleToolClick(Tool.ZoomInOneFold)}
              title="Zoom in"
            >
              <MagnifyingGlassPlusIcon
                className="text-gray-600 dark:text-dark-primary"
                style={iconSizeStyle}
              />
            </button>
            <AnimatePresence>
              {hoveredMagnifyingDirection === MagnifyingDirection.In && (
                <motion.div
                  className="absolute top-0 left-0 h-full border border-gray-secondary rounded-full flex flex-row justify-between items-center z-10"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "300%", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ translateX: "30%" }}
                >
                  <button
                    onClick={() => handleToolClick(Tool.ZoomInOneThirdFold)}
                    className={
                      getButtonClass() +
                      " text-gray-600 dark:text-dark-primary rounded-l-full pr-1 -mr-1 w-[33%] text-xs"
                    }
                  >
                    +⅓
                  </button>
                  <button
                    onClick={() => handleToolClick(Tool.ZoomInOneFold)}
                    className={
                      getButtonClass() +
                      " text-gray-600 dark:text-dark-primary rounded-r-full pr-1 -mr-1 w-[33%] text-xs"
                    }
                  >
                    +1
                  </button>
                  <button
                    onClick={() => handleToolClick(Tool.ZoomInFiveFold)}
                    className={
                      getButtonClass() +
                      " text-gray-600 dark:text-dark-primary rounded-r-full pl-1 -ml-1 w-[33%] text-xs"
                    }
                  >
                    +5
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Navigation and tools */}
          <motion.div
            className="flex flex-row items-center"
            style={{ gap: gapSize }}
            animate={{
              opacity: hoveredMagnifyingDirection !== null ? 0 : 1,
              scale: hoveredMagnifyingDirection !== null ? 0.95 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={() => handleToolClick(Tool.PanRight)}
              className={getButtonClass(Tool.PanRight)}
              style={getButtonStyle()}
              title="Pan right"
            >
              <ArrowRightCircleIcon
                className="text-gray-600 dark:text-dark-primary"
                style={iconSizeStyle}
              />
            </button>
          </motion.div>

          <motion.div
            className="flex flex-row items-center relative"
            style={{ gap: gapSize }}
            animate={{
              opacity: hoveredMagnifyingDirection !== null ? 0 : 1,
              scale: hoveredMagnifyingDirection !== null ? 0.95 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={() => handleToolClick(Tool.Highlight)}
              className={getButtonClass(Tool.Highlight)}
              style={getButtonStyle()}
              title="Highlight"
            >
              <BoltIcon
                className="text-gray-600 dark:text-dark-primary"
                style={iconSizeStyle}
              />
            </button>
            <div className="relative">
              <button
                className={getButtonClass(Tool.highlightMenu)}
                style={getButtonStyle()}
                onClick={() => handleToolClick(Tool.highlightMenu)}
                title="Highlight list"
              >
                <LightBulbIcon
                  className="text-gray-600 dark:text-dark-primary"
                  style={iconSizeStyle}
                />
              </button>
              {tool === Tool.highlightMenu ? <HighlightMenu

                selectedTool={tool}
                onNewRegion={onNewRegionSelect}
                handleToolClick={handleToolClick}
              /> : ""}

            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Toolbar;
