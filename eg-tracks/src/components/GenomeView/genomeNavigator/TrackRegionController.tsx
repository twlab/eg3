import React, { useState, useRef, useCallback, FC, KeyboardEvent } from "react";
import ReactDOM from "react-dom";
import DisplayedRegionModel from "../../../models/DisplayedRegionModel";
import GeneSearchBox from "./GeneSearchBox";

import SnpSearchBox from "./SnpSearchBox";
import { CopyToClip } from "../TrackComponents/commonComponents/CopyToClipboard";
import Genome from "../../../models/Genome";
import { parse } from "path";

const MODAL_STYLE = {
  content: {
    position: "fixed" as const,
    top: "50px",
    left: "40%",
    right: "unset",
    bottom: "unset",
    overflow: "visible",
    padding: "5px",
    borderRadius: "4px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  overlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(111,107,101, 0.7)",
    zIndex: 9999,
    display: "flex" as const,
  },
};

const X_BUTTON_STYLE: React.CSSProperties = {
  cursor: "pointer",
  color: "red",
  fontSize: "2em",
  position: "absolute",
  top: "-5px",
  right: "15px",
};

interface TrackRegionControllerProps {
  selectedRegion: DisplayedRegionModel; // The current view of the genome navigator
  onRegionSelected: (
    newStart: number,
    newEnd: number,
    toolTitle: number | string,
    highlightSearch: boolean
  ) => void;

  contentColorSetup: { color: string; background: string };
  virusBrowserMode?: boolean;
  genomeConfig: Genome;
  genomeArr: any[];
  genomeIdx: number;
  addGlobalState: any;
  trackManagerState: any;
  windowWidth?: number;
  fontSize?: number;
  padding?: number;
}

const TrackRegionController: FC<TrackRegionControllerProps> = ({
  selectedRegion,
  onRegionSelected,
  contentColorSetup,
  virusBrowserMode,
  genomeConfig,
  windowWidth = 800,
  fontSize,
  padding,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [badInputMessage, setBadInputMessage] = useState("");
  const [doHighlight, setDoHighlight] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const handleHighlightToggle = () => {
    setDoHighlight((prev) => !prev);
  };

  const keyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      parseRegion();
    }
  };

  const parseRegion = () => {
    const navContext = selectedRegion.getNavigationContext();
    let parsedRegion;

    try {
      parsedRegion = navContext.parse(inputRef.current?.value || "");
    } catch (error) {
      if (error instanceof RangeError) {
        setBadInputMessage(error.message);
        return;
      } else {
        throw error;
      }
    }

    // Parsing successful
    if (badInputMessage) {
      setBadInputMessage("");
    }
    onRegionSelected(
      parsedRegion ? parsedRegion.start : selectedRegion._startBase,
      parsedRegion ? parsedRegion.end : selectedRegion._endBase,
      "isJump",
      doHighlight
    );

    handleCloseModal();
  };

  const { color, background } = contentColorSetup;
  const content = { ...MODAL_STYLE.content, color, background };
  const coordinates = selectedRegion.currentRegionAsString();

  return (
    <div
      className="bg tool-element"
      style={{
        fontSize: `${fontSize || Math.max(11, Math.min(15, windowWidth * 0.009))
          }px`,
        paddingLeft: padding ? padding : 5,
      }}
    >
      <button
        onClick={handleOpenModal}
        style={{
          fontSize: `${fontSize || Math.max(11, Math.min(15, windowWidth * 0.009))
            }px`,
          cursor: "pointer",
          background: "none",
          border: "none",
          color: "inherit",
          fontFamily: "inherit",
          padding: "2px 6px",
          borderRadius: "6px",
          transition: "background-color 0.15s ease",
          textDecoration: "underline",

          transform: "translateY(.5px)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        {coordinates}
      </button>
      {showModal && ReactDOM.createPortal(
        <div
          style={MODAL_STYLE.overlay}
          onClick={handleCloseModal}
          role="dialog"
          aria-label="Gene & Region search"
        >
          <div
            style={{ ...MODAL_STYLE.content, color, background }}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className="text-right"
              style={X_BUTTON_STYLE}
              onClick={handleCloseModal}
            >
              ×
            </span>
            <div>
              <span>
                Highlight search{" "}
                <input
                  type="checkbox"
                  name="do-highlight"
                  checked={doHighlight}
                  onChange={handleHighlightToggle}
                />
              </span>
            </div>
            <h6>Gene search</h6>
            <GeneSearchBox
              navContext={selectedRegion.getNavigationContext()}
              onRegionSelected={onRegionSelected}
              doHighlight={doHighlight}
              handleCloseModal={handleCloseModal}
              color={color}
              background={background}
              genomeConfig={genomeConfig}
            />
            {!virusBrowserMode && (
              <>
                <h6 style={{ marginTop: "5px" }}>SNP search</h6>
                <SnpSearchBox
                  navContext={selectedRegion.getNavigationContext()}
                  onRegionSelected={onRegionSelected}
                  handleCloseModal={handleCloseModal}
                  color={color}
                  background={background}
                  doHighlight={doHighlight}
                  genomeConfig={genomeConfig}
                />
              </>
            )}
            <h6>
              Region search (current region is {coordinates}{" "}
              <CopyToClip value={coordinates} />)
            </h6>
            <input
              ref={inputRef}
              type="text"
              size={30}
              placeholder="Coordinate"
              onKeyDown={keyPress}
              style={{
                padding: "6px 8px",
                border: "1px solid #e2e8f0",
                borderRadius: "4px",
              }}
            />
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginLeft: "2px" }}
              onClick={parseRegion}
            >
              Go
            </button>
            {badInputMessage && (
              <span className="alert-danger">{badInputMessage}</span>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TrackRegionController;
