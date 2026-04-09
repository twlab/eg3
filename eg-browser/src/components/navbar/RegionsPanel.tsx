import React, { useRef, useState, KeyboardEvent, useEffect } from "react";
import GeneSearchBox from "../../../../eg-tracks/src/components/GenomeView/genomeNavigator/GeneSearchBox";
import SnpSearchBox from "../../../../eg-tracks/src/components/GenomeView/genomeNavigator/SnpSearchBox";
import { CopyToClip } from "wuepgg3-track";
import type { GenomeCoordinate } from "wuepgg3-track";

import { DisplayedRegionModel, Genome } from "wuepgg3-track";
import useMidSizeNavigationTab from "@/lib/hooks/useMidSizeNavigationTab";

interface RegionsPanelProps {
  selectedRegion: DisplayedRegionModel;
  onRegionSelected: (
    query: string | GenomeCoordinate,
    highlightSearch: boolean,
  ) => void;
  contentColorSetup: { color: string; background: string };
  virusBrowserMode?: boolean;
  genomeConfig: Genome;
  onClose: () => void;
}

const RegionsPanel: React.FC<RegionsPanelProps> = ({
  selectedRegion,
  onRegionSelected,
  contentColorSetup,
  virusBrowserMode,
  genomeConfig,
  onClose,
}) => {
  useMidSizeNavigationTab();
  const [badInputMessage, setBadInputMessage] = useState("");
  const [doHighlight, setDoHighlight] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleHighlightToggle = () => setDoHighlight((prev) => !prev);

  const keyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      parseRegion();
    }
  };

  const parseRegion = () => {
    if (badInputMessage) setBadInputMessage("");
    onRegionSelected(inputRef.current?.value || "", doHighlight);
    onClose();
  };

  const { color, background } = contentColorSetup;
  const coordinates = selectedRegion.currentRegionAsString();

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-label="Gene & Region search"
      style={{ padding: "4px" }}
    >
      <div style={{ color }} onClick={(e) => e.stopPropagation()}>
        <div>
          <span className="text-sm">
            Highlight search{" "}
            <input
              type="checkbox"
              name="do-highlight"
              checked={doHighlight}
              onChange={handleHighlightToggle}
            />
          </span>
        </div>
        <h6 className="text-sm font-semibold mt-3 mb-1" style={{ color }}>
          Gene search
        </h6>
        <GeneSearchBox
          navContext={selectedRegion.getNavigationContext()}
          onRegionSelected={onRegionSelected}
          doHighlight={doHighlight}
          handleCloseModal={onClose}
          color={color}
          background={background}
          genomeConfig={genomeConfig}
        />
        {!virusBrowserMode && (
          <>
            <h6 className="text-sm font-semibold mt-3 mb-1" style={{ color }}>
              SNP search
            </h6>
            <SnpSearchBox
              navContext={selectedRegion.getNavigationContext()}
              onRegionSelected={onRegionSelected}
              handleCloseModal={onClose}
              color={color}
              background={background}
              doHighlight={doHighlight}
              genomeConfig={genomeConfig}
            />
          </>
        )}
        <h6 className="text-sm font-semibold mt-3 mb-1" style={{ color }}>
          Region search (current: {coordinates}{" "}
          <CopyToClip value={coordinates} />)
        </h6>
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            size={30}
            placeholder="Coordinate"
            onKeyDown={keyPress}
            className="flex-1 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-surface text-primary dark:text-dark-primary focus:outline-none focus:ring-1 focus:ring-secondary"
          />
          <button
            className="px-3 py-1 text-sm rounded bg-secondary text-white hover:opacity-80 cursor-pointer"
            onClick={parseRegion}
          >
            Go
          </button>
        </div>
        {badInputMessage && (
          <span className="text-xs text-red-500 mt-1 block">
            {badInputMessage}
          </span>
        )}
      </div>
    </div>
  );
};

export default RegionsPanel;
