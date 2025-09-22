import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./HighlightMenu.css";
import {
  selectCurrentSession,
  updateCurrentSession,
} from "@/lib/redux/slices/browserSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { ColorPicker } from "wuepgg3-track";

export class HighlightInterval {
  start: number;
  end: number;
  display: boolean;
  color: string;
  tag: string;
  constructor(
    start: number,
    end: number,
    tag: string = "",
    color: string = "rgba(255,255,0, 0.3)",
    display: boolean = true
  ) {
    this.start = start;
    this.end = end;
    this.tag = tag;
    this.color = color;
    this.display = display;
  }
}

interface HighlightMenuProps {
  genomeConfig: any;
  selectedTool: any;
  onNewRegion: (start: number, end: number) => void;
  handleToolClick: (tool: any) => void;
  windowWidth: number;
}

const HighlightMenu: React.FC<HighlightMenuProps> = ({
  onNewRegion,
  handleToolClick,
  genomeConfig,
  windowWidth,
}) => {
  const dispatch = useAppDispatch();

  const currentSession = useAppSelector(selectCurrentSession);

  const handleHighlightIntervalUpdate = (
    doDelete: boolean,
    index: number,
    interval?: HighlightInterval
  ): void => {
    if (!currentSession) return;

    if (doDelete) {
      const newIntervals = [
        ...currentSession.highlights.slice(0, index),
        ...currentSession.highlights.slice(
          index + 1,
          currentSession.highlights.length
        ),
      ];

      dispatch(updateCurrentSession({ highlights: newIntervals }));
    } else {
      const newIntervals: any = [...currentSession.highlights];
      newIntervals.splice(index, 1, interval);

      dispatch(updateCurrentSession({ highlights: newIntervals }));
    }
  };

  const handleViewRegionJump = (interval: HighlightInterval): void => {
    const { start, end } = interval;
    onNewRegion(start, end);
  };

  const handleCloseModal = () => {
    handleToolClick(null);
  };

  const highlightElements = currentSession?.highlights?.length ? (
    <ol style={{ display: "flex", flexDirection: "column", gap: "0.2em" }}>
      {currentSession.highlights.map(
        (item: HighlightInterval, index: number) => (
          <HighlightItem
            key={index}
            interval={item}
            index={index}
            onHandleHighlightIntervalUpdate={handleHighlightIntervalUpdate}
            onHandleViewRegionJump={handleViewRegionJump}
            genomeConfig={genomeConfig}
          />
        )
      )}
    </ol>
  ) : (
    <div
      style={{
        textAlign: "center",
        color: "#3c4043",
        display: "flex", // Added flexbox for centering
        flexDirection: "column", // Ensure vertical alignment
        alignItems: "center", // Center horizontally
        justifyContent: "center", // Center vertically
      }}
    >
      <img
        src="/browser/img/favicon-144.png"
        alt="Browser Icon"
        style={{
          height: "clamp(80px, 10vw, 150px)",
          width: "auto",
          marginLeft: "clamp(15px, 1.5vw, 25px)",
          marginRight: "clamp(15px, 1.5vw, 25px)",
        }}
      />
      <h4 style={{ fontSize: "clamp(14px, 1.2vw, 20px)" }}>No highlights</h4>
      <h5
        style={{
          width: "clamp(300px, 40vw, 500px)",
          textAlign: "center",
          fontSize: "clamp(12px, 1vw, 16px)",
        }}
      >
        Select a region with the highlight tool and it will show up here.
      </h5>
    </div>
  );

  return (
    <div className="relative">
      <AnimatePresence>
        <motion.div
          className="absolute top-full left-0 mt-4 bg-white border border-gray-300 rounded-lg shadow-lg z-50 overflow-y-auto"
          style={{
            left: `-${windowWidth / 2.5}px`,
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
              <h5 className="font-semibold text-gray-800">Highlights</h5>
              <div className="flex gap-2">
                {(currentSession?.highlights?.length ?? 0) > 0 && (
                  <button
                    onClick={() =>
                      dispatch(updateCurrentSession({ highlights: [] }))
                    }
                    className="px-3 py-1 text-sm border-2 border-blue-500 text-blue-500 bg-transparent rounded hover:bg-blue-50 transition-colors"
                  >
                    Remove all
                  </button>
                )}
                <button
                  onClick={handleCloseModal}
                  className="px-3 py-1 text-sm border-2 border-red-500 text-red-500 bg-transparent rounded hover:bg-red-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            <div>{highlightElements}</div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

interface HighlightItemProps {
  interval: HighlightInterval;
  onHandleHighlightIntervalUpdate: (
    doDelete: boolean,
    index: number,
    interval?: HighlightInterval
  ) => void;
  onHandleViewRegionJump: (interval: HighlightInterval) => void;
  index: number;

  genomeConfig: any;
}

const HighlightItem: React.FC<HighlightItemProps> = ({
  interval,
  index,
  onHandleHighlightIntervalUpdate,
  onHandleViewRegionJump,
  genomeConfig,
}) => {
  const navContext = genomeConfig.navContext;

  return (
    <li
      style={{
        border: `2px solid ${interval.color}`,
        borderRadius: "clamp(4px, 0.5vw, 8px)",
        padding: "clamp(0.5em, 1vw, 1.5em)",
        fontSize: "clamp(10px, 0.9vw, 14px)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        // gap: "clamp(4px, 0.5vw, 8px)",
      }}
    >
      <span>
        {navContext.getLociInInterval(interval.start, interval.end).toString()}
      </span>
      <div style={{ display: "flex", gap: "clamp(4px, 0.5vw, 8px)" }}>
        <ColorPicker
          color={interval.color}
          disableAlpha={false}
          onChange={(color: any) => {
            const newColor = `rgba(${color.rgb.r}, ${color.rgb.g},
              color.rgb.b
            }, ${0.15})`;
            const newInterval = new HighlightInterval(
              interval.start,
              interval.end,
              interval.tag,
              newColor
            );
            onHandleHighlightIntervalUpdate(false, index, newInterval);
          }}
        />
        <button
          onClick={() => onHandleHighlightIntervalUpdate(true, index)}
          style={{ fontSize: "clamp(10px, 0.8vw, 14px)" }}
        >
          Delete
        </button>
        <button
          onClick={() => {
            const newInterval = new HighlightInterval(
              interval.start,
              interval.end,
              interval.tag,
              interval.color,
              !interval.display
            );
            onHandleHighlightIntervalUpdate(false, index, newInterval);
          }}
          style={{ fontSize: "clamp(10px, 0.8vw, 14px)" }}
        >
          {interval.display ? "Hide" : "Show"}
        </button>
        <button
          onClick={() => onHandleViewRegionJump(interval)}
          style={{ fontSize: "clamp(10px, 0.8vw, 14px)" }}
        >
          Jump
        </button>
      </div>
    </li>
  );
};

export default HighlightMenu;
