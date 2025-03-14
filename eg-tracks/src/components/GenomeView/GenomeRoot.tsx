import React, { memo, useEffect, useRef, useState } from "react";
import _ from "lodash";
import { v4 as uuidv4 } from "uuid";
import { ITrackContainerState } from "../../types";
import "./track.css";
// import { chrType } from "../../localdata/genomename";
// import { getGenomeConfig } from "../../models/genomes/allGenomes";
import OpenInterval from "../../models/OpenInterval";

import useResizeObserver from "./TrackComponents/commonComponents/Resize";
import TrackManager from "./TrackManager";
import DisplayedRegionModel from "../../models/DisplayedRegionModel";
import RegionSet from "../../models/RegionSet";
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
  selectedRegionSet,
}) {
  const isInitial = useRef(true);
  const [resizeRef, size] = useResizeObserver();
  const [currentGenomeConfig, setCurrentGenomeConfig] = useState<any>(null);
  // TO-DO need to set initial.current back to true when genomeConfig changes
  // to see if genomeConfig we can check its session id because it will unique
  useEffect(() => {
    if (size.width > 0) {
      console.log(selectedRegionSet);
      let curGenome;
      if (!selectedRegionSet) {
        if (!isInitial.current) {
          curGenome = { ...currentGenomeConfig };

          curGenome["isInitial"] = isInitial.current;
          curGenome.defaultRegion = new OpenInterval(
            userViewRegion._startBase!,
            userViewRegion._endBase!
          );
          curGenome["sizeChange"] = true;
        } else {
          curGenome = { ...genomeConfig };
          curGenome["isInitial"] = isInitial.current;
          curGenome["genomeID"] = uuidv4();
          let bundleId = uuidv4();
          curGenome.defaultRegion = new OpenInterval(
            userViewRegion._startBase!,
            userViewRegion._endBase!
          );
          curGenome["bundleId"] = bundleId;
        }
      } else {
        let viewRegionSet: RegionSet;
        console.log(curGenome, "jere1");
        if (typeof selectedRegionSet === "object") {
          selectedRegionSet["genomeName"] =
            selectedRegionSet["genome"]["_name"];
          viewRegionSet = RegionSet.deserialize(selectedRegionSet);
          if (!viewRegionSet["genome"]) {
            viewRegionSet["genome"] = genomeConfig.genome;
          }
        } else {
          console.log(curGenome, "jere3");
          viewRegionSet = selectedRegionSet;
        }
        const newRegionSetVisData = new DisplayedRegionModel(
          viewRegionSet.makeNavContext()
        );
        if (!isInitial.current) {
          curGenome = { ...currentGenomeConfig };

          curGenome["isInitial"] = isInitial.current;
          curGenome.defaultRegion = new OpenInterval(
            newRegionSetVisData._startBase!,
            newRegionSetVisData._endBase!
          );
          curGenome["regionSetView"] = [viewRegionSet];
          curGenome["sizeChange"] = false;
          console.log(curGenome, "jere2");
        } else {
          curGenome = { ...genomeConfig };
          curGenome["isInitial"] = isInitial.current;
          curGenome["genomeID"] = uuidv4();
          let bundleId = uuidv4();
          curGenome.defaultRegion = new OpenInterval(
            newRegionSetVisData._startBase!,
            newRegionSetVisData._endBase!
          );
          curGenome["regionSetView"] = [viewRegionSet];

          curGenome["bundleId"] = bundleId;
        }
        curGenome.navContext = newRegionSetVisData._navContext;
      }

      setCurrentGenomeConfig(curGenome);
      isInitial.current = false;
    }
  }, [size.width, selectedRegionSet]);
  useEffect(() => {
    if (size.width > 0) {
      let curGenome;

      if (!isInitial.current) {
        console.log("did it reset here?", viewRegion);
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
              onNewRegionSelect={onNewRegionSelect}
              onNewHighlight={onNewHighlight}
              onTrackSelected={onTrackSelected}
              onTrackDeleted={onTrackDeleted}
              tool={tool}
              viewRegion={viewRegion}
              showGenomeNav={showGenomeNav}
            />
          )}
        </div>
      </div>
    </div>
  );
});

export default GenomeRoot;
