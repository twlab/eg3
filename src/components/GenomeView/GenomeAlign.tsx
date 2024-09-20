import React, { memo } from "react";
import { useEffect, useRef, useState } from "react";
// import worker_script from '../../Worker/worker';
import _ from "lodash";
import HoverToolTip from "./commonComponents/hover-and-tooltip/hoverToolTip";
import { TrackProps } from "../../models/trackModels/trackProps";
import {
  GapText,
  PlacedAlignment,
} from "./GenomeAlignComponents/MultiAlignmentViewCalculator";
import {
  renderFineAlignment,
  renderGapText,
  renderRoughStrand,
  renderRoughAlignment,
  DEFAULT_OPTIONS,
  PlacedMergedAlignment,
} from "./GenomeAlignComponents/GenomeAlignComponents";
import { GenomeAlignTrackConfig } from "../../trackConfigs/config-menu-models.tsx/GenomeAlignTrackConfig";
import trackConfigMenu from "../../trackConfigs/config-menu-components.tsx/TrackConfigMenu";
import OpenInterval from "../../models/OpenInterval";
const GenomeAlign: React.FC<TrackProps> = memo(function GenomeAlign({
  bpToPx,
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
  useFineModeNav,
}) {
  //useRef to store data between states without re render the component
  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates
  const rightIdx = useRef(0);
  const leftIdx = useRef(1);
  const configOptions = useRef({ ...DEFAULT_OPTIONS });
  const fetchedDataCache = useRef<{ [key: string]: any }>({});
  const curRegionData = useRef<{ [key: string]: any }>({});
  const xPos = useRef(0);
  const configMenuPos = useRef<{ [key: string]: any }>({});
  const [svgComponents, setSvgComponents] = useState<{ [key: string]: any }>(
    {}
  );
  const [configChanged, setConfigChanged] = useState(false);

  const newTrackWidth = useRef(windowWidth);

  function createSVG(trackState, alignmentData) {
    let result = alignmentData;
    let svgElements;

    if (bpToPx! <= 10) {
      const drawData = result.drawData as PlacedAlignment[];

      svgElements = drawData.map((item, index) =>
        renderFineAlignment(item, index, configOptions.current)
      );
      const drawGapText = result.drawGapText as GapText[];
      svgElements.push(
        drawGapText.map((item, index) =>
          renderGapText(item, index, configOptions.current)
        )
      );

      let tempObj = {
        alignment: result,
        svgElements,
        trackState,
      };
      setSvgComponents(tempObj);

      if (trackState.index === 0) {
        xPos.current = -trackState.startWindow;
      } else if (trackState.side === "right") {
        xPos.current = -trackState!.xDist - trackState.startWindow;
      } else if (trackState.side === "left") {
        xPos.current = trackState!.xDist - trackState.startWindow;
      }

      newTrackWidth.current = trackState.visWidth;
    }

    //ROUGHMODE __________________________________________________________________________________________________________________________________________________________
    //step 1
    else {
      const drawData = result.drawData as PlacedMergedAlignment[];

      const strand = result.plotStrand;
      const targetGenome = result.primaryGenome;
      const queryGenome = result.queryGenome;
      svgElements = drawData.map((placement) =>
        renderRoughAlignment(
          placement,
          strand === "-",
          80,
          targetGenome,
          queryGenome
        )
      );
      const arrows = renderRoughStrand(
        "+",
        0,
        new OpenInterval(0, windowWidth * 3),
        false
      );
      svgElements.push(arrows);
      // const primaryViewWindow = result.primaryVisData.viewWindow;

      const primaryArrows = renderRoughStrand(
        strand,
        80 - 15,
        new OpenInterval(0, windowWidth * 3),
        true
      );
      svgElements.push(primaryArrows);

      let tempObj = {
        alignment: result,
        svgElements,
        trackState,
      };
      setSvgComponents(tempObj);

      if (trackState.index === 0) {
        xPos.current = -trackState.startWindow;
      } else if (trackState.side === "right") {
        xPos.current = -trackState!.xDist - trackState.startWindow;
      } else if (trackState.side === "left") {
        xPos.current = trackState!.xDist - trackState.startWindow;
      }

      newTrackWidth.current = trackState.visWidth;
    }
  }

  // function to get for dataidx change and getting stored data
  function getCacheData() {
    //when dataIDx and rightRawData.current equals we have a new data since rightRawdata.current didn't have a chance to push new data yet
    //so this is for when there atleast 3 raw data length, and doesn't equal rightRawData.current length, we would just use the lastest three newest vaLUE
    // otherwise when there is new data cuz the user is at the end of the track
    let viewData = {};
    let curIdx;

    if (dataIdx! !== rightIdx.current && dataIdx! <= 0) {
      if (dataIdx === 1) {
        dataIdx = 0;
      }
      viewData = fetchedDataCache.current[dataIdx!].data;
      curIdx = dataIdx!;
    } else if (dataIdx! !== leftIdx.current && dataIdx! > 0) {
      if (dataIdx === 1) {
        dataIdx = 0;
      }
      viewData = fetchedDataCache.current[dataIdx!].data;
      curIdx = dataIdx!;
    }
    if ("drawData" in viewData) {
      curRegionData.current = {
        trackState: fetchedDataCache.current[curIdx].trackState,
        cachedData: viewData,
        initial: 0,
      };
      createSVG(fetchedDataCache.current[curIdx].trackState, viewData);
    }
  }
  // INITIAL AND NEW DATA &&&&&&&&&&&&&&&&&&&
  useEffect(() => {
    if (trackData![`${id}`] !== undefined) {
      if (trackData!.initial === 1) {
        let trackState0 = {
          initial: 0,
          side: "left",
          xDist: 0,
          index: 1,
          startWindow:
            trackData![`${id}`].result[0].result.primaryVisData.viewWindow
              .start,
          visWidth:
            trackData![`${id}`].result[0].result.primaryVisData.visWidth,
        };
        let trackState1 = {
          initial: 1,
          side: "right",
          xDist: 0,
          index: 0,
          startWindow:
            trackData![`${id}`].result[1].result.primaryVisData.viewWindow
              .start,
          visWidth:
            trackData![`${id}`].result[1].result.primaryVisData.visWidth,
        };
        let trackState2 = {
          initial: 0,
          side: "right",
          xDist: 0,
          index: -1,
          startWindow:
            trackData![`${id}`].result[2].result.primaryVisData.viewWindow
              .start,
          visWidth:
            trackData![`${id}`].result[2].result.primaryVisData.visWidth,
        };

        fetchedDataCache.current[leftIdx.current] = {
          data: trackData![`${id}`].result[0].result,
          trackState: trackState0,
        };
        leftIdx.current++;

        fetchedDataCache.current[rightIdx.current] = {
          data: trackData![`${id}`].result[1].result,
          trackState: trackState1,
        };
        rightIdx.current--;
        fetchedDataCache.current[rightIdx.current] = {
          data: trackData![`${id}`].result[2].result,
          trackState: trackState2,
        };
        rightIdx.current--;

        let curDataArr = fetchedDataCache.current[0].data;

        curRegionData.current = {
          trackState: trackState1,
          cachedData: curDataArr,
        };
        createSVG(trackState1, curDataArr);
      } else {
        let newTrackState = {
          ...trackData!.trackState,
          startWindow:
            trackData![`${id}`].result.primaryVisData.viewWindow.start,
          visWidth: trackData![`${id}`].result.primaryVisData.visWidth,
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
          createSVG(
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

          createSVG(
            newTrackState,
            fetchedDataCache.current[leftIdx.current - 1].data
          );
        }
      }
    }
  }, [trackData]);
  // when INDEX POSITION CHANGE

  useEffect(() => {
    getCacheData();
  }, [dataIdx]);
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

    const renderer = new GenomeAlignTrackConfig(genomeArr![genomeIdx!]);

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
      createSVG(
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
        flexDirection: "column",
        height: `${configOptions.current.height}px`,
      }}
    >
      <div
        style={{
          display: "flex",
          position: "relative",
          height: `${configOptions.current.height}px`,
        }}
      >
        <svg
          width={`${newTrackWidth.current}px`}
          style={{
            display: "block",
            position: "absolute",
            borderTop: "1px solid Dodgerblue",
            borderBottom: "1px solid Dodgerblue",
            height: `${configOptions.current.height}px`,
            right: side === "left" ? `${xPos.current!}px` : "",
            left: side === "right" ? `${xPos.current!}px` : "",
          }}
        >
          {svgComponents.svgElements}
        </svg>
        {svgComponents.svgElements ? (
          <div
            style={{
              position: "absolute",

              right: side === "left" ? `${xPos.current!}px` : "",
              left: side === "right" ? `${xPos.current!}px` : "",
              zIndex: 3,
            }}
          >
            <HoverToolTip
              data={svgComponents.alignment}
              windowWidth={svgComponents.trackState.visWidth}
              trackType={
                useFineModeNav ? "genomealignFine" : "genomealignRough"
              }
              height={configOptions.current.height}
              viewRegion={svgComponents.trackState.visRegion}
              side={svgComponents.trackState.side}
              options={configOptions.current}
            />
          </div>
        ) : (
          ""
        )}
      </div>
    </div>
  );
});
export default memo(GenomeAlign);
