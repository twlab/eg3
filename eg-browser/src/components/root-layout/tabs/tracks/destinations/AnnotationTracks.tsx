import { useMemo } from "react";
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

export default function AnnotationTracks() {
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectCurrentSession);
  const genomeConfig = useCurrentGenome();

  const selectedIds = useMemo(() => {
    return new Set(session?.tracks.map((track) => track.name));
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

  return (
    <>
      {combinedGenomeData.map((genomeData) => (
        <CollectionView
          key={genomeData.genomeName}
          data={genomeData.tracks}
          selectedIds={selectedIds}
          onSelect={handleSelect}
        />
      ))}
    </>
  );
}
