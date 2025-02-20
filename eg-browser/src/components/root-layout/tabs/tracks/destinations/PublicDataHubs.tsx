import { useMemo, useState } from "react";
import _ from "lodash";
import CollectionView, { ICollectionViewDataSource } from "@/components/ui/collection/CollectionView";
import useCurrentGenomeConfig from "@/lib/hooks/useCurrentGenomeConfig";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { selectCurrentSession, updateCurrentSession } from "@/lib/redux/slices/browserSlice";
import { fetchDataHubTracks } from "@eg/core";
import { ITrackModel } from "@eg/tracks";
import { addPublicTracksPool } from "@/lib/redux/slices/hubSlice";

export default function PublicDataHubs() {
    const genomeConfig = useCurrentGenomeConfig();
    const dispatch = useAppDispatch();
    const session = useAppSelector(selectCurrentSession);

    const [loadedHubs, setLoadedHubs] = useState<Set<string>>(new Set());

    const data = useMemo(() => {
        const hubs = genomeConfig?.publicHubList || [];

        return hubs.map(hub => ({
            section: hub.collection,
            id: hub.url,
            title: `${hub.name} (${hub.numTracks} tracks)`,
            data: hub
        }));
    }, [genomeConfig]);

    const loadHub = async (hub: any) => {
        setLoadedHubs(prev => new Set([...prev, hub.url]));

        try {
            const fetchedTracks: ITrackModel[] = await fetchDataHubTracks(hub).then(tracks => tracks.map<ITrackModel>(track => ({
                ...track,
                id: crypto.randomUUID(),
                isSelected: false,
            })));
            dispatch(addPublicTracksPool(fetchedTracks));

            if (fetchedTracks.length > 0) {
                dispatch(updateCurrentSession({
                    tracks: [...session!.tracks, ...fetchedTracks]
                }));
            }
        } catch {
            setLoadedHubs(prev => {
                const next = new Set(prev);
                next.delete(hub.url);
                return next;
            });
        }
    };

    const handleSelect = (item: ICollectionViewDataSource<any>) => {
        loadHub(item.data);
    };

    return (
        <div>
            <CollectionView
                data={data}
                onSelect={handleSelect}
                selectedIds={loadedHubs}
            />

            {/* {session?.publicTracksPool?.length > 0 && (
                <div>
                    <h2 className="text-base font-medium mb-4">Available Tracks</h2>
                    <FacetTable
                        tracks={session.publicTracksPool}
                        addedTracks={session.tracks}
                        addedTrackSets={new Set(session.tracks.map(track => track.url || track.name))}
                        contentColorSetup={{ color: "#222", background: "white" }}
                    />
                </div>
            )} */}
        </div>
    );
}
