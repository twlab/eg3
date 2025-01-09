import _ from "lodash";

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ITrackContainerState } from "@/types";
import { useGenome } from "../../lib/contexts/GenomeContext";
import { chrType } from "../../localdata/genomename";
import { getGenomeConfig } from "../../models/genomes/allGenomes";
import OpenInterval from "../../models/OpenInterval";
import GenomeNavigator from "./genomeNavigator/GenomeNavigator";

import { SelectDemo } from "./tesShadcn";
// Import the functions you need from the SDKs you need
import Drag from "./TrackComponents/commonComponents/chr-order/ChrOrder";
import useResizeObserver from "./TrackComponents/commonComponents/Resize";
import TrackManager from "./TrackManager";
import DisplayedRegionModel from "@/models/DisplayedRegionModel";

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
  const isInitial = useRef(false);
  const [resizeRef, size] = useResizeObserver();

  //Control and manage the state RegionSetSelect, gene plot, scatter plot
  //_________________________________________________________________________________________________________________________

  //Control and manage the state of genomeNavigator, restoreview, and legend Width
  //_________________________________________________________________________________________________________________________

  useEffect(() => {
    if (size.width > 0) {
      debounceTimeout.current = setTimeout(() => {
        let curGenome;

        curGenome = genomeConfig;
        curGenome["isInitial"] = isInitial.current;

        if (!isInitial.current) {
          curGenome.defaultRegion = new OpenInterval(
            viewRegion._startBase!,
            viewRegion._endBase!
          );
          curGenome["sizeChange"] = true;
        } else {
          curGenome["genomeID"] = uuidv4();
          let bundleId = uuidv4();
        }
      }, 300);
    }
  }, [size.width, genomeConfig]);

  return (
    <div style={{ paddingLeft: "1%", paddingRight: "1%" }}>
      <div ref={resizeRef as React.RefObject<HTMLDivElement>}>
        {size.width > 0 ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {viewRegion && showGenomeNav && genomeConfig ? (
              <GenomeNavigator
                selectedRegion={viewRegion}
                genomeConfig={genomeConfig}
                windowWidth={size.width}
                onRegionSelected={onNewRegion}
              />
            ) : (
              ""
            )}

            <TrackManager
              key={genomeConfig.genomeID}
              legendWidth={legendWidth}
              windowWidth={size.width - legendWidth}
              selectedRegion={viewRegion}
              genomeConfig={genomeConfig}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
});

export default GenomeRoot;
