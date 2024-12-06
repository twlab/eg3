import NavigationStack, { NavigationDestination } from "@/components/core-navigation/NavigationStack";
import DescriptiveNavigationLink from "@/components/ui/navigation/DescriptiveNavigationLink";
import { useMemo } from "react";


export default function ShareTab() {

    const destinations: NavigationDestination[] = useMemo(() => [

    ], []);

    return (
        <NavigationStack destinations={destinations} rootOptions={{ title: 'Apps' }}>
            <DescriptiveNavigationLink
                path="annotation"
                title="Annotation Tracks"
                description="View and manage genomic annotation tracks like genes, transcripts, and regulatory elements"
            />
        </NavigationStack>
    )
}
