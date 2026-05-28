import React, { useEffect, useRef, useState } from "react";

import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
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
  tracks?: Array<any>;
  termValues?: { [term: string]: string[] };
  onTermValueClick?: (term: string, value: string) => void;
}

const MetadataHeader: React.FC<MetadataHeaderProps> = ({
  terms = [],
  windowWidth = 800,
  padding,
  tracks = [],
  termValues,
  onTermValueClick,
}) => {
  const [activeTerm, setActiveTerm] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeTerm) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setActiveTerm(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeTerm]);

  function getValuesForTerm(term: string): string[] {
    // Prefer state-driven termValues (avoids stale mutable-ref timing issues)
    if (termValues && termValues[term] && termValues[term].length > 0) {
      return termValues[term];
    }
    // Fall back to computing from tracks prop
    if (!tracks || tracks.length === 0) return [];
    const values = new Set<string>();
    tracks.forEach((track) => {
      const v = track.metadata?.[term];
      if (v !== undefined && v !== null && v !== "") {
        if (Array.isArray(v)) v.forEach((vi: any) => values.add(String(vi)));
        else values.add(String(v));
      }
    });
    return Array.from(values);
  }

  const termWidth = 15;
  const totalContentWidth = Math.max(
    terms.length * termWidth + (padding ? padding * 2 : 10),
    windowWidth * 0.15,
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
          {terms.map((term) => {
            const values = getValuesForTerm(term);
            const isActive = activeTerm === term;
            return (
              <li
                key={term}
                style={{
                  width: termWidth,
                  fontSize: termWidth * 0.75,
                  cursor: values.length > 0 ? "pointer" : "default",
                  position: "relative",
                  userSelect: "none",
                }}
                title={values.length > 0 ? `Filter by "${term}"` : term}
                onClick={() => {
                  if (values.length === 0) return;
                  setActiveTerm(isActive ? null : term);
                }}
              >
                {term}
                {isActive && (
                  <div
                    ref={dropdownRef}
                    style={{
                      position: "absolute",
                      top: 0,
                      right: "100%",
                      marginRight: 4,
                      backgroundColor: "var(--bg-color, #fff)",
                      border: "1px solid #d1d5db",
                      borderRadius: 4,
                      zIndex: 1000,
                      minWidth: 120,
                      padding: 4,
                      writingMode: "horizontal-tb",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        opacity: 0.55,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        padding: "2px 4px 4px",
                        color: "var(--font-color)",
                        borderBottom: "1px solid #e5e7eb",
                        marginBottom: 2,
                      }}
                    >
                      {term}
                    </div>
                    {values.map((val) => (
                      <div
                        key={val}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTermValueClick?.(term, val);
                          setActiveTerm(null);
                        }}
                        style={{
                          padding: "3px 6px",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          color: "var(--font-color)",
                          borderRadius: 3,
                        }}
                        onMouseEnter={(e) =>
                          ((
                            e.currentTarget as HTMLDivElement
                          ).style.backgroundColor = "#eff6ff")
                        }
                        onMouseLeave={(e) =>
                          ((
                            e.currentTarget as HTMLDivElement
                          ).style.backgroundColor = "transparent")
                        }
                      >
                        {val}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default MetadataHeader;
