import React, { useEffect, useState } from "react";
import ReactModal from "react-modal";
import DisplayedRegionModel from "@eg/core/src/eg-lib/models/DisplayedRegionModel";
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
  onNewRegion: (start: number, end: number) => void;
  onSetHighlights: any;
  selectedTool: any;
}

const HighlightMenu: React.FC<HighlightMenuProps> = ({
  highlights,
  viewRegion,
  showHighlightMenuModal,
  onNewRegion,
  onSetHighlights,
  selectedTool
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
  }, [selectedTool])
  const handleViewRegionJump = (interval: HighlightInterval): void => {
    const { start, end } = interval;
    onNewRegion(start, end);
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
    <div style={{ textAlign: "center", marginTop: 100, color: "#3c4043" }}>
      <img
        src="https://epigenomegateway.wustl.edu/browser/favicon-144.png"
        alt="Browser Icon"
        style={{ height: 125, width: "auto", marginLeft: 20, marginRight: 20 }}
      />
      <h4>No highlights</h4>
      <h5 style={{ width: "50vh", textAlign: "center" }}>
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
        <div className="HighlightMenu">
          <h5 style={{ margin: 15 }}>Highlights</h5>
          {highlights.length ? (
            <div style={{ paddingBottom: "5px" }}>
              <button onClick={() => { }}>Remove all</button>
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
              fontSize: "2em",
              position: "absolute",
              top: "-5px",
              right: "15px",
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
        borderRadius: 12,
        padding: "1em",
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
          style={{ flex: 1, marginRight: "1em" }}
        />
        <div className="highlight-item-buttons-group">
          <ColorPicker
            color={interval.color}
            disableAlpha={false}
            onChange={(color: any) => {
              const newColor = `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b
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
        <h5>
          {navContext
            .getLociInInterval(interval.start, interval.end)
            .toString()}
        </h5>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "1em",
        }}
      >
        <button onClick={() => onHandleHighlightIntervalUpdate(true, index)}>
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
        >
          {interval.display ? "Hide" : "Show"}
        </button>
        <button onClick={() => onHandleViewRegionJump(interval)}>Jump</button>
      </div>
    </div>
  );
};

export default HighlightMenu;
