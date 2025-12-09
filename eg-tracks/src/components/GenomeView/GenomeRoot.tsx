import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import _ from "lodash";
import { ITrackContainerState } from "../../types";
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
const MAX_WORKERS = 16;
const INSTANCE_FETCH_TYPES = { hic: "", dynamichic: "", bam: "" };
export const AWS_API = "https://lambda.epigenomegateway.org/v2";
import "./track.css";
import TrackModel from "../../models/TrackModel";
import FetchDataWorker from "../../getRemoteData/fetchDataWorker.ts?worker&inline";
// @ts-ignore
import FetchGenomeAlignWorker from "../../getRemoteData/fetchGenomeAlignWorker.ts?worker&inline";
// import GenomeViewerTest from "../testComp";
// import GenomeViewerTest from "./testComp";

const packageVersion = false;
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
}) {
  const [resizeRef, size] = useResizeObserver();

  const infiniteScrollWorkers = useRef<{
    instance: { fetchWorker: Worker; hasOnMessage: boolean }[];
    worker: { fetchWorker: Worker; hasOnMessage: boolean }[];
  }>({
    instance: [],
    worker: [],
  });
  const fetchGenomeAlignWorker = useRef<{
    fetchWorker: Worker;
    hasOnMessage: boolean;
  } | null>(null);

  const layout = useRef(_.cloneDeep(initialLayout));
  const [model, setModel] = useState(FlexLayout.Model.fromJson(layout.current));

  const [show3dGene, setShow3dGene] = useState();
  //keep a ref of g3d track else completeTrackChange will not have the latest tracks data
  const g3dTracks = useRef<Array<any>>([]);
  const has3dTracks = useMemo(
    () => tracks.some((track) => track.type === "g3d"),
    [tracks]
  );

  // Initialize workers based on tracks when they change
  useEffect(() => {
    if (tracks.length > 0 && has3dTracks) {
      const curG3dTracks = findAllG3dTabs(layout.current);
      const newG3dTracks: Array<any> = tracks.filter(
        (track) => track.type === "g3d"
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

    const normalTracks = tracks.filter(
      (t) => !(t.type in INSTANCE_FETCH_TYPES)
    );
    const instanceFetchTracks = tracks.filter(
      (t) => t.type in INSTANCE_FETCH_TYPES
    );

    // Calculate how many workers we need
    const normalCount = Math.min(normalTracks.length, MAX_WORKERS);
    const instanceFetchTracksCount = Math.min(
      instanceFetchTracks.length,
      MAX_WORKERS
    );

    // Only create NEW workers if we need more than we have
    const existingNormalWorkers = infiniteScrollWorkers.current.worker.length;
    for (let i = existingNormalWorkers; i < normalCount; i++) {
      infiniteScrollWorkers.current.worker.push({
        fetchWorker: new FetchDataWorker(),
        hasOnMessage: false,
      });
    }

    const existingInstanceWorkers =
      infiniteScrollWorkers.current.instance.length;
    for (let i = existingInstanceWorkers; i < instanceFetchTracksCount; i++) {
      infiniteScrollWorkers.current.instance.push({
        fetchWorker: new FetchDataWorker(),
        hasOnMessage: false,
      });
    }

    // Create genome align worker if needed (only once)
    if (
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
        })
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
            windowWidth={
              (!size.width || size.width - legendWidth <= 0
                ? window.innerWidth
                : size.width) -
              legendWidth -
              40
            }
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
    ]
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

  useEffect(() => {
    genomeConfig.defaultTracks = tracks;
    return () => {
      // Terminate all infinite scroll workers

      if (infiniteScrollWorkers.current) {
        infiniteScrollWorkers.current.worker.forEach((workerObj) => {
          workerObj.fetchWorker.terminate();
        });
        infiniteScrollWorkers.current.instance.forEach((workerObj) => {
          workerObj.fetchWorker.terminate();
        });

        // Clear the arrays and references

        infiniteScrollWorkers.current = {
          instance: [],
          worker: [],
        };
      }

      // Terminate genome align worker
      if (fetchGenomeAlignWorker.current) {
        fetchGenomeAlignWorker.current.fetchWorker.terminate();
      }
      fetchGenomeAlignWorker.current = null;

      // Clear all other refs

      layout.current = _.cloneDeep(initialLayout);
      g3dTracks.current = [];

      // Reset state to initial values

      setModel(FlexLayout.Model.fromJson(_.cloneDeep(initialLayout)));
      setShow3dGene(undefined);
    };
  }, []);

  return (
    <div ref={resizeRef as React.RefObject<HTMLDivElement>}>
      {!has3dTracks ? (
        <TrackManager
          tracks={tracks}
          legendWidth={legendWidth}
          windowWidth={Math.round(
            (!size.width || size.width - legendWidth <= 0
              ? window.innerWidth
              : size.width) -
              legendWidth -
              40
          )}
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
        <div style={{ width: size.width, height: 900 }}>
          <FlexLayout.Layout model={model} factory={factory} />
        </div>
      )}
    </div>
  );
});

export default GenomeRoot;
