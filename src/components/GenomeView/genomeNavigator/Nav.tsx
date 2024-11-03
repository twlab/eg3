import React, { useState, useCallback, FC } from "react";
import ReactModal from "react-modal";

import { Button } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import AnnotationTrackUI from "../TrackTabComponent/AnnotationTrackUI";
import _ from "lodash";

import { getSpeciesInfo } from "@/models/genomes/allGenomes";
import TrackRegionController from "./TrackRegionController";

import TrackModel from "@/models/TrackModel";
// import { AnnotationTrackUI } from "./trackManagers/AnnotationTrackUI";
// import HubPane from "./trackManagers/HubPane";

// import { RegionExpander } from "../model/RegionExpander";

// import FacetTableUI from "./FacetTableUI";

import "./Nav.css";
import GenomePicker from "@/components/Home/GenomePicker";
import CustomTrackAdder from "../TrackTabComponent/CustomTrackAdder";

interface NavProps {
  selectedRegion: any;
  onRegionSelected: any;
  tracks: TrackModel[];
  genomeConfig: any;
  onTracksAdded?: (tracks: TrackModel[]) => void;
  onTrackRemoved?: (track: TrackModel) => void;
  trackLegendWidth: number;
  isShowingNavigator?: boolean;
  darkTheme?: boolean;
  onGenomeSelected: (name: string) => void;
  onToggleNavigator?: () => void;
}

const Nav: FC<NavProps> = ({
  tracks,
  genomeConfig,
  onTracksAdded,
  onTrackRemoved,
  selectedRegion,
  onRegionSelected,
  darkTheme,
  onGenomeSelected,
}) => {
  const [genomeModal, setGenomeModal] = useState(false);

  const handleGenomeOpenModal = () => {
    setGenomeModal(true);
  };

  const handleGenomeCloseModal = () => {
    setGenomeModal(false);
  };

  const handleGenomeSelected = (name: string) => {
    onGenomeSelected(name);
    handleGenomeCloseModal();
  };
  function groupTrackByGenome() {
    const grouped = {}; // key: genome name like `hg19`, value: a set of track name or url
    tracks.forEach((track) => {
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
    ...tracks.filter((track) => track.url).map((track) => track.url),
    ...tracks.filter((track) => !track.url).map((track) => track.name),
  ]);
  // tracksUrlSets.delete('Ruler'); // allow ruler to be added many times
  // const publicHubs = genomeConfig.publicHubList ? genomeConfig.publicHubList.slice() : [] ;
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
            content: {
              color: modalfg,
              background: modalbg,
              zIndex: 5,
            },
            overlay: {
              backgroundColor: "rgba(111,107,101, 0.7)",
            },
          }}
        >
          <IconButton color="secondary" onClick={handleGenomeCloseModal}>
            <ArrowBack />
          </IconButton>
          <GenomePicker
            onGenomeSelected={handleGenomeSelected}
            title="Choose a new genome"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenomeCloseModal}
          >
            Close
          </Button>
        </ReactModal>
        <div className="element Nav-center" style={{}}>
          <TrackRegionController
            selectedRegion={selectedRegion}
            onRegionSelected={onRegionSelected}
            contentColorSetup={{ background: "white", color: "#222" }}
            genomeConfig={genomeConfig}
          />{" "}
        </div>
        <div className="element Nav-center btn-group">
          <DropdownOpener extraClassName="btn-primary" label="🎹Tracks" />
          <div className="dropdown-menu bg">
            <ModalMenuItem
              itemLabel="Annotation Tracks"
              style={{
                content: {
                  color: modalfg,
                  background: modalbg,
                },
              }}
            >
              <AnnotationTrackUI
                addedTracks={tracks}
                onTracksAdded={onTracksAdded}
                addedTrackSets={tracksUrlSets}
                genomeConfig={genomeConfig}
                groupedTrackSets={groupedTrackSets}
              />
            </ModalMenuItem>
            {/* <ModalMenuItem
              itemLabel="Public Data Hubs"
              style={{
                content: {
                  color: modalfg,
                  background: modalbg,
                }, 
              }}
            >
              <HubPane
                addedTracks={tracks}
                onTracksAdded={onTracksAdded}
                onTrackRemoved={onTrackRemoved}
                onAddTracksToPool={onAddTracksToPool}
                publicTracksPool={publicTracksPool}
                publicHubs={publicHubs}
                onHubUpdated={onHubUpdated}
                publicTrackSets={publicTrackSets}
                addedTrackSets={addedTrackSets}
                addTermToMetaSets={addTermToMetaSets}
                contentColorSetup={{
                  color: modalfg,
                  background: modalbg,
                }}
              />
            </ModalMenuItem> */}
            {/* <ModalMenuItem
              itemLabel="Track Facet Table"
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
                addedTracks={tracks}
                onTracksAdded={onTracksAdded}
                publicTrackSets={publicTrackSets}
                customTrackSets={customTrackSets}
                addedTrackSets={addedTrackSets}
                addTermToMetaSets={addTermToMetaSets}
                contentColorSetup={{
                  color: modalfg,
                  background: modalbg,
                }}
              />
            </ModalMenuItem> */}
            <ModalMenuItem
              itemLabel="Remote Tracks"
              style={{
                content: {
                  color: modalfg,
                  background: modalbg,
                },
              }}
            >
              <CustomTrackAdder
                addedTracks={tracks}
                onTracksAdded={onTracksAdded}
                genomeConfig={genomeConfig}
              />
            </ModalMenuItem>
            {/* <ModalMenuItem
              itemLabel="Local Tracks"
              style={{
                content: {
                  color: modalfg,
                  background: modalbg,
                },
              }}
            >
              <TrackUpload onTracksAdded={onTracksAdded} />
            </ModalMenuItem> */}
            {/* <ModalMenuItem
              itemLabel="Local Text Tracks"
              style={{
                content: {
                  color: modalfg,
                  background: modalbg,
                },
              }}
            >
              <TextTrack onTracksAdded={onTracksAdded} />
            </ModalMenuItem> */}
            {/* <ModalMenuItem
              itemLabel="Track List"
              style={{
                content: {
                  color: modalfg,
                  background: modalbg,
                },
              }}
            >
              <TrackList
                addedTracks={tracks}
                onTracksAdded={onTracksAdded}
                onTrackRemoved={onTrackRemoved}
                addedTrackSets={addedTrackSets}
                availableTrackSets={availableTrackSets}
                addTracktoAvailable={addTracktoAvailable}
                removeTrackFromAvailable={removeTrackFromAvailable}
              />
            </ModalMenuItem> */}
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

  const toggleOpen = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  const finalStyle = {
    overlay: {
      backgroundColor: "rgba(111,107,101, 0.7)",
      zIndex: 4,
    },
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
