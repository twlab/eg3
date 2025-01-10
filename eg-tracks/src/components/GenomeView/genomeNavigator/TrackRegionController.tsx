import React, { useState, useRef, useCallback, FC, KeyboardEvent } from "react";
import ReactModal from "react-modal";
import DisplayedRegionModel from "@eg/core/src/eg-lib/models/DisplayedRegionModel";
import GeneSearchBox from "./GeneSearchBox";
import { HighlightInterval } from "../ToolComponents/HighlightMenu";
import SnpSearchBox from "./SnpSearchBox";
import { CopyToClip } from "../TrackComponents/commonComponents/CopyToClipboard";
import Genome from "@eg/core/src/eg-lib/models/Genome";
import SnpSearch from "../SnpSearch";

const MODAL_STYLE = {
  content: {
    top: "50px",
    left: "295px",
    right: "unset",
    bottom: "unset",
    overflow: "visible",
    padding: "5px",
  },
  overlay: {
    backgroundColor: "rgba(111,107,101, 0.7)",
    zIndex: 4,
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
    isHighlight?: boolean
  ) => void;

  contentColorSetup: { color: string; background: string };
  virusBrowserMode?: boolean;
  genomeConfig: Genome;
  genomeArr: any[];
  genomeIdx: number;
  addGlobalState: any;
  trackManagerState: any;
}

const TrackRegionController: FC<TrackRegionControllerProps> = ({
  selectedRegion,
  onRegionSelected,

  contentColorSetup,
  virusBrowserMode,
  genomeConfig,

  addGlobalState,
  trackManagerState,
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
    onRegionSelected(parsedRegion!.start, parsedRegion.end, doHighlight);

    handleCloseModal();
  };

  const { color, background } = contentColorSetup;
  const content = { ...MODAL_STYLE.content, color, background };
  const coordinates = selectedRegion.currentRegionAsString();

  return (
    <div className="bg tool-element font-mono pl-2">
      <button className="btn btn-secondary underline" onClick={handleOpenModal}>
        {coordinates}
      </button>
      <ReactModal
        isOpen={showModal}
        contentLabel="Gene & Region search"
        ariaHideApp={false}
        onRequestClose={handleCloseModal}
        shouldCloseOnOverlayClick={true}
        style={{ ...MODAL_STYLE, content }}
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
      </ReactModal>
    </div>
  );
};

export default TrackRegionController;
