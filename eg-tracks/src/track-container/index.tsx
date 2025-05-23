import {
  GenomeCoordinate,
  ITrackContainerRepresentableProps,
  ITrackContainerState,
  ITrackModel,
} from "../types";
import GenomeRoot from "../components/GenomeView/GenomeRoot";
import { useCallback, useMemo, useRef } from "react";
import { TrackModel } from "../models/TrackModel";
import NavigationContext from "../models/NavigationContext";
import DisplayedRegionModel from "../models/DisplayedRegionModel";
import GenomeSerializer from "../genome-hub/GenomeSerializer";
import OpenInterval, { IOpenInterval } from "../models/OpenInterval";
import RegionSet from "../models/RegionSet";
import { getGenomeConfig } from "../util";

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
      selectedRegionSet={props.selectedRegionSet}
      setScreenshotData={props.setScreenshotData}
      isScreenShotOpen={props.isScreenShotOpen}
      currentState={props.currentState}
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
  genomeConfig: _genomeConfig,
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
  Toolbar,
  selectedRegionSet,
  genomeName,
  setScreenshotData,
  isScreenShotOpen,
  overrideViewRegion,
  currentState,
}: ITrackContainerRepresentableProps) {
  const lastViewRegion = useRef<DisplayedRegionModel | null>(null);

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

  const convertedViewRegion = useMemo(() => {
    try {
      if (!viewRegion) {
        if (userViewRegion) {
          const start = userViewRegion.start;

          const end = userViewRegion.end;

          return new DisplayedRegionModel(genomeConfig.navContext, start, end);
        }
      } else if (lastViewRegion.current) {
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

        // const parsed = navContext.parse(viewRegion);
        // let { start, end } = parsed;

        // startViewRegion.setRegion(start, end);
        // lastViewRegion.current = startViewRegion;
        return startViewRegion;
      }
    } catch (e) {
      // console.error(e);

      return (
        lastViewRegion.current ||
        new DisplayedRegionModel(
          genomeConfig.navContext,
          ...genomeConfig.defaultRegion
        )
      );
    }
  }, [viewRegion, genomeConfig, selectedRegionSet]);

  const convertedUserViewRegion = useMemo(() => {
    try {
      let genomeConfig;

      if (_genomeConfig) {
        genomeConfig = GenomeSerializer.deserialize(_genomeConfig);
      } else {
        genomeConfig = getGenomeConfig(genomeName);
      }

      let newViewRegion;
      if (userViewRegion) {
        newViewRegion = OpenInterval.deserialize(
          userViewRegion as IOpenInterval
        );
      } else if (overrideViewRegion) {
        newViewRegion = genomeConfig.navContext.parse(
          overrideViewRegion as GenomeCoordinate
        );
      } else {
        newViewRegion = genomeConfig.navContext.parse(
          viewRegion as GenomeCoordinate
        );
      }

      if (selectedRegionSet) {
        let setNavContext;
        if (typeof selectedRegionSet === "object") {
          const newRegionSet = RegionSet.deserialize(selectedRegionSet);
          newRegionSet.genome = genomeConfig.genome;
          newRegionSet.genomeName = genomeConfig.genome.getName();

          setNavContext = newRegionSet.makeNavContext();
        } else {
          setNavContext = selectedRegionSet.makeNavContext();
        }

        return new DisplayedRegionModel(setNavContext, ...newViewRegion);
      } else {
        return new DisplayedRegionModel(
          genomeConfig.navContext,
          ...newViewRegion
        );
      }
    } catch (e) {
      console.error(e);
      return new DisplayedRegionModel(
        genomeConfig.navContext,
        ...genomeConfig.defaultRegion
      );
    }
  }, [userViewRegion, _genomeConfig, overrideViewRegion, selectedRegionSet]);

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
      onNewRegion(startbase, endbase);
    },
    [onNewRegion]
  );

  const handleNewRegionSelect = (
    startbase: number,
    endbase: number,
    highlightSearch: boolean = false
  ) => {
    const newRegion = new DisplayedRegionModel(
      genomeConfig.navContext,
      startbase,
      endbase
    );
    onNewRegionSelect(
      startbase,
      endbase,
      newRegion.currentRegionAsString() as GenomeCoordinate
    );

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
      <TrackContainer
        tracks={convertedTracks}
        highlights={highlights}
        genomeConfig={genomeConfig}
        legendWidth={legendWidth}
        showGenomeNav={showGenomeNav}
        onNewRegion={!onNewRegion ? () => {} : handleNewRegion}
        onNewHighlight={!onNewHighlight ? () => {} : onNewHighlight}
        onTrackSelected={!onTrackSelected ? () => {} : handleTrackSelected}
        onTrackDeleted={!onTrackDeleted ? () => {} : handleTrackDeleted}
        onTrackAdded={!onTrackAdded ? () => {} : handleTrackAdded}
        onNewRegionSelect={
          !onNewRegionSelect ? () => {} : handleNewRegionSelect
        }
        viewRegion={convertedViewRegion}
        userViewRegion={convertedUserViewRegion}
        tool={tool}
        selectedRegionSet={selectedRegionSet}
        setScreenshotData={setScreenshotData}
        isScreenShotOpen={isScreenShotOpen}
        currentState={currentState}
      />
      {Toolbar ? (
        <div
          id="toolbar-container"
          style={{
            position: "fixed",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 50,
          }}
        >
          <Toolbar
            highlights={highlights}
            onNewHighlight={!onNewHighlight ? () => {} : onNewHighlight}
            onNewRegionSelect={
              !onNewRegionSelect ? () => {} : handleNewRegionSelect
            }
          />
        </div>
      ) : (
        ""
      )}
    </div>
  );
}
