import { NavigationComponentProps } from "@/components/core-navigation/NavigationStack";
import { useGenome } from "@/lib/contexts/GenomeContext";
import FacetTableUI from "@/components/GenomeView/TabComponents/FacetTableUI";
import { useMemo } from "react";

export default function TrackFacetTable({ params }: NavigationComponentProps) {
    const {
        state,
        onTracksAdded,
        genomeConfig,
        addTermToMetaSets,
        secondaryGenomes,
        publicTracksPool,
        customTracksPool,
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
        <FacetTableUI
            publicTracksPool={publicTracksPool}
            customTracksPool={customTracksPool}
            addedTracks={state.tracks}
            onTracksAdded={onTracksAdded}
            addTermToMetaSets={addTermToMetaSets}
            addedTrackSets={tracksUrlSets}
            contentColorSetup={{ color: "#222", background: "white" }}
        />
    );
} 