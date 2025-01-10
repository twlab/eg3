import { useMemo, useState } from "react";
import _ from "lodash";
import DataHubParser from "../../../../../../../eg-core/src/eg-lib/model/DataHubParser";
// import FacetTable from "@/components/GenomeView/TabComponents/FacetTable";
import CollectionView, { ICollectionViewDataSource } from "@/components/ui/collection/CollectionView";
import useCurrentGenomeConfig from "@/lib/hooks/useCurrentGenomeConfig";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { selectCurrentSession, updateCurrentSession } from "@/lib/redux/slices/browserSlice";
import { fetchDataHubTracks } from "@eg/core";
import { ITrackModel } from "@eg/tracks";

export default function PublicDataHubs() {
    const [loadedHubs, setLoadedHubs] = useState<Set<string>>(new Set());

    const genomeConfig = useCurrentGenomeConfig();
    const session = useAppSelector(selectCurrentSession);
    const dispatch = useAppDispatch();

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
            const fetchedTracks: ITrackModel[] = await fetchDataHubTracks(hub);

            if (fetchedTracks.length > 0) {
                dispatch(updateCurrentSession({
                    tracks: [...session!.tracks, ...fetchedTracks]
                }));
            }
        } catch (error) {
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
