import React, { memo, useEffect, useRef, useState } from "react";
import _, { has } from "lodash";
import { ITrackContainerState } from "../../types";
import FlexLayout from "flexlayout-react";
import ThreedmolContainer from "./TrackComponents/3dmol/ThreedmolContainer";
import { addTabSetToLayout, initialLayout } from "../../models/layoutUtils";
import "./AppLayout.css";
import { arraysHaveSameTrackModels } from "../../util";

// Pre-compile FlexLayout model to eliminate JSON parsing delay
const precompiledModel = FlexLayout.Model.fromJson(initialLayout);
// import "./track.css";
// import { chrType } from "../../localdata/genomename";
// import { getGenomeConfig } from "../../models/genomes/allGenomes";
import OpenInterval from "../../models/OpenInterval";
import useResizeObserver from "./TrackComponents/commonComponents/Resize";
import TrackManager from "./TrackManager";
const MAX_WORKERS = 10;
const INSTANCE_FETCH_TYPES = { hic: "", dynamichic: "", bam: "" };
export const AWS_API = "https://lambda.epigenomegateway.org/v2";
import "./track.css";
import TrackModel from "../../models/TrackModel";
import { generateUUID } from "../../util";

// Performance tracking
let genomeRootStartTime = performance.now();

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
}) {
  const [resizeRef, size] = useResizeObserver();

  const infiniteScrollWorkers = useRef<{
    instance: { fetchWorker: Worker; hasOnMessage: boolean }[];
    worker: { fetchWorker: Worker; hasOnMessage: boolean }[];
  } | null>(
    packageVersion
      ? null
      : {
          instance: [],
          worker: [],
        }
  );
  const fetchGenomeAlignWorker = useRef<{
    fetchWorker: Worker;
    hasOnMessage: boolean;
  } | null>(null);
  const tracksHeight = useRef<number>(400);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentGenomeConfig, setCurrentGenomeConfig] = useState<any>(null);
  const trackManagerId = useRef<null | string>(null);
  const prevViewRegion = useRef({ genomeName: "", start: 0, end: 1 });
  const layout = useRef(_.cloneDeep(initialLayout));
  const [model, setModel] = useState(FlexLayout.Model.fromJson(layout.current));
  const [show3dGene, setShow3dGene] = useState();
  //keep a ref of g3d track else completeTrackChange will not have the latest tracks data
  const g3dTracks = useRef<Array<any>>([]);

  const has3dTracks = React.useMemo(
    () => tracks.some((track) => track.type === "g3d"),
    [tracks]
  );
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
        genomeConfig={currentGenomeConfig}
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
        // // Minimal logging for performance
        // if (process.env.NODE_ENV === "development") {
        //   console.log(`[GenomeRoot] Factory:${Date.now()}`);
        // }

        return (
          <TrackManager
            key={trackManagerId.current}
            tracks={tracks.filter((trackModel) => trackModel.type !== "g3d")}
            legendWidth={legendWidth}
            windowWidth={
              (!size.width || size.width - legendWidth <= 0
                ? 1500
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
            isThereG3dTrack={g3dTracks.current.length > 0}
            setScreenshotData={setScreenshotData}
            isScreenShotOpen={isScreenShotOpen}
            selectedRegionSet={selectedRegionSet}
            setShow3dGene={setShow3dGene}
            infiniteScrollWorkers={infiniteScrollWorkers}
            fetchGenomeAlignWorker={fetchGenomeAlignWorker}
            onHeightChange={onHeightChange}
          />
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

  const throttle = (callback, limit) => {
    let timeoutId: any = null;
    return (...args) => {
      if (!timeoutId) {
        callback(...args);
        timeoutId = setTimeout(() => {
          timeoutId = null;
        }, limit);
      }
    };
  };

  const throttledSetConfig = useRef(
    throttle((curGenome) => {
      setCurrentGenomeConfig(curGenome);
    }, 100)
  );

  function onHeightChange(height: number) {
    const newHeight = height + 250;
    if (Math.round(newHeight) !== Math.round(tracksHeight.current)) {
      tracksHeight.current = newHeight;
      // Directly update the DOM to avoid re-renders and flickering
      if (containerRef.current) {
        containerRef.current.style.height = `${Math.round(newHeight)}px`;
      }
    }
    // top parts is 200 px and 4 for border top and bottom
  }

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
    // console.log(
    //   `[GenomeRoot] ⚙️ Setting genome config at ${new Date().toLocaleTimeString()}.${Math.floor(
    //     performance.now() % 1000
    //   )
    //     .toString()
    //     .padStart(3, "0")} (+${(
    //     performance.now() - genomeRootStartTime
    //   ).toFixed(1)}ms)`
    // );
    // setCurrentGenomeConfig(curGenome);
    // Cleanup workers and all refs/state on component unmount
    trackManagerId.current = generateUUID();
    const normalTracks = tracks.filter(
      (t) => !(t.type in INSTANCE_FETCH_TYPES)
    );
    const instanceFetchTracks = tracks.filter(
      (t) => t.type in INSTANCE_FETCH_TYPES
    );
    // Create up to MAX_WORKERS for each type, but do not exceed 10 in the ref
    const normalCount = Math.min(normalTracks.length, MAX_WORKERS);
    const instanceFetchTracksCount = Math.min(
      instanceFetchTracks.length,
      MAX_WORKERS
    );
    if (!packageVersion) {
      for (let i = 0; i < normalCount; i++) {
        if (infiniteScrollWorkers.current!.worker.length < MAX_WORKERS) {
          infiniteScrollWorkers.current!.worker.push({
            fetchWorker: new Worker(
              new URL(
                "../../getRemoteData/fetchDataWorker.ts",
                import.meta.url
              ),
              { type: "module" }
            ),
            hasOnMessage: false,
          });
        }
      }
      for (let i = 0; i < instanceFetchTracksCount; i++) {
        if (infiniteScrollWorkers.current!.instance.length < MAX_WORKERS) {
          infiniteScrollWorkers.current!.instance.push({
            fetchWorker: new Worker(
              new URL(
                "../../getRemoteData/fetchDataWorker.ts",
                import.meta.url
              ),
              { type: "module" }
            ),
            hasOnMessage: false,
          });
        }
      }
      if (
        tracks.some((t) => t.type === "genomealign") &&
        !fetchGenomeAlignWorker.current
      ) {
        fetchGenomeAlignWorker.current = {
          fetchWorker: new Worker(
            new URL(
              "../../getRemoteData/fetchGenomeAlignWorker.ts",
              import.meta.url
            ),
            { type: "module" }
          ),
          hasOnMessage: false,
        };
      }
    }
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
        infiniteScrollWorkers.current.worker = [];
        infiniteScrollWorkers.current.instance = [];
        infiniteScrollWorkers.current = null;
      }

      // Terminate genome align worker
      if (fetchGenomeAlignWorker.current) {
        fetchGenomeAlignWorker.current.fetchWorker.terminate();
      }
      fetchGenomeAlignWorker.current = null;

      // Clear all other refs
      containerRef.current = null;
      tracksHeight.current = 0;
      trackManagerId.current = null;
      prevViewRegion.current = { genomeName: "", start: 0, end: 1 };
      layout.current = _.cloneDeep(initialLayout);
      g3dTracks.current = [];

      // Reset state to initial values
      setCurrentGenomeConfig(null);
      setModel(FlexLayout.Model.fromJson(_.cloneDeep(initialLayout)));
      setShow3dGene(undefined);
    };
  }, []);

  // check what types of tracks are being added, and determine the number of workers needed for
  // TrackManager
  useEffect(() => {
    const normalTracks = tracks.filter(
      (t) => !(t.type in INSTANCE_FETCH_TYPES)
    );
    const instanceFetchTracks = tracks.filter(
      (t) => t.type in INSTANCE_FETCH_TYPES
    );
    // Create up to MAX_WORKERS for each type, but do not exceed 10 in the ref
    const normalCount = Math.min(normalTracks.length, MAX_WORKERS);
    const instanceFetchTracksCount = Math.min(
      instanceFetchTracks.length,
      MAX_WORKERS
    );
    if (!packageVersion) {
      for (let i = 0; i < normalCount; i++) {
        if (infiniteScrollWorkers.current!.worker.length < MAX_WORKERS) {
          infiniteScrollWorkers.current!.worker.push({
            fetchWorker: new Worker(
              new URL(
                "../../getRemoteData/fetchDataWorker.ts",
                import.meta.url
              ),
              { type: "module" }
            ),
            hasOnMessage: false,
          });
        }
      }
      for (let i = 0; i < instanceFetchTracksCount; i++) {
        if (infiniteScrollWorkers.current!.instance.length < MAX_WORKERS) {
          infiniteScrollWorkers.current!.instance.push({
            fetchWorker: new Worker(
              new URL(
                "../../getRemoteData/fetchDataWorker.ts",
                import.meta.url
              ),
              { type: "module" }
            ),
            hasOnMessage: false,
          });
        }
      }
      if (
        tracks.some((t) => t.type === "genomealign") &&
        !fetchGenomeAlignWorker.current
      ) {
        fetchGenomeAlignWorker.current = {
          fetchWorker: new Worker(
            new URL(
              "../../getRemoteData/fetchGenomeAlignWorker.ts",
              import.meta.url
            ),
            { type: "module" }
          ),
          hasOnMessage: false,
        };
      }
    }

    const curG3dTracks = findAllG3dTabs(layout.current);
    const newG3dTracks: Array<any> = tracks.filter(
      (track) => track.type === "g3d"
    );

    if (tracks.length > 0 && has3dTracks) {
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
  }, [tracks]);

  // use effect of tracks will get trigger first creating the page layout before the resize effect
  // which will create the TrackManager component
  // useEffect(() => {
  //   if (size.width > 0 && userViewRegion) {
  //     let curGenome;
  //     if (trackManagerId.current) {
  //       curGenome = { ...genomeConfig };
  //       curGenome["genomeID"] = trackManagerId.current;
  //       curGenome["isInitial"] = false;
  //       curGenome.defaultRegion = new OpenInterval(
  //         userViewRegion._startBase!,
  //         userViewRegion._endBase!
  //       );
  //       curGenome.navContext = userViewRegion._navContext;
  //       curGenome["sizeChange"] = true;
  //       throttledSetConfig.current(curGenome);
  //     }

  //     // else {
  //     //   trackManagerId.current = generateUUID();
  //     //   curGenome = { ...genomeConfig };
  //     //   curGenome.navContext = userViewRegion._navContext;
  //     //   curGenome["isInitial"] = true;
  //     //   curGenome["genomeID"] = trackManagerId.current;
  //     //   curGenome.defaultRegion = new OpenInterval(
  //     //     userViewRegion._startBase!,
  //     //     userViewRegion._endBase!
  //     //   );
  //     //   setCurrentGenomeConfig(curGenome);
  //     // }
  //   }
  // }, [size.width]);

  // useEffect(() => {
  //   if (userViewRegion) {
  //     if (trackManagerId.current) {
  //       const curGenome = { ...genomeConfig };
  //       curGenome["isInitial"] = false;
  //       curGenome["genomeID"] = trackManagerId.current;
  //       curGenome.defaultRegion = new OpenInterval(
  //         userViewRegion._startBase!,
  //         userViewRegion._endBase!
  //       );
  //       curGenome.navContext = userViewRegion._navContext;
  //       curGenome["sizeChange"] = false;
  //       throttledSetConfig.current(curGenome);
  //       // setCurrentGenomeConfig(curGenome);
  //     }
  //   }
  // }, [viewRegion]);

  // useEffect(() => {
  //   if (userViewRegion) {
  //     if (
  //       trackManagerId.current &&
  //       currentState.index !== currentState.limit - 1
  //     ) {
  //       if (
  //         genomeConfig.genomeName !== prevViewRegion.current.genomeName ||
  //         userViewRegion._startBase !== prevViewRegion.current.start ||
  //         userViewRegion._endBase !== prevViewRegion.current.end
  //       ) {
  //         const curGenome = { ...genomeConfig };
  //         curGenome["isInitial"] = false;
  //         curGenome["genomeID"] = trackManagerId.current;

  //         curGenome.defaultRegion = new OpenInterval(
  //           userViewRegion._startBase!,
  //           userViewRegion._endBase!
  //         );
  //         curGenome.navContext = userViewRegion._navContext;
  //         curGenome["sizeChange"] = false;
  //         throttledSetConfig.current(curGenome);
  //       }
  //     }
  //     prevViewRegion.current.genomeName = genomeConfig.genomeName;
  //     prevViewRegion.current.start = userViewRegion._startBase!;
  //     prevViewRegion.current.end = userViewRegion._endBase!;
  //   }
  // }, [userViewRegion]);

  return (
    <div ref={resizeRef as React.RefObject<HTMLDivElement>}>
      <div
        // ref={containerRef}
        style={{
          display: "flex",
          flexDirection: "column",
          // width: size.width,
          // height: 400,
        }}
      >
        {has3dTracks ? (
          // Use FlexLayout with precompiled model for better performance
          <FlexLayout.Layout model={model} factory={factory} />
        ) : (
          // Direct rendering for optimal performance
          <TrackManager
            key={trackManagerId.current || "direct-track-manager"}
            tracks={tracks.filter((trackModel) => trackModel.type !== "g3d")}
            legendWidth={legendWidth}
            windowWidth={
              (!size.width || size.width - legendWidth <= 0
                ? 1500
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
            onHeightChange={onHeightChange}
          />
        )}
      </div>
    </div>
  );
});

export default GenomeRoot;
