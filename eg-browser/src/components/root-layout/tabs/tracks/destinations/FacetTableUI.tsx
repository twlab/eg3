import React from "react";
import FacetTable from "./FacetTable";
import TrackModel from "wuepgg3-track-test";

interface FacetTableUIProps {
  publicTracksPool: any[];
  customTracksPool: any[];
  addedTracks: any[];
  onTracksAdded?: (tracks: any[]) => void;
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
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-medium mb-1 bg-white py-2">Public hubs</h2>
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

      <hr className="border-gray-200 my-8" />

      <div className="mb-8">
        <h2 className="text-xl font-medium mb-1 bg-white py-2">
          Custom tracks or hubs
        </h2>
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
            No custom tracks yet. Submit custom tracks or load custom data hub.
          </p>
        )}
      </div>
    </div>
  );
};

export default FacetTableUI;
