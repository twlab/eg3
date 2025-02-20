import { useState } from "react";
import RegionSetCreator from "./RegionSetCreator";
import { useNavigation } from "@/components/core-navigation/NavigationStack";
import DescriptiveNavigationLink from "@/components/ui/navigation/DescriptiveNavigationLink";
import RegionSetViewEdit from "./RegionSetViewEdit";

interface RegionSet {
    id: string;
    name: string;
    elements: string[];
}

export default function RegionSetView() {
    const [regionSets, setRegionSets] = useState<RegionSet[]>([]);

    return (
        <div className="pt-4 h-full">
            {regionSets.length === 0 ? (
                <RegionSetCreator />
            ) : (
                <div className="flex flex-col gap-4">
                    <DescriptiveNavigationLink
                        title="Create Region Set"
                        description="Create a new region set"
                        path="region-set-view/create"
                    />

                    {regionSets.map((regionSet) => (
                        <DescriptiveNavigationLink
                            key={regionSet.id}
                            title={regionSet.name}
                            path="region-set-view/edit"
                            params={{ id: regionSet.id }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
