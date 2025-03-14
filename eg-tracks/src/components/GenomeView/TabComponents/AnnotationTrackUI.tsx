import React, { useEffect, useState } from "react";
import { TrackModel } from "../../../models/TrackModel";
import { getSecondaryGenomes } from "../../../models/util";
import { getGenomeConfig } from "../../../models/genomes/allGenomes";
import AnnotationTrackSelector from "./AnnotationTrackSelector";

interface AnnotationTrackUIProps {
  genomeConfig: any; // Replace 'any' with the appropriate type
  addedTracks: TrackModel[];
  onTracksAdded?: (tracks: TrackModel[]) => void;
  addedTrackSets?: Set<any>;
  groupedTrackSets?: { [key: string]: TrackModel[] };
}

const AnnotationTrackUI: React.FC<AnnotationTrackUIProps> = ({
  genomeConfig,
  addedTracks,
  onTracksAdded = () => undefined,
  addedTrackSets,
  groupedTrackSets,
}) => {
  const [secondConfigs, setSecondConfigs] = useState(getSecondConfigs());

  function getSecondConfigs() {
    const secondaryGenomes = getSecondaryGenomes(
      genomeConfig.genome.getName(),
      addedTracks
    );
    return secondaryGenomes.map((g) => getGenomeConfig(g));
  }

  useEffect(() => {
    setSecondConfigs(getSecondConfigs());
  }, [addedTracks]); // Update when addedTracks changes

  const renderSecondaryUI = () => {
    return secondConfigs.map((config) =>
      config ? (
        <AnnotationTrackSelector
          key={config.genome.getName()}
          addedTracks={addedTracks}
          onTracksAdded={onTracksAdded}
          addedTrackSets={addedTrackSets}
          genomeConfig={config}
          addGenomeLabel={true}
          groupedTrackSets={groupedTrackSets}
        />
      ) : null
    );
  };

  return (
    <React.Fragment>
      <AnnotationTrackSelector
        addedTracks={addedTracks}
        onTracksAdded={onTracksAdded}
        addedTrackSets={addedTrackSets}
        genomeConfig={genomeConfig}
        groupedTrackSets={groupedTrackSets}
      />
      {renderSecondaryUI()}
    </React.Fragment>
  );
};

export default AnnotationTrackUI;
