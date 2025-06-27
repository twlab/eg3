import React, { memo, useEffect, useRef, useState } from "react";
import _ from "lodash";
import { ITrackContainerState } from "../../types";
import { Layout, Model } from "flexlayout-react";
import ThreedmolContainer from "./TrackComponents/3dmol/ThreedmolContainer";
import { addTabSetToLayout, initialLayout } from "../../models/layoutUtils";
import "./AppLayout.css";
// import "flexlayout-react/style/light.css";
import { arraysHaveSameTrackModels } from "../../util";
import { diffTrackModels } from "../../util";
// import "./track.css";
// import { chrType } from "../../localdata/genomename";
// import { getGenomeConfig } from "../../models/genomes/allGenomes";
import OpenInterval from "../../models/OpenInterval";
import useResizeObserver from "./TrackComponents/commonComponents/Resize";
import TrackManager from "./TrackManager";

export const AWS_API = "https://lambda.epigenomegateway.org/v2";
import "./track.css";
import TrackModel from "../../models/TrackModel";
// import GenomeViewerTest from "../testComp";

// import GenomeViewerTest from "./testComp";
const GenomeRoot: React.FC<ITrackContainerState> = memo(function GenomeRoot({
  tracks,
  genomeConfig,
  highlights,
  legendWidth,
  showGenomeNav,
  onNewRegion,
  onNewHighlight,
  onTracksChange,
  onNewRegionSelect,
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
  const infiniteScrollWorker = useRef<Worker | null>(null);
  const fetchGenomeAlignWorker = useRef<Worker | null>(null);
  const [currentGenomeConfig, setCurrentGenomeConfig] = useState<any>(null);
  const trackManagerId = useRef<null | string>(null);
  const prevViewRegion = useRef({ genomeName: "", start: 0, end: 1 });
  const layout = useRef(_.cloneDeep(initialLayout));
  const [model, setModel] = useState(Model.fromJson(layout.current));
  const [show3dGene, setShow3dGene] = useState();

  function renderG3dTrackComponents(node) {
    const model = node.getModel();

    const config = node.getConfig();
    const { x, y, width, height } = node.getRect();
    const g3dtrack = TrackModel.deserialize(config.trackModel);
    g3dtrack.id = config.trackId;
    const origG3d = tracks.filter((tk) => tk.getId() === g3dtrack.id);
    g3dtrack.fileObj = origG3d.length ? origG3d[0].fileObj : null;
    // const currentTrackIds = tracks.map((tk) => tk.getId());
    // if (!currentTrackIds.includes(g3dtrack.id)) {
    //     const newTracks = [...tracks, g3dtrack];
    //     this.props.onTracksChanged(newTracks);
    // }

    node.setEventListener("close", () => {
      onTracksChange(
        tracks.filter((item, _index) => {
          return !(String(item.id) === g3dtrack.id);
        })
      );

      // const layout = deleteTabByIdFromModel(model, config.tabId);
      // this.props.onSetLayout(layout);
    });
    // node.setEventListener("resize", () => this.handleNodeResize(node));

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
      />
    );
  }
  const factory = (node) => {
    var component = node.getComponent();

    if (component === "Browser") {
      return (
        <TrackManager
          key={trackManagerId.current}
          tracks={tracks.filter((trackModel) => trackModel.type !== "g3d")}
          legendWidth={legendWidth}
          windowWidth={
            (!size.width || size.width - legendWidth < 0 ? 1500 : size.width) -
            legendWidth -
            60
            // 20 px from padding left moving element inside flexlayout 20px over, 20px from scrollbar, 20px to add the gap
            // this make the width of the browser fit the screen
          }
          userViewRegion={userViewRegion}
          highlights={highlights}
          genomeConfig={currentGenomeConfig}
          onNewRegion={onNewRegion}
          onNewRegionSelect={onNewRegionSelect}
          onNewHighlight={onNewHighlight}
          onTracksChange={onTracksChange}
          tool={tool}
          Toolbar={Toolbar}
          viewRegion={viewRegion}
          showGenomeNav={showGenomeNav}
          setScreenshotData={setScreenshotData}
          isScreenShotOpen={isScreenShotOpen}
          selectedRegionSet={selectedRegionSet}
          setShow3dGene={setShow3dGene}
          infiniteScrollWorker={infiniteScrollWorker}
          fetchGenomeAlignWorker={fetchGenomeAlignWorker}
        />
      );
    } else {
      const g3dComp = renderG3dTrackComponents(node);
      return g3dComp;
    }
  };

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

  useEffect(() => {
    if (!infiniteScrollWorker.current) {
      infiniteScrollWorker.current = new Worker(
        new URL("../../getRemoteData/fetchDataWorker.ts", import.meta.url),
        { type: "module" }
      );
    }
    if (
      tracks.some((t) => t.type === "genomealign") &&
      !fetchGenomeAlignWorker.current
    ) {
      fetchGenomeAlignWorker.current = new Worker(
        new URL(
          "../../getRemoteData/fetchGenomeAlignWorker.ts",
          import.meta.url
        ),
        { type: "module" }
      );
    }
    const curG3dTracks = layout.current.layout.children.flatMap((item: any) => {
      const tracks: any[] = [];
      if (item.trackModel && item.trackModel.type === "g3d") {
        tracks.push(item.trackModel);
      }
      if (Array.isArray(item.children)) {
        item.children.forEach((child: any) => {
          if (
            child.config &&
            child.config.trackModel &&
            child.config.trackModel.type === "g3d"
          ) {
            tracks.push(child.config.trackModel);
          }
        });
      }
      return tracks;
    });
    const newG3dTracks = tracks.filter((track) => track.type === "g3d");
    if (tracks.length > 0) {
      if (!arraysHaveSameTrackModels(curG3dTracks, newG3dTracks)) {
        layout.current = _.cloneDeep(initialLayout);
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

        setModel(Model.fromJson(layout.current));
      }
    }
  }, [tracks]);

  useEffect(() => {
    if (size.width > 0) {
      let curGenome;
      if (trackManagerId.current) {
        curGenome = { ...genomeConfig };
        curGenome["genomeID"] = trackManagerId.current;
        curGenome["isInitial"] = false;
        curGenome.defaultRegion = new OpenInterval(
          userViewRegion._startBase!,
          userViewRegion._endBase!
        );
        curGenome.navContext = userViewRegion._navContext;
        curGenome["sizeChange"] = true;
        throttledSetConfig.current(curGenome);
      } else {
        trackManagerId.current = crypto.randomUUID();
        curGenome = { ...genomeConfig };
        curGenome.navContext = userViewRegion._navContext;
        curGenome["isInitial"] = true;
        curGenome["genomeID"] = trackManagerId.current;
        curGenome.defaultRegion = new OpenInterval(
          userViewRegion._startBase!,
          userViewRegion._endBase!
        );
        setCurrentGenomeConfig(curGenome);
      }
    }
  }, [size.width]);

  useEffect(() => {
    if (size.width > 0) {
      if (trackManagerId.current) {
        const curGenome = { ...genomeConfig };
        curGenome["isInitial"] = false;
        curGenome["genomeID"] = trackManagerId.current;
        curGenome.defaultRegion = new OpenInterval(
          userViewRegion._startBase!,
          userViewRegion._endBase!
        );
        curGenome.navContext = userViewRegion._navContext;
        curGenome["sizeChange"] = false;

        setCurrentGenomeConfig(curGenome);
      }
    }
  }, [viewRegion]);

  useEffect(() => {
    if (size.width > 0) {
      if (
        trackManagerId.current &&
        currentState.index !== currentState.limit - 1
      ) {
        if (
          genomeConfig.genomeName !== prevViewRegion.current.genomeName ||
          userViewRegion._startBase !== prevViewRegion.current.start ||
          userViewRegion._endBase !== prevViewRegion.current.end
        ) {
          const curGenome = { ...genomeConfig };
          curGenome["isInitial"] = false;
          curGenome["genomeID"] = trackManagerId.current;

          curGenome.defaultRegion = new OpenInterval(
            userViewRegion._startBase!,
            userViewRegion._endBase!
          );
          curGenome.navContext = userViewRegion._navContext;
          curGenome["sizeChange"] = false;

          throttledSetConfig.current(curGenome);
        }
      }
      prevViewRegion.current.genomeName = genomeConfig.genomeName;
      prevViewRegion.current.start = userViewRegion._startBase!;
      prevViewRegion.current.end = userViewRegion._endBase!;
    }
  }, [userViewRegion]);

  return (
    <div>
      <div ref={resizeRef as React.RefObject<HTMLDivElement>}> </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {/* <GenomeViewerTest /> */}
        {currentGenomeConfig && size.width > 0 ? (
          <Layout model={model} factory={factory} />
        ) : (
          ""
        )}

        {/* {currentGenomeConfig && size.width > 0 ? (
          tracks && tracks.some((obj) => obj.type === "g3d") ? (
            <FlexLayout.Layout model={model} factory={factory} />
          ) : (
            <TrackManager
              key={trackManagerId.current}
              tracks={tracks}
              legendWidth={legendWidth}
              windowWidth={
                (!size.width || size.width - legendWidth < 0
                  ? 1500
                  : size.width) - legendWidth
              }
              userViewRegion={userViewRegion}
              highlights={highlights}
              genomeConfig={currentGenomeConfig}
              onNewRegion={onNewRegion}
              onNewRegionSelect={onNewRegionSelect}
              onNewHighlight={onNewHighlight}
              onTracksChange={onTracksChange}
              tool={tool}
              Toolbar={Toolbar}
              viewRegion={viewRegion}
              showGenomeNav={showGenomeNav}
              setScreenshotData={setScreenshotData}
              isScreenShotOpen={isScreenShotOpen}
              selectedRegionSet={selectedRegionSet}
              setShow3dGene={setShow3dGene}
              infiniteScrollWorker={infiniteScrollWorker}
              fetchGenomeAlignWorker={fetchGenomeAlignWorker}
            />
          )
        ) : (
          ""
        )} */}

        {/* {currentGenomeConfig && size.width > 0 ? (
          tracks && tracks.some((obj) => obj.type === "g3d") ? (
            <FlexLayout.Layout model={model} factory={factory} />
          ) : (
            <TrackManager
              key={trackManagerId.current}
              tracks={tracks}
              legendWidth={legendWidth}
              windowWidth={
                (!size.width || size.width - legendWidth < 0
                  ? 1500
                  : size.width) - legendWidth
              }
              userViewRegion={userViewRegion}
              highlights={highlights}
              genomeConfig={currentGenomeConfig}
              onNewRegion={onNewRegion}
              onNewRegionSelect={onNewRegionSelect}
              onNewHighlight={onNewHighlight}
              onTracksChange={onTracksChange}
              tool={tool}
              Toolbar={Toolbar}
              viewRegion={viewRegion}
              showGenomeNav={showGenomeNav}
              setScreenshotData={setScreenshotData}
              isScreenShotOpen={isScreenShotOpen}
              selectedRegionSet={selectedRegionSet}
              setShow3dGene={setShow3dGene}
              infiniteScrollWorker={infiniteScrollWorker}
              fetchGenomeAlignWorker={fetchGenomeAlignWorker}
            />
          )
        ) : (
          ""
        )} */}
      </div>
    </div>
  );
});

export default GenomeRoot;
