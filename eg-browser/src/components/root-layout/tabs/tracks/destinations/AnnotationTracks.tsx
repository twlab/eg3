import { useMemo } from "react";

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

  const data = useMemo(() => {
    const tracks = genomeConfig?.annotationTracks || {};

    return Object.entries(tracks).flatMap(([section, value]) => {
      let trackList: any[] = [];

      if (Array.isArray(value) && value.length > 0 && Array.isArray(value[0])) {
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
        id: track.name || track.url,
        title: track.label ?? track.name,
        data: track,
      }));
    });
  }, [genomeConfig]);

  const handleSelect = (item: ICollectionViewDataSource<any>) => {
    const track = item.data;

    track.metadata = {
      ...track.metadata,
      genome: session?.genomeId,
    };

    dispatch(
      updateCurrentSession({
        tracks: [...session!.tracks, track],
      })
    );
  };

  return (
    <CollectionView
      data={data}
      selectedIds={selectedIds}
      onSelect={handleSelect}
    />
  );
}
