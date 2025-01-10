import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import _ from "lodash";
import { v4 as uuidv4 } from "uuid";
import { ITrackContainerState } from "../../types";
import "../../index.css";
import { chrType } from "../../localdata/genomename";
import { getGenomeConfig } from "../../models/genomes/allGenomes";
import OpenInterval from "../../models/OpenInterval";
import GenomeNavigator from "./genomeNavigator/GenomeNavigator";
import useResizeObserver from "./TrackComponents/commonComponents/Resize";
import TrackManager from "./TrackManager";
import OutsideClickDetector from "./TrackComponents/commonComponents/OutsideClickDetector";

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
  viewRegion,
  userViewRegion,
}) {
  const debounceTimeout = useRef<any>(null);
  const isInitial = useRef(true);
  const [resizeRef, size] = useResizeObserver();
  const [currentGenomeConfig, setCurrentGenomeConfig] = useState<any>(null);
  const trackModelId = useRef(0);

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
        curGenome["sizeChange"] = true;
      } else {
        curGenome = { ...genomeConfig };
        curGenome["isInitial"] = isInitial.current;
        curGenome["genomeID"] = uuidv4();
        let bundleId = uuidv4();
        curGenome["bundleId"] = bundleId;
        curGenome.defaultTracks.map((trackModel) => {
          trackModel.id = trackModelId.current;
          trackModelId.current++;
        });
      }
      setCurrentGenomeConfig(curGenome);
      isInitial.current = false;
    }
  }, [size.width]);

  useEffect(() => {
    console.log(currentGenomeConfig);
  }, [currentGenomeConfig]);

  return (
    <div data-theme={"light"} style={{ paddingLeft: "1%", paddingRight: "1%" }}>
      <div ref={resizeRef as React.RefObject<HTMLDivElement>}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {userViewRegion && showGenomeNav && currentGenomeConfig ? (
            <GenomeNavigator
              selectedRegion={userViewRegion}
              genomeConfig={currentGenomeConfig}
              windowWidth={size.width}
              onRegionSelected={onNewRegion}
            />
          ) : null}
          {currentGenomeConfig && (
            <TrackManager
              key={currentGenomeConfig.genomeID}
              legendWidth={legendWidth}
              windowWidth={size.width - legendWidth}
              selectedRegion={userViewRegion}
              highlights={highlights}
              genomeConfig={currentGenomeConfig}
              onNewRegion={onNewRegion}
              onNewHighlight={onNewHighlight}
              onTrackSelected={onTrackSelected}
              onTrackDeleted={onTrackDeleted}
            />
          )}
        </div>
      </div>
    </div>
  );
});

export default GenomeRoot;
