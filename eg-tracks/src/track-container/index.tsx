import {
  GenomeCoordinate,
  ITrackContainerRepresentableProps,
  ITrackContainerState,
  ITrackModel,
} from "../types";
import GenomeRoot from "@eg/tracks/src/components/GenomeView/GenomeRoot";
import { useCallback, useMemo, useRef } from "react";
import { TrackModel } from "../models/TrackModel";
import NavigationContext from "../models/NavigationContext";
import DisplayedRegionModel from "../models/DisplayedRegionModel";
import GenomeSerializer from "../genome-hub/GenomeSerializer";
import OpenInterval from "../models/OpenInterval";
import RegionSet from "../models/RegionSet";

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

  setScreenshotData,
  isScreenShotOpen,
  overrideViewRegion,
}: ITrackContainerRepresentableProps) {
  const lastViewRegion = useRef<DisplayedRegionModel | null>(null);
  const lastUserViewRegion = useRef<DisplayedRegionModel | null>(null);
  const lastSelectedSet = useRef<RegionSet | null>(selectedRegionSet);

  // MARK: Genome Config

  const genomeConfig = useMemo(() => {
    if (selectedRegionSet && _genomeConfig) {
      lastUserViewRegion.current = null;
      lastViewRegion.current = null;
      let newGenomeConfig = GenomeSerializer.deserialize(_genomeConfig);
      if (typeof selectedRegionSet === "object") {
        const newRegionSet = RegionSet.deserialize(selectedRegionSet);
        newRegionSet.genome = newGenomeConfig.genome;
        newRegionSet.genomeName = newGenomeConfig.genome.getName();

        const newVisData: any = new DisplayedRegionModel(
          newRegionSet.makeNavContext()
        );
        newGenomeConfig.defaultRegion = new OpenInterval(
          newVisData._startBase,
          newVisData._endBase
        );
        newGenomeConfig.navContext = newVisData._navContext;
      } else {
        const newVisData: any = new DisplayedRegionModel(
          selectedRegionSet.makeNavContext()
        );
        newGenomeConfig.defaultRegion = new OpenInterval(
          newVisData._startBase,
          newVisData._endBase
        );
        newGenomeConfig.navContext = newVisData._navContext;
      }
      return newGenomeConfig;
    } else {
      lastUserViewRegion.current = null;
      lastViewRegion.current = null;

      return GenomeSerializer.deserialize(_genomeConfig);
    }
  }, [_genomeConfig, selectedRegionSet, overrideViewRegion]);

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
        let { start, end } = parsed;

        startViewRegion.setRegion(start, end);
        lastViewRegion.current = startViewRegion;
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
  }, [viewRegion, genomeConfig]);

  const areObjectsEqual = (obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) return true;

    if (obj1 === null || obj2 === null) return false;

    if (typeof obj1 !== "object" || typeof obj2 !== "object") return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (let key of keys1) {
      if (!keys2.includes(key) || !areObjectsEqual(obj1[key], obj2[key])) {
        return false;
      }
    }

    return true;
  };

  const convertedUserViewRegion = useMemo(() => {
    try {
      if (areObjectsEqual(lastSelectedSet.current, selectedRegionSet)) {
        if (userViewRegion) {
          const start = userViewRegion.start;

          const end = userViewRegion.end;

          return new DisplayedRegionModel(genomeConfig.navContext, start, end);
        } else {
          if (overrideViewRegion) {
            try {
              const navContext = genomeConfig.navContext as NavigationContext;

              const parsed = navContext.parse(overrideViewRegion);
              let { start, end } = parsed;
              const newRegion = new DisplayedRegionModel(
                genomeConfig.navContext,
                start,
                end
              );

              lastUserViewRegion.current = newRegion;
              return newRegion;
            } catch (e) {
              const newRegion = new DisplayedRegionModel(
                genomeConfig.navContext,
                ...genomeConfig.defaultRegion
              );
              lastUserViewRegion.current = newRegion;
              lastSelectedSet.current = selectedRegionSet;
              return newRegion;
            }
          } else {
            const newRegion = new DisplayedRegionModel(
              genomeConfig.navContext,
              ...genomeConfig.defaultRegion
            );
            lastUserViewRegion.current = newRegion;
            lastSelectedSet.current = selectedRegionSet;
            return newRegion;
          }
        }
      } else {
        // when there is a new displayModel from regionSet, or we exit out of region we use new defaultRegion startings point

        if (overrideViewRegion) {
          try {
            const navContext = genomeConfig.navContext as NavigationContext;

            const parsed = navContext.parse(overrideViewRegion);
            let { start, end } = parsed;
            const newRegion = new DisplayedRegionModel(
              genomeConfig.navContext,
              start,
              end
            );

            lastUserViewRegion.current = newRegion;
            return newRegion;
          } catch (e) {
            const newRegion = new DisplayedRegionModel(
              genomeConfig.navContext,
              ...genomeConfig.defaultRegion
            );
            lastUserViewRegion.current = newRegion;
            lastSelectedSet.current = selectedRegionSet;
            return newRegion;
          }
        } else {
          const newRegion = new DisplayedRegionModel(
            genomeConfig.navContext,
            ...genomeConfig.defaultRegion
          );
          lastUserViewRegion.current = newRegion;
          lastSelectedSet.current = selectedRegionSet;
          return newRegion;
        }
      }
    } catch (e) {
      console.error(e);
      return new DisplayedRegionModel(
        genomeConfig.navContext,
        ...genomeConfig.defaultRegion
      );
    }
  }, [userViewRegion, genomeConfig, overrideViewRegion]);

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

  const handleNewRegionSelect = useCallback(
    (startbase: number, endbase: number, highlightSearch: boolean = false) => {
      if (lastViewRegion.current) {
        const newRegion = lastViewRegion.current
          .clone()
          .setRegion(startbase, endbase);
        onNewRegionSelect(
          startbase,
          endbase,
          newRegion.currentRegionAsString() as GenomeCoordinate
        );
      } else {
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
      }
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
    },
    [lastViewRegion, onNewRegionSelect]
  );

  // useEffect(() => {
  //   if (selectedRegionSet && genomeConfig && lastUserViewRegion.current) {
  //     if (typeof selectedRegionSet === "object") {
  //       const newRegionSet = RegionSet.deserialize(selectedRegionSet);
  //       newRegionSet.genome = genomeConfig.genome;
  //       newRegionSet.genomeName = genomeConfig.genome.getName();

  //       const newVisData: any = new DisplayedRegionModel(
  //         newRegionSet.makeNavContext()
  //       );
  //       genomeConfig.defaultRegion = new OpenInterval(
  //         newVisData._startBase,
  //         newVisData._endBase
  //       );
  //       genomeConfig.navContext = newVisData._navContext;
  //       handleNewRegionSelect(newVisData._startBase, newVisData._endBase);
  //     } else {
  //       lastUserViewRegion.current = null;
  //       lastViewRegion.current = null;
  //       const newVisData: any = new DisplayedRegionModel(
  //         selectedRegionSet.makeNavContext()
  //       );
  //       genomeConfig.defaultRegion = new OpenInterval(
  //         newVisData._startBase,
  //         newVisData._endBase
  //       );
  //       genomeConfig.navContext = newVisData._navContext;
  //       handleNewRegionSelect(newVisData._startBase, newVisData._endBase);
  //     }
  //   }
  // }, [selectedRegionSet]);
  return (
    <div>
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
        selectedRegionSet={selectedRegionSet}
        setScreenshotData={setScreenshotData}
        isScreenShotOpen={isScreenShotOpen}
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
            onNewHighlight={onNewHighlight}
            onNewRegionSelect={handleNewRegionSelect}
          />
        </div>
      ) : (
        ""
      )}
    </div>
  );
}
