import FacetTable from "@/components/ui/facet-table/FacetTable";
import TabView from "@/components/ui/tab-view/TabView";
import useExpandedNavigationTab from "@/lib/hooks/useExpandedNavigationTab";
import { useAppSelector } from "@/lib/redux/hooks";
import { selectCurrentSession } from "@/lib/redux/slices/browserSlice";
import { selectPublicTracksPool } from "@/lib/redux/slices/hubSlice";

export default function TrackFacetTable() {
    useExpandedNavigationTab();

    return (
        <TabView
            tabs={[
                {
                    label: "Public",
                    value: "public",
                    component: <PublicTracks />
                },
                {
                    label: "Custom",
                    value: "custom",
                    component: <div>Custom</div>
                }
            ]}
        />
    )
}

function PublicTracks() {
    const session = useAppSelector(selectCurrentSession)!;
    const publicTracksPool = useAppSelector(selectPublicTracksPool);

    return (
        <FacetTable
            tracks={publicTracksPool}
            addedTracks={session.tracks}
            addTermToMetaSets={() => {}}
            addedTrackSets={new Set()}
            contentColorSetup={{}}
        />
    );
}

function CustomTracks() {
    return (
        null
    )
}
