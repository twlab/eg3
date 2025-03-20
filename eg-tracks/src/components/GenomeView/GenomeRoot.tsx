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

  tool,
  viewRegion,
  userViewRegion,
  setScreenshotData,
  isScreenShotOpen,
}) {
  const isInitial = useRef(true);
  const [resizeRef, size] = useResizeObserver();
  const [currentGenomeConfig, setCurrentGenomeConfig] = useState<any>(null);
  const trackManagerId = useRef<null | string>(null);
  // TO-DO need to set initial.current back to true when genomeConfig changes
  // to see if genomeConfig we can check its session id because it will unique
  useEffect(() => {
    if (size.width > 0) {
      let curGenome;

      if (!isInitial.current && trackManagerId.current) {
        curGenome = { ...genomeConfig };
        curGenome["genomeID"] = trackManagerId.current;
        curGenome["isInitial"] = isInitial.current;
        curGenome.defaultRegion = new OpenInterval(
          userViewRegion._startBase!,
          userViewRegion._endBase!
        );
        curGenome["sizeChange"] = true;
      } else {
        trackManagerId.current = crypto.randomUUID();
        curGenome = genomeConfig;
        curGenome["isInitial"] = isInitial.current;
        curGenome["genomeID"] = trackManagerId.current;
        curGenome.defaultRegion = new OpenInterval(
          userViewRegion._startBase!,
          userViewRegion._endBase!
        );
      }
      setCurrentGenomeConfig(curGenome);

      isInitial.current = false;
    }
  }, [size.width]);
  useEffect(() => {
    console.log("SADASD2");
    if (size.width > 0) {
      let curGenome;
      console.log("SADASD2");
      if (trackManagerId.current) {
        curGenome = { ...genomeConfig };
        curGenome["isInitial"] = isInitial.current;
        curGenome["genomeID"] = trackManagerId.current;
        curGenome.defaultRegion = new OpenInterval(
          userViewRegion._startBase!,
          userViewRegion._endBase!
        );
        curGenome["sizeChange"] = false;
        setCurrentGenomeConfig(curGenome);
      }
    }
  }, [viewRegion]);

  return (
    <div data-theme={"light"} style={{ paddingLeft: "1%", paddingRight: "1%" }}>
      <div ref={resizeRef as React.RefObject<HTMLDivElement>}> </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {currentGenomeConfig && (
          <TrackManager
            key={currentGenomeConfig.genomeID}
            tracks={tracks}
            legendWidth={legendWidth}
            windowWidth={size.width - legendWidth}
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
          />
        )}
      </div>
    </div>
  );
});

export default GenomeRoot;
