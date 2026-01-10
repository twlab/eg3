import { useMemo, useState } from "react";
import { getGenomeConfig } from "wuepgg3-track";
import CollectionView, {
  ICollectionViewDataSource,
} from "@/components/ui/collection/CollectionView";
import useCurrentGenome from "@/lib/hooks/useCurrentGenome";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  selectCurrentSession,
  updateCurrentSession,
} from "@/lib/redux/slices/browserSlice";
import { ChevronDownIcon } from "@heroicons/react/24/solid";

export default function AnnotationTracks() {
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectCurrentSession);
  const genomeConfig = useCurrentGenome();
  const [expandedGenomes, setExpandedGenomes] = useState<Set<string>>(
    new Set([genomeConfig?.name].filter(Boolean) as string[])
  );

  const selectedIds = useMemo(() => {
    return new Set(session?.tracks.map((track) => {
      let trackId
      if (track.type === "genomealign") {

        trackId = track.url;
      } else {
        trackId = track.name
      }
      return trackId
    }));
  }, [session?.tracks]);

  const combinedGenomeData = useMemo(() => {
    const querySet = new Set<string>();
    const resultArr: Array<any> = [];

    // find annotation from primary genome
    if (genomeConfig) {
      const tracks = genomeConfig.annotationTracks || {};
      resultArr.push({
        genomeName: genomeConfig.name ?? "none",
        tracks: Object.entries(tracks).flatMap(([section, value]) => {
          let trackList: any[] = [];

          if (
            Array.isArray(value) &&
            value.length > 0 &&
            Array.isArray(value[0])
          ) {
            trackList = value.flat();
          } else if (
            !Array.isArray(value) &&
            typeof value === "object" &&
            value !== null
          ) {
            trackList = Object.values(value as Record<string, unknown>).flat();
          } else {
            trackList = Array.isArray(value) ? value : [value];
          }

          return trackList.map((track) => ({
            section,
            genomeName: genomeConfig.name ?? "none",
            id: track.name || track.url,
            title: track.label ?? track.name,
            data: track,
          }));
        }),
      });
    }

    // find queryGenome genome geomealign
    if (session?.tracks && genomeConfig) {
      for (let i = 0; i < session.tracks.length; i++) {
        const track = session.tracks[i];
        const queryGenome = track["querygenome"]
          ? track.querygenome
          : track.metadata?.genome
            ? track.metadata.genome
            : null;
        if (
          queryGenome &&
          queryGenome !== genomeConfig.name &&
          !querySet.has(queryGenome)
        ) {
          const queryGenomeConfig = getGenomeConfig(queryGenome);
          const queryAnnotationTracks =
            queryGenomeConfig?.annotationTracks || {};
          querySet.add(queryGenome);
          resultArr.push({
            genomeName: queryGenome,
            tracks: Object.entries(queryAnnotationTracks).flatMap(
              ([section, value]) => {
                let trackList: any[] = [];

                if (
                  Array.isArray(value) &&
                  value.length > 0 &&
                  Array.isArray(value[0])
                ) {
                  trackList = value.flat();
                } else if (
                  !Array.isArray(value) &&
                  typeof value === "object" &&
                  value !== null
                ) {
                  trackList = Object.values(
                    value as Record<string, unknown>
                  ).flat();
                } else {
                  trackList = Array.isArray(value) ? value : [value];
                }

                return trackList.map((track) => ({
                  section,
                  genomeName: queryGenomeConfig?.genome.getName() ?? "none",
                  id: track.name || track.url,
                  title: track.label ?? track.name,
                  data: track,
                }));
              }
            ),
          });
        }
      }
    }

    return resultArr;
  }, [genomeConfig, session?.tracks]);

  const handleSelect = (item: ICollectionViewDataSource<any>) => {
    const track = { ...item.data };

    track.metadata = {
      ...track.metadata,
      genome: item && item.genomeName ? item.genomeName : "none",
    };

    dispatch(
      updateCurrentSession({
        tracks: [...session!.tracks, track],
      })
    );
  };

  const toggleGenome = (genomeName: string) => {
    setExpandedGenomes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(genomeName)) {
        newSet.delete(genomeName);
      } else {
        newSet.add(genomeName);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-3">
      {combinedGenomeData.map((genomeData) => {
        const isExpanded = expandedGenomes.has(genomeData.genomeName);
        const isPrimary = genomeData.genomeName === genomeConfig?.name;

        return (
          <div
            key={genomeData.genomeName}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-dark-background shadow-sm"
          >
            <button
              onClick={() => toggleGenome(genomeData.genomeName)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
            >
              <div className="flex items-center gap-2">
                <ChevronDownIcon
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'
                    }`}
                />
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {genomeData.genomeName}
                </span>
                {isPrimary && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                    Primary
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {genomeData.tracks.length} track{genomeData.tracks.length !== 1 ? 's' : ''}
              </span>
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <CollectionView
                  isPrimaryGenome={isPrimary}
                  data={genomeData.tracks}
                  selectedIds={selectedIds}
                  onSelect={handleSelect}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
