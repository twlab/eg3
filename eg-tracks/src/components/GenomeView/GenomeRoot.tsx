import React, { memo, useEffect, useRef, useState } from "react";
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
  const infiniteScrollWorker = useRef<Worker | null>(null);
  const fetchGenomeAlignWorker = useRef<Worker | null>(null);
  const [currentGenomeConfig, setCurrentGenomeConfig] = useState<any>(null);
  const trackManagerId = useRef<null | string>(null);
  const prevViewRegion = useRef({ genomeName: "", start: 0, end: 1 });
  const layout = useRef(_.cloneDeep(initialLayout));
  const [model, setModel] = useState(FlexLayout.Model.fromJson(layout.current));
  const [show3dGene, setShow3dGene] = useState();
  //keep a ref of g3d track else completeTrackChange will not have the latest tracks data
  const g3dTracks = useRef<Array<any>>([]);

  function completeTracksChange(updateTracks: Array<TrackModel>) {
    onTracksChange([...updateTracks, ...g3dTracks.current]);
  }
  // function handleNodeResize(node) {
  //   const model = node.getModel();
  //   if (model) {
  //     const parent = node.getParent();
  //     // console.log(node.getId(), parent.getWeight());
  //     console.log(size.width);
  //     model.doAction(
  //       FlexLayout.Actions.updateNodeAttributes(parent.getId(), {
  //         width: size.width,
  //         weight: parent.getWeight(),
  //       })
  //     );
  //     // console.log(parent.getWeight());
  //     // console.log("HUHUH", parent);
  //     setModel(model);
  //   }
  // }
  function renderG3dTrackComponents(node) {
    // const model = node.getModel();

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
    // node.setEventListener("resize", () => handleNodeResize(node));

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

  const factory = (node) => {
    var component = node.getComponent();

    if (component === "Browser") {
      // node.setEventListener("resize", () => handleNodeResize(node));
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
          onTracksChange={completeTracksChange}
          tool={tool}
          Toolbar={Toolbar}
          viewRegion={viewRegion}
          showGenomeNav={showGenomeNav}
          isThereG3dTrack={g3dTracks.current.length > 0 ? true : false}
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
    const curG3dTracks = findAllG3dTabs(layout.current);
    const newG3dTracks: Array<any> = tracks.filter(
      (track) => track.type === "g3d"
    );

    if (tracks.length > 0) {
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
  console.log(size);
  return (
    <div
      style={{ height: "100%" }}
      ref={resizeRef as React.RefObject<HTMLDivElement>}
    >
      {/* <div ref={resizeRef as React.RefObject<HTMLDivElement>}> </div> */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: size.width,
          height: "100%",
        }}
      >
        {/* <GenomeViewerTest /> */}
        {currentGenomeConfig && size.width > 0 ? (
          <FlexLayout.Layout model={model} factory={factory} />
        ) : (
          ""
        )}
      </div>
    </div>
  );
});

export default GenomeRoot;
