import { useMemo } from "react";
import NavigationStack, { NavigationDestination } from "../../../core-navigation/NavigationStack";
import NavigationLink from "../../../ui/navigation/NavigationLink";
import AnnotationTracks from "./destinations/AnnotationTracks";
import { useGenome } from "@/lib/contexts/GenomeContext";
import SelectGenome from "./destinations/SelectGenome";
import PublicDataHubs from "./destinations/PublicDataHubs";
import TrackFacetTable from "./destinations/TrackFacetTable";
import RemoteTracks from "./destinations/RemoteTracks";
import LocalTracks from "./destinations/LocalTracks";
import LocalTextTracks from "./destinations/LocalTextTracks";
import TrackList from "./destinations/TrackList";

export default function TracksTab() {
    const { viewRegion, secondaryGenomes } = useGenome();

    const destinations: NavigationDestination[] = useMemo(() => [
        {
            path: 'annotation',
            component: AnnotationTracks,
            options: {
                title: "Annotation Tracks"
            }
        },
        {
            path: 'select-genome',
            component: SelectGenome,
            options: {
                title: "Select Genome"
            }
        },
        {
            path: 'public-data-hubs',
            component: PublicDataHubs,
            options: {
                title: "Public Data Hubs"
            }
        },
        {
            path: 'track-facet-table',
            component: TrackFacetTable,
            options: {
                title: "Track Facet Table"
            }
        },
        {
            path: 'remote-tracks',
            component: RemoteTracks,
            options: {
                title: "Remote Tracks"
            }
        },
        {
            path: 'local-tracks',
            component: LocalTracks,
            options: {
                title: "Local Tracks"
            }
        },
        {
            path: 'local-text-tracks',
            component: LocalTextTracks,
            options: {
                title: "Local Text Tracks"
            }
        },
        {
            path: 'track-list',
            component: TrackList,
            options: {
                title: "Track List"
            }
        }
    ], []);

    return (
        <NavigationStack destinations={destinations} rootOptions={{ title: 'Tracks' }}>
            <div className="flex flex-col gap-4">
                <NavigationLink
                    path={secondaryGenomes.length > 0 ? "select-genome" : "annotation"}
                    params={{ destination: "annotation" }}
                    title="Annotation Tracks"
                    description="View and manage genomic annotation tracks like genes, transcripts, and regulatory elements"
                />
                <NavigationLink
                    path="public-data-hubs"
                    title="Public Data Hubs"
                    description="Connect to public genomic data repositories and track collections"
                />
                <NavigationLink
                    path="track-facet-table"
                    title="Track Facet Table"
                    description="Organize and filter tracks using customizable categories and metadata"
                />
                <NavigationLink
                    path="remote-tracks"
                    title="Remote Tracks"
                    description="Access and manage tracks from remote servers and databases"
                />
                <NavigationLink
                    path="local-tracks"
                    title="Local Tracks"
                    description="Manage tracks loaded from your local files"
                />
                <NavigationLink
                    path="local-text-tracks"
                    title="Local Text Tracks"
                    description="Create and edit simple text-based genomic tracks"
                />
                <NavigationLink
                    path="track-list"
                    title="Track List"
                    description="View all available tracks in a comprehensive list format"
                />
            </div>
        </NavigationStack>
    )
}
