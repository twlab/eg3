import DisplayedRegionModel from "@eg/core/src/eg-lib/model/DisplayedRegionModel";
import NavigationContext from "@eg/core/src/eg-lib/model/NavigationContext";
import TrackModel from "@eg/core/src/eg-lib/model/TrackModel";
import { useCallback, useMemo, useRef } from "react";

import TracksPlaceholder from "../assets/tracks-placeholder.jpg";
import { GenomeCoordinate, ITrackContainerRepresentableProps, ITrackContainerState, ITrackModel } from "../types";

function TrackContainer(props: ITrackContainerState) {
    const { tracks, viewRegion } = props;

    const getTrackSummary = (track: TrackModel) => {
        return `${track.getDisplayLabel()} (${track.type})${track.url ? ` - ${track.url}` : ''}`;
    };

    return (
        <div className="flex flex-col gap-4 p-4">
            <div>
                <img src={TracksPlaceholder} alt="tracks" className="w-full" />
            </div>

            <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Current Region</h3>
                        <p className="text-gray-600">
                            {viewRegion.currentRegionAsString()}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            Loaded Tracks ({tracks.length})
                        </h3>
                        <ul className="space-y-2">
                            {tracks.map((track, index) => (
                                <li
                                    key={track.getId()}
                                    className="text-gray-600 border-l-4 border-blue-500 pl-3 py-1"
                                >
                                    {getTrackSummary(track)}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}


/**
 * TrackContainerRepresentable serves as the boundary between the new serializable TrackModel and the previous
 * class-based TrackModel.
 * 
 * New serializable state is actively converted to the class-based state and passed to the TrackContainer.
 */
export function TrackContainerRepresentable({
    tracks,
    highlights,
    genomeConfig,
    legendWidth,
    showGenomeNav,
    onNewRegion,
    onNewHighlight,
    onTrackSelected,
    onTrackDeleted,
    onTrackAdded,
    onNewRegionSelect,
    viewRegion,
}: ITrackContainerRepresentableProps) {
    // MARK: Tracks

    const trackCache = useRef(new Map<string, TrackModel>());

    const convertTrackModelToITrackModel = useCallback((track: TrackModel): ITrackModel => ({
        name: track.name,
        type: track.type,
        filetype: track.filetype,
        options: track.options,
        url: track.url,
        indexUrl: track.indexUrl,
        metadata: track.metadata,
        queryEndpoint: track.queryEndpoint,
        querygenome: track.querygenome
    }), []);

    const convertedTracks = useMemo(() => {
        const cache = trackCache.current;

        const getCacheKey = (track: ITrackModel) => {
            return JSON.stringify({
                name: track.name,
                type: track.type,
                filetype: track.filetype,
                options: track.options,
                url: track.url,
                indexUrl: track.indexUrl,
                metadata: track.metadata,
                queryEndpoint: track.queryEndpoint,
                querygenome: track.querygenome
            });
        };

        const result: TrackModel[] = [];
        const currentKeys = new Set<string>();

        for (const track of tracks) {
            const cacheKey = getCacheKey(track);
            currentKeys.add(cacheKey);
            if (!cache.has(cacheKey)) {
                cache.set(cacheKey, new TrackModel(track));
            }

            result.push(cache.get(cacheKey)!);
        }

        for (const key of cache.keys()) {
            if (!currentKeys.has(key)) {
                cache.delete(key);
            }
        }

        return result;
    }, [tracks]);

    // MARK: View Region

    const lastViewRegion = useRef<DisplayedRegionModel | null>(null);

    const convertedViewRegion = useMemo(() => {
        try {
            if (lastViewRegion.current) {
                const navContext = lastViewRegion.current.getNavigationContext();
                const parsed = navContext.parse(viewRegion);
                const { start, end } = parsed;

                const newRegion = lastViewRegion.current.clone();
                newRegion.setRegion(start, end);
                lastViewRegion.current = newRegion;
                return newRegion;
            } else {
                const navContext = genomeConfig.navContext as NavigationContext;
                const startViewRegion = new DisplayedRegionModel(navContext, ...genomeConfig.defaultRegion);

                const parsed = navContext.parse(viewRegion);
                const { start, end } = parsed;

                startViewRegion.setRegion(start, end);
                lastViewRegion.current = startViewRegion;
                return startViewRegion;
            }
        } catch (e) {
            console.error(e);
            return lastViewRegion.current ||
                new DisplayedRegionModel(genomeConfig.navContext, ...genomeConfig.defaultRegion);
        }
    }, [viewRegion, genomeConfig]);

    const handleTrackSelected = useCallback((selectedTracks: TrackModel[]) => {
        onTrackSelected(selectedTracks.map(convertTrackModelToITrackModel));
    }, [onTrackSelected, convertTrackModelToITrackModel]);

    const handleTrackDeleted = useCallback((currentTracks: TrackModel[]) => {
        onTrackDeleted(currentTracks.map(convertTrackModelToITrackModel));
    }, [onTrackDeleted, convertTrackModelToITrackModel]);

    const handleTrackAdded = useCallback((addedTracks: TrackModel[]) => {
        onTrackAdded(addedTracks.map(convertTrackModelToITrackModel));
    }, [onTrackAdded, convertTrackModelToITrackModel]);

    const handleNewRegion = useCallback((startbase: number, endbase: number) => {
        if (lastViewRegion.current) {
            const newRegion = lastViewRegion.current.clone().setRegion(startbase, endbase);
            onNewRegion(newRegion.currentRegionAsString() as GenomeCoordinate);
        }
    }, [lastViewRegion, onNewRegion]);

    const handleNewRegionSelect = useCallback((startbase: number, endbase: number) => {
        if (lastViewRegion.current) {
            const newRegion = lastViewRegion.current.clone().setRegion(startbase, endbase);
            onNewRegionSelect(newRegion.currentRegionAsString() as GenomeCoordinate);
        }
    }, [lastViewRegion, onNewRegionSelect]);

    return (
        <TrackContainer
            tracks={convertedTracks}
            highlights={highlights}
            genomeConfig={genomeConfig}
            legendWidth={legendWidth}
            showGenomeNav={showGenomeNav}
            onNewRegion={handleNewRegion}
            onNewHighlight={onNewHighlight}
            onTrackSelected={handleTrackSelected}
            onTrackDeleted={handleTrackDeleted}
            onTrackAdded={handleTrackAdded}
            onNewRegionSelect={handleNewRegionSelect}
            viewRegion={convertedViewRegion}
            userViewRegion={convertedViewRegion}
        />
    );
}
