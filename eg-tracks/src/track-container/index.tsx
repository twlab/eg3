import {
  GenomeCoordinate,
  ITrackContainerRepresentableProps,
  ITrackContainerState,
  ITrackModel,
} from "../types";
import GenomeRoot from "@eg/tracks/src/components/GenomeView/GenomeRoot";
import { useCallback, useMemo, useRef } from "react";
import { TrackModel } from "@eg/core/src/eg-lib/models/TrackModel";
import NavigationContext from "@eg/core/src/eg-lib/models/NavigationContext";
import DisplayedRegionModel from "@eg/core/src/eg-lib/models/DisplayedRegionModel";

export function TrackContainer(props: ITrackContainerState) {
  return (
    <GenomeRoot
      tracks={props.tracks}
      genomeConfig={props.genomeConfig}
      highlights={props.highlights}
      legendWidth={props.legendWidth}
      showGenomeNav={props.showGenomeNav}
      onNewRegion={props.onNewRegion}
      onNewHighlight={props.onNewHighlight}
      onTrackSelected={props.onTrackSelected}
      onTrackDeleted={props.onTrackDeleted}
      onNewRegionSelect={props.onNewRegionSelect}
      onTrackAdded={props.onTrackAdded}
      viewRegion={props.viewRegion}
      userViewRegion={props.userViewRegion}
      tool={props.tool}
    />
  );
}

/**
 * TrackContainerRepresentable serves as the boundary between the new serializable TrackModel and the previous
 * class-based TrackModel.
 *
 * New serializable state is actively converted to the class-based state and passed to the TrackContainer.
 */
export function TrackContainerRepresentable({
  tracks,
  highlights,
  genomeConfig,
  legendWidth,
  showGenomeNav,
  onNewRegion,
  onNewHighlight,
  onTrackSelected,
  onTrackDeleted,
  onTrackAdded,
  onNewRegionSelect,
  viewRegion,
  userViewRegion,
  tool,
}: ITrackContainerRepresentableProps) {
  // MARK: Tracks

  const trackCache = useRef(new Map<string, TrackModel>());

  const convertTrackModelToITrackModel = useCallback(
    (track: TrackModel): ITrackModel => ({
      name: track.name,
      type: track.type,
      filetype: track.filetype,
      options: track.options,
      url: track.url,
      indexUrl: track.indexUrl,
      metadata: track.metadata,
      queryEndpoint: track.queryEndpoint,
      querygenome: track.querygenome,
      id: track.id,
      isSelected: track.isSelected,
    }),
    []
  );

  const convertedTracks = useMemo(() => {
    const cache = trackCache.current;

    const getCacheKey = (track: ITrackModel) => {
      return JSON.stringify({
        name: track.name,
        type: track.type,
        filetype: track.filetype,
        options: track.options,
        url: track.url,
        indexUrl: track.indexUrl,
        metadata: track.metadata,
        queryEndpoint: track.queryEndpoint,
        querygenome: track.querygenome,
        id: track.id,
      });
    };

    const result: TrackModel[] = [];
    const currentKeys = new Set<string>();

    for (const track of tracks) {
      const cacheKey = getCacheKey(track);
      currentKeys.add(cacheKey);
      if (!cache.has(cacheKey)) {
        cache.set(cacheKey, new TrackModel(track));
      }

      result.push(cache.get(cacheKey)!);
    }

    for (const key of cache.keys()) {
      if (!currentKeys.has(key)) {
        cache.delete(key);
      }
    }

    return result;
  }, [tracks]);
  genomeConfig["defaultTracks"] = convertedTracks;
  // MARK: View Region

  const lastViewRegion = useRef<DisplayedRegionModel | null>(null);
  const lastUserViewRegion = useRef<DisplayedRegionModel | null>(null);
  const convertedViewRegion = useMemo(() => {
    try {
      if (lastViewRegion.current) {
        const navContext = lastViewRegion.current.getNavigationContext();
        const parsed = navContext.parse(viewRegion);
        const { start, end } = parsed;

        const newRegion = lastViewRegion.current.clone();
        newRegion.setRegion(start, end);
        lastViewRegion.current = newRegion;
        return newRegion;
      } else {
        const navContext = genomeConfig.navContext as NavigationContext;
        const startViewRegion = new DisplayedRegionModel(
          navContext,
          ...genomeConfig.defaultRegion
        );

        const parsed = navContext.parse(viewRegion);
        const { start, end } = parsed;

        startViewRegion.setRegion(start, end);
        lastViewRegion.current = startViewRegion;
        return startViewRegion;
      }
    } catch (e) {
      console.error(e);
      return (
        lastViewRegion.current ||
        new DisplayedRegionModel(
          genomeConfig.navContext,
          ...genomeConfig.defaultRegion
        )
      );
    }
  }, [viewRegion, genomeConfig]);
  const convertedUserViewRegion = useMemo(() => {
    try {
      if (lastUserViewRegion.current) {
        const navContext = lastUserViewRegion.current.getNavigationContext();
        const parsed = navContext.parse(userViewRegion!);
        const { start, end } = parsed;

        const newRegion = lastUserViewRegion.current.clone();
        newRegion.setRegion(start, end);
        lastUserViewRegion.current = newRegion;
        return newRegion;
      } else {
        const navContext = genomeConfig.navContext as NavigationContext;
        const startViewRegion = new DisplayedRegionModel(
          navContext,
          ...genomeConfig.defaultRegion
        );

        const parsed = navContext.parse(userViewRegion!);
        const { start, end } = parsed;

        startViewRegion.setRegion(start, end);
        lastUserViewRegion.current = startViewRegion;
        return startViewRegion;
      }
    } catch (e) {
      console.error(e);
      return (
        lastUserViewRegion.current ||
        new DisplayedRegionModel(
          genomeConfig.navContext,
          ...genomeConfig.defaultRegion
        )
      );
    }
  }, [userViewRegion, genomeConfig]);

  const handleTrackSelected = useCallback(
    (selectedTracks: TrackModel[]) => {
      onTrackSelected(selectedTracks.map(convertTrackModelToITrackModel));
    },
    [onTrackSelected, convertTrackModelToITrackModel]
  );

  const handleTrackDeleted = useCallback(
    (currentTracks: TrackModel[]) => {
      onTrackDeleted(currentTracks.map(convertTrackModelToITrackModel));
    },
    [onTrackDeleted, convertTrackModelToITrackModel]
  );

  const handleTrackAdded = useCallback(
    (addedTracks: TrackModel[]) => {
      onTrackAdded(addedTracks.map(convertTrackModelToITrackModel));
    },
    [onTrackAdded, convertTrackModelToITrackModel]
  );

  const handleNewRegion = useCallback(
    (startbase: number, endbase: number) => {
      if (lastUserViewRegion.current) {
        const newRegion = lastUserViewRegion.current
          .clone()
          .setRegion(startbase, endbase);
        onNewRegion(newRegion.currentRegionAsString() as GenomeCoordinate);
      }
    },
    [lastUserViewRegion, onNewRegion]
  );

  const handleNewRegionSelect = useCallback(
    (startbase: number, endbase: number) => {
      if (lastViewRegion.current) {
        const newRegion = lastViewRegion.current
          .clone()
          .setRegion(startbase, endbase);
        onNewRegionSelect(
          newRegion.currentRegionAsString() as GenomeCoordinate
        );
      }
    },
    [lastViewRegion, onNewRegionSelect]
  );

  return (
    <TrackContainer
      tracks={convertedTracks}
      highlights={highlights}
      genomeConfig={genomeConfig}
      legendWidth={legendWidth}
      showGenomeNav={showGenomeNav}
      onNewRegion={handleNewRegion}
      onNewHighlight={onNewHighlight}
      onTrackSelected={handleTrackSelected}
      onTrackDeleted={handleTrackDeleted}
      onTrackAdded={handleTrackAdded}
      onNewRegionSelect={handleNewRegionSelect}
      viewRegion={convertedViewRegion}
      userViewRegion={convertedUserViewRegion}
      tool={tool}
    />
  );
}
