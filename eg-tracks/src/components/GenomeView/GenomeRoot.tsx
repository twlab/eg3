import React, { memo, useEffect, useRef, useState } from "react";
import _ from "lodash";
import { ITrackContainerState } from "../../types";
import "./track.css";
// import { chrType } from "../../localdata/genomename";
// import { getGenomeConfig } from "../../models/genomes/allGenomes";
import OpenInterval from "../../models/OpenInterval";
import useResizeObserver from "./TrackComponents/commonComponents/Resize";
import TrackManager from "./TrackManager";
export const AWS_API = "https://lambda.epigenomegateway.org/v2";

const GenomeRoot: React.FC<ITrackContainerState> = memo(function GenomeRoot({
  tracks,
  genomeConfig,
  highlights,
  legendWidth,
  showGenomeNav,
  onNewRegion,
  onNewHighlight,
  onTrackSelected,
  onTrackDeleted,
  onNewRegionSelect,
  currentState,
  tool,
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
  // TO-DO need to set initial.current back to true when genomeConfig changes
  // to see if genomeConfig we can check its session id because it will unique

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
      setCurrentGenomeConfig(curGenome);
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
          setCurrentGenomeConfig(curGenome);
        }
      }
      prevViewRegion.current.genomeName = genomeConfig.genomeName;
      prevViewRegion.current.start = userViewRegion._startBase!;
      prevViewRegion.current.end = userViewRegion._endBase!;
    }
  }, [userViewRegion]);

  return (
    <div
      data-theme={"light"}
      style={{ paddingLeft: "10px", paddingRight: "10px" }}
    >
      <div ref={resizeRef as React.RefObject<HTMLDivElement>}> </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {currentGenomeConfig && (
          <TrackManager
            key={currentGenomeConfig.genomeID}
            tracks={tracks}
            legendWidth={legendWidth}
            windowWidth={size.width - legendWidth - 10}
            userViewRegion={userViewRegion}
            highlights={highlights}
            genomeConfig={currentGenomeConfig}
            onNewRegion={onNewRegion}
            onNewRegionSelect={onNewRegionSelect}
            onNewHighlight={onNewHighlight}
            onTrackSelected={onTrackSelected}
            onTrackDeleted={onTrackDeleted}
            tool={tool}
            viewRegion={viewRegion}
            showGenomeNav={showGenomeNav}
            setScreenshotData={setScreenshotData}
            isScreenShotOpen={isScreenShotOpen}
            selectedRegionSet={selectedRegionSet}
          />
        )}
      </div>
    </div>
  );
});

export default GenomeRoot;
