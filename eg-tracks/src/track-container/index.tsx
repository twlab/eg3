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
import RegionSet from "../models/RegionSet";
import OpenInterval from "../models/OpenInterval";

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
}: ITrackContainerRepresentableProps) {
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
      let newRegion;
      if (lastViewRegion.current) {
        if (!selectedRegionSet) {
          const navContext = lastViewRegion.current.getNavigationContext();
          const parsed = navContext.parse(viewRegion);
          const { start, end } = parsed;

          newRegion = lastViewRegion.current.clone();
          newRegion.setRegion(start, end);
          console.log("SHOILD be here???????????????????????qhwy");
          lastViewRegion.current = newRegion;
        } else if (selectedRegionSet) {
          let viewRegionSet: RegionSet;

          if (typeof selectedRegionSet === "object") {
            selectedRegionSet["name"] = selectedRegionSet["name"];
            selectedRegionSet["genomeName"] =
              selectedRegionSet["genome"]["_name"];
            viewRegionSet = RegionSet.deserialize(selectedRegionSet);
            if (!viewRegionSet["genome"]) {
              viewRegionSet["genome"] = genomeConfig.genome;
            }
          } else {
            viewRegionSet = selectedRegionSet;
          }

          newRegion = lastViewRegion.current.clone();
          const newRegionSetVisData = new DisplayedRegionModel(
            viewRegionSet.makeNavContext()
          );
          newRegion.setRegion(
            newRegionSetVisData._startBase!,
            newRegionSetVisData._endBase!
          );

          genomeConfig.defaultRegion = new OpenInterval(
            newRegionSetVisData._startBase!,
            newRegionSetVisData._endBase!
          );
          genomeConfig.navContext = newRegionSetVisData._navContext;
          console.log("SHOILD be here", genomeConfig.navContext);
          lastViewRegion.current = newRegion;
        }

        return newRegion;
      } else {
        let startViewRegion;
        if (!selectedRegionSet) {
          const navContext = genomeConfig.navContext as NavigationContext;
          startViewRegion = new DisplayedRegionModel(
            navContext,
            ...genomeConfig.defaultRegion
          );

          const parsed = navContext.parse(viewRegion);
          const { start, end } = parsed;

          startViewRegion.setRegion(start, end);
          lastViewRegion.current = startViewRegion;
        } else {
          let viewRegionSet: RegionSet;

          if (typeof selectedRegionSet === "object") {
            selectedRegionSet["name"] = selectedRegionSet["name"];
            selectedRegionSet["genomeName"] =
              selectedRegionSet["genome"]["_name"];
            viewRegionSet = RegionSet.deserialize(selectedRegionSet);
            if (!viewRegionSet["genome"]) {
              viewRegionSet["genome"] = genomeConfig.genome;
            }
          } else {
            viewRegionSet = selectedRegionSet;
          }

          startViewRegion = new DisplayedRegionModel(
            viewRegionSet.makeNavContext()
          );
          genomeConfig.defaultRegion = new OpenInterval(
            startViewRegion._startBase!,
            startViewRegion._endBase!
          );
          genomeConfig.navContext = startViewRegion._navContext;
        }
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
  }, [viewRegion, genomeConfig, selectedRegionSet]);
  const convertedUserViewRegion = useMemo(() => {
    try {
      if (lastUserViewRegion.current) {
        let newRegion;
        if (selectedRegionSet) {
          const navContext = lastUserViewRegion.current.getNavigationContext();
          const parsed = navContext.parse(userViewRegion!);
          const { start, end } = parsed;

          const newRegion = lastUserViewRegion.current.clone();
          newRegion.setRegion(start, end);
          lastUserViewRegion.current = newRegion;
        } else if (selectedRegionSet) {
          let viewRegionSet: RegionSet;

          if (typeof selectedRegionSet === "object") {
            selectedRegionSet["name"] = selectedRegionSet["name"];
            selectedRegionSet["genomeName"] =
              selectedRegionSet["genome"]["_name"];
            viewRegionSet = RegionSet.deserialize(selectedRegionSet);
            if (!viewRegionSet["genome"]) {
              viewRegionSet["genome"] = genomeConfig.genome;
            }
          } else {
            viewRegionSet = selectedRegionSet;
          }

          newRegion = lastUserViewRegion.current.clone();
          const newRegionSetVisData = new DisplayedRegionModel(
            viewRegionSet.makeNavContext()
          );
          newRegion.setRegion(
            newRegionSetVisData._startBase!,
            newRegionSetVisData._endBase!
          );

          lastViewRegion.current = newRegion;
        }
        return newRegion;
      } else {
        let startViewRegion;
        if (!selectedRegionSet) {
          const navContext = genomeConfig.navContext as NavigationContext;
          startViewRegion = new DisplayedRegionModel(
            navContext,
            ...genomeConfig.defaultRegion
          );

          const parsed = navContext.parse(userViewRegion!);
          const { start, end } = parsed;

          startViewRegion.setRegion(start, end);
          lastUserViewRegion.current = startViewRegion;
        } else {
          let viewRegionSet: RegionSet;

          if (typeof selectedRegionSet === "object") {
            selectedRegionSet["name"] = selectedRegionSet["name"];
            selectedRegionSet["genomeName"] =
              selectedRegionSet["genome"]["_name"];
            viewRegionSet = RegionSet.deserialize(selectedRegionSet);
            if (!viewRegionSet["genome"]) {
              viewRegionSet["genome"] = genomeConfig.genome;
            }
          } else {
            viewRegionSet = selectedRegionSet;
          }

          startViewRegion = new DisplayedRegionModel(
            viewRegionSet.makeNavContext()
          );
        }
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
    (startbase: number, endbase: number, highlightSearch: boolean = false) => {
      if (lastViewRegion.current) {
        const newRegion = lastViewRegion.current
          .clone()
          .setRegion(startbase, endbase);
        onNewRegionSelect(
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
      />
      {Toolbar ? (
        <div
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
