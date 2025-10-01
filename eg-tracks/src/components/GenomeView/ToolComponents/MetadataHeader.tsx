import React, { useEffect, useState } from "react";

import MetadataSelectionMenu from "./MetadataSelectionMenu";
import { TagIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
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
  metaWidth?: number;
}

const MetadataHeader: React.FC<MetadataHeaderProps> = ({
  terms = [],
  onNewTerms = () => undefined,
  suggestedMetaSets,
  onRemoveTerm,
  windowWidth = 800,
  fontSize,
  padding,
  metaWidth = 200,
}) => {
  const [isShowingEditMenu, setIsShowingEditMenu] = useState(false);
  const termWidth = 15;
  const buttonWidth = 120; // Approximate width for the Metadata button
  const totalContentWidth = Math.max(
    buttonWidth + terms.length * termWidth + (padding ? padding * 2 : 10),
    windowWidth * 0.2 // Minimum width
  );

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        width: `${totalContentWidth}px`,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          className="MetadataHeader-button"
          style={{ paddingLeft: padding ?? (padding || 5) }}
        >
          <button
            onClick={() => setIsShowingEditMenu(!isShowingEditMenu)}
            className="flex items-center gap-2 rounded-sm px-2"
            style={{
              border: isShowingEditMenu
                ? "1px solid #1e40af"
                : "1px solid #1d4ed8",
              backgroundColor: "#eff6ff",
              color: isShowingEditMenu ? "#1d4ed8" : "#2563eb",
              transition: "all 0.2s",
            }}
            title="Metadata options"
          >
            <span className="text-base font-medium">Metadata</span>
            <motion.div
              animate={{ rotate: isShowingEditMenu ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRightIcon className="w-4 h-4" />
            </motion.div>
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
    </div>
  );
};

export default MetadataHeader;
