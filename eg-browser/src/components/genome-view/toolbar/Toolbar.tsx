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
  ArrowPathRoundedSquareIcon
} from "@heroicons/react/24/outline";
import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  const currentSession = useAppSelector(selectCurrentSession);
  const _genomeConfig = useCurrentGenome();
  const genomeConfig = useMemo(() => {
    return _genomeConfig ? GenomeSerializer.deserialize(_genomeConfig) : null;
  }, [_genomeConfig]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey) {
        switch (event.key.toLowerCase()) {
          case 'h':
          case 'd':
            event.preventDefault();
            handleToolClick(Tool.Drag);
            break;
          case 'r':
          case 's':
            event.preventDefault();
            handleToolClick(Tool.Reorder);
            break;
          case 'm':
            event.preventDefault();
            handleToolClick(Tool.Zoom);
            break;
          case 'n':
            event.preventDefault();
            handleToolClick(Tool.Highlight);
            break;
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        handleToolClick(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
    return `hover:bg-gray-200 dark:hover:bg-dark-secondary rounded-md ${tool === buttonTool ? "bg-secondary dark:bg-dark-secondary" : ""
      }`;
  };

  const getButtonStyle = () => ({
    padding: `${buttonPadding}px`,
  });

  const handleToolClick = (selectedTool: Tool | null): any => {
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
              style={getButtonStyle()}
              title="Drag tool
(Alt+H or Alt+D)"
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
              title="Zoom-in tool
(Alt+M)"
            >
              <span
                className="flex flex-row items-center justify-center text-gray-600 dark:text-dark-primary"
                style={iconSizeStyle}
              >
                <span>⬚</span>
                <span>+</span>
              </span>
            </button>
            <button
              onClick={() => handleToolClick(Tool.Reorder)}
              className={getButtonClass(Tool.Reorder)}
              style={getButtonStyle()}
              title="Reorder tool
(Alt+R or Alt+S)"
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
              <ArrowPathRoundedSquareIcon
                className="text-gray-600 dark:text-dark-primary"
                style={iconSizeStyle}
              />
            </button>

            <div className="h-full border-r border-gray-400" />

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

            <button
              onClick={() => handleToolClick(Tool.ZoomOutFiveFold)}
              className={getButtonClass(Tool.ZoomOutFiveFold)}
              style={getButtonStyle()}
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
              onClick={() => handleToolClick(Tool.ZoomOutOneFold)}
              className={getButtonClass(Tool.ZoomOutOneFold)}
              style={getButtonStyle()}
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
              onClick={() => handleToolClick(Tool.ZoomOutOneThirdFold)}
              className={getButtonClass(Tool.ZoomOutOneThirdFold)}
              style={getButtonStyle()}
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
              onClick={() => handleToolClick(Tool.ZoomInOneThirdFold)}
              className={getButtonClass(Tool.ZoomInOneThirdFold)}
              style={getButtonStyle()}
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
              onClick={() => handleToolClick(Tool.ZoomInOneFold)}
              className={getButtonClass(Tool.ZoomInOneFold)}
              style={getButtonStyle()}
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
              onClick={() => handleToolClick(Tool.ZoomInFiveFold)}
              className={getButtonClass(Tool.ZoomInFiveFold)}
              style={getButtonStyle()}
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


            <button
              onClick={() => handleToolClick(Tool.Highlight)}
              className={getButtonClass(Tool.Highlight)}
              style={getButtonStyle()}
              title="Highlight tool
(Alt+N)"
            >
              <BoltIcon
                className="text-gray-600 dark:text-dark-primary"
                style={iconSizeStyle}
              />
            </button>

            <button
              className={getButtonClass(Tool.highlightMenu)}
              style={{
                ...getButtonStyle(),
                display: "flex",
                alignItems: "center",
              }}
              onClick={() => handleToolClick(Tool.highlightMenu)}
              title="Highlight list"
            >
              <LightBulbIcon
                className="text-gray-600 dark:text-dark-primary"
                style={iconSizeStyle}
              />
            </button>
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
