import { NavigationComponentProps } from "@/components/core-navigation/NavigationStack";
import { useGenome } from "@/lib/contexts/GenomeContext";
import { PlusIcon, CheckIcon } from "@heroicons/react/24/solid";
import { useMemo, useState } from "react";
import _ from "lodash";
import DataHubParser from "@/models/DataHubParser";
import Json5Fetcher from "@/models/Json5Fetcher";
import FacetTable from "@/components/GenomeView/TabComponents/FacetTable";
import { useElementGeometry } from "@/lib/hooks/useElementGeometry";

export default function PublicDataHubs({ params }: NavigationComponentProps) {
    const {
        state,
        onTracksAdded,
        genomeConfig,
        publicTracksPool,
        addTermToMetaSets,
        onHubUpdated,
        secondaryGenomes,
    } = useGenome();

    const [loadingHubs, setLoadingHubs] = useState<Set<string>>(new Set());
    const [loadedHubs, setLoadedHubs] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");

    const selectedGenomeName = params?.genome;

    const selectedGenomeConfig = useMemo(() => {
        if (selectedGenomeName && selectedGenomeName !== genomeConfig.genome.getName()) {
            return secondaryGenomes.find((g) => g.genome.getName() === selectedGenomeName);
        }
        return genomeConfig;
    }, [secondaryGenomes, selectedGenomeName, genomeConfig]);

    const groupedHubs = useMemo(() => {
        const hubs = selectedGenomeConfig.publicHubList || [];

        const filteredHubs = hubs.filter(hub =>
            Object.values(hub).some(value =>
                String(value).toLowerCase().includes(searchQuery.toLowerCase())
            )
        );

        return _.groupBy(filteredHubs, 'collection');
    }, [selectedGenomeConfig, searchQuery]);

    const loadHub = async (hub: any) => {
        const hubParser = new DataHubParser();
        setLoadingHubs(prev => new Set([...prev, hub.url]));

        try {
            const json = await new Json5Fetcher().get(hub.url);
            const lastSlashIndex = hub.url.lastIndexOf("/");
            const hubBase = hub.url.substring(0, lastSlashIndex).replace(/\/+$/, "");
            const tracksStartIndex = hub.oldHubFormat ? 1 : 0;

            const tracks = await hubParser.getTracksInHub(
                json,
                hub.name,
                hub.genome,
                hub.oldHubFormat,
                tracksStartIndex,
                hubBase
            );

            const updatedHubs = selectedGenomeConfig.publicHubList.map(h =>
                h.url === hub.url ? { ...h, isLoaded: true } : h
            );

            onHubUpdated(updatedHubs, tracks, "public");
            const tracksToShow = tracks.filter((track: any) => track.showOnHubLoad);
            if (tracksToShow.length > 0 && onTracksAdded) {
                onTracksAdded(tracksToShow);
            }

            setLoadedHubs(prev => new Set([...prev, hub.url]));
        } catch (error) {
            console.error(error);
            const updatedHubs = selectedGenomeConfig.publicHubList.map(h =>
                h.url === hub.url ? { ...h, error: true } : h
            );
            onHubUpdated(updatedHubs, [], "public");
        } finally {
            setLoadingHubs(prev => {
                const next = new Set(prev);
                next.delete(hub.url);
                return next;
            });
        }
    };

    const renderHubItem = (hub: any) => {
        const isLoading = loadingHubs.has(hub.url);
        const isLoaded = loadedHubs.has(hub.url);

        return (
            <div key={hub.url} className="flex items-center justify-between py-1">
                <span className="text-sm">
                    {hub.name} ({hub.numTracks} tracks)
                </span>
                <div className="flex-shrink-0 ml-2">
                    {isLoading ? (
                        <div className="size-6 rounded-md bg-gray-100 flex items-center justify-center">
                            <div className="size-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <button
                            className={`size-6 rounded-md flex items-center justify-center ${isLoaded ? 'bg-green-200 hover:bg-green-300' : 'bg-secondary hover:bg-purple-200'
                                }`}
                            onClick={() => loadHub(hub)}
                            disabled={isLoading}
                        >
                            {isLoaded ? (
                                <CheckIcon className="size-4 text-green-700" />
                            ) : (
                                <PlusIcon className="size-4" />
                            )}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const searchBarGeometry = useElementGeometry();

    const renderSearchBar = () => (
        <div 
            ref={searchBarGeometry.ref}
            className="sticky top-0 bg-white z-20 pb-2"
        >
            <input
                type="text"
                placeholder="Search hubs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
            />
        </div>
    );

    const renderHubGroup = (collection: string, hubs: any[]) => (
        <div key={collection} className="mb-4 relative">
            <h2 
                className="text-base font-medium mb-1 sticky bg-white z-10 py-2"
                style={{ top: `${searchBarGeometry.height}px` }}
            >
                {collection}
            </h2>
            <div className="pl-3 border-l border-gray-200">
                {hubs.map(hub => renderHubItem(hub))}
            </div>
        </div>
    );

    const addedTrackUrls = useMemo(() =>
        new Set(state.tracks.map(track => track.url || track.name)),
        [state.tracks]
    );

    return (
        <div>
            {renderSearchBar()}
            <div>
                {Object.entries(groupedHubs).map(([collection, hubs]) =>
                    renderHubGroup(collection, hubs)
                )}
            </div>

            {publicTracksPool.length > 0 && (
                <div>
                    <h2 className="text-base font-medium mb-4">Available Tracks</h2>
                    <FacetTable
                        tracks={publicTracksPool}
                        addedTracks={state.tracks}
                        onTracksAdded={onTracksAdded}
                        publicTrackSets={undefined}
                        addedTrackSets={addedTrackUrls as Set<string>}
                        addTermToMetaSets={addTermToMetaSets as any}
                        contentColorSetup={{ color: "#222", background: "white" }}
                    />
                </div>
            )}
        </div>
    );
}
