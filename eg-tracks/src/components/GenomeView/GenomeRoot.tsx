import React, { memo, useEffect, useRef, useState } from "react";
import _ from "lodash";
import { v4 as uuidv4 } from "uuid";
import { ITrackContainerState } from "../../types";
import "./track.css";
// import { chrType } from "../../localdata/genomename";
// import { getGenomeConfig } from "../../models/genomes/allGenomes";
import OpenInterval from "../../models/OpenInterval";
import GenomeNavigator from "./genomeNavigator/GenomeNavigator";
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
  onTrackAdded,
  tool,
  viewRegion,
  userViewRegion,

}) {
  const isInitial = useRef(true);
  const [resizeRef, size] = useResizeObserver();
  const [currentGenomeConfig, setCurrentGenomeConfig] = useState<any>(null);
  // TO-DO need to set initial.current back to true when genomeConfig changes 
  // to see if genomeConfig we can check its session id because it will unique
  useEffect(() => {

    if (size.width > 0) {
      console.log("did it reset here222?")
      let curGenome;

      if (!isInitial.current) {
        console.log("did it reset hereasddsads3443343434aads?")
        curGenome = { ...currentGenomeConfig };

        curGenome["isInitial"] = isInitial.current;
        curGenome.defaultRegion = new OpenInterval(
          userViewRegion._startBase!,
          userViewRegion._endBase!
        );
        curGenome["sizeChange"] = true;
      } else {
        console.log("did it reset hereasddsadsaads?")
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

      setCurrentGenomeConfig(curGenome);
      isInitial.current = false;
    }
  }, [size.width]);
  useEffect(() => {
    if (size.width > 0) {

      let curGenome;

      if (!isInitial.current) {
        console.log("did it reset here?", viewRegion)
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
            currentGenomeConfig && (
              <GenomeNavigator
                selectedRegion={userViewRegion}
                genomeConfig={currentGenomeConfig}
                windowWidth={size.width}
                onRegionSelected={onNewRegionSelect}
              />
            )}

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

            />
          )}
        </div>
      </div>
    </div>
  );
});

export default GenomeRoot;
