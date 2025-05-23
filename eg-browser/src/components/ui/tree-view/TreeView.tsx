import React, { useState, useEffect, useCallback } from "react";
import _ from "lodash";
import { ITrackModel, variableIsObject } from "@eg/tracks";

const DEFAULT_GROUP = "Sample";
const UNUSED_META_KEY = "notused";

type TreeViewProps = {
  tracks: ITrackModel[];
  addedTracks: ITrackModel[];
  onTracksAdded?: (tracks: ITrackModel[]) => void;
  addTermToMetaSets: (keys: string[]) => void;
  addedTrackSets: Set<string>;
  publicTrackSets?: Set<string>;
};

export default function TreeView({
  tracks,
  addedTracks,
  onTracksAdded,
  addTermToMetaSets,
  addedTrackSets,
  publicTrackSets,
}: TreeViewProps) {
  const [state, setState] = useState<{
    tracks: ITrackModel[];
    groupedTracks: Record<string, ITrackModel[]>;
    metaKeys: string[];
    selectedGroup: string;
    expandedGroups: Set<string>;
  }>({
    tracks: [],
    groupedTracks: {},
    metaKeys: [],
    selectedGroup: DEFAULT_GROUP,
    expandedGroups: new Set(),
  });

  const initializeTracks = useCallback(
    (allTracks: ITrackModel[]) => {
      const allKeys = allTracks.map((track) => Object.keys(track.metadata));
      const metaKeys = _.union(...allKeys);
      addTermToMetaSets(metaKeys);

      const selectedGroup = metaKeys.includes(DEFAULT_GROUP)
        ? DEFAULT_GROUP
        : metaKeys[0];

      const groupedTracks = allTracks.reduce((acc, track) => {
        const metaValue = track.metadata[selectedGroup];
        const key = variableIsObject(metaValue)
          ? metaValue.name
          : Array.isArray(metaValue)
          ? metaValue[0]
          : metaValue;

        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(track);
        return acc;
      }, {} as Record<string, ITrackModel[]>);

      setState((prev) => ({
        ...prev,
        tracks: allTracks,
        groupedTracks,
        metaKeys,
        selectedGroup,
      }));
    },
    [addTermToMetaSets]
  );

  useEffect(() => {
    initializeTracks(tracks);
  }, [tracks, initializeTracks]);

  const toggleGroup = (groupName: string) => {
    setState((prev) => {
      const newExpanded = new Set(prev.expandedGroups);
      if (newExpanded.has(groupName)) {
        newExpanded.delete(groupName);
      } else {
        newExpanded.add(groupName);
      }
      return { ...prev, expandedGroups: newExpanded };
    });
  };

  const handleGroupChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newGroup = event.target.value;
    setState((prev) => ({
      ...prev,
      selectedGroup: newGroup,
      expandedGroups: new Set(),
    }));
    initializeTracks(tracks);
  };

  if (!state.tracks.length) {
    return <p className="text-gray-500">Loading...</p>;
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Group by:
          <select
            value={state.selectedGroup}
            onChange={handleGroupChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {state.metaKeys.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-2">
        {Object.entries(state.groupedTracks).map(([groupName, groupTracks]) => {
          const isExpanded = state.expandedGroups.has(groupName);
          const addedCount = groupTracks.filter(
            (track) =>
              addedTrackSets?.has(track.url) || addedTrackSets?.has(track.name)
          ).length;

          return (
            <div key={groupName} className="border rounded-lg shadow-sm">
              <button
                onClick={() => toggleGroup(groupName)}
                className="w-full px-4 py-2 text-left flex items-center justify-between hover:bg-gray-50"
              >
                <span className="font-medium">{groupName}</span>
                <span className="text-sm text-gray-500">
                  {addedCount}/{groupTracks.length}
                  <span className="ml-2">{isExpanded ? "▼" : "▶"}</span>
                </span>
              </button>

              {isExpanded && (
                <div className="p-4 border-t">
                  <div className="space-y-2">
                    {groupTracks.map((track) => (
                      <div
                        key={track.url}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{track.name}</span>
                        <button
                          onClick={() => onTracksAdded?.([track])}
                          className={`px-3 py-1 rounded-md ${
                            addedTrackSets?.has(track.url) ||
                            addedTrackSets?.has(track.name)
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                          }`}
                        >
                          {addedTrackSets?.has(track.url) ||
                          addedTrackSets?.has(track.name)
                            ? "Added"
                            : "Add"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
