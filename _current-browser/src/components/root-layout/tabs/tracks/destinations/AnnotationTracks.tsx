import { NavigationComponentProps } from "@/components/core-navigation/NavigationStack";
import { useGenome } from "@/lib/contexts/GenomeContext";
import { TrackModel } from "@/models/TrackModel";
import { PlusIcon, CheckIcon } from "@heroicons/react/24/solid";
import { useMemo, useState } from "react";
import { useElementGeometry } from "@/lib/hooks/useElementGeometry";

export default function AnnotationTracks({ params }: NavigationComponentProps) {
  const { state, onTracksAdded, genomeConfig, secondaryGenomes } = useGenome();
  const [searchQuery, setSearchQuery] = useState("");
  const searchBarGeometry = useElementGeometry();

  const selectedGenomeName = params?.genome;

  const tracksUrlSets = useMemo(
    () =>
      new Set([
        ...state.tracks.filter((track) => track.url).map((track) => track.url),
        ...state.tracks
          .filter((track) => !track.url)
          .map((track) => track.name),
      ]),
    [state.tracks]
  );

  const groupedTrackSets = useMemo(() => {
    const grouped = {};
    state.tracks.forEach((track) => {
      const gname = track.getMetadata("genome");
      const targeName = gname ? gname : genomeConfig.genome.getName();
      if (grouped[targeName]) {
        grouped[targeName].add(track.url || track.name);
      } else {
        grouped[targeName] = new Set([track.url || track.name]);
      }
    });
    return grouped;
  }, [state.tracks, genomeConfig]);

  const selectedGenomeConfig = useMemo(() => {
    if (
      selectedGenomeName &&
      selectedGenomeName !== genomeConfig.genome.getName()
    ) {
      return secondaryGenomes.find(
        (g) => g.genome.getName() === selectedGenomeName
      );
    }
    return genomeConfig;
  }, [secondaryGenomes, selectedGenomeName]);

  const organizedTracks = useMemo(() => {
    const tracks = selectedGenomeConfig?.annotationTracks || {};
    return Object.entries(tracks)
      .map(([key, value]) => {
        if (Array.isArray(value) && value.length > 0 && Array.isArray(value[0])) {
          return {
            name: key,
            tracks: value.flat().filter(track =>
              Object.values(track).some(val =>
                String(val).toLowerCase().includes(searchQuery.toLowerCase())
              )
            ),
          };
        }

        if (!Array.isArray(value) && typeof value === "object" && value !== null) {
          return {
            name: key,
            tracks: Object.values(value as Record<string, unknown>)
              .flat()
              .filter(track =>
                Object.values(track as object).some(val =>
                  String(val).toLowerCase().includes(searchQuery.toLowerCase())
                )
              ),
          };
        }

        const tracks = Array.isArray(value) ? value : [value];
        return {
          name: key,
          tracks: tracks.filter(track =>
            Object.values(track).some(val =>
              String(val).toLowerCase().includes(searchQuery.toLowerCase())
            )
          ),
        };
      })
      .filter(group => group.tracks.length > 0); // Only show groups with matching tracks
  }, [selectedGenomeConfig, searchQuery]);

  const addTrack = (track: any) => {
    const trackModel = new TrackModel(track);
    const genomeName = selectedGenomeConfig.genome.getName();
    const label = `${trackModel.label} (${genomeName})`;
    trackModel.label = label;
    trackModel.options = { ...trackModel.options, label };
    trackModel.metadata = { ...trackModel.metadata, genome: genomeName };
    onTracksAdded([trackModel]);
  };

  const isTrackAdded = (track: any) => {
    const genomeName = selectedGenomeConfig.genome.getName();
    return (
      groupedTrackSets[genomeName]?.has(track.name) ||
      groupedTrackSets[genomeName]?.has(track.url)
    );
  };

  const renderTrackItem = (track: any) => (
    <div key={track.name} className="flex items-center justify-between py-1">
      <span className="text-sm">{track.label ?? track.name}</span>
      {isTrackAdded(track) ? (
        <div className="w-6 h-6 rounded-md bg-green-200 flex items-center justify-center">
          <CheckIcon className="w-4 h-4" />
        </div>
      ) : (
        <button
          className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center hover:bg-purple-200"
          onClick={() => addTrack(track)}
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  const renderTrackGroup = (groupName: string, tracks: any[]) => (
    <div key={groupName} className="mb-4 relative">
      <h2
        className="text-base font-medium mb-1 sticky bg-white z-10 py-2"
        style={{ top: `${searchBarGeometry.height}px` }}
      >
        {groupName}
      </h2>
      <div className="pl-3 border-l border-gray-200">
        {tracks.map((track) => renderTrackItem(track))}
      </div>
    </div>
  );

  const renderSearchBar = () => (
    <div
      ref={searchBarGeometry.ref}
      className="sticky top-0 bg-white z-20 pb-2"
    >
      <input
        type="text"
        placeholder="Search tracks..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
      />
    </div>
  );

  return (
    <div>
      {renderSearchBar()}
      {organizedTracks.map((group) =>
        renderTrackGroup(group.name, group.tracks)
      )}
    </div>
  );
}
