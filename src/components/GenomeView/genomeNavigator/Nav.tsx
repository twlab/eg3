import React, { useState, useCallback, FC, useEffect } from "react";
import ReactModal from "react-modal";
import { treeOfLife } from "@/models/genomes/allGenomes";
import { Button } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import AnnotationTrackUI from "../TabComponents/AnnotationTrackUI";
import _ from "lodash";
import { getSpeciesInfo } from "@/models/genomes/allGenomes";
import TrackRegionController from "./TrackRegionController";
import TrackModel from "@/models/TrackModel";
import GenomePicker from "@/components/Home/GenomePicker";
import CustomTrackAdder from "../TabComponents/CustomTrackAdder";
import SessionUI from "@/components/Home/SessionUI";
import "./Nav.css";
import { TrackState } from "../TrackComponents/CommonTrackStateChangeFunctions.tsx/createNewTrackState";
import HubPane from "../TabComponents/HubPane";
import FacetTableUI from "../TabComponents/FacetTableUI";
import RegionSetSelector from "../TabComponents/RegionSetSelector/RegionSetSelector";
import Geneplot from "../TabComponents/Geneplot/Geneplot";
import ScatterPlot from "../TabComponents/Geneplot/ScatterPlot";
import ShareUI from "../TabComponents/ShareUI";
import { HotKeyInfo } from "../TabComponents/HotKeyInfo";
import { TrackUpload } from "../TabComponents/TrackUpload";

interface NavProps {
  selectedRegion: any;
  onRegionSelected: any;

  state: TrackState;
  genomeConfig: any;
  onTracksAdded?: (tracks: TrackModel[]) => void;
  onTrackRemoved?: any;
  trackLegendWidth: number;
  isShowingNavigator: boolean;
  darkTheme?: boolean;
  onGenomeSelected: (name: string) => void;
  onToggleNavigator?: () => void;
  onHubUpdated: any;
  onRestoreSession: any;
  addSessionState?: any;
  bundle?: any;
  onRetrieveBundle?: any;
  curBundle?: any;
  publicTracksPool: Array<any>;
  customTracksPool: Array<any>;
  addTermToMetaSets: any;
  onSetSelected: any;
  onSetsChanged: any;
  sets: Array<any>;
  selectedSet: any;
  onTabSettingsChange: any;
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
  onRestoreSession,
  addSessionState,
  bundle,
  onHubUpdated,
  curBundle,
  publicTracksPool,
  addTermToMetaSets,
  customTracksPool,
  onSetSelected,
  onSetsChanged,
  sets,
  selectedSet,
  onTabSettingsChange,
  trackLegendWidth,
  isShowingNavigator,
}) => {
  const [genomeModal, setGenomeModal] = useState(false);
  const [trackDropdownOpen, setTrackDropdownOpen] = useState(false);
  const [appDropdownOpen, setAppDropdownOpen] = useState(false);
  const [settingDropdownOpen, setSettingDropdownOpen] = useState(false);
  const [helpDropDownOpen, setHelpDropDownOpen] = useState(false);
  const [share, setShare] = useState(false);
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [switchNavigatorChecked, setSwitchNavigatorChecked] = useState(true);
  const [cacheToggleChecked, setCacheToggleChecked] = useState(true);
  const [legendWidth, setLegendWidth] = useState("120");

  const handleGenomeOpenModal = () => setGenomeModal(true);
  const handleGenomeCloseModal = () => setGenomeModal(false);

  const handleGenomeSelected = (name: string) => {
    onGenomeSelected(name);
    handleGenomeCloseModal();
  };

  const toggleTrackDropdown = () => setTrackDropdownOpen(!trackDropdownOpen);
  const toggleAppDropdown = () => setAppDropdownOpen(!appDropdownOpen);
  const toggleHelpDropdown = () => setHelpDropDownOpen(!helpDropDownOpen);

  const toggleShare = () => setShare(!share);

  const toggleSettingDropdown = () =>
    setSettingDropdownOpen(!settingDropdownOpen);

  useEffect(() => {
    setLegendWidth(`${trackLegendWidth}`);
  }, [trackLegendWidth]);
  useEffect(() => {
    setSwitchNavigatorChecked(isShowingNavigator);
  }, [isShowingNavigator]);

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
  const handleCheckboxChange = (event) => {
    const { id, checked } = event.target;
    console.log(`${id} is ${checked ? "checked" : "not checked"}`);

    if (id === "switchNavigator") {
      setSwitchNavigatorChecked(checked);
    } else if (id === "cacheToggle") {
      setCacheToggleChecked(checked);
    }
    onTabSettingsChange({ type: id, val: checked });
  };

  const handleChange = (event) => {
    setLegendWidth(event.target.value);
    let numVal = Number(event.target.value);
    if (numVal >= 60) {
      onTabSettingsChange({ type: event.target.id, val: numVal });
    }
  };
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
                isOpen={openModal === "Annotation Tracks"}
                onOpen={() => setOpenModal("Annotation Tracks")}
                onClose={() => setOpenModal(null)}
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
                itemLabel="Public Data Hubs"
                isOpen={openModal === "Public Data Hubs"}
                onOpen={() => setOpenModal("Public Data Hubs")}
                onClose={() => setOpenModal(null)}
                style={{
                  content: {
                    color: modalfg,
                    background: modalbg,
                  },
                }}
              >
                <HubPane
                  addedTracks={state.tracks}
                  onTracksAdded={onTracksAdded}
                  addTermToMetaSets={addTermToMetaSets}
                  onHubUpdated={onHubUpdated}
                  publicTracksPool={publicTracksPool}
                  publicHubs={genomeConfig.publicHubList}
                  publicTrackSets={undefined}
                  addedTrackSets={tracksUrlSets}
                  contentColorSetup={{ color: modalfg, background: modalbg }}
                  genomeConfig={genomeConfig}
                />
              </ModalMenuItem>
              <ModalMenuItem
                itemLabel="Track Facet Table"
                isOpen={openModal === "Track Facet Table"}
                onOpen={() => setOpenModal("Track Facet Table")}
                onClose={() => setOpenModal(null)}
                style={{
                  content: {
                    color: modalfg,
                    background: modalbg,
                  },
                }}
              >
                <FacetTableUI
                  publicTracksPool={publicTracksPool}
                  customTracksPool={customTracksPool}
                  addedTracks={state.tracks}
                  onTracksAdded={onTracksAdded}
                  addTermToMetaSets={addTermToMetaSets}
                  addedTrackSets={tracksUrlSets}
                  contentColorSetup={{
                    color: modalfg,
                    background: modalbg,
                  }}
                />
              </ModalMenuItem>

              <ModalMenuItem
                itemLabel="Remote Tracks"
                isOpen={openModal === "Remote Tracks"}
                onOpen={() => setOpenModal("Remote Tracks")}
                onClose={() => setOpenModal(null)}
                style={{ content: { color: modalfg, background: modalbg } }}
              >
                <CustomTrackAdder
                  addedTracks={state.tracks}
                  onTracksAdded={onTracksAdded}
                  genomeConfig={genomeConfig}
                  onHubUpdated={onHubUpdated}
                  customTracksPool={customTracksPool}
                  addTermToMetaSets={addTermToMetaSets}
                  addedTrackSets={tracksUrlSets}
                  contentColorSetup={{
                    color: modalfg,
                    background: modalbg,
                  }}
                />
              </ModalMenuItem>

              <ModalMenuItem
                itemLabel="Local Tracks"
                isOpen={openModal === "Local Tracks"}
                onOpen={() => setOpenModal("Local Tracks")}
                onClose={() => setOpenModal(null)}
                style={{ content: { color: modalfg, background: modalbg } }}
              >
                <TrackUpload onTracksAdded={onTracksAdded} />
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
                itemLabel="Region Set View"
                isOpen={openModal === "Region Set View"}
                onOpen={() => setOpenModal("Region Set View")}
                onClose={() => setOpenModal(null)}
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
                <RegionSetSelector
                  genome={genomeConfig.genome}
                  sets={sets}
                  selectedSet={selectedSet}
                  onSetSelected={onSetSelected}
                  onSetsChanged={onSetsChanged}
                />
              </ModalMenuItem>

              <ModalMenuItem
                itemLabel="Gene Plot"
                isOpen={openModal === "Gene Plot"}
                onOpen={() => setOpenModal("Gene Plot")}
                onClose={() => setOpenModal(null)}
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
                <Geneplot
                  genome={genomeConfig.genome}
                  sets={sets}
                  selectedSet={selectedSet}
                  tracks={state.tracks}
                  onSetSelected={onSetSelected}
                  onSetsChanged={onSetsChanged}
                />
              </ModalMenuItem>

              <ModalMenuItem
                itemLabel="Scatter Plot"
                isOpen={openModal === "Scatter Plot"}
                onOpen={() => setOpenModal("Scatter Plot")}
                onClose={() => setOpenModal(null)}
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
                <ScatterPlot
                  genomeConfig={genomeConfig.genome}
                  sets={sets}
                  selectedSet={selectedSet}
                  tracks={state.tracks}
                />
              </ModalMenuItem>
              <ModalMenuItem
                itemLabel="Session"
                isOpen={openModal === "Session"}
                onOpen={() => setOpenModal("Session")}
                onClose={() => setOpenModal(null)}
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
                  onRestoreSession={onRestoreSession}
                  onRetrieveBundle={onRetrieveBundle}
                  curBundle={curBundle}
                  addSessionState={addSessionState}
                />
              </ModalMenuItem>
            </div>
          </div>

          <div className="dropdown" style={{ marginLeft: "10px" }}>
            <button
              type="button"
              className="btn btn-success"
              style={{ backgroundColor: "lightblue" }}
              onClick={toggleSettingDropdown}
            >
              ⚙Settings
            </button>
            <div
              className={`dropdown-menu ${
                settingDropdownOpen ? "show" : "hide"
              }`}
            >
              <div
                className="dropdown-menu bg"
                style={{ display: "flex", flexDirection: "column" }}
              >
                <label className="dropdown-item" htmlFor="switchNavigator">
                  <input
                    id="switchNavigator"
                    type="checkbox"
                    checked={switchNavigatorChecked}
                    onChange={handleCheckboxChange}
                  />
                  <span style={{ marginLeft: "1ch" }}>
                    Show genome-wide navigator
                  </span>
                  <span
                    className="GenomeNavigator-tooltip"
                    role="img"
                    aria-label="genomenavigator"
                  >
                    ❓
                    <div className="GenomeNavigator-tooltiptext">
                      <ul style={{ lineHeight: "1.2em", marginBottom: 0 }}>
                        <li>Left mouse drag: select</li>
                        <li>Right mouse drag: pan</li>
                        <li>Mousewheel: zoom</li>
                      </ul>
                    </div>
                  </span>
                </label>

                <label className="dropdown-item" htmlFor="cacheToggle">
                  <input
                    id="cacheToggle"
                    type="checkbox"
                    checked={cacheToggleChecked}
                    onChange={handleCheckboxChange}
                  />
                  <span style={{ marginLeft: "1ch" }}>
                    Restore current view after Refresh
                  </span>
                </label>

                <label className="dropdown-item" htmlFor="setLegendWidth">
                  <input
                    type="number"
                    id="legendWidth"
                    step="5"
                    min="60"
                    max="200"
                    value={legendWidth}
                    onChange={handleChange}
                  />
                  <span style={{ marginLeft: "1ch" }}>
                    Change track legend width
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="dropdown" style={{ marginLeft: "10px" }}>
            <button
              type="button"
              className="btn btn-success"
              style={{ backgroundColor: "red" }}
              onClick={toggleShare}
            >
              📨Share
            </button>
            <div className={`dropdown-menu ${share ? "show" : "hide"}`}>
              <ModalMenuItem
                itemLabel="Share"
                isOpen={share}
                onOpen={() => setOpenModal("Share")}
                onClose={() => setShare(false)}
                hasDropDown={false}
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
                <ShareUI browser={state} color={modalfg} background={modalbg} />
              </ModalMenuItem>
            </div>
          </div>

          <div className="dropdown" style={{ marginLeft: "10px" }}>
            <button
              type="button"
              className="btn btn-success"
              style={{ backgroundColor: "orange" }}
              onClick={toggleHelpDropdown}
            >
              📖Help
            </button>
            <div
              className={`dropdown-menu ${helpDropDownOpen ? "show" : "hide"}`}
            >
              <div
                className="dropdown-menu bg"
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <label className="dropdown-item">
                  <ModalMenuItem
                    isOpen={openModal === "Hotkeys"}
                    itemLabel="Hotkeys"
                    onOpen={() => setOpenModal("Hotkeys")}
                    onClose={() => setOpenModal(null)}
                    style={{
                      content: {
                        left: "unset",
                        bottom: "unset",
                        overflow: "visible",
                        padding: "5px",
                        zIndex: 5,
                        color: modalfg,
                        background: modalbg,
                      },
                    }}
                  >
                    <HotKeyInfo />
                  </ModalMenuItem>
                </label>
                <label className="dropdown-item">
                  <a
                    href="https://epigenomegateway.readthedocs.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Documentation
                  </a>
                </label>
                <label className="dropdown-item">
                  <a
                    href="http://epigenomegateway.wustl.edu/legacy"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    The 'old' browser
                  </a>
                </label>
                <label className="dropdown-item">
                  <a
                    href="https://groups.google.com/d/forum/epgg"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google groups
                  </a>
                </label>
                <label className="dropdown-item">
                  <a
                    href="https://join.slack.com/t/epgg/shared_invite/enQtNTA5NDY5MDIwNjc4LTlhYjJlZWM4MmRlMTcyODEzMDI0ZTlmNmM2ZjIyYmY2NTU5ZTY2MWRmOWExMDg1N2U5ZWE3NzhkMjVkZDVhNTc"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join our Slack
                  </a>
                </label>
                <label className="dropdown-item">
                  <a
                    href="https://github.com/lidaof/eg-react"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Source code @ Github
                  </a>
                </label>
                <label className="dropdown-item">
                  <a
                    href="https://www.youtube.com/channel/UCnGVWbxJv-DPDCAFDQ1oFQA"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    YouTube channel
                  </a>
                </label>
              </div>
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
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  hasDropDown?: boolean;
}

const ModalMenuItem: FC<ModalMenuItemProps> = ({
  itemLabel,
  itemClassName = "dropdown-item",
  style,
  children,
  isOpen,
  onOpen,
  onClose,
  hasDropDown = true,
}) => {
  const toggleOpen = useCallback(() => {
    if (isOpen) {
      onClose();
    } else {
      onOpen();
    }
  }, [isOpen, onOpen, onClose]);

  const finalStyle = {
    overlay: { backgroundColor: "rgba(111,107,101, 0.7)", zIndex: 4 },
    ...style,
  };

  return (
    <>
      {hasDropDown ? (
        <div className={itemClassName} onClick={toggleOpen}>
          {itemLabel}
        </div>
      ) : (
        ""
      )}
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
