import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import _ from "lodash";
import { ITrackContainerState, InfiniteScrollWorkersRef, GenomeAlignWorkerRef } from "../../types";
import FlexLayout from "flexlayout-react";
import ThreedmolContainer from "./TrackComponents/3dmol/ThreedmolContainer";
import { addTabSetToLayout, initialLayout } from "../../models/layoutUtils";
import "./AppLayout.css";
import { arraysHaveSameTrackModels } from "../../util";

// import "./track.css";
// import { chrType } from "../../localdata/genomename";
// import { getGenomeConfig } from "../../models/genomes/allGenomes";

import useResizeObserver from "./TrackComponents/commonComponents/Resize";
import TrackManager from "./TrackManager";
const MAX_WORKERS = 2;
export const AWS_API = "https://lambda.epigenomegateway.org/v2";
import "./track.css";
import TrackModel from "../../models/TrackModel";
import FetchDataWorker from "../../getRemoteData/fetchDataWorker.ts?worker&inline";
// @ts-ignore
import FetchGenomeAlignWorker from "../../getRemoteData/fetchGenomeAlignWorker.ts?worker&inline";
// import GenomeViewerTest from "../testComp";
// import GenomeViewerTest from "./testComp";

const GenomeRoot: React.FC<ITrackContainerState> = memo(function GenomeRoot({
  tracks,
  genomeConfig,
  highlights,
  legendWidth,
  showGenomeNav,
  showToolBar,
  onNewRegion,
  onNewHighlight,
  onTracksChange,
  onNewRegionSelect,
  onSetSelected,
  currentState,
  tool,
  Toolbar,
  viewRegion,
  userViewRegion,
  setScreenshotData,
  isScreenShotOpen,
  selectedRegionSet,
  darkTheme,
  width,
  height,
  infiniteScrollWorkers: externalInfiniteScrollWorkers,
  fetchGenomeAlignWorker: externalFetchGenomeAlignWorker,
}) {
  const [resizeRef, size] = useResizeObserver();

  // Use externally-created workers if provided (created earlier in RootLayout),
  // otherwise create them locally for standalone usage.
  const localInfiniteScrollWorkers = useRef<{
    worker: { fetchWorker: Worker; hasOnMessage: boolean }[];
  } | null>(null);
  const localFetchGenomeAlignWorker = useRef<{
    fetchWorker: Worker;
    hasOnMessage: boolean;
  } | null>(null);

  const infiniteScrollWorkers: InfiniteScrollWorkersRef =
    externalInfiniteScrollWorkers ?? localInfiniteScrollWorkers;
  const fetchGenomeAlignWorker: GenomeAlignWorkerRef =
    externalFetchGenomeAlignWorker ?? localFetchGenomeAlignWorker;

  const layout = useRef(_.cloneDeep(initialLayout));
  const [model, setModel] = useState(FlexLayout.Model.fromJson(layout.current));

  const [show3dGene, setShow3dGene] = useState();
  //keep a ref of g3d track else completeTrackChange will not have the latest tracks data
  const g3dTracks = useRef<Array<any>>([]);
  const has3dTracks = useMemo(
    () => tracks.some((track) => track.type === "g3d"),
    [tracks],
  );

  // Initialize workers based on tracks when they change
  useEffect(() => {
    if (tracks.length > 0 && has3dTracks) {
      const curG3dTracks = findAllG3dTabs(layout.current);
      const newG3dTracks: Array<any> = tracks.filter(
        (track) => track.type === "g3d",
      );

      if (!arraysHaveSameTrackModels(curG3dTracks, newG3dTracks)) {
        layout.current = _.cloneDeep(initialLayout);
        g3dTracks.current = newG3dTracks;
        for (let track of newG3dTracks) {
          const newLayout = {
            type: "tabset",
            children: [
              {
                type: "tab",
                name: track.getDisplayLabel(),
                component: "g3d",

                config: { trackModel: track, trackId: track.id },
                enableClose: true,
              },
            ],
          };
          layout.current = addTabSetToLayout(newLayout, layout.current);
        }

        setModel(FlexLayout.Model.fromJson(layout.current));
      }
    }

    // Only create local workers if none were passed in from a parent.
    if (!externalInfiniteScrollWorkers && infiniteScrollWorkers.current) {
      const normalCount = Math.min(tracks.length, MAX_WORKERS);
      const existingNormalWorkers = infiniteScrollWorkers.current.worker.length;
      for (let i = existingNormalWorkers; i < normalCount; i++) {
        infiniteScrollWorkers.current.worker.push({
          fetchWorker: new FetchDataWorker(),
          hasOnMessage: false,
        });
      }
    }

    // Create genome align worker locally only if needed and not provided externally.
    if (
      !externalFetchGenomeAlignWorker &&
      tracks.some((t) => t.type === "genomealign") &&
      !fetchGenomeAlignWorker.current
    ) {
      fetchGenomeAlignWorker.current = {
        fetchWorker: new FetchGenomeAlignWorker(),
        hasOnMessage: false,
      };
    }
    genomeConfig.defaultTracks = tracks;
  }, [tracks]);

  function completeTracksChange(updateTracks: Array<TrackModel>) {
    onTracksChange([...updateTracks, ...g3dTracks.current]);
  }

  function renderG3dTrackComponents(node) {
    if (!userViewRegion) {
      return null;
    }
    const config = node.getConfig();
    const { x, y, width, height } = node.getRect();
    const g3dtrack = TrackModel.deserialize(config.trackModel);
    g3dtrack.id = config.trackId;
    const origG3d = tracks.filter((tk) => tk.getId() === g3dtrack.id);
    g3dtrack.fileObj = origG3d.length ? origG3d[0].fileObj : null;

    node.setEventListener("close", () => {
      onTracksChange(
        tracks.filter((item, _index) => {
          return item.id !== g3dtrack.id;
        }),
      );
    });

    return (
      <ThreedmolContainer
        key={g3dtrack.id}
        tracks={tracks}
        g3dtrack={g3dtrack}
        viewRegion={userViewRegion}
        width={width}
        height={height}
        x={x}
        y={y}
        genomeConfig={genomeConfig}
        geneFor3d={show3dGene}
        onSetSelected={onSetSelected}
        onNewViewRegion={onNewRegionSelect}
        selectedSet={selectedRegionSet ? selectedRegionSet : null}
      />
    );
  }

  // Optimized factory function with reduced overhead
  const factory = React.useCallback(
    (node) => {
      const component = node.getComponent();

      if (component === "Browser") {
        return tracks ? (
          <TrackManager
            tracks={tracks}
            legendWidth={legendWidth}
            windowWidth={width ? width : size.width - legendWidth - 40}
            userViewRegion={userViewRegion}
            highlights={highlights}
            genomeConfig={genomeConfig}
            onNewRegion={onNewRegion}
            onNewRegionSelect={onNewRegionSelect}
            onNewHighlight={onNewHighlight}
            onTracksChange={completeTracksChange}
            tool={tool}
            Toolbar={Toolbar}
            viewRegion={viewRegion}
            showGenomeNav={showGenomeNav}
            showToolBar={showToolBar}
            isThereG3dTrack={false}
            setScreenshotData={setScreenshotData}
            isScreenShotOpen={isScreenShotOpen}
            selectedRegionSet={selectedRegionSet}
            setShow3dGene={setShow3dGene}
            infiniteScrollWorkers={infiniteScrollWorkers}
            fetchGenomeAlignWorker={fetchGenomeAlignWorker}
            currentState={currentState}
            darkTheme={darkTheme}
          />
        ) : (
          ""
        );
      } else {
        return renderG3dTrackComponents(node);
      }
    },
    [
      tracks,
      size.width,
      legendWidth,
      userViewRegion,
      highlights,
      genomeConfig,
      onNewRegion,
      onNewRegionSelect,
      onNewHighlight,
      tool,
      viewRegion,
      showGenomeNav,
      showToolBar,
      selectedRegionSet,
    ],
  );

  function findAllG3dTabs(layout: any) {
    const result: any[] = [];

    function recurse(node: any) {
      if (!node) return;
      if (
        node.type === "tab" &&
        node.config &&
        node.config.trackModel &&
        node.config.trackModel.type === "g3d"
      ) {
        result.push(node.config.trackModel);
      }
      if (Array.isArray(node.children)) {
        node.children.forEach(recurse);
      }
    }

    recurse(layout.layout); // Start from the root layout node
    return result;
  }

  // Eagerly init local workers synchronously (only used when no external workers are provided).
  if (!externalInfiniteScrollWorkers && !infiniteScrollWorkers.current) {
    infiniteScrollWorkers.current = { worker: [] };
  }
  if (
    !externalInfiniteScrollWorkers &&
    infiniteScrollWorkers.current &&
    infiniteScrollWorkers.current.worker.length === 0 &&
    tracks.length > 0
  ) {
    const normalCount = Math.min(tracks.length, MAX_WORKERS);
    for (let i = 0; i < normalCount; i++) {
      infiniteScrollWorkers.current.worker.push({
        fetchWorker: new FetchDataWorker(),
        hasOnMessage: false,
      });
    }
  }

  useEffect(() => {
    genomeConfig.defaultTracks = tracks;
    return () => {
      // Only terminate workers if they are locally owned (not passed in from a parent).
      if (!externalInfiniteScrollWorkers) {
        if (infiniteScrollWorkers.current) {
          infiniteScrollWorkers.current.worker.forEach((workerObj) => {
            workerObj.fetchWorker.terminate();
          });
          infiniteScrollWorkers.current = { worker: [] };
        }
      }

      if (!externalFetchGenomeAlignWorker) {
        if (fetchGenomeAlignWorker.current) {
          fetchGenomeAlignWorker.current.fetchWorker.terminate();
        }
        fetchGenomeAlignWorker.current = null;
      }

      layout.current = _.cloneDeep(initialLayout);
      g3dTracks.current = [];
      setModel(FlexLayout.Model.fromJson(_.cloneDeep(initialLayout)));
      setShow3dGene(undefined);
    };
  }, []);
  return (
    <div ref={resizeRef as React.RefObject<HTMLDivElement>}>
      <div style={{ ...(height && { height }) }}>
        <TrackManager
          tracks={tracks}
          legendWidth={legendWidth}
          windowWidth={size.width - legendWidth - 45}
          // subtract legend width so it matches the width with eg2,
          // 15 + 15 paddig left right, to match old browser, and + 15 for scroll bar
          userViewRegion={userViewRegion}
          highlights={highlights}
          genomeConfig={genomeConfig}
          onNewRegion={onNewRegion}
          onNewRegionSelect={onNewRegionSelect}
          onNewHighlight={onNewHighlight}
          onTracksChange={completeTracksChange}
          tool={tool}
          Toolbar={Toolbar}
          viewRegion={viewRegion}
          showGenomeNav={showGenomeNav}
          showToolBar={showToolBar}
          isThereG3dTrack={false}
          setScreenshotData={setScreenshotData}
          isScreenShotOpen={isScreenShotOpen}
          selectedRegionSet={selectedRegionSet}
          setShow3dGene={setShow3dGene}
          infiniteScrollWorkers={infiniteScrollWorkers}
          fetchGenomeAlignWorker={fetchGenomeAlignWorker}
          currentState={currentState}
          darkTheme={darkTheme}
        />
      </div>


    </div>
  );
});

export default GenomeRoot;
