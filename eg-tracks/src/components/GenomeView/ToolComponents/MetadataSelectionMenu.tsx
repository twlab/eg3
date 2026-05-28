import React, { useState, CSSProperties } from "react";
import { PlusIcon, XMarkIcon, CheckIcon } from "@heroicons/react/24/solid";
import "./MetadataSelectionMenu.css";

interface MetadataSelectionMenuProps {
  terms?: string[];
  style?: CSSProperties;
  onNewTerms?: (newTerms: string[]) => void;
  suggestedMetaSets?: Set<string>;
  onRemoveTerm?: (termToRemove: string[]) => void;
  tracks?: Array<any>;
  onTracksChange?: (tracks: Array<any>) => void;
}

const MetadataSelectionMenu: React.FC<MetadataSelectionMenuProps> = ({
  terms = [],
  style = {},
  onNewTerms = () => undefined,
  suggestedMetaSets = new Set<string>(),
  onRemoveTerm = () => undefined,
  tracks = [],
  onTracksChange,
}) => {
  const [customTerm, setCustomTerm] = useState("");
  const [customValue, setCustomValue] = useState("");
  const [pendingTerm, setPendingTerm] = useState<string | null>(null);
  const [pendingValue, setPendingValue] = useState<string>("");
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(
    new Set(),
  );

  const addTerm = (term: string) => onNewTerms([term]);
  const removeTerm = (termToRemove: string) => onRemoveTerm([termToRemove]);

  const handleAddCustomTerm = () => {
    const trimmed = customTerm.trim();
    if (trimmed.length > 0 && !terms.includes(trimmed)) {
      setPendingTerm(trimmed);
      setPendingValue(customValue.trim());
      setSelectedTrackIds(new Set());
      setCustomTerm("");
      setCustomValue("");
    }
  };

  const toggleTrack = (id: string) => {
    setSelectedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmCustomTerm = () => {
    if (!pendingTerm) return;
    onNewTerms([pendingTerm]);
    if (selectedTrackIds.size > 0 && onTracksChange) {
      const updatedTracks = tracks.map((track) => {
        if (selectedTrackIds.has(track.id)) {
          return {
            ...track,
            metadata: {
              ...(track.metadata || {}),
              [pendingTerm]: pendingValue,
            },
          };
        }
        return track;
      });
      onTracksChange(updatedTracks);
    }
    setPendingTerm(null);
    setPendingValue("");
    setSelectedTrackIds(new Set());
  };

  const cancelCustomTerm = () => {
    setPendingTerm(null);
    setPendingValue("");
    setSelectedTrackIds(new Set());
  };

  const currentTermSet = new Set(terms);
  const suggestedUnused = Array.from(suggestedMetaSets).filter(
    (t) => !currentTermSet.has(t),
  );

  const sectionHeader: CSSProperties = {
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "var(--font-color)",
    opacity: 0.55,
    margin: "8px 0 3px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  };

  const row: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "2px 0",
    color: "var(--font-color)",
  };

  const iconBtn = (
    variant: "remove" | "add" | "neutral",
    extraStyle?: CSSProperties,
  ): CSSProperties => ({
    width: 20,
    height: 20,
    borderRadius: 4,
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    backgroundColor:
      variant === "remove"
        ? "#fecaca"
        : variant === "add"
          ? "#bbf7d0"
          : "#e0e7ff",
    color:
      variant === "remove"
        ? "#b91c1c"
        : variant === "add"
          ? "#15803d"
          : "#4338ca",
    ...extraStyle,
  });

  const emptyNote: CSSProperties = {
    fontSize: "0.75rem",
    color: "var(--font-color)",
    opacity: 0.45,
    margin: "2px 0",
  };

  return (
    <div className="MetadataSelectionMenu" style={style}>
      {/* ── Current terms ── */}
      <div style={sectionHeader}>Current terms</div>
      {terms.length === 0 ? (
        <p style={emptyNote}>None</p>
      ) : (
        terms.map((term) => (
          <div key={term} style={row}>
            <span style={{ fontSize: "0.875rem" }}>{term}</span>
            <button
              style={iconBtn("remove")}
              onClick={() => removeTerm(term)}
              title={`Remove "${term}"`}
            >
              <XMarkIcon style={{ width: 12, height: 12 }} />
            </button>
          </div>
        ))
      )}

      {/* ── Suggested terms ── */}
      <div style={sectionHeader}>Suggested terms</div>
      {suggestedUnused.length === 0 ? (
        <p style={emptyNote}>None</p>
      ) : (
        suggestedUnused.map((term) => (
          <div key={term} style={row}>
            <span style={{ fontSize: "0.875rem" }}>{term}</span>
            <button
              style={iconBtn("add")}
              onClick={() => addTerm(term)}
              title={`Add "${term}"`}
            >
              <PlusIcon style={{ width: 12, height: 12 }} />
            </button>
          </div>
        ))
      )}

      {/* ── Custom term ── */}
      <div style={sectionHeader}>Custom term</div>
      {pendingTerm ? (
        <div>
          <div
            style={{
              fontSize: "0.8rem",
              marginBottom: 6,
              color: "var(--font-color)",
            }}
          >
            Apply <strong>"{pendingTerm}"</strong>
            {pendingValue ? (
              <>
                {" = "}
                <strong>"{pendingValue}"</strong>
              </>
            ) : null}{" "}
            to tracks:
          </div>
          <div
            style={{
              maxHeight: 160,
              overflowY: "auto",
              marginBottom: 6,
              borderLeft: "2px solid var(--border-color, #d1d5db)",
              paddingLeft: 6,
            }}
          >
            {tracks.length === 0 ? (
              <p style={emptyNote}>No tracks loaded</p>
            ) : (
              tracks.map((track) => (
                <label
                  key={track.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "2px 0",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    color: "var(--font-color)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedTrackIds.has(track.id)}
                    onChange={() => toggleTrack(track.id)}
                    style={{ cursor: "pointer", accentColor: "#4338ca" }}
                  />
                  <span
                    style={{
                      fontSize: "0.75rem",
                      opacity: 0.55,
                      flexShrink: 0,
                    }}
                  >
                    {track.type}
                  </span>
                  {track.name || track.id}
                </label>
              ))
            )}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              style={{
                ...iconBtn("add"),
                width: "auto",
                padding: "2px 10px",
                fontSize: "0.75rem",
                gap: 4,
              }}
              onClick={confirmCustomTerm}
            >
              <CheckIcon style={{ width: 11, height: 11 }} />
              Confirm
            </button>
            <button
              style={{
                ...iconBtn("remove"),
                width: "auto",
                padding: "2px 10px",
                fontSize: "0.75rem",
                gap: 4,
              }}
              onClick={cancelCustomTerm}
            >
              <XMarkIcon style={{ width: 11, height: 11 }} />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <input
              type="text"
              value={customTerm}
              placeholder="Term name..."
              onChange={(e) => setCustomTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCustomTerm();
              }}
              style={{ flex: 1, fontSize: "0.8rem" }}
            />
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <input
              type="text"
              value={customValue}
              placeholder="Value (optional)..."
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCustomTerm();
              }}
              style={{ flex: 1, fontSize: "0.8rem" }}
            />
            <button
              style={iconBtn("neutral")}
              onClick={handleAddCustomTerm}
              title="Add custom term"
            >
              <PlusIcon style={{ width: 12, height: 12 }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetadataSelectionMenu;
