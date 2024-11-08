import React from "react";
import PropTypes from "prop-types";
import HubTable from "./HubTable";
import TrackModel from "@/models/TrackModel";
import FacetTable from "./FacetTable";

/**
 * The window containing UI for loading public track hubs and adding tracks from hubs.
 *
 * @param {Object} props - React props
 * @returns {JSX.Element} the rendered component
 */
const HubPane: React.FC<HubPaneProps> = ({
  addedTracks,
  publicTracksPool,
  onTracksAdded,
  onAddTracksToPool,
  addTermToMetaSets,
  addedTrackSets,
  publicTrackSets,
  publicHubs,
  onHubUpdated,
  contentColorSetup,
  genomeConfig,
}) => {
  return (
    <div>
      <HubTable
        onTracksAdded={onTracksAdded}
        publicHubs={publicHubs}
        genomeConfig={genomeConfig}
        onHubLoaded={function (
          tracks: TrackModel[],
          visible: boolean,
          hubUrl: string
        ): void {
          throw new Error("Function not implemented.");
        }}
        onHubUpdated={onHubUpdated}
      />
      {publicTracksPool.length > 0 ? (
        <FacetTable
          tracks={publicTracksPool} // need include add tracks, also need consider track remove to just remove from sets
          addedTracks={addedTracks!}
          onTracksAdded={onTracksAdded}
          publicTrackSets={publicTrackSets}
          addedTrackSets={addedTrackSets}
          addTermToMetaSets={addTermToMetaSets}
          contentColorSetup={contentColorSetup}
        />
      ) : (
        <p>No tracks from data hubs yet. Load a hub first.</p>
      )}
    </div>
  );
};

export default HubPane;

// Define TypeScript interfaces
interface HubPaneProps {
  addedTracks?: TrackModel[];
  publicTracksPool: TrackModel[];
  onTracksAdded?: (tracks: TrackModel[]) => void;
  onAddTracksToPool?: (tracks: TrackModel[]) => void;
  addTermToMetaSets?: any;
  addedTrackSets?: Set<string>;
  publicTrackSets?: Set<string>;
  publicHubs: any[];
  onHubUpdated?: () => void;
  contentColorSetup?: object;
  genomeConfig: any;
}
