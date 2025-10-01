import React, { useState } from "react";

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
  const [isHovered, setIsHovered] = useState(false);

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
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="flex items-center gap-1 px-1"
            style={{
              outline: isShowingEditMenu
                ? "1px solid #1e40af"
                : "1px solid #1d4ed8",
              backgroundColor: isHovered ? "#eff6ff" : "transparent",
              color: isShowingEditMenu ? "#1d4ed8" : "#2563eb",
              transition: "all 0.2s",
              borderRadius: "2px",
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
    </>
  );
};

export default MetadataHeader;
