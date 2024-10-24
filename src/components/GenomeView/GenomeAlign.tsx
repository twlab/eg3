import React, { memo, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { TrackProps } from "../../models/trackModels/trackProps";
import HoverToolTip from "./commonComponents/HoverToolTips/HoverToolTip";
import { DEFAULT_OPTIONS } from "./GenomeAlignComponents/GenomeAlignComponents";
import { GenomeAlignTrackConfig } from "../../trackConfigs/config-menu-models.tsx/GenomeAlignTrackConfig";
import trackConfigMenu from "../../trackConfigs/config-menu-components.tsx/TrackConfigMenu";
import { cacheTrackData } from "./CommonTrackStateChangeFunctions.tsx/cacheTrackData";
import { getCacheData } from "./CommonTrackStateChangeFunctions.tsx/getCacheData";
import { getConfigChangeData } from "./CommonTrackStateChangeFunctions.tsx/getDataAfterConfigChange";
import { getTrackXOffset } from "./CommonTrackStateChangeFunctions.tsx/getTrackPixelXOffset";
import { getDisplayModeFunction } from "./displayModeComponentMap";

const GenomeAlign: React.FC<TrackProps> = memo(function GenomeAlign({
  basePerPixel,
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
  useFineModeNav,
  legendRef,
  trackManagerRef,
}) {
  const configOptions = useRef({ ...DEFAULT_OPTIONS, displayMode: "full" });
  const rightIdx = useRef(0);
  const leftIdx = useRef(1);
  const fetchedDataCache = useRef<{ [key: string]: any }>({});
  const displayCache = useRef<{ [key: string]: any }>({
    full: {},
  });
  const updatedLegend = useRef<any>();
  const svgHeight = useRef(0);
  const useFineOrSecondaryParentNav = useRef(useFineModeNav);

  const xPos = useRef(0);
  const updateSide = useRef("right");
  const newTrackWidth = useRef(windowWidth);
  const configMenuPos = useRef<{ [key: string]: any }>({});
  const [svgComponents, setSvgComponents] = useState<{ [key: string]: any }>(
    {}
  );
  const [configChanged, setConfigChanged] = useState(false);
  const [legend, setLegend] = useState<any>();

  const displaySetter = {
    full: { setComponents: setSvgComponents },
  };

  async function createSVGOrCanvas(trackState, genesArr, cacheIdx) {
    let curXPos = getTrackXOffset(trackState, windowWidth, true);

    getDisplayModeFunction(
      {
        genesArr,
        useFineOrSecondaryParentNav: true,
        trackState,
        windowWidth,
        configOptions: configOptions.current,
        svgHeight,
        updatedLegend,
        trackModel,
        basesByPixel: basePerPixel,
      },
      displaySetter,
      displayCache,
      cacheIdx,
      curXPos
    );
    newTrackWidth.current = trackState.visWidth;
    xPos.current = curXPos;
    updateSide.current = side;
  }
  // async function createSVGOrCanvas(trackState, genesArr, cacheIdx) {
  //   let result = genesArr;
  //   let svgElements;

  //   if (basePerPixel! <= 10) {
  //     const drawData = result.drawData as PlacedAlignment[];

  //     svgElements = drawData.map((item, index) =>
  //       renderFineAlignment(item, index, configOptions.current)
  //     );
  //     const drawGapText = result.drawGapText as GapText[];
  //     svgElements.push(
  //       drawGapText.map((item, index) =>
  //         renderGapText(item, index, configOptions.current)
  //       )
  //     );

  //     let tempObj = {
  //       alignment: result,
  //       svgElements,
  //       trackState,
  //     };
  //     console.log(tempObj);
  //     setSvgComponents(tempObj);

  //     if (trackState.initial === 1) {
  //       xPos.current = -trackState.startWindow;
  //     } else if (trackState.side === "right") {
  //       xPos.current =
  //         (Math.floor(-trackState.xDist / windowWidth) - 1) * windowWidth -
  //         windowWidth +
  //         trackState.startWindow;
  //     } else if (trackState.side === "left") {
  //       xPos.current =
  //         (Math.floor(trackState.xDist / windowWidth) - 1) * windowWidth -
  //         windowWidth +
  //         trackState.startWindow;
  //     }
  //     newTrackWidth.current = trackState.visWidth;
  //     updateSide.current = side;
  //   }

  //   //ROUGHMODE __________________________________________________________________________________________________________________________________________________________
  //   //step 1
  //   else {
  //     const drawData = result.drawData as PlacedMergedAlignment[];

  //     const strand = result.plotStrand;
  //     const targetGenome = result.primaryGenome;
  //     const queryGenome = result.queryGenome;
  //     svgElements = drawData.map((placement) =>
  //       renderRoughAlignment(
  //         placement,
  //         strand === "-",
  //         80,
  //         targetGenome,
  //         queryGenome
  //       )
  //     );
  //     const arrows = renderRoughStrand(
  //       "+",
  //       0,
  //       new OpenInterval(0, windowWidth * 3),
  //       false
  //     );
  //     svgElements.push(arrows);
  //     // const primaryViewWindow = result.primaryVisData.viewWindow;

  //     const primaryArrows = renderRoughStrand(
  //       strand,
  //       80 - 15,
  //       new OpenInterval(0, windowWidth * 3),
  //       true
  //     );
  //     svgElements.push(primaryArrows);

  //     let tempObj = {
  //       alignment: result,
  //       svgElements,
  //       trackState,
  //     };
  //     setSvgComponents(tempObj);

  //     if (trackState.initial === 1) {
  //       xPos.current = -windowWidth;
  //     } else if (trackState.side === "right") {
  //       xPos.current =
  //         (Math.floor(-trackState.xDist / windowWidth) - 1) * windowWidth;
  //     } else if (trackState.side === "left") {
  //       xPos.current =
  //         (Math.floor(trackState.xDist / windowWidth) - 1) * windowWidth;
  //     }
  //     newTrackWidth.current = trackState.visWidth;
  //     updateSide.current = side;
  //   }

  //   let curLegendEle = ReactDOM.createPortal(
  //     <TrackLegend
  //       height={configOptions.current.height}
  //       trackModel={trackModel}
  //     />,
  //     legendRef.current
  //   );

  //   setLegend(curLegendEle);
  // }
  useEffect(() => {
    if (trackData![`${id}`]) {
      if (trackData!.initial === 1) {
        configOptions.current = {
          ...configOptions.current,
          ...trackModel.options,
        };

        onTrackConfigChange({
          configOptions: configOptions.current,
          trackModel: trackModel,
          id: id,
          trackIdx: trackIdx,
          legendRef: legendRef,
        });
      }

      cacheTrackData(
        true,
        id,
        trackData,
        fetchedDataCache,
        rightIdx,
        leftIdx,
        createSVGOrCanvas,
        genomeArr![genomeIdx!],
        "none"
      );
    }
  }, [trackData]);

  useEffect(() => {
    getCacheData(
      true,
      rightIdx.current,
      leftIdx.current,
      dataIdx,
      displayCache.current,
      fetchedDataCache.current,
      configOptions.current.displayMode,
      displaySetter,
      svgHeight,
      xPos,
      updatedLegend,
      trackModel,
      createSVGOrCanvas,
      side,
      updateSide,
      "none"
    );
  }, [dataIdx]);

  function onConfigChange(key, value) {
    if (value === configOptions.current[key]) {
      return;
    } else if (
      key === "displayMode" &&
      value !== configOptions.current.displayMode
    ) {
      configOptions.current.displayMode = value;

      trackModel.options = configOptions.current;
      const renderer = new GenomeAlignTrackConfig(trackModel);

      const items = renderer.getMenuComponents();

      let menu = trackConfigMenu[`${trackModel.type}`]({
        blockRef: trackManagerRef,
        trackIdx,
        handleDelete,
        id,
        pageX: configMenuPos.current.left,
        pageY: configMenuPos.current.top,
        onCloseConfigMenu,
        trackModel,
        configOptions: configOptions.current,
        items,
        onConfigChange,
        basesByPixel: basePerPixel,
      });
      getConfigMenu(menu, "singleSelect");
    } else {
      configOptions.current[key] = value;
    }
    setConfigChanged(true);
  }

  useEffect(() => {
    if (configChanged === true) {
      getConfigChangeData(
        true,
        fetchedDataCache.current,
        dataIdx,
        createSVGOrCanvas,
        "none"
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
    setLegend(ReactDOM.createPortal(updatedLegend.current, legendRef.current));
  }, [svgComponents]);
  function renderConfigMenu(event) {
    event.preventDefault();

    const renderer = new GenomeAlignTrackConfig(trackModel);
    const items = renderer.getMenuComponents();
    let menu = trackConfigMenu[`${trackModel.type}`]({
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
        height: `${configOptions.current.height + 2}px`,
      }}
    >
      <svg
        width={`${newTrackWidth.current}px`}
        style={{
          display: "block",
          position: "absolute",
          height: `${configOptions.current.height}px`,
          right: updateSide.current === "left" ? `${xPos.current}px` : "",
          left: updateSide.current === "right" ? `${xPos.current}px` : "",
        }}
      >
        {svgComponents.svgElements}
      </svg>
      {svgComponents.svgElements && (
        <div
          style={{
            position: "absolute",
            right: updateSide.current === "left" ? `${xPos.current}px` : "",
            left: updateSide.current === "right" ? `${xPos.current}px` : "",
            zIndex: 3,
          }}
        >
          <HoverToolTip
            data={svgComponents.alignment}
            windowWidth={svgComponents.trackState.visWidth}
            trackType={useFineModeNav ? "genomealignFine" : "genomealignRough"}
            height={configOptions.current.height}
            viewRegion={svgComponents.trackState.visRegion}
            side={svgComponents.trackState.side}
            options={configOptions.current}
          />
        </div>
      )}
      {legend}
    </div>
  );
});

export default memo(GenomeAlign);
