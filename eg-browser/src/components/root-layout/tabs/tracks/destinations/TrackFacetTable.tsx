import TabView from "@/components/ui/tab-view/TabView";

export default function TrackFacetTable() {

    return (
        <TabView
            tabs={[
                {
                    label: "Public",
                    value: "public",
                    component: <div>Public</div>
                },
                {
                    label: "Private",
                    value: "private",
                    component: <div>Private</div>
                }
            ]}
        />
    )
}
