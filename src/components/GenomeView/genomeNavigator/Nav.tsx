import React, { useState, useCallback, FC, useEffect } from "react";
import ReactModal from "react-modal";
import { treeOfLife } from "@/models/genomes/allGenomes";
import { Button } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import AnnotationTrackUI from "../TrackTabComponent/AnnotationTrackUI";
import _ from "lodash";
import { getSpeciesInfo } from "@/models/genomes/allGenomes";
import TrackRegionController from "./TrackRegionController";
import TrackModel from "@/models/TrackModel";
import GenomePicker from "@/components/Home/GenomePicker";
import CustomTrackAdder from "../TrackTabComponent/CustomTrackAdder";
import SessionUI from "@/components/Home/SessionUI";
import "./Nav.css";
import { TrackState } from "../CommonTrackStateChangeFunctions.tsx/createNewTrackState";

interface NavProps {
  selectedRegion: any;
  onRegionSelected: any;

  state: TrackState;
  genomeConfig: any;
  onTracksAdded?: (tracks: TrackModel[]) => void;
  onTrackRemoved?: (track: TrackModel) => void;
  trackLegendWidth: number;
  isShowingNavigator?: boolean;
  darkTheme?: boolean;
  onGenomeSelected: (name: string) => void;
  onToggleNavigator?: () => void;
  addSessionState?: any;
  sessionArr?: any;
  onRetrieveBundle?: any;
}

const Nav: FC<NavProps> = ({
  state,
  genomeConfig,
  onTracksAdded,
  onTrackRemoved,
  selectedRegion,
  onRegionSelected,
  darkTheme,
  onRetrieveBundle,
  onGenomeSelected,
  addSessionState,
  sessionArr,
}) => {
  const [genomeModal, setGenomeModal] = useState(false);
  const [trackDropdownOpen, setTrackDropdownOpen] = useState(false);
  const [appDropdownOpen, setAppDropdownOpen] = useState(false);

  const handleGenomeOpenModal = () => setGenomeModal(true);
  const handleGenomeCloseModal = () => setGenomeModal(false);

  const handleGenomeSelected = (name: string) => {
    onGenomeSelected(name);
    handleGenomeCloseModal();
  };

  const toggleTrackDropdown = () => setTrackDropdownOpen(!trackDropdownOpen);
  const toggleAppDropdown = () => setAppDropdownOpen(!appDropdownOpen);

  function groupTrackByGenome() {
    const grouped = {};
    state.tracks.forEach((track) => {
      const gname = track.getMetadata("genome");
      const targeName = gname ? gname : genomeConfig.genome.getName();
      if (grouped[targeName]) {
        grouped[targeName].add(track.url || track.name);
      } else {
        grouped[targeName] = new Set([track.url || track.name]);
      }
    });
    return grouped;
  }

  const genomeName = genomeConfig.genome.getName();
  const { name, logo, color } = getSpeciesInfo(genomeName);
  const modalfg = "#222";
  const modalbg = "white";
  const tracksUrlSets = new Set([
    ...state.tracks.filter((track) => track.url).map((track) => track.url),
    ...state.tracks.filter((track) => !track.url).map((track) => track.name),
  ]);
  const groupedTrackSets = groupTrackByGenome();

  return (
    <div className="Nav-container bg">
      <div className="panel">
        <IconButton
          onClick={() => handleGenomeSelected("")}
          style={{ marginTop: "5px" }}
        >
          <ArrowBack />
        </IconButton>
        <div style={{ marginTop: "6px" }}>
          <span id="theVersion">v</span>
        </div>
        <div
          className="element Nav-genome Nav-center"
          style={{
            backgroundImage: `url(${logo})`,
            color: color,
            backgroundSize: "cover",
            marginTop: 10,
            marginBottom: 10,
            borderRadius: "0.25rem",
          }}
          onClick={handleGenomeOpenModal}
        >
          <span className="capitalize">{name}</span>{" "}
          <span className="italic">{genomeName}</span>
        </div>
        <ReactModal
          isOpen={genomeModal}
          ariaHideApp={false}
          contentLabel="genomeModal"
          onRequestClose={handleGenomeCloseModal}
          shouldCloseOnOverlayClick={true}
          style={{
            content: { color: modalfg, background: modalbg, zIndex: 5 },
            overlay: { backgroundColor: "rgba(111,107,101, 0.7)" },
          }}
        >
          <IconButton color="secondary" onClick={handleGenomeCloseModal}>
            <ArrowBack />
          </IconButton>
          <GenomePicker
            onGenomeSelected={handleGenomeSelected}
            selectedGenome={[]}
            treeOfLife={treeOfLife}
            addToView={handleGenomeSelected}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenomeCloseModal}
          >
            Close
          </Button>
        </ReactModal>
        <div className="element Nav-center">
          <TrackRegionController
            selectedRegion={selectedRegion}
            onRegionSelected={onRegionSelected}
            contentColorSetup={{ background: "white", color: "#222" }}
            genomeConfig={genomeConfig}
          />
        </div>
        <div
          className="element Nav-center btn-group"
          style={{ display: "flex" }}
        >
          <div className="dropdown">
            <button
              type="button"
              className="btn btn-primary"
              onClick={toggleTrackDropdown}
            >
              🎹 Tracks
            </button>
            <div
              className={`dropdown-menu ${trackDropdownOpen ? "show" : "hide"}`}
            >
              <ModalMenuItem
                itemLabel="Annotation Tracks"
                style={{ content: { color: modalfg, background: modalbg } }}
              >
                <AnnotationTrackUI
                  addedTracks={state.tracks}
                  onTracksAdded={onTracksAdded}
                  addedTrackSets={tracksUrlSets}
                  genomeConfig={genomeConfig}
                  groupedTrackSets={groupedTrackSets}
                />
              </ModalMenuItem>
              <ModalMenuItem
                itemLabel="Remote Tracks"
                style={{ content: { color: modalfg, background: modalbg } }}
              >
                <CustomTrackAdder
                  addedTracks={state.tracks}
                  onTracksAdded={onTracksAdded}
                  genomeConfig={genomeConfig}
                />
              </ModalMenuItem>
            </div>
          </div>
          <div className="dropdown" style={{ marginLeft: "10px" }}>
            <button
              type="button"
              className="btn btn-success"
              onClick={toggleAppDropdown}
            >
              🔧 Apps
            </button>
            <div
              className={`dropdown-menu ${appDropdownOpen ? "show" : "hide"}`}
            >
              <ModalMenuItem
                itemLabel="Session"
                style={{
                  content: {
                    right: "unset",
                    bottom: "unset",
                    overflow: "visible",
                    padding: "5px",
                    zIndex: 5,
                    color: modalfg,
                    background: modalbg,
                  },
                }}
              >
                <SessionUI
                  bundleId={state.bundleId}
                  state={state}
                  addSessionState={addSessionState}
                  sessionArr={sessionArr}
                  onRestoreSession={function (session: object): void {
                    throw new Error("Function not implemented.");
                  }}
                  onRetrieveBundle={onRetrieveBundle}
                />
              </ModalMenuItem>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DropdownOpenerProps {
  extraClassName?: string;
  label: string;
}

const DropdownOpener: FC<DropdownOpenerProps> = ({ extraClassName, label }) => {
  return (
    <button
      type="button"
      className={`btn ${extraClassName}`}
      data-toggle="dropdown"
      aria-haspopup="true"
      aria-expanded="false"
    >
      {label}
    </button>
  );
};

interface ModalMenuItemProps {
  itemLabel: string;
  itemClassName?: string;
  style?: ReactModal.Styles;
  children: React.ReactNode;
}

const ModalMenuItem: FC<ModalMenuItemProps> = ({
  itemLabel,
  itemClassName = "dropdown-item",
  style,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleOpen = useCallback(() => setIsOpen(!isOpen), [isOpen]);

  const finalStyle = {
    overlay: { backgroundColor: "rgba(111,107,101, 0.7)", zIndex: 4 },
    ...style,
  };

  return (
    <>
      <div className={itemClassName} onClick={toggleOpen}>
        {itemLabel}
      </div>
      <ReactModal
        isOpen={isOpen}
        ariaHideApp={false}
        onRequestClose={toggleOpen}
        shouldCloseOnOverlayClick
        style={finalStyle}
      >
        <ModalCloseButton onClick={toggleOpen} />
        {children}
      </ReactModal>
    </>
  );
};

const ModalCloseButton: FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <span
      className="text-right"
      style={{
        cursor: "pointer",
        color: "red",
        fontSize: "2em",
        position: "absolute",
        top: "-5px",
        right: "15px",
        zIndex: 5,
      }}
      onClick={onClick}
    >
      ×
    </span>
  );
};

export default Nav;
