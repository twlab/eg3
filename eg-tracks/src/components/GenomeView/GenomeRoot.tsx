import React, { memo, useEffect, useRef, useState } from "react";
import _ from "lodash";
import { ITrackContainerState } from "../../types";
import FlexLayout from "flexlayout-react";
import ThreedmolContainer from "./TrackComponents/3dmol/ThreedmolContainer";
import "./AppLayout.css";
var json = {
  global: {},
  borders: [],
  layout: {
    type: "row",
    weight: 100,
    children: [
      {
        type: "tabset",
        weight: 50,
        children: [
          {
            type: "tab",
            name: "One",
            component: "Browser",
            enableClose: true,
          },
        ],
      },
      {
        type: "tabset",
        weight: 50,
        children: [
          {
            type: "tab",
            name: "two",
            component: "placeholder2",
            enableClose: true,
          },
        ],
      },
    ],
  },
};

// import "./track.css";
// import { chrType } from "../../localdata/genomename";
// import { getGenomeConfig } from "../../models/genomes/allGenomes";
import OpenInterval from "../../models/OpenInterval";
import useResizeObserver from "./TrackComponents/commonComponents/Resize";
import TrackManager from "./TrackManager";

// import GenomeViewer from "..";
export const AWS_API = "https://lambda.epigenomegateway.org/v2";
import "./track.css";

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
  const modelRef = useRef(FlexLayout.Model.fromJson(json));
  const [show3dGene, setShow3dGene] = useState();
  const [g3dtrackComponents, setG3dTrackComponents] = useState<Array<any>>([]);
  const factory = (node) => {
    var component = node.getComponent();
    // newG3dComponents.push({
    //   id: trackManagerState.current.tracks[i].id,
    //   component: ThreedmolContainer,

    //   trackModel: trackManagerState.current.tracks[i],
    // });
    //     for (let i = 0; i < trackManagerState.current.tracks.length; i++) {
    //   if (trackManagerState.current.tracks[i].type === "genomealign") {
    //     if (basePerPixel.current < 10) {
    //       useFineModeNav.current = true;
    //     }
    //   }
    //   if (trackManagerState.current.tracks[i].type === "hic") {
    //     if (
    //       !fetchInstances.current[`${trackManagerState.current.tracks[i].id}`]
    //     ) {
    //       fetchInstances.current[`${trackManagerState.current.tracks[i].id}`] =
    //         new HicSource(trackManagerState.current.tracks[i].url);
    //     }
    //   } else if (trackManagerState.current.tracks[i].type === "dynamichic") {
    //     trackManagerState.current.tracks[i].tracks?.map(
    //       (_item: any, index: string | number) => {
    //         fetchInstances.current[
    //           `${trackManagerState.current.tracks[i].id}` +
    //             "subtrack" +
    //             `${index}`
    //         ] = new HicSource(
    //           trackManagerState.current.tracks[i].tracks![index].url
    //         );
    //       }
    //     );
    //   } else if (
    //     trackManagerState.current.tracks[i].type in
    //     { matplot: "", dynamic: "", dynamicbed: "", dynamiclongrange: "" }
    //   ) {
    //     trackManagerState.current.tracks[i].tracks?.map(
    //       (trackModel: { id: string }, index: any) => {
    //         trackModel.id =
    //           `${trackManagerState.current.tracks[i].id}` +
    //           "subtrack" +
    //           `${index}`;
    //       }
    //     );
    //   } else if (trackManagerState.current.tracks[i].type === "bam") {
    //     fetchInstances.current[`${trackManagerState.current.tracks[i].id}`] =
    //       new BamSource(trackManagerState.current.tracks[i].url);
    //   }

    //   const newPosRef = createRef();
    //   const newLegendRef = createRef();

    //   trackManagerState.current.tracks[i]["legendWidth"] = legendWidth;

    //   if (trackManagerState.current.tracks[i].type !== "g3d") {
    //     newTrackComponents.push({
    //       trackIdx: i,
    //       id: trackManagerState.current.tracks[i].id,
    //       component: TrackFactory,
    //       posRef: newPosRef,
    //       legendRef: newLegendRef,
    //       trackModel: trackManagerState.current.tracks[i],
    //       hasAllRegionData: false,
    //     });
    //   } else {
    //     isThereG3dTrack.current = true;

    //     newG3dComponents.push({
    //       id: trackManagerState.current.tracks[i].id,
    //       component: ThreedmolContainer,

    //       trackModel: trackManagerState.current.tracks[i],
    //     });
    //   }
    // }

    // if (newG3dComponents.length > 0) {
    //   setG3dTrackComponents(newG3dComponents);
    // }

    if (component === "Browser") {
      return (
        <TrackManager
          key="main-track-manager"
          tracks={tracks.filter((trackModel) => trackModel.type !== "g3d")}
          legendWidth={legendWidth}
          windowWidth={
            (!size.width || size.width - legendWidth < 0 ? 1500 : size.width) -
            legendWidth
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
      return <div>HI 2</div>;
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
    }, 200)
  );

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
      }

      throttledSetConfig.current(curGenome);
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
    return () => {
      infiniteScrollWorker.current?.terminate();
      fetchGenomeAlignWorker.current?.terminate();
    };
  }, [tracks]);
  return (
    <div style={{ paddingLeft: "20px", paddingRight: "20px" }}>
      <div ref={resizeRef as React.RefObject<HTMLDivElement>}> </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {currentGenomeConfig && size.width > 0 ? (
          tracks && tracks.some((obj) => obj.type === "g3d") ? (
            <FlexLayout.Layout model={modelRef.current} factory={factory} />
          ) : (
            <TrackManager
              key="main-track-manager"
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
        )}
      </div>
    </div>
  );
});

export default GenomeRoot;

// {g3dtrackComponents.length > 0 ? (
//   <div
//     style={{
//       display: "flex",
//       backgroundColor: "var(--bg-color)",
//       WebkitBackfaceVisibility: "hidden",
//       WebkitPerspective: `${windowWidth + 120}px`,
//       backfaceVisibility: "hidden",
//       perspective: `${windowWidth + 120}px`,
//       border: "1px solid #d3d3d3",
//       borderRadius: "10px",
//       boxShadow: "0 2px 3px 0 rgba(0, 0, 0, 0.2)",
//       padding: "5px",
//       flexWrap: "wrap",
//     }}
//   >
//     {g3dtrackComponents.map((item, index) => {
//       const Component = item.component;
//       return (
//         trackManagerState.current.viewRegion && (
//           <div key={item.id} style={{ width: "50%" }}>
//             <Component
//               handleDelete={handleDelete}
//               tracks={tracks}
//               g3dtrack={item.trackModel}
//               viewRegion={trackManagerState.current.viewRegion}
//               width={windowWidth / 2}
//               genomeConfig={genomeConfig}
//               geneFor3d={show3dGene}
//             />
//           </div>
//         )
//       );
//     })}
//   </div>
// ) : (
//   ""
// )}
