import React, { useState } from "react";

import MetadataSelectionMenu from "./MetadataSelectionMenu";
// import MetadataIndicator from "../TrackComponents/commonComponents/MetadataIndicator";
import "./MetadataHeader.css";

interface MetadataHeaderProps {
  terms?: string[];
  onNewTerms?: (newTerms: string[]) => void;
  suggestedMetaSets?: Set<string>;
  onRemoveTerm?: (newTerms: string[]) => void;
}

const MetadataHeader: React.FC<MetadataHeaderProps> = ({
  terms = [],
  onNewTerms = () => undefined,
  suggestedMetaSets,
  onRemoveTerm,
}) => {
  const [isShowingEditMenu, setIsShowingEditMenu] = useState(false);

  const termWidth = 15;

  return (
    <>
      <div className="MetadataHeader-button">
        <button
          onClick={() => setIsShowingEditMenu(!isShowingEditMenu)}
          className={
            isShowingEditMenu
              ? "btn btn-sm btn-danger dense-button"
              : "btn btn-sm btn-success dense-button"
          }
          style={{ width: "95px" }}
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
