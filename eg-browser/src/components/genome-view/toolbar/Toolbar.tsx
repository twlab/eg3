import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import { selectTool, setTool } from "@/lib/redux/slices/utilitySlice";

import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ArrowsUpDownIcon,
  BookOpenIcon,
  ClockIcon,
  HandRaisedIcon,
  MagnifyingGlassIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  PaintBrushIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SearchBar from "./SearchBar";
import { Tool } from "@eg/tracks";

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
  highlights: Array<any>;
  onNewHighlight: (highlightState: Array<any>) => void;
}
const Toolbar: React.FC<ToolbarProps> = ({ onNewRegionSelect }) => {
  const tool = useAppSelector(selectTool);
  const dispatch = useAppDispatch();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [hoveredMagnifyingDirection, setHoveredMagnifyingDirection] =
    useState<MagnifyingDirection | null>(null);

  const getButtonClass = (buttonTool?: Tool) => {
    return `p-1.5 ${tool === buttonTool ? "bg-secondary" : ""} ${
      tool !== buttonTool ? "hover:bg-gray-200" : ""
    } rounded-md`;
  };
  const handleToolClick = (selectedTool: Tool): any => {
    if (tool === selectedTool) {
      dispatch(setTool(null));
    } else {
      dispatch(setTool(selectedTool));
    }
  };

  return (
    <motion.div
      className="bg-white/80 backdrop-blur-md flex p-1 m-1.5"
      animate={{
        gap: isSearchFocused ? 0 : "0.5rem",
      }}
      transition={{ duration: 0.2 }}
    >
      <SearchBar
        isSearchFocused={isSearchFocused}
        onSearchFocusChange={setIsSearchFocused}
        onNewRegionSelect={onNewRegionSelect}
      />

      <motion.div
        className="flex flex-row items-center gap-1.5"
        animate={{
          height: isSearchFocused ? 0 : "auto",
          opacity: isSearchFocused ? 0 : 1,
        }}
        transition={{ duration: 0.2 }}
        style={{ overflow: "hidden" }}
      >
        <motion.div
          className="flex flex-row items-center gap-1.5"
          animate={{
            opacity: hoveredMagnifyingDirection !== null ? 0 : 1,
            scale: hoveredMagnifyingDirection !== null ? 0.95 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          <button
            onClick={() => handleToolClick(Tool.Drag)}
            className={getButtonClass(Tool.Drag)}
            title="Drag"
          >
            <HandRaisedIcon className="size-6 text-gray-600" />
          </button>

          <button
            onClick={() => handleToolClick(Tool.Zoom)}
            className={getButtonClass(Tool.Zoom)}
            title="Zoom out"
          >
            <MagnifyingGlassIcon className="size-6 text-gray-600" />
          </button>
          <button
            onClick={() => handleToolClick(Tool.Highlight)}
            className={getButtonClass(Tool.Highlight)}
            title="Highlight region"
          >
            <PaintBrushIcon className="size-6 text-gray-600" />
          </button>

          <div className="h-full border-r border-gray-400" />
        </motion.div>

        <motion.div
          className="self-stretch w-[1px] border-r border-gray-400"
          animate={{
            opacity: hoveredMagnifyingDirection !== null ? 0 : 1,
            scale: hoveredMagnifyingDirection !== null ? 0.95 : 1,
          }}
          transition={{ duration: 0.2 }}
        />
        <motion.div
          className="flex flex-row items-center gap-1.5"
          animate={{
            opacity: hoveredMagnifyingDirection !== null ? 0 : 1,
            scale: hoveredMagnifyingDirection !== null ? 0.95 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          <button
            onClick={() => handleToolClick(Tool.PanLeft)}
            className={getButtonClass(Tool.PanLeft)}
            title="Pan Left"
          >
            <ChevronDoubleLeftIcon className="size-6 text-gray-600" />
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
              ` relative rounded-none ${
                hoveredMagnifyingDirection === MagnifyingDirection.Out
                  ? "z-20"
                  : ""
              }`
            }
            title="Zoom out"
          >
            <MagnifyingGlassMinusIcon className="size-6 text-gray-600" />
          </button>
          <AnimatePresence>
            {hoveredMagnifyingDirection === MagnifyingDirection.Out && (
              <motion.div
                className="absolute top-0 left-0 h-full border border-gray-secondary rounded-full flex flex-row justify-between items-center z-10"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "350%", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ translateX: "-100%" }}
              >
                <button
                  onClick={() => handleToolClick(Tool.ZoomOutOneThirdFold)}
                  className={
                    getButtonClass() +
                    " text-gray-600 rounded-l-full pr-1.5 -mr-1.5 w-[33%]"
                  }
                >
                  -⅓
                </button>
                <button
                  onClick={() => handleToolClick(Tool.ZoomOutOneFold)}
                  className={
                    getButtonClass() +
                    " text-gray-600 rounded-l-full pr-1.5 -mr-1.5 w-[33%]"
                  }
                >
                  -1
                </button>
                <button
                  onClick={() => handleToolClick(Tool.ZoomOutFiveFold)}
                  className={
                    getButtonClass() +
                    " text-gray-600 rounded-r-full pl-1.5 -ml-1.5 w-[33%]"
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
              ` relative rounded-none ${
                hoveredMagnifyingDirection === MagnifyingDirection.In
                  ? "z-20"
                  : ""
              }`
            }
            title="Zoom in"
          >
            <MagnifyingGlassPlusIcon className="size-6 text-gray-600" />
          </button>
          <AnimatePresence>
            {hoveredMagnifyingDirection === MagnifyingDirection.In && (
              <motion.div
                className="absolute top-0 left-0 h-full border border-gray-secondary rounded-full flex flex-row justify-between items-center z-10"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "350%", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ translateX: "30%" }}
              >
                <button
                  onClick={() => handleToolClick(Tool.ZoomInOneThirdFold)}
                  className={
                    getButtonClass() +
                    " text-gray-600 rounded-l-full pr-1.5 -mr-1.5 w-[33%]"
                  }
                >
                  +⅓
                </button>
                <button
                  onClick={() => handleToolClick(Tool.ZoomInOneFold)}
                  className={
                    getButtonClass() +
                    " text-gray-600 rounded-r-full pr-1.5 -mr-1.5 w-[33%]"
                  }
                >
                  +1
                </button>
                <button
                  onClick={() => handleToolClick(Tool.ZoomInFiveFold)}
                  className={
                    getButtonClass() +
                    " text-gray-600 rounded-r-full pl-1.5 -ml-1.5 w-[33%]"
                  }
                >
                  +5
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        <motion.div
          className="flex flex-row items-center gap-1.5"
          animate={{
            opacity: hoveredMagnifyingDirection !== null ? 0 : 1,
            scale: hoveredMagnifyingDirection !== null ? 0.95 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          <button
            onClick={() => handleToolClick(Tool.PanRight)}
            className={getButtonClass(Tool.PanRight)}
            title="Pan Right"
          >
            <ChevronDoubleRightIcon className="size-6 text-gray-600" />
          </button>
        </motion.div>
        <motion.div
          className="self-stretch w-[1px] border-r border-gray-400"
          animate={{
            opacity: hoveredMagnifyingDirection !== null ? 0 : 1,
            scale: hoveredMagnifyingDirection !== null ? 0.95 : 1,
          }}
          transition={{ duration: 0.2 }}
        />

        <motion.div
          className="flex flex-row items-center gap-1.5"
          animate={{
            opacity: hoveredMagnifyingDirection !== null ? 0 : 1,
            scale: hoveredMagnifyingDirection !== null ? 0.95 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          <div className="h-full border-r border-gray-400" />
          {/* <button
            onClick={() => handleToolClick(Tool.Drag)}
            className={getButtonClass(Tool.Drag)}
            title="Drag"
          >
            <HandRaisedIcon className="size-6 text-gray-600" />
          </button> */}
          {/* <button className={getButtonClass()} title="Zoom in">
            <ClockIcon className="size-6 text-gray-600" />
          </button> */}
          <button
            onClick={() => handleToolClick(Tool.Reorder)}
            className={getButtonClass(Tool.Reorder)}
            title="Reorder tracks"
          >
            <ArrowsUpDownIcon className="size-6 text-gray-600" />
          </button>
          <button
            className={getButtonClass()}
            onClick={() => handleToolClick(Tool.highlightMenu)}
            title="Highlight Menu"
          >
            <BookOpenIcon className="size-6 text-gray-600" />
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Toolbar;
