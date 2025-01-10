import _ from "lodash";

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ITrackContainerState } from "../../types";
import "../../index.css";
import { chrType } from "../../localdata/genomename";
import { getGenomeConfig } from "../../models/genomes/allGenomes";
import OpenInterval from "../../models/OpenInterval";
import GenomeNavigator from "./genomeNavigator/GenomeNavigator";

import { SelectDemo } from "./tesShadcn";
// Import the functions you need from the SDKs you need
import Drag from "./TrackComponents/commonComponents/chr-order/ChrOrder";
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
  viewRegion,
}) {
  const debounceTimeout = useRef<any>(null);
  const isInitial = useRef(true);
  const [resizeRef, size] = useResizeObserver();
  const [currentGenomeConfig, setCurrentGenomeConfig] = useState<any>(null);
  const trackModelId = useRef(0);
  //Control and manage the state RegionSetSelect, gene plot, scatter plot
  //_________________________________________________________________________________________________________________________

  //Control and manage the state of genomeNavigator, restoreview, and legend Width
  //_________________________________________________________________________________________________________________________

  useEffect(() => {
    if (size.width > 0) {
      debounceTimeout.current = setTimeout(() => {
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
          isInitial.current = false;
        }
        setCurrentGenomeConfig(curGenome);
      }, 300);
    }
  }, [size.width, genomeConfig]);

  return (
    <div data-theme={"light"} style={{ paddingLeft: "1%", paddingRight: "1%" }}>
      <div ref={resizeRef as React.RefObject<HTMLDivElement>}>
        {size.width > 0 ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {viewRegion && showGenomeNav && currentGenomeConfig ? (
              <GenomeNavigator
                selectedRegion={viewRegion}
                genomeConfig={currentGenomeConfig}
                windowWidth={size.width}
                onRegionSelected={onNewRegion}
              />
            ) : (
              ""
            )}
            {currentGenomeConfig ? (
              <TrackManager
                key={currentGenomeConfig.genomeID}
                legendWidth={legendWidth}
                windowWidth={size.width - legendWidth}
                selectedRegion={viewRegion}
                genomeConfig={currentGenomeConfig}
              />
            ) : (
              ""
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
});

export default GenomeRoot;
