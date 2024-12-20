import { NavigationComponentProps } from "@/components/core-navigation/NavigationStack";
import { useGenome } from "@/lib/contexts/GenomeContext";
import HubPane from "@/components/GenomeView/TabComponents/HubPane";
import { useMemo } from "react";
import TrackRegionController from "@/components/GenomeView/genomeNavigator/TrackRegionController";
export default function TrackRegionControllerTab({
  params,
}: NavigationComponentProps) {
  const {
    state,
    onTracksAdded,
    genomeConfig,
    publicTracksPool,
    addTermToMetaSets,
    onHubUpdated,
    secondaryGenomes,
  } = useGenome();

  const selectedGenomeName = params?.genome;

  const tracksUrlSets = useMemo(
    () =>
      new Set([
        ...state.tracks.filter((track) => track.url).map((track) => track.url),
        ...state.tracks
          .filter((track) => !track.url)
          .map((track) => track.name),
      ]),
    [state.tracks]
  );

  const selectedGenomeConfig = useMemo(() => {
    if (
      selectedGenomeName &&
      selectedGenomeName !== genomeConfig.genome.getName()
    ) {
      return secondaryGenomes.find(
        (g) => g.genome.getName() === selectedGenomeName
      );
    }
    return genomeConfig;
  }, [secondaryGenomes, selectedGenomeName, genomeConfig]);

  return (
    <HubPane
      addedTracks={state.tracks}
      onTracksAdded={onTracksAdded}
      addTermToMetaSets={addTermToMetaSets}
      onHubUpdated={onHubUpdated}
      publicTracksPool={publicTracksPool}
      publicHubs={selectedGenomeConfig.publicHubList}
      publicTrackSets={undefined}
      addedTrackSets={tracksUrlSets}
      contentColorSetup={{ color: "#222", background: "white" }}
      genomeConfig={selectedGenomeConfig}
    />
  );
}
