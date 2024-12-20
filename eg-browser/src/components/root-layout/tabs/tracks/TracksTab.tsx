import { useMemo } from "react";
import NavigationStack, { NavigationDestination } from "../../../core-navigation/NavigationStack";
import DescriptiveNavigationLink from "../../../ui/navigation/DescriptiveNavigationLink";
import AnnotationTracks from "./destinations/AnnotationTracks";

export default function TracksTab() {

    const destinations: NavigationDestination[] = useMemo(() => [
        {
            path: 'annotation',
            component: AnnotationTracks,
            options: {
                title: "Annotation Tracks"
            }
        },
    ], []);

    return (
        <NavigationStack destinations={destinations} rootOptions={{ title: 'Tracks' }}>
            <div className="flex flex-col gap-4">
                <DescriptiveNavigationLink 
                    path="annotation"
                    title="Annotation Tracks" 
                    description="View and manage genomic annotation tracks like genes, transcripts, and regulatory elements" 
                />
                <DescriptiveNavigationLink 
                    path="public-data-hubs"
                    title="Public Data Hubs" 
                    description="Connect to public genomic data repositories and track collections" 
                />
                <DescriptiveNavigationLink 
                    path="track-facet-table"
                    title="Track Facet Table" 
                    description="Organize and filter tracks using customizable categories and metadata" 
                />
                <DescriptiveNavigationLink 
                    path="remote-tracks"
                    title="Remote Tracks" 
                    description="Access and manage tracks from remote servers and databases" 
                />
                <DescriptiveNavigationLink 
                    path="local-tracks"
                    title="Local Tracks" 
                    description="Manage tracks loaded from your local files" 
                />
                <DescriptiveNavigationLink 
                    path="local-text-tracks"
                    title="Local Text Tracks" 
                    description="Create and edit simple text-based genomic tracks" 
                />
                <DescriptiveNavigationLink 
                    path="track-list"
                    title="Track List" 
                    description="View all available tracks in a comprehensive list format" 
                />
            </div>
        </NavigationStack>
    )
}
