import React, { memo, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
// import worker_script from '../../Worker/worker';
import _ from "lodash";
import { TrackProps } from "../../models/trackModels/trackProps";

import trackConfigMenu from "../../trackConfigs/config-menu-components.tsx/TrackConfigMenu";
import OpenInterval from "../../models/OpenInterval";
import InteractionTrackComponent from "./InteractionComponents/InteractionTrackComponent";
import { objToInstanceAlign } from "./TrackManager";
import { DEFAULT_OPTIONS } from "./InteractionComponents/InteractionTrackComponent";
import { BigInteractTrackConfig } from "../../trackConfigs/config-menu-models.tsx/BigInteractTrackConfig";
import ChromosomeInterval from "../../models/ChromosomeInterval";
import { GenomeInteraction } from "./getRemoteData/GenomeInteraction";
import TrackLegend from "./commonComponents/TrackLegend";
import ReactDOM from "react-dom";
const BigInteractTrack: React.FC<TrackProps> = memo(function BigInteractTrack({
  side,
  trackData,
  trackIdx,
  handleDelete,
  windowWidth,
  dataIdx,
  onCloseConfigMenu,
  trackModel,
  genomeArr,
  genomeIdx,
  id,
  getConfigMenu,
  legendRef,
  trackManagerRef,
}) {
  //useRef to store data between states without re render the component
  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates
  const rightIdx = useRef(0);
  const leftIdx = useRef(1);
  const configOptions = useRef({ ...DEFAULT_OPTIONS });
  const fetchedDataCache = useRef<{ [key: string]: any }>({});
  const curRegionData = useRef<{ [key: string]: any }>({});
  const xPos = useRef(0);
  const parentGenome = useRef("");
  const configMenuPos = useRef<{ [key: string]: any }>({});

  const updateSide = useRef("right");
  const updatedLegend = useRef<any>();
  const [legend, setLegend] = useState<any>();
  const updateLegendCanvas = useRef<any>(null);

  const [canvasComponents, setCanvasComponents] = useState<any>();
  const [configChanged, setConfigChanged] = useState(false);

  const newTrackWidth = useRef(windowWidth);

  async function createCanvas(curTrackData, genesArr) {
    const algoData: any = [];
    genesArr.map((record) => {
      const regexMatch = record["rest"].match(
        /([\w.]+)\W+(\d+)\W+(\d+)\W+(\d+)/
      );

      if (regexMatch) {
        const fields = record["rest"].split("\t");

        const score = parseInt(fields[1]);
        const value = fields[2];
        const region1Chrom = fields[5];
        const region1Start = parseInt(fields[6]);
        const region1End = parseInt(fields[7]);
        const region2Chrom = fields[10];
        const region2Start = parseInt(fields[11]);
        const region2End = parseInt(fields[12]);

        const recordLocus1 = new ChromosomeInterval(
          region1Chrom,
          region1Start,
          region1End
        );
        const recordLocus2 = new ChromosomeInterval(
          region2Chrom,
          region2Start,
          region2End
        );
        algoData.push(new GenomeInteraction(recordLocus1, recordLocus2, score));
      } else {
        console.error(
          `${record[3]} not formated correctly in  BIGinteract track`
        );
      }
    });

    let tmpObj = { ...configOptions.current };
    tmpObj["trackManagerHeight"] = trackManagerRef.current.offsetHeight;
    function getNumLegend(legend: ReactNode) {
      updatedLegend.current = ReactDOM.createPortal(legend, legendRef.current);
    }
    let canvasElements = (
      <InteractionTrackComponent
        data={algoData}
        options={tmpObj}
        viewWindow={new OpenInterval(0, curTrackData.visWidth)}
        visRegion={objToInstanceAlign(curTrackData.visRegion)}
        width={curTrackData.visWidth}
        forceSvg={false}
        trackModel={trackModel}
        getNumLegend={getNumLegend}
      />
    );
    setCanvasComponents(canvasElements);
    if (curTrackData.initial === 1) {
      xPos.current = -curTrackData.startWindow;
    } else if (curTrackData.side === "right") {
      xPos.current =
        (Math.floor(-curTrackData.xDist / windowWidth) - 1) * windowWidth -
        windowWidth +
        curTrackData.startWindow;
    } else if (curTrackData.side === "left") {
      xPos.current =
        (Math.floor(curTrackData.xDist / windowWidth) - 1) * windowWidth -
        windowWidth +
        curTrackData.startWindow;
    }
    updateSide.current = side;
    newTrackWidth.current = curTrackData.visWidth;
  }

  // function to get for dataidx change and getting stored data
  function getCacheData() {
    //when dataIDx and rightRawData.current equals we have a new data since rightRawdata.current didn't have a chance to push new data yet
    //so this is for when there atleast 3 raw data length, and doesn't equal rightRawData.current length, we would just use the lastest three newest vaLUE
    // otherwise when there is new data cuz the user is at the end of the track
    let viewData: Array<any> = [];
    let curIdx;

    if (dataIdx! !== rightIdx.current && dataIdx! <= 0) {
      viewData = fetchedDataCache.current[dataIdx!].data;
      curIdx = dataIdx!;
    } else if (dataIdx! < leftIdx.current - 1 && dataIdx! > 0) {
      viewData = fetchedDataCache.current[dataIdx! + 1].data;
      curIdx = dataIdx! + 1;
    }
    if (viewData.length > 0) {
      curRegionData.current = {
        trackState: fetchedDataCache.current[curIdx].trackState,
        cachedData: viewData,
        initial: 0,
      };
      createCanvas(fetchedDataCache.current[curIdx].trackState, viewData);
    }
  }

  // INITIAL AND NEW DATA &&&&&&&&&&&&&&&&&&&
  useEffect(() => {
    async function handle() {
      if (trackData![`${id}`] !== undefined) {
        const primaryVisData =
          trackData!.trackState.genomicFetchCoord[
            trackData!.trackState.primaryGenName
          ].primaryVisData;

        if (trackData!.initial === 1) {
          //boxXpos.current = trackManagerRef.current!.getBoundingClientRect().x;
          if (trackModel.options) {
            configOptions.current = {
              ...configOptions.current,
              ...trackModel.options,
            };
          }
          if ("genome" in trackData![`${id}`].metadata) {
            parentGenome.current = trackData![`${id}`].metadata.genome;
          } else {
            parentGenome.current = trackData!.trackState.primaryGenName;
          }
          let visRegion =
            "genome" in trackData![`${id}`].metadata
              ? trackData!.trackState.genomicFetchCoord[
                  trackData![`${id}`].metadata.genome
                ].queryRegion
              : primaryVisData.visRegion;

          let trackState = {
            initial: 1,
            side: "right",
            xDist: 0,
            visRegion: visRegion,
            startWindow: primaryVisData.viewWindow.start,
            visWidth: primaryVisData.visWidth,
          };

          fetchedDataCache.current[rightIdx.current] = {
            data: trackData![`${id}`].result[0],
            trackState: trackState,
          };
          rightIdx.current--;

          let curDataArr = fetchedDataCache.current[0].data;

          curRegionData.current = {
            trackState: trackState,
            cachedData: curDataArr,
          };
          createCanvas(trackState, curDataArr);
        } else {
          let visRegion;
          if ("genome" in trackData![`${id}`].metadata) {
            visRegion =
              trackData!.trackState.genomicFetchCoord[
                `${trackData![`${id}`].metadata.genome}`
              ].queryRegion;
          } else {
            visRegion = primaryVisData.visRegion;
          }
          let newTrackState = {
            initial: 0,
            side: trackData!.trackState.side,
            xDist: trackData!.trackState.xDist,
            visRegion: visRegion,
            startWindow: primaryVisData.viewWindow.start,
            visWidth: primaryVisData.visWidth,
          };

          if (trackData!.trackState.side === "right") {
            newTrackState["index"] = rightIdx.current;
            fetchedDataCache.current[rightIdx.current] = {
              data: trackData![`${id}`].result,
              trackState: newTrackState,
            };

            rightIdx.current--;

            curRegionData.current = {
              trackState: newTrackState,
              cachedData: fetchedDataCache.current[rightIdx.current + 1].data,
              initial: 0,
            };
            createCanvas(
              newTrackState,
              fetchedDataCache.current[rightIdx.current + 1].data
            );
          } else if (trackData!.trackState.side === "left") {
            newTrackState["index"] = leftIdx.current;
            fetchedDataCache.current[leftIdx.current] = {
              data: trackData![`${id}`].result,
              trackState: newTrackState,
            };

            leftIdx.current++;

            curRegionData.current = {
              trackState: newTrackState,
              cachedData: fetchedDataCache.current[leftIdx.current - 1].data,
              initial: 0,
            };

            createCanvas(
              newTrackState,
              fetchedDataCache.current[leftIdx.current - 1].data
            );
          }
        }
      }
    }
    handle();
  }, [trackData]);
  // when INDEX POSITION CHANGE

  useEffect(() => {
    getCacheData();
  }, [dataIdx]);
  useEffect(() => {
    setLegend(updatedLegend.current);
  }, [canvasComponents]);

  function onConfigChange(key, value) {
    if (value === configOptions.current[`${key}`]) {
      return;
    } else {
      configOptions.current[`${key}`] = value;
    }
    setConfigChanged(true);
  }
  function renderConfigMenu(event) {
    event.preventDefault();

    genomeArr![genomeIdx!].options = configOptions.current;

    const renderer = new BigInteractTrackConfig(genomeArr![genomeIdx!]);

    // create object that has key as displayMode and the configmenu component as the value
    const items = renderer.getMenuComponents();

    let menu = trackConfigMenu[`${trackModel.type}`]({
      trackIdx,
      handleDelete,
      id,
      pageX: event.pageX,
      pageY: event.pageY,
      onCloseConfigMenu,
      trackModel,
      configOptions: configOptions.current,
      items,
      onConfigChange,
    });

    getConfigMenu(menu);
    configMenuPos.current = { left: event.pageX, top: event.pageY };
  }
  useEffect(() => {
    if (configChanged === true) {
      createCanvas(
        curRegionData.current.trackState,
        curRegionData.current.cachedData
      );
    }
    setConfigChanged(false);
  }, [configChanged]);

  return (
    <div
      onContextMenu={renderConfigMenu}
      style={{
        display: "flex",
        position: "relative",
        height: configOptions.current.height,
      }}
    >
      <div
        style={{
          position: "absolute",
          backgroundColor: configOptions.current.backgroundColor,
          left: updateSide.current === "right" ? `${xPos.current}px` : "",
          right: updateSide.current === "left" ? `${xPos.current}px` : "",
        }}
      >
        {canvasComponents}
      </div>
      {legend}
    </div>
  );
});
export default memo(BigInteractTrack);
