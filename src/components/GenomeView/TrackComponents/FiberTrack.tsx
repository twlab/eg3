import React, { memo, useEffect, useRef, useState } from "react";
import { TrackProps } from "../../../models/trackModels/trackProps";
import { DEFAULT_OPTIONS as defaultFiberTrack } from "./bedComponents/FiberTrackComponent";

import { getGenomeConfig } from "../../../models/genomes/allGenomes";
import ReactDOM from "react-dom";
import { cacheTrackData } from "./CommonTrackStateChangeFunctions.tsx/cacheTrackData";
import { getDisplayModeFunction } from "./displayModeComponentMap";
import { getTrackXOffset } from "./CommonTrackStateChangeFunctions.tsx/getTrackPixelXOffset";
import { getCacheData } from "./CommonTrackStateChangeFunctions.tsx/getCacheData";
import { FiberDisplayModes } from "@/trackConfigs/config-menu-models.tsx/DisplayModes";
import { Manager, Reference, Popper } from "react-popper";
import { Fiber } from "@/models/Feature";
import OpenInterval from "@/models/OpenInterval";
const BACKGROUND_COLOR = "rgba(173, 216, 230, 0.9)"; // lightblue with opacity adjustment
const ARROW_SIZE = 16;
export const DEFAULT_OPTIONS = {
  ...defaultFiberTrack,
};

DEFAULT_OPTIONS.displayMode = FiberDisplayModes.AUTO;
function getGenePadding(feature: Fiber, xSpan: OpenInterval) {
  const width = xSpan.end - xSpan.start;
  const estimatedLabelWidth = feature.getName().length * 9;
  if (estimatedLabelWidth < 0.5 * width) {
    return 5;
  } else {
    return 9 + estimatedLabelWidth;
  }
}
const FiberTrack: React.FC<TrackProps> = memo(function FiberTrack({
  trackData,
  updateGlobalTrackConfig,
  side,
  windowWidth = 0,
  genomeArr,
  genomeIdx,
  trackModel,
  dataIdx,

  trackIdx,
  id,
  useFineModeNav,
  basePerPixel,
  legendRef,

  applyTrackConfigChange,
}) {
  const configOptions = useRef({ ...DEFAULT_OPTIONS });
  const svgHeight = useRef(0);
  const rightIdx = useRef(0);
  const leftIdx = useRef(1);
  const updateSide = useRef("right");
  const updatedLegend = useRef<any>();
  const parentGenome = useRef("");
  const fetchedDataCache = useRef<{ [key: string]: any }>({});
  const displayCache = useRef<{ [key: string]: any }>({ density: {} });
  const useFineOrSecondaryParentNav = useRef(false);
  const xPos = useRef(0);
  const [toolTip, setToolTip] = useState<any>();
  const [toolTipVisible, setToolTipVisible] = useState(false);
  const [canvasComponents, setCanvasComponents] = useState<any>(null);

  const [legend, setLegend] = useState<any>();

  const displaySetter = {
    density: {
      setComponents: setCanvasComponents,
    },
  };
  function getHeight(numRows: number): number {
    let rowHeight = configOptions.current.rowHeight;
    let options = configOptions.current;
    let rowsToDraw = Math.min(numRows, options.maxRows);

    if (options.hideMinimalItems) {
      rowsToDraw -= 1;
    }
    if (rowsToDraw < 1) {
      rowsToDraw = 1;
    }
    // add one to row because the last none bar svg doesn;t count
    return (rowsToDraw + 1) * rowHeight + 2;
  }
  function createSVGOrCanvas(trackState, genesArr, cacheIdx) {
    let curXPos = getTrackXOffset(
      trackState,
      windowWidth,
      useFineOrSecondaryParentNav.current
    );
    getDisplayModeFunction(
      {
        genesArr,
        useFineOrSecondaryParentNav: useFineOrSecondaryParentNav.current,
        trackState,
        windowWidth,
        configOptions: configOptions.current,
        renderTooltip,
        onHideToolTip,
        svgHeight,
        updatedLegend,
        trackModel,
        getHeight,
        getGenePadding,
        genomeConfig: getGenomeConfig(parentGenome.current),
        basesByPixel: basePerPixel,
      },
      displaySetter,
      displayCache,
      cacheIdx,
      curXPos
    );

    xPos.current = curXPos;
    updateSide.current = side;
  }

  // the function to create individial feature element from the GeneAnnotation track which is passed down to fullvisualizer
  function barTooltip(feature: any, pageX, pageY, onCount, onPct, total) {
    const contentStyle = Object.assign({
      marginTop: ARROW_SIZE,
      pointerEvents: "auto",
    });

    return ReactDOM.createPortal(
      <Manager>
        <Reference>
          {({ ref }) => (
            <div
              ref={ref}
              style={{ position: "absolute", left: pageX - 8 * 2, top: pageY }}
            />
          )}
        </Reference>
        <Popper
          placement="bottom-start"
          modifiers={[{ name: "flip", enabled: false }]}
        >
          {({ ref, style, placement, arrowProps }) => (
            <div
              ref={ref}
              style={{
                ...style,
                ...contentStyle,
                zIndex: 1001,
              }}
              className="Tooltip"
            >
              <div>
                {onCount}/{total} ({`${(onPct * 100).toFixed(2)}%`})
              </div>
              <div>{feature.getName()}</div>
            </div>
          )}
        </Popper>
      </Manager>,
      document.body
    );
  }
  function normToolTip(bs: any, pageX, pageY, feature) {
    const contentStyle = Object.assign({
      marginTop: ARROW_SIZE,
      pointerEvents: "auto",
    });

    return ReactDOM.createPortal(
      <Manager>
        <Reference>
          {({ ref }) => (
            <div
              ref={ref}
              style={{
                position: "absolute",
                left: pageX - 8 * 2,
                top: pageY,
              }}
            />
          )}
        </Reference>

        <div
          style={{
            ...contentStyle,
            zIndex: 1001,
          }}
          className="Tooltip"
        >
          <div>
            {bs && `position ${bs} in`} {feature.getName()} read
          </div>
        </div>
      </Manager>,
      document.body
    );
  }
  function onHideToolTip() {
    setToolTipVisible(false);
  }
  function renderTooltip(
    event,
    feature,
    bs,
    type,
    onCount = "",
    onPct = "",
    total = ""
  ) {
    let currtooltip;
    if (type === "norm") {
      currtooltip = normToolTip(bs, event.pageX, event.pageY, feature);
    } else {
      currtooltip = barTooltip(
        feature,
        event.pageX,
        event.pageY,
        onCount,
        onPct,
        total
      );
    }
    setToolTipVisible(true);
    setToolTip(currtooltip);
  }

  useEffect(() => {
    if (trackData![`${id}`]) {
      if (trackData!.initial === 1) {
        if ("genome" in trackData![`${id}`].metadata) {
          parentGenome.current = trackData![`${id}`].metadata.genome;
        } else {
          parentGenome.current = trackData!.trackState.primaryGenName;
        }
        configOptions.current = {
          ...configOptions.current,
          ...trackModel.options,
        };

        updateGlobalTrackConfig({
          configOptions: configOptions.current,
          trackModel: trackModel,
          id: id,
          trackIdx: trackIdx,
          legendRef: legendRef,
        });
      }
      if (
        useFineModeNav ||
        (trackData![`${id}`].metadata.genome !== undefined &&
          genomeArr![genomeIdx!].genome.getName() !==
            trackData![`${id}`].metadata.genome)
      ) {
        useFineOrSecondaryParentNav.current = true;
      }

      cacheTrackData(
        useFineOrSecondaryParentNav.current,
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
      useFineOrSecondaryParentNav.current,
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

  useEffect(() => {
    setLegend(ReactDOM.createPortal(updatedLegend.current, legendRef.current));
  }, [canvasComponents]);

  useEffect(() => {
    if (canvasComponents !== null) {
      if (id in applyTrackConfigChange) {
        if ("type" in applyTrackConfigChange) {
          configOptions.current = {
            ...DEFAULT_OPTIONS,
            ...applyTrackConfigChange[`${id}`],
          };
        } else {
          configOptions.current = {
            ...configOptions.current,
            ...applyTrackConfigChange[`${id}`],
          };
        }

        updateGlobalTrackConfig({
          configOptions: configOptions.current,
          trackModel: trackModel,
          id: id,
          trackIdx: trackIdx,
          legendRef: legendRef,
        });
        if (dataIdx! in displayCache.current.density) {
          let tmpNewConfig = { ...configOptions.current };

          for (let key in displayCache.current.density) {
            let curCacheComponent =
              displayCache.current.density[`${key}`].canvasData;
            let newComponent = React.cloneElement(curCacheComponent, {
              options: tmpNewConfig,
            });
            displayCache.current.density[`${key}`].canvasData = newComponent;
          }
          configOptions.current = tmpNewConfig;

          setCanvasComponents(
            displayCache.current.density[`${dataIdx}`].canvasData
          );
        }
      }
    }
  }, [applyTrackConfigChange]);
  return (
    <div
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
      {toolTipVisible ? toolTip : ""}
      {legend}
    </div>
  );
});

export default memo(FiberTrack);
