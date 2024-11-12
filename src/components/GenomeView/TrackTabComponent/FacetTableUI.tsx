import React, { useState, CSSProperties } from "react";
import FacetTable from "./FacetTable";
import TrackModel from "@/models/TrackModel";

interface FacetTableUIProps {
  publicTracksPool: TrackModel[];
  customTracksPool: TrackModel[];
  addedTracks: TrackModel[];
  onTracksAdded?: (tracks: TrackModel[]) => void;
  addedTrackSets: Set<string>;
  addTermToMetaSets?: any;
  contentColorSetup?: any;
}

const FacetTableUI: React.FC<FacetTableUIProps> = ({
  publicTracksPool,
  customTracksPool,
  addedTracks,
  onTracksAdded,
  addedTrackSets,
  addTermToMetaSets,
  contentColorSetup,
}) => {
  const [selectedTab, setSelectedTab] = useState<string>("public-tracks");

  const handleSelect = (key: string) => {
    setSelectedTab(key);
  };

  // Inline styles
  const styles = {
    tabs: {
      margin: "20px",
      borderRadius: "4px",
    } as CSSProperties,
    tabList: {
      display: "flex",
      borderBottom: "2px solid #ccc",
    } as CSSProperties,
    tab: {
      padding: "10px 20px",
      cursor: "pointer",
      border: "1px solid transparent",
      borderRadius: "4px 4px 0 0",
      marginRight: "2px",
      transition: "background-color 0.2s ease, color 0.2s ease",
    } as CSSProperties,
    tabHover: {
      backgroundColor: "#e9ecef",
    } as CSSProperties,
    tabActive: {
      border: "1px solid #ccc",
      borderBottom: "2px solid white",
      backgroundColor: "white",
      fontWeight: "bold",
      color: "blue",
    } as CSSProperties,
    tabContent: {
      border: "1px solid #ccc",
      padding: "20px",
      borderRadius: "0 4px 4px 4px",
      backgroundColor: "white",
    } as CSSProperties,
  };

  return (
    <div style={styles.tabs}>
      <div style={styles.tabList}>
        <div
          style={
            selectedTab === "public-tracks"
              ? { ...styles.tab, ...styles.tabActive }
              : styles.tab
          }
          onClick={() => handleSelect("public-tracks")}
        >
          Public tracks facet table
        </div>
        <div
          style={
            selectedTab === "custom-tracks"
              ? { ...styles.tab, ...styles.tabActive }
              : styles.tab
          }
          onClick={() => handleSelect("custom-tracks")}
        >
          Custom tracks facet table
        </div>
      </div>

      <div style={styles.tabContent}>
        {selectedTab === "public-tracks" && (
          <div>
            <h1>Tracks from public hubs</h1>
            {publicTracksPool.length > 0 ? (
              <FacetTable
                tracks={publicTracksPool}
                addedTracks={addedTracks}
                onTracksAdded={onTracksAdded}
                addedTrackSets={addedTrackSets}
                contentColorSetup={contentColorSetup}
                addTermToMetaSets={addTermToMetaSets}
              />
            ) : (
              <p>No public tracks from data hubs yet. Load a hub first.</p>
            )}
          </div>
        )}

        {selectedTab === "custom-tracks" && (
          <div>
            <h1>Tracks from custom track or hubs</h1>
            {customTracksPool.length > 0 ? (
              <FacetTable
                tracks={customTracksPool}
                addedTracks={addedTracks}
                onTracksAdded={onTracksAdded}
                addedTrackSets={addedTrackSets}
                contentColorSetup={contentColorSetup}
                addTermToMetaSets={addTermToMetaSets}
              />
            ) : (
              <p>
                No custom tracks yet. Submit custom tracks or load custom data
                hub.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FacetTableUI;
