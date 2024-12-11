import { NavigationComponentProps } from "@/components/core-navigation/NavigationStack";
import { useGenome } from "@/lib/contexts/GenomeContext";
import { useMemo } from "react";

export default function TrackList({ params }: NavigationComponentProps) {
    const {
        state,
        onTracksAdded,
        genomeConfig,
        secondaryGenomes,
    } = useGenome();

    const selectedGenomeName = params?.genome;

    const selectedGenomeConfig = useMemo(() => {
        if (selectedGenomeName && selectedGenomeName !== genomeConfig.genome.getName()) {
            return secondaryGenomes.find((g) => g.genome.getName() === selectedGenomeName);
        }
        return genomeConfig;
    }, [secondaryGenomes, selectedGenomeName, genomeConfig]);

    return (
        <div className="flex flex-col gap-4">
            {state.tracks.map((track, index) => (
                <div
                    key={track.id || index}
                    className="p-4 border rounded-lg hover:bg-gray-50"
                >
                    <h3 className="font-medium">{track.name}</h3>
                    {track.url && (
                        <p className="text-sm text-gray-500 mt-1">{track.url}</p>
                    )}
                    {track.metadata && Object.entries(track.metadata).map(([key, value]) => (
                        <div key={key} className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">{key}:</span> {String(value)}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
} 