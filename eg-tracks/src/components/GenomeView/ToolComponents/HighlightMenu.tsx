import React, { useEffect, useState } from "react";
import ReactModal from "react-modal";
import DisplayedRegionModel from "../../../models/DisplayedRegionModel";
import ColorPicker from "../../../trackConfigs/config-menu-components.tsx/ColorPicker";
import "./HighlightMenu.css";

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
  highlights: HighlightInterval[];
  viewRegion: DisplayedRegionModel;
  showHighlightMenuModal: boolean;
  onNewRegion: (start: number, end: number, toolTitle: number | string) => void;
  onSetHighlights: any;
  selectedTool: any;
}

const HighlightMenu: React.FC<HighlightMenuProps> = ({
  highlights,
  viewRegion,
  showHighlightMenuModal,
  onNewRegion,
  onSetHighlights,
  selectedTool,
}) => {
  const handleHighlightIntervalUpdate = (
    doDelete: boolean,
    index: number,
    interval?: HighlightInterval
  ): void => {
    if (doDelete) {
      const newIntervals = [
        ...highlights.slice(0, index),
        ...highlights.slice(index + 1, highlights.length),
      ];
      onSetHighlights(newIntervals);
    } else {
      const newIntervals: any = [...highlights];
      newIntervals.splice(index, 1, interval);

      onSetHighlights(newIntervals);
    }
  };
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (selectedTool.title === 12) {
      setShowModal(true);
    }
  }, [selectedTool]);
  const handleViewRegionJump = (interval: HighlightInterval): void => {
    const { start, end } = interval;
    onNewRegion(start, end, "isJump");
  };
  const handleCloseModal = () => {
    setShowModal(false);
  };
  const highlightElements = highlights.length ? (
    highlights.map((item: HighlightInterval, index: number) => (
      <div key={index} style={{ margin: "1em" }}>
        <HighlightItem
          interval={item}
          index={index}
          onHandleHighlightIntervalUpdate={handleHighlightIntervalUpdate}
          onHandleViewRegionJump={handleViewRegionJump}
          viewRegion={viewRegion}
        />
      </div>
    ))
  ) : (
    <div
      style={{
        textAlign: "center",
        marginTop: "clamp(60px, 8vw, 120px)",
        color: "#3c4043",
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
    <>
      <ReactModal
        isOpen={showModal}
        onRequestClose={handleCloseModal}
        contentLabel="HighlightMenu"
        ariaHideApp={false}
        shouldCloseOnOverlayClick={true}
        style={{
          overlay: { backgroundColor: "rgba(111,107,101,0.3)", zIndex: 4 },
        }}
      >
        <div
          className="HighlightMenu"
          style={{ fontSize: "clamp(10px, 0.9vw, 16px)" }}
        >
          <h5 style={{ margin: "clamp(10px, 1vw, 20px)" }}>Highlights</h5>
          {highlights.length ? (
            <div style={{ paddingBottom: "clamp(3px, 0.4vw, 8px)" }}>
              <button
                onClick={() => {}}
                style={{
                  fontSize: "clamp(10px, 0.8vw, 14px)",
                  padding: "clamp(2px, 0.3vw, 6px)",
                }}
              >
                Remove all
              </button>
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {highlightElements}
          </div>
          <span
            className="text-right"
            style={{
              cursor: "pointer",
              color: "red",
              fontSize: "clamp(1.5em, 1.8vw, 2.5em)",
              position: "absolute",
              top: "clamp(-8px, -0.5vw, -3px)",
              right: "clamp(10px, 1vw, 20px)",
              zIndex: 2,
            }}
            onClick={() => {
              handleCloseModal();
            }}
          >
            ×
          </span>
        </div>
      </ReactModal>
    </>
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

  viewRegion: DisplayedRegionModel;
}

const HighlightItem: React.FC<HighlightItemProps> = ({
  interval,
  index,
  onHandleHighlightIntervalUpdate,
  onHandleViewRegionJump,
  viewRegion,
}) => {
  const navContext = viewRegion.getNavigationContext();

  return (
    <div
      style={{
        border: `2px solid ${interval.color}`,
        borderRadius: "clamp(8px, 1vw, 16px)",
        padding: "clamp(0.5em, 1vw, 1.5em)",
        fontSize: "clamp(10px, 0.9vw, 14px)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          value={interval.tag}
          onChange={(e) => {
            const newInterval = new HighlightInterval(
              interval.start,
              interval.end,
              e.target.value,
              interval.color
            );
            onHandleHighlightIntervalUpdate(false, index, newInterval);
          }}
          style={{
            flex: 1,
            marginRight: "clamp(0.5em, 1vw, 1.5em)",
            fontSize: "clamp(10px, 0.8vw, 14px)",
            padding: "clamp(2px, 0.3vw, 6px)",
          }}
        />
        <div className="highlight-item-buttons-group">
          <ColorPicker
            color={interval.color}
            disableAlpha={false}
            onChange={(color: any) => {
              const newColor = `rgba(${color.rgb.r}, ${color.rgb.g}, ${
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
        </div>
      </div>
      <div>
        <h5 style={{ fontSize: "clamp(12px, 1vw, 16px)" }}>
          {navContext
            .getLociInInterval(interval.start, interval.end)
            .toString()}
        </h5>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "clamp(0.5em, 1vw, 1.5em)",
          gap: "clamp(4px, 0.5vw, 8px)",
        }}
      >
        <button
          onClick={() => onHandleHighlightIntervalUpdate(true, index)}
          style={{
            fontSize: "clamp(10px, 0.8vw, 14px)",
            padding: "clamp(2px, 0.3vw, 6px)",
          }}
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
          style={{
            fontSize: "clamp(10px, 0.8vw, 14px)",
            padding: "clamp(2px, 0.3vw, 6px)",
          }}
        >
          {interval.display ? "Hide" : "Show"}
        </button>
        <button
          onClick={() => onHandleViewRegionJump(interval)}
          style={{
            fontSize: "clamp(10px, 0.8vw, 14px)",
            padding: "clamp(2px, 0.3vw, 6px)",
          }}
        >
          Jump
        </button>
      </div>
    </div>
  );
};

export default HighlightMenu;
