import React, { memo, useEffect, useRef, useState } from "react";
import _ from "lodash";
import { ITrackContainerState } from "../../types";
import FlexLayout from "flexlayout-react";
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
            component: "placeholder",
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
  const [currentGenomeConfig, setCurrentGenomeConfig] = useState<any>(null);
  const trackManagerId = useRef<null | string>(null);
  const prevViewRegion = useRef({ genomeName: "", start: 0, end: 1 });
  const modelRef = useRef(FlexLayout.Model.fromJson(json));

  const factory = (node) => {
    var component = node.getComponent();
    if (component === "placeholder") {
      return (
        <TrackManager
          key="main-track-manager"
          tracks={tracks}
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
    return () => {
      console.log("GenomeRoot unmounted");
    };
  }, []);
  return (
    <div style={{ paddingLeft: "20px", paddingRight: "20px" }}>
      <div ref={resizeRef as React.RefObject<HTMLDivElement>}> </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {currentGenomeConfig && size.width ? (
          <FlexLayout.Layout model={modelRef.current} factory={factory} />
        ) : (
          ""
        )}
      </div>
    </div>
  );
});

export default GenomeRoot;
