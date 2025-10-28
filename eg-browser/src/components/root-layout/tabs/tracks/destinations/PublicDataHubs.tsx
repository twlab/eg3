import { useMemo, useState } from "react";
import _ from "lodash";

import useCurrentGenome from "@/lib/hooks/useCurrentGenome";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  selectCurrentSession,
  updateCurrentSession,
} from "@/lib/redux/slices/browserSlice";

import FacetTable from "./FacetTable";
import { PlusIcon, CheckIcon } from "@heroicons/react/24/solid";
import { ITrackModel } from "wuepgg3-track";

import {
  addPublicTracksPool,
  selectLoadedPublicHub,
  selectPublicTracksPool,
  updateLoadedPublicHub,
} from "@/lib/redux/slices/hubSlice";
// Local Hooks
import { useElementGeometry } from "@/lib/hooks/useElementGeometry";
import useExpandedNavigationTab from "../../../../../lib/hooks/useExpandedNavigationTab";

// wuepgg3-track Imports
import { DataHubParser, Json5Fetcher, TrackModel } from "wuepgg3-track";

export default function PublicDataHubs() {
  useExpandedNavigationTab();
  const genomeConfig = useCurrentGenome();
  const loadedPublicHub = useAppSelector(selectLoadedPublicHub);
  const publicTracksPool = useAppSelector(selectPublicTracksPool);
  const dispatch = useAppDispatch();
  const currentSession = useAppSelector(selectCurrentSession);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingHubs, setLoadingHubs] = useState<{ [key: string]: boolean }>(
    {}
  );

  const secondaryGenomes: Array<any> = [];
  let selectedGenomeName: any = null;
  if (currentSession) {
    selectedGenomeName = currentSession!.genomeId;
  }

  const selectedGenomeConfig = useMemo(() => {
    // if (selectedGenomeName && selectedGenomeName !== selectedGenomeName) {
    //   return secondaryGenomes.find(
    //     (g) => g.genome.getName() === selectedGenomeName
    //   );
    // }

    return genomeConfig;
  }, [secondaryGenomes, selectedGenomeName, genomeConfig]);

  const groupedHubs = useMemo(() => {
    const hubs = selectedGenomeConfig && selectedGenomeConfig.publicHubList ? selectedGenomeConfig.publicHubList : [];

    const filteredHubs = hubs.filter((hub: any) =>
      Object.values(hub).some((value: any) =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );

    return _.groupBy(filteredHubs, "collection");
  }, [selectedGenomeConfig, searchQuery]);

  const loadHub = async (hub: any) => {
    const parser = new DataHubParser();
    setLoadingHubs((prev) => ({ ...prev, [hub.url]: true }));

    try {
      const json = await new Json5Fetcher().get(hub.url);
      const lastSlashIndex = hub.url.lastIndexOf("/");
      const hubBase = hub.url.substring(0, lastSlashIndex).replace(/\/+$/, "");
      const tracksStartIndex = hub.oldHubFormat ? 1 : 0;

      const tracks = await parser.getTracksInHub(
        json,
        hub.name,
        hub.genome,
        hub.oldHubFormat,
        tracksStartIndex,
        hubBase
      );
      dispatch(addPublicTracksPool([...publicTracksPool, ...tracks]));
      const tracksToShow = tracks.filter((track: any) => track.showOnHubLoad);
      if (tracksToShow.length > 0) {
        dispatch(
          updateCurrentSession({
            tracks: [...currentSession!.tracks, ...tracksToShow],
          })
        );
      }
      dispatch(updateLoadedPublicHub({ ...loadedPublicHub, [hub.url]: true }));
    } catch (error) {
      console.error(error);
      // dispatch(addPublicTracksPool([...publicTracksPool]));
    } finally {
      setLoadingHubs((prev) => {
        const next = { ...prev };
        delete next[hub.url];
        return next;
      });
    }
  };

  const renderHubItem = (hub: any) => {
    const isLoading = loadingHubs[hub.url];
    const isLoaded = loadedPublicHub[hub.url];

    return (
      <div key={hub.url} className="flex items-center justify-between py-1">
        <span className="text-sm">
          {hub.name} ({hub.numTracks} tracks)
        </span>
        <div className="flex-shrink-0 ml-2">
          {isLoading ? (
            <div className="size-6 rounded-md bg-gray-200 flex items-center justify-center">
              <div className="size-4 border-1 border-gray-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <button
              className={`size-6 rounded-md flex items-center justify-center ${isLoaded
                ? "bg-green-200 dark:bg-green-900 hover:bg-green-300 dark:hover:bg-green-800"
                : "bg-secondary hover:bg-purple-200 dark:bg-dark-secondary"
                }`}
              onClick={() => loadHub(hub)}
              disabled={isLoaded || isLoading}
            >
              {isLoaded ? (
                <CheckIcon className="size-4 text-green-700 dark:text-dark-primary" />
              ) : (
                <PlusIcon className="size-4 text-primary dark:text-dark-primary" />
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  const searchBarGeometry = useElementGeometry();

  const renderSearchBar = () => (
    <div
      ref={searchBarGeometry.ref}
      className="sticky top-0 z-20 pb-2 bg-white dark:bg-dark-background"
    >
      <input
        type="text"
        placeholder="Search hubs..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
      />
    </div>
  );

  const renderHubGroup = (collection: string, hubs: any[]) => (
    <div key={collection} className="mb-4 relative">
      <h2
        className="text-base font-medium mb-1 sticky z-10 py-2 bg-white dark:bg-dark-background"
        style={{
          top: `${searchBarGeometry.height}px`,
        }}
      >
        {collection}
      </h2>
      <div className="pl-3 border-l border-gray-200">
        {hubs.map((hub) => renderHubItem(hub))}
      </div>
    </div>
  );

  const addedTrackUrls = useMemo(() => {
    if (currentSession) {
      return new Set(
        currentSession.tracks.map((track) => track.url || track.name)
      );
    } else {
      return new Set();
    }
  }, [currentSession]);
  function onTracksAdded(tracks: TrackModel[]) {
    if (currentSession) {
      dispatch(
        updateCurrentSession({
          tracks: [...currentSession.tracks, ...tracks],
        })
      );
    }
  }
  return (
    <div>
      {currentSession && publicTracksPool.length > 0 ? (
        <div>
          <h2 className="text-base font-medium mb-4">Available Tracks</h2>
          <FacetTable
            tracks={publicTracksPool}
            addedTracks={currentSession!.tracks as ITrackModel[]}
            onTracksAdded={onTracksAdded}
            publicTrackSets={undefined}
            addedTrackSets={addedTrackUrls as Set<string>}
            addTermToMetaSets={() => { }}
            contentColorSetup={{ color: "#222", background: "white" }}
          />
        </div>
      ) : (
        ""
      )}
      {renderSearchBar()}
      <div>
        {Object.entries(groupedHubs).map(([collection, hubs]) =>
          renderHubGroup(collection, hubs)
        )}
      </div>
    </div>
  );
}
