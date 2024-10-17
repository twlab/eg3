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
import { GenomeInteraction } from "../../getRemoteData/GenomeInteraction";

import ReactDOM from "react-dom";
const BigInteractTrack: React.FC<TrackProps> = memo(function BigInteractTrack({
  side,
  trackData,
  onTrackConfigChange,
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
  const configOptions = useRef({ ...DEFAULT_OPTIONS });
  const rightIdx = useRef(0);
  const leftIdx = useRef(1);
  const updateSide = useRef("right");
  const updatedLegend = useRef<any>();

  const fetchedDataCache = useRef<{ [key: string]: any }>({});
  const curRegionData = useRef<{ [key: string]: any }>({});

  const xPos = useRef(0);
  const parentGenome = useRef("");
  const configMenuPos = useRef<{ [key: string]: any }>({});

  const [canvasComponents, setCanvasComponents] = useState<any>(null);
  const [configChanged, setConfigChanged] = useState(false);
  const [legend, setLegend] = useState<any>();

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
          `${record[3]} not formatted correctly in BIGinteract track`
        );
      }
    });

    const tmpObj = { ...configOptions.current };
    tmpObj["trackManagerHeight"] = trackManagerRef.current.offsetHeight;

    const getNumLegend = (legend: ReactNode) => {
      updatedLegend.current = ReactDOM.createPortal(legend, legendRef.current);
    };

    const canvasElements = (
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

  useEffect(() => {
    async function handle() {
      if (trackData![`${id}`]) {
        const primaryVisData =
          trackData!.trackState.genomicFetchCoord[
            trackData!.trackState.primaryGenName
          ].primaryVisData;

        if (trackData!.initial === 1) {
          if (trackModel.options) {
            configOptions.current = {
              ...configOptions.current,
              ...trackModel.options,
            };
          }
          if (trackData![`${id}`].metadata.genome) {
            parentGenome.current = trackData![`${id}`].metadata.genome;
          } else {
            parentGenome.current = trackData!.trackState.primaryGenName;
          }

          let visRegion = trackData![`${id}`].metadata.genome
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

          curRegionData.current = {
            trackState: trackState,
            cachedData: fetchedDataCache.current[0].data,
          };

          createCanvas(trackState, fetchedDataCache.current[0].data);
        } else {
          let visRegion = trackData![`${id}`].metadata.genome
            ? trackData!.trackState.genomicFetchCoord[
                `${trackData![`${id}`].metadata.genome}`
              ].queryRegion
            : primaryVisData.visRegion;

          let newTrackState = {
            initial: 0,
            side: trackData!.trackState.side,
            xDist: trackData!.trackState.xDist,
            visRegion: visRegion,
            startWindow: primaryVisData.viewWindow.start,
            visWidth: primaryVisData.visWidth,
          };

          const isRightSide = trackData!.trackState.side === "right";
          let trackIdx = isRightSide ? rightIdx.current : leftIdx.current;
          let cacheKey = isRightSide ? rightIdx.current : leftIdx.current;

          fetchedDataCache.current[trackIdx] = {
            data: trackData![`${id}`].result,
            trackState: newTrackState,
          };

          curRegionData.current = {
            trackState: newTrackState,
            cachedData: fetchedDataCache.current[cacheKey].data,
          };

          createCanvas(newTrackState, fetchedDataCache.current[cacheKey].data);
          isRightSide ? rightIdx.current-- : leftIdx.current++;
        }
      }
    }
    handle();
    if (trackData![`${id}`] && trackData!.initial === 1) {
      onTrackConfigChange({
        configOptions: configOptions.current,
        trackModel: trackModel,
        id: id,
        trackIdx: trackIdx,
        legendRef: legendRef,
      });
    }
  }, [trackData]);

  useEffect(() => {
    setLegend(updatedLegend.current);
  }, [canvasComponents]);

  useEffect(() => {
    if (configChanged) {
      createCanvas(
        curRegionData.current.trackState,
        curRegionData.current.cachedData
      );
      onTrackConfigChange({
        configOptions: configOptions.current,
        trackModel: trackModel,
        id: id,
        trackIdx: trackIdx,
        legendRef: legendRef,
      });
    }
    setConfigChanged(false);
  }, [configChanged]);

  useEffect(() => {
    if (dataIdx! < rightIdx.current && dataIdx! >= 0) {
      let viewData = fetchedDataCache.current[dataIdx!].data;
      curRegionData.current = {
        trackState: fetchedDataCache.current[dataIdx!].trackState,
        cachedData: viewData,
      };
      createCanvas(fetchedDataCache.current[dataIdx!].trackState, viewData);
    }
  }, [dataIdx]);

  function onConfigChange(key, value) {
    if (configOptions.current[key] !== value) {
      configOptions.current[key] = value;
      setConfigChanged(true);
    }
  }

  function renderConfigMenu(event) {
    event.preventDefault();

    const renderer = new BigInteractTrackConfig(trackModel);
    const items = renderer.getMenuComponents();
    const menu = trackConfigMenu[trackModel.type]({
      blockRef: trackManagerRef,
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

    getConfigMenu(menu, "singleSelect");
    configMenuPos.current = { left: event.pageX, top: event.pageY };
  }

  return (
    <div
      onContextMenu={renderConfigMenu}
      style={{
        display: "flex",
        position: "relative",
        height: configOptions.current.height + 2,
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
