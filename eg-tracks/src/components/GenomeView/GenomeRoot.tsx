import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import _ from "lodash";
import { v4 as uuidv4 } from "uuid";
import { ITrackContainerState } from "../../types";
import "./track.css";
import { chrType } from "../../localdata/genomename";
import { getGenomeConfig } from "../../models/genomes/allGenomes";
import OpenInterval from "../../models/OpenInterval";
import GenomeNavigator from "./genomeNavigator/GenomeNavigator";
import useResizeObserver from "./TrackComponents/commonComponents/Resize";
import TrackManager from "./TrackManager";
import TrackModel from "../../models/TrackModel";
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
  onTrackAdded,
  viewRegion,
  userViewRegion,
}) {
  const isInitial = useRef(true);
  const [resizeRef, size] = useResizeObserver();
  const [currentGenomeConfig, setCurrentGenomeConfig] = useState<any>(null);

  useEffect(() => {
    if (size.width > 0) {
      let curGenome;

      if (!isInitial.current) {
        curGenome = { ...currentGenomeConfig };
        console.log(userViewRegion);
        curGenome["isInitial"] = isInitial.current;
        curGenome.defaultRegion = new OpenInterval(
          userViewRegion._startBase!,
          userViewRegion._endBase!
        );
        curGenome["sizeChange"] = true;
      } else {
        curGenome = { ...genomeConfig };
        console.log(curGenome);
        curGenome["isInitial"] = isInitial.current;
        curGenome["genomeID"] = uuidv4();
        let bundleId = uuidv4();
        curGenome["bundleId"] = bundleId;
      }

      setCurrentGenomeConfig(curGenome);
      isInitial.current = false;
    }
  }, [size.width]);
  useEffect(() => {
    if (size.width > 0) {
      let curGenome;

      if (!isInitial.current) {
        curGenome = { ...currentGenomeConfig };
        curGenome["isInitial"] = isInitial.current;
        curGenome.defaultRegion = new OpenInterval(
          viewRegion._startBase!,
          viewRegion._endBase!
        );
        curGenome["sizeChange"] = false;
        setCurrentGenomeConfig(curGenome);
      }
    }
  }, [viewRegion]);

  return (
    <div data-theme={"light"} style={{ paddingLeft: "1%", paddingRight: "1%" }}>
      <div ref={resizeRef as React.RefObject<HTMLDivElement>}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {size.width > 0 &&
          userViewRegion &&
          showGenomeNav &&
          currentGenomeConfig ? (
            <GenomeNavigator
              selectedRegion={userViewRegion}
              genomeConfig={currentGenomeConfig}
              windowWidth={size.width}
              onRegionSelected={onNewRegionSelect}
            />
          ) : null}

          {currentGenomeConfig && (
            <TrackManager
              key={currentGenomeConfig.genomeID}
              tracks={tracks}
              legendWidth={legendWidth}
              windowWidth={size.width - legendWidth}
              selectedRegion={userViewRegion}
              highlights={highlights}
              genomeConfig={currentGenomeConfig}
              onNewRegion={onNewRegion}
              onNewHighlight={onNewHighlight}
              onTrackSelected={function (trackSelected: TrackModel[]): void {
                throw new Error("Function not implemented.");
              }}
              onTrackDeleted={function (currenTracks: TrackModel[]): void {
                throw new Error("Function not implemented.");
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
});

export default GenomeRoot;
