import React, { useState, FC } from "react";
import classNames from "classnames";
import DisplayedRegionModel from "../../../models/DisplayedRegionModel";
import Genome from "../../../models/Genome";
import { GenomeCoordinate } from "@/types/track-container";
import TrackRegionButton from "./TrackRegionButton";
import RegionsPanel from "./RegionsPanel";



interface TrackRegionControllerProps {
  selectedRegion: DisplayedRegionModel; // The current view of the genome navigator
  onRegionSelected: (
    query: string | GenomeCoordinate,
    highlightSearch: boolean,
  ) => void;
  contentColorSetup: { color: string; background: string };
  virusBrowserMode?: boolean;
  genomeConfig: Genome;
  genomeArr: any[];
  genomeIdx: number;
  addGlobalState: any;
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
  const coordinates = selectedRegion.currentRegionAsString();

  return (
    <div
      className={classNames(
        "w-55 h-9 rounded-xs flex items-center justify-center",
        "text-sm font-medium select-none",
        "text-gray-700 dark:text-gray-300 bg-gray-100/70 dark:bg-gray-800/50",
        "transition-all duration-150 cursor-pointer",
        "hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white hover:shadow-sm",
        "bg-tint dark:bg-dark-tint text-white",
        "bg-alert text-white",

      )}
    >
      <TrackRegionButton
        coordinates={coordinates}
        onClick={() => setShowModal(true)}
      />
      {showModal && (
        <RegionsPanel
          selectedRegion={selectedRegion}
          onRegionSelected={onRegionSelected}
          contentColorSetup={contentColorSetup}
          virusBrowserMode={virusBrowserMode}
          genomeConfig={genomeConfig}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default TrackRegionController;
