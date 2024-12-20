import { NavigationComponentProps } from "@/components/core-navigation/NavigationStack";
import { useGenome } from "@/lib/contexts/GenomeContext";
import CustomTrackAdder from "@/components/GenomeView/TabComponents/CustomTrackAdder";
import { useMemo } from "react";
import { TrackUpload } from "@/components/GenomeView/TabComponents/TrackUpload";

export default function LocalTracks({ params }: NavigationComponentProps) {
    const {
        state,
        onTracksAdded,
        genomeConfig,
        customTracksPool,
        secondaryGenomes,
        addTermToMetaSets,
        onHubUpdated,
    } = useGenome();

    const selectedGenomeName = params?.genome;

    const tracksUrlSets = useMemo(() => new Set([
        ...state.tracks.filter((track) => track.url).map((track) => track.url),
        ...state.tracks.filter((track) => !track.url).map((track) => track.name),
    ]), [state.tracks]);

    const selectedGenomeConfig = useMemo(() => {
        if (selectedGenomeName && selectedGenomeName !== genomeConfig.genome.getName()) {
            return secondaryGenomes.find((g) => g.genome.getName() === selectedGenomeName);
        }
        return genomeConfig;
    }, [secondaryGenomes, selectedGenomeName, genomeConfig]);

    return (
        <TrackUpload onTracksAdded={onTracksAdded} />
    );
} 