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
  padding,
}) => {

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
