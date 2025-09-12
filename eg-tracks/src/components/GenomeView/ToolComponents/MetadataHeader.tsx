import React, { useState } from "react";

import MetadataSelectionMenu from "./MetadataSelectionMenu";
// import MetadataIndicator from "../TrackComponents/commonComponents/MetadataIndicator";
import "./MetadataHeader.css";

interface MetadataHeaderProps {
  terms?: string[];
  onNewTerms?: (newTerms: string[]) => void;
  suggestedMetaSets?: Set<string>;
  onRemoveTerm?: (newTerms: string[]) => void;
  windowWidth?: number;
  fontSize?: number;
  padding?: number;
}

const MetadataHeader: React.FC<MetadataHeaderProps> = ({
  terms = [],
  onNewTerms = () => undefined,
  suggestedMetaSets,
  onRemoveTerm,
  windowWidth = 800,
  fontSize,
  padding,
}) => {
  const [isShowingEditMenu, setIsShowingEditMenu] = useState(false);

  const termWidth = 15;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{ paddingLeft: padding ? padding : 5 }}
          className="h-5 border-r border-gray-400"
        />

        <div
          className="MetadataHeader-button"
          style={{ paddingLeft: padding ?? (padding || 5) }}
        >
          <button
            onClick={() => setIsShowingEditMenu(!isShowingEditMenu)}
            className={
              isShowingEditMenu
                ? "btn btn-sm btn-danger"
                : "btn btn-sm btn-success"
            }
            style={{
              width: `${Math.max(80, Math.min(110, windowWidth * 0.09))}px`,
              fontSize: `${fontSize}px`,
            }}
          >
            Metadata {isShowingEditMenu ? "↩" : "»"}
          </button>
          <div>
            <MetadataSelectionMenu
              terms={terms}
              style={isShowingEditMenu ? undefined : { display: "none" }}
              onNewTerms={onNewTerms}
              suggestedMetaSets={suggestedMetaSets}
              onRemoveTerm={onRemoveTerm}
            />
          </div>
        </div>
      </div>

      <div className="MetadataHeader-container">
        <ul className="MetadataHeader-terms">
          {terms.map((term) => (
            <li
              key={term}
              style={{ width: termWidth, fontSize: termWidth * 0.75 }}
            >
              {term}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default MetadataHeader;
