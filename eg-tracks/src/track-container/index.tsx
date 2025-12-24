import {
  GenomeCoordinate,
  ITrackContainerRepresentableProps,
  ITrackModel,
} from "../types";
import GenomeRoot from "../components/GenomeView/GenomeRoot";
import { useCallback, useMemo, useRef, useState } from "react";
import { TrackModel } from "../models/TrackModel";
import NavigationContext from "../models/NavigationContext";
import DisplayedRegionModel from "../models/DisplayedRegionModel";
import GenomeSerializer from "../genome-hub/GenomeSerializer";
import RegionSet from "../models/RegionSet";
import { FeatureSegment } from "../models/FeatureSegment";

/**
 * TrackContainerRepresentable serves as the boundary between the new serializable TrackModel and the previous
 * class-based TrackModel.
 *
 * New serializable state is actively converted to the class-based state and passed to the TrackContainer.
 */
export function TrackContainerRepresentable({
  tracks,
  highlights,
  genomeConfig: _genomeConfig,
  legendWidth,
  showGenomeNav,
  showToolBar,
  onNewRegion,
  onNewHighlight,
  onTracksChange,
  onNewRegionSelect,
  onSetSelected,
  viewRegion,
  userViewRegion,
  tool,
  Toolbar = {},
  selectedRegionSet,
  genomeName,
  setScreenshotData,
  isScreenShotOpen,
  overrideViewRegion,
  currentState,
  darkTheme,
}: ITrackContainerRepresentableProps) {
  // const [forceViewRegionUpdate, setForceViewRegionUpdate] = useState(0);

  // MARK: Genome Config

  const genomeConfig = useMemo(() => {
    return GenomeSerializer.deserialize(_genomeConfig);
  }, [_genomeConfig]);

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
      fileObj: track.fileObj,
      files: track.files,
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
        isSelected: track.isSelected,
        fileObj: track.fileObj,
        files: track.files,
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

  // Create a modified genomeConfig with updated defaultTracks
  const modifiedGenomeConfig = useMemo(() => {
    if (!genomeConfig) return genomeConfig;
    return {
      ...genomeConfig,
      defaultTracks: convertedTracks,
    };
  }, [genomeConfig, convertedTracks]);

  // MARK: View Region

  const convertedViewRegion = useMemo(() => {
    try {
      if (!viewRegion) {
        if (userViewRegion) {
          const navContext = genomeConfig.navContext as NavigationContext;
          const parsed = navContext.parse(userViewRegion);
          const { start, end } = parsed;
          return new DisplayedRegionModel(genomeConfig.navContext, start, end);
        } else {
          return new DisplayedRegionModel(
            genomeConfig.navContext,
            ...genomeConfig.defaultRegion
          );
        }
      } else {
        const navContext = genomeConfig.navContext as NavigationContext;
        const parsed = navContext.parse(viewRegion);
        const { start, end } = parsed;
        return new DisplayedRegionModel(genomeConfig.navContext, start, end);
      }
    } catch (e) {
      // console.error(e);
      return new DisplayedRegionModel(
        genomeConfig.navContext,
        ...genomeConfig.defaultRegion
      );
    }
  }, [viewRegion, genomeConfig, selectedRegionSet]);

  const convertedUserViewRegion = useMemo(() => {
    let newViewRegion;
    if (userViewRegion) {
      if (selectedRegionSet) {
        let setNavContext;
        if (typeof selectedRegionSet === "object") {
          const newRegionSet = RegionSet.deserialize(selectedRegionSet);
          setNavContext = newRegionSet.makeNavContext();
        } else {
          setNavContext = selectedRegionSet.makeNavContext();
        }

        setNavContext.parse(userViewRegion as GenomeCoordinate);
        return new DisplayedRegionModel(setNavContext);
      } else {
        newViewRegion = genomeConfig.navContext.parse(
          userViewRegion as GenomeCoordinate
        );
      }
    } else if (overrideViewRegion) {
      newViewRegion = genomeConfig.navContext.parse(
        overrideViewRegion as GenomeCoordinate
      );
    } else {
      newViewRegion = genomeConfig.defaultRegion;
    }

    if (newViewRegion) {
      return new DisplayedRegionModel(
        genomeConfig.navContext,
        ...newViewRegion
      );
    }
  }, [userViewRegion, genomeConfig, overrideViewRegion, selectedRegionSet]);

  const handleTracksChange = useCallback(
    (selectedTracks: TrackModel[]) => {
      onTracksChange(
        selectedTracks.map((item) => {
          const newITrackModel = convertTrackModelToITrackModel(item);
          if (item.tracks) {
            // check if there is a track that has multi source, like matplot, dynamic
            newITrackModel["tracks"] = item.tracks.map(
              convertTrackModelToITrackModel
            );
          }

          return newITrackModel;
        })
      );
    },

    [onTracksChange, convertTrackModelToITrackModel]
  );
  function currentRegionAsString(segments: FeatureSegment[]): string {
    if (segments.length === 1) {
      return segments[0].toString();
    } else {
      const first = segments[0];
      const last = segments[segments.length - 1];

      return first.toStringWithOther(last);
    }
  }
  const handleNewRegion = useCallback(
    (startbase: number, endbase: number) => {
      const genomeFeatureSegment: Array<FeatureSegment> =
        genomeConfig.navContext.getFeaturesInInterval(startbase, endbase);
      const coordinate = currentRegionAsString(
        genomeFeatureSegment
      ) as GenomeCoordinate;
      onNewRegion(coordinate);
    },
    [onNewRegion]
  );
  const handleSetRegion = useCallback(
    (set: RegionSet | null) => {
      let coordinate: GenomeCoordinate | null = null;
      if (set) {
        const newVisData: any = new DisplayedRegionModel(set.makeNavContext());
        coordinate =
          newVisData.currentRegionAsString() as GenomeCoordinate | null;
      } else {
        const navContext = genomeConfig.navContext;
        coordinate = new DisplayedRegionModel(
          navContext,
          genomeConfig.defaultRegion.start,
          genomeConfig.defaultRegion.end
        ).currentRegionAsString() as GenomeCoordinate | null;
      }
      onSetSelected(set, coordinate);
    },
    [onNewRegion]
  );
  const handleNewRegionSelect = (
    startbase: number,
    endbase: number,
    highlightSearch: boolean = false
  ) => {
    const genomeFeatureSegment: Array<FeatureSegment> =
      genomeConfig.navContext.getFeaturesInInterval(startbase, endbase);
    const newCoordinate = currentRegionAsString(
      genomeFeatureSegment
    ) as GenomeCoordinate;

    onNewRegionSelect(newCoordinate as GenomeCoordinate);

    if (highlightSearch) {
      const newHightlight = {
        start: startbase,
        end: endbase,
        display: true,
        color: "rgba(0, 123, 255, 0.15)",
        tag: "",
      };
      const tmpHighlight = [...highlights, newHightlight];
      onNewHighlight(tmpHighlight);
    }
  };

  return (
    <div>
      <GenomeRoot
        tracks={convertedTracks}
        highlights={highlights}
        genomeConfig={modifiedGenomeConfig}
        legendWidth={legendWidth}
        showGenomeNav={showGenomeNav}
        showToolBar={showToolBar}
        onNewRegion={!onNewRegion ? () => {} : handleNewRegion}
        onNewHighlight={!onNewHighlight ? () => {} : onNewHighlight}
        onTracksChange={!onTracksChange ? () => {} : handleTracksChange}
        onNewRegionSelect={
          !onNewRegionSelect ? () => {} : handleNewRegionSelect
        }
        onSetSelected={!onSetSelected ? () => {} : handleSetRegion}
        viewRegion={convertedViewRegion}
        userViewRegion={
          convertedUserViewRegion
            ? convertedUserViewRegion
            : convertedViewRegion
        }
        tool={tool}
        Toolbar={Toolbar}
        selectedRegionSet={selectedRegionSet}
        setScreenshotData={setScreenshotData}
        isScreenShotOpen={isScreenShotOpen}
        currentState={currentState}
        darkTheme={darkTheme}
      />
    </div>
  );
}
