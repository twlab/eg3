import React, { useEffect, useRef, useState } from "react";
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
  const [popupPos, setPopupPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
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
    document.addEventListener("mousedown", handleClickOutside, true);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside, true);
  }, [activeTerm]);

  // The popup opens under the cursor and closes as soon as the mouse moves off it,
  // so it never lingers in place blocking a click. A small margin gives a bit of
  // slack so a tiny jitter right after opening doesn't dismiss it.
  // Listen in the capture phase: the genome view's drag/navigation handlers call
  // stopPropagation() on mousemove, so a bubble-phase listener would stop firing
  // once the cursor moves over the tracks.
  useEffect(() => {
    if (!activeTerm) return;
    const handleMove = (e: MouseEvent) => {
      const el = dropdownRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const margin = 12;
      if (
        e.clientX < rect.left - margin ||
        e.clientX > rect.right + margin ||
        e.clientY < rect.top - margin ||
        e.clientY > rect.bottom + margin
      ) {
        setActiveTerm(null);
      }
    };
    document.addEventListener("mousemove", handleMove, true);
    return () => document.removeEventListener("mousemove", handleMove, true);
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
                onClick={(e) => {
                  if (values.length === 0) return;
                  setPopupPos({ x: e.clientX, y: e.clientY });
                  setActiveTerm(isActive ? null : term);
                }}
              >
                {term}
                {isActive &&
                  (() => {
                    const POPUP_WIDTH = 160;
                    const estHeight = Math.min(
                      values.length * 24 + 34,
                      Math.round(window.innerHeight * 0.5),
                    );
                    // Open the popup under the cursor (cursor sits just inside its
                    // top-left) so moving down onto a value keeps it open, while
                    // moving off it in any direction dismisses it.
                    let left = popupPos.x - 18;
                    left = Math.max(
                      8,
                      Math.min(left, window.innerWidth - POPUP_WIDTH - 8),
                    );
                    let top = popupPos.y - 14;
                    top = Math.max(
                      8,
                      Math.min(top, window.innerHeight - estHeight - 8),
                    );
                    return (
                      <div
                        ref={dropdownRef}
                        style={{
                          position: "fixed",
                          left,
                          top,
                          backgroundColor: "var(--bg-color, #fff)",
                          border: "1px solid #d1d5db",
                          borderRadius: 4,
                          zIndex: 1000,
                          width: POPUP_WIDTH,
                          maxHeight: "50vh",
                          overflowY: "auto",
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
                    );
                  })()}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default MetadataHeader;
