import { NavigationComponentProps } from "@/components/core-navigation/NavigationStack";
import { useGenome } from "@/lib/contexts/GenomeContext";
import { useMemo } from "react";
import { TrackUpload } from "@/components/GenomeView/TabComponents/TrackUpload";
export default function LocalTracks({ params }: NavigationComponentProps) {
  const {
    state,
    onTracksAdded,
    genomeConfig,

    secondaryGenomes,
  } = useGenome();

  const selectedGenomeName = params?.genome;

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

  return <TrackUpload onTracksAdded={onTracksAdded} />;
}
