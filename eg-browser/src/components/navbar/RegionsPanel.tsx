import React, { useRef, useState, KeyboardEvent } from "react";

import type { GenomeCoordinate, SnpSearchBox, GeneSearchBox } from "wuepgg3-track";
import Button from "@/components/ui/button/Button";

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
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [coordsHover, setCoordsHover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCopyCoordinates = async () => {
    try {
      await navigator.clipboard.writeText(coordinates);
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 1500);
    } catch (e) {
      console.error("Failed to copy coordinates", e);
    }
  };

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
    <div className="px-4 py-2 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
      {/* Highlight toggle */}
      <label className="flex items-center gap-2 text-md text-primary dark:text-dark-primary cursor-pointer select-none">
        <input
          type="checkbox"
          name="do-highlight"
          checked={doHighlight}
          onChange={handleHighlightToggle}
          className="accent-secondary"
        />
        Highlight search
      </label>

      {/* Gene search */}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-primary dark:text-dark-primary uppercase tracking-wider">
          Gene search
        </p>
        <GeneSearchBox
          navContext={selectedRegion.getNavigationContext()}
          onRegionSelected={onRegionSelected}
          doHighlight={doHighlight}
          handleCloseModal={onClose}
          color={color}
          background={background}
          genomeConfig={genomeConfig}
        />
      </div>

      {/* SNP search */}
      {!virusBrowserMode && (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-primary dark:text-dark-primary uppercase tracking-wider">
            SNP search
          </p>
          <SnpSearchBox
            navContext={selectedRegion.getNavigationContext()}
            onRegionSelected={onRegionSelected}
            handleCloseModal={onClose}
            color={color}
            background={background}
            doHighlight={doHighlight}
            genomeConfig={genomeConfig}
            customButton={Button}
          />
        </div>
      )}

      {/* Region search */}
      <div className="flex flex-col gap-1">
        <div
          className="flex flex-wrap items-center justify-start"
          style={{ columnGap: "12px", rowGap: "0px" }}
        >
          <p className="text-sm font-semibold text-primary dark:text-dark-primary uppercase tracking-wider shrink-0">
            Region search
          </p>
          <div className="flex items-center p-0.5 bg-[#f8f9fa] dark:bg-dark-secondary rounded">
            <code
              onClick={handleCopyCoordinates}
              onMouseEnter={() => setCoordsHover(true)}
              onMouseLeave={() => setCoordsHover(false)}
              title="Click to copy coordinates"
              className="text-md font-mono overflow-hidden truncate"
              style={{
                color: "#0b5cff",
                textDecoration: coordsHover ? "underline" : "none",
                cursor: "pointer",
              }}
            >
              {coordinates}
            </code>
            {copiedCoords && (
              <span className="text-md text-green-600 dark:text-green-400 ml-1">
                Copied
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center ">
          <input
            ref={inputRef}
            type="text"
            placeholder="e.g. chr1:1000-2000"
            onKeyDown={keyPress}
            className="w-full"
            style={{
              padding: "4px 6px",
              border: "1px solid #e2e8f0",
              borderRadius: "4px",
              marginRight: "10px",
            }}
          />


          <Button
            onClick={parseRegion}
            active={false}
            style={{
              width: "fit-content",
              padding: "4px 6px",
            }}
            outlined
          >
            Go
          </Button>
        </div>
        {badInputMessage && (
          <span className="text-sm text-red-500">{badInputMessage}</span>
        )}
      </div>
    </div>
  );
};

export default RegionsPanel;
