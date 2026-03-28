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
    useMidSizeNavigationTab()
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
            <div
                style={{

                    // ...MODAL_STYLE.content, 

                    // color, background
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div>
                    <span>
                        Highlight search {" "}
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
                    handleCloseModal={onClose}
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
                            handleCloseModal={onClose}
                            color={color}
                            background={background}
                            doHighlight={doHighlight}
                            genomeConfig={genomeConfig}
                        />
                    </>
                )}
                <h6>
                    Region search (current region is {coordinates} {" "}
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
        </div>
    );
};

export default RegionsPanel;
