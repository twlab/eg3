import React, { memo } from "react";
import { useEffect, useRef, useState } from "react";
import { TrackProps } from "../../../models/trackModels/trackProps";

import ReactDOM from "react-dom";
import { Manager, Popper, Reference } from "react-popper";
import OutsideClickDetector from "./commonComponents/OutsideClickDetector";

import FeatureDetail from "./commonComponents/annotation/FeatureDetail";

import { DEFAULT_OPTIONS as defaultNumericalTrack } from "./commonComponents/numerical/NumericalTrack";
import { DEFAULT_OPTIONS as defaultAnnotationTrack } from "../../../trackConfigs/config-menu-models.tsx/AnnotationTrackConfig";

import { getTrackXOffset } from "./CommonTrackStateChangeFunctions.tsx/getTrackPixelXOffset";
import { getCacheData } from "./CommonTrackStateChangeFunctions.tsx/getCacheData";
import { getConfigChangeData } from "./CommonTrackStateChangeFunctions.tsx/getDataAfterConfigChange";
import { cacheTrackData } from "./CommonTrackStateChangeFunctions.tsx/cacheTrackData";
import { getDisplayModeFunction } from "./displayModeComponentMap";

const BACKGROUND_COLOR = "rgba(173, 216, 230, 0.9)"; // lightblue with opacity adjustment
const ARROW_SIZE = 16;

const ROW_PADDING = 2;
const HEIGHT = 10;
const ROW_HEIGHT = HEIGHT + ROW_PADDING;

export const DEFAULT_OPTIONS = {
  ...defaultNumericalTrack,
  ...defaultAnnotationTrack,
  mismatchColor: "yellow",
  deletionColor: "black",
  insertionColor: "green",
  color: "red",
  color2: "blue",
  smooth: 0, // for density mode
  rowHeight: ROW_HEIGHT,
  aggregateMethod: "COUNT",
};

const TOP_PADDING = 2;

const BamTrack: React.FC<TrackProps> = memo(function BamTrack({
  trackData,
  updateGlobalTrackConfig,

  side,
  windowWidth = 0,
  genomeArr,
  genomeIdx,
  trackModel,
  dataIdx,
  checkTrackPreload,
  trackIdx,
  id,

  setShow3dGene,
  isThereG3dTrack,
  legendRef,
  applyTrackConfigChange,
  sentScreenshotData,
}) {
  const configOptions = useRef({ ...DEFAULT_OPTIONS });
  const svgHeight = useRef(0);
  const rightIdx = useRef(0);
  const leftIdx = useRef(1);
  const updateSide = useRef("right");
  const updatedLegend = useRef<any>();

  const fetchedDataCache = useRef<{ [key: string]: any }>({});
  const displayCache = useRef<{ [key: string]: any }>({
    full: {},
    density: {},
  });

  function resetState() {
    configOptions.current = { ...DEFAULT_OPTIONS };
    svgHeight.current = 0;
    rightIdx.current = 0;
    leftIdx.current = 1;
    updateSide.current = "right";
    updatedLegend.current = undefined;
    fetchedDataCache.current = {};
    displayCache.current = {
      full: {},
      density: {},
    };

    xPos.current = 0;

    setToolTip(undefined);
    setToolTipVisible(false);
    setLegend(undefined);
  }
  const usePrimaryNav = useRef<boolean>(true);
  const xPos = useRef(0);
  const [svgComponents, setSvgComponents] = useState<any>(null);
  const [canvasComponents, setCanvasComponents] = useState<any>(null);
  const [toolTip, setToolTip] = useState<any>();
  const [toolTipVisible, setToolTipVisible] = useState(false);

  const [legend, setLegend] = useState<any>();

  const displaySetter = {
    full: {
      setComponents: setSvgComponents,
    },
    density: {
      setComponents: setCanvasComponents,
    },
  };
  function createSVGOrCanvas(trackState, genesArr, cacheIdx) {
    let curXPos = getTrackXOffset(trackState, windowWidth);
    function getHeight(numRows: number): number {
      let options = configOptions.current;
      let rowsToDraw = Math.min(numRows, options.maxRows);
      if (options.hideMinimalItems) {
        rowsToDraw -= 1;
      }
      if (rowsToDraw < 1) {
        rowsToDraw = 1;
      }
      return rowsToDraw * configOptions.current.rowHeight + TOP_PADDING;
    }
    let res = getDisplayModeFunction(
      {
        genesArr,
        trackState,
        windowWidth,
        configOptions: configOptions.current,
        renderTooltip,
        svgHeight,
        updatedLegend,
        trackModel,
        getGenePadding: 5,
        getHeight,
        ROW_HEIGHT,
      },
      displaySetter,
      displayCache,
      cacheIdx,
      curXPos
    );

    if (
      ((rightIdx.current + 2 >= dataIdx || leftIdx.current - 2 <= dataIdx) &&
        usePrimaryNav.current) ||
      ((rightIdx.current + 1 >= dataIdx || leftIdx.current - 1 <= dataIdx) &&
        !usePrimaryNav.current) ||
      trackState.initial ||
      trackState.recreate
    ) {
      xPos.current = curXPos;
      updateSide.current = side;
      configOptions.current.displayMode === "full"
        ? setSvgComponents(res)
        : setCanvasComponents(res);
    }
  }

  //________________________________________________________________________________________________________________________________________________________

  // the function to create individial feature element from the GeneAnnotation track which is passed down to fullvisualizer
  function bamClickTooltip(feature: any, pageX, pageY, name, onClose) {
    const contentStyle = Object.assign({
      marginTop: ARROW_SIZE,
      pointerEvents: "auto",
    });
    const alignment = feature.getAlignment();
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
              <OutsideClickDetector onOutsideClick={onClose}>
                <FeatureDetail feature={feature} />
                <div style={{ fontFamily: "monospace", whiteSpace: "pre" }}>
                  <div>Ref {alignment.reference}</div>
                  <div> {alignment.lines}</div>
                  <div>Read {alignment.read}</div>
                </div>
              </OutsideClickDetector>
              {ReactDOM.createPortal(
                <div
                  ref={arrowProps.ref}
                  style={{
                    ...arrowProps.style,
                    width: 0,
                    height: 0,
                    position: "absolute",
                    left: pageX - 8,
                    top: pageY,
                    borderLeft: `${ARROW_SIZE / 2}px solid transparent`,
                    borderRight: `${ARROW_SIZE / 2}px solid transparent`,
                    borderBottom: `${ARROW_SIZE}px solid ${BACKGROUND_COLOR}`,
                  }}
                />,
                document.body
              )}
            </div>
          )}
        </Popper>
      </Manager>,
      document.body
    );
  }

  function renderTooltip(event, feature) {
    const currtooltip = bamClickTooltip(
      feature,
      event.pageX,
      event.pageY,
      genomeArr![genomeIdx!].genome._name,
      onClose
    );
    setToolTipVisible(true);
    setToolTip(currtooltip);
  }
  function onClose() {
    setToolTipVisible(false);
  }

  useEffect(() => {
    async function handle() {
      if (trackData![`${id}`]) {
        if (trackData!.trackState.initial === 1) {
          if (
            "genome" in trackData![`${id}`].metadata &&
            trackData![`${id}`].metadata.genome !==
              genomeArr![genomeIdx!].genome.getName()
          ) {
            usePrimaryNav.current = false;
          }
          if (
            !genomeArr![genomeIdx!].isInitial &&
            genomeArr![genomeIdx!].sizeChange &&
            Object.keys(fetchedDataCache.current).length > 0
          ) {
            if (
              "genome" in trackData![`${id}`].metadata &&
              trackData![`${id}`].metadata.genome !==
                genomeArr![genomeIdx!].genome.getName()
            ) {
              trackData![`${id}`].result =
                fetchedDataCache.current[
                  trackData![`${id}`].trackDataIdx
                ].dataCache;
            } else {
              trackData![`${id}`].result = [
                fetchedDataCache.current[trackData![`${id}`].trackDataIdx + 1]
                  .dataCache,
                fetchedDataCache.current[trackData![`${id}`].trackDataIdx]
                  .dataCache,
                fetchedDataCache.current[trackData![`${id}`].trackDataIdx - 1]
                  .dataCache,
              ];
            }
          }
          resetState();
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
            usePrimaryNav: usePrimaryNav.current,
          });
        }

        let tmpRawData: Array<Promise<any>> = [];

        trackData![`${id}`].curFetchNav.forEach((locuses) => {
          tmpRawData.push(trackData![`${id}`].fetchInstance.getData(locuses));
        });

        trackData![`${id}`]["result"] = await Promise.all(tmpRawData);
        if (!trackData!.initial) {
          trackData![`${id}`]["result"] = trackData![`${id}`]["result"].flat();
        }
        cacheTrackData({
          usePrimaryNav: usePrimaryNav.current,
          id,
          trackData,
          fetchedDataCache,
          rightIdx,
          leftIdx,
          createSVGOrCanvas,
          trackModel,
        });
      }
    }
    handle();
  }, [trackData]);

  useEffect(() => {
    //when dataIDx and rightRawData.current equals we have a new data since rightRawdata.current didn't have a chance to push new data yet
    //so this is for when there atleast 3 raw data length, and doesn't equal rightRawData.current length, we would just use the lastest three newest vaLUE
    // otherwise when there is new data cuz the user is at the end of the track

    getCacheData({
      usePrimaryNav: usePrimaryNav.current,
      rightIdx: rightIdx.current,
      leftIdx: leftIdx.current,
      dataIdx,
      displayCache: displayCache.current,
      fetchedDataCache: fetchedDataCache.current,
      displayType: configOptions.current.displayMode,
      displaySetter,
      svgHeight,
      xPos,
      updatedLegend,
      trackModel,
      createSVGOrCanvas,
      side,
      updateSide,
    });
  }, [dataIdx]);
  useEffect(() => {
    checkTrackPreload(id);

    setLegend(ReactDOM.createPortal(updatedLegend.current, legendRef.current));
  }, [svgComponents, canvasComponents]);

  useEffect(() => {
    if (svgComponents !== null || canvasComponents !== null) {
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
        getConfigChangeData({
          fetchedDataCache: fetchedDataCache.current,
          dataIdx,
          usePrimaryNav: usePrimaryNav.current,
          createSVGOrCanvas,
          trackType: trackModel.type,
        });
      }
    }
  }, [applyTrackConfigChange]);

  return (
    //svg allows overflow to be visible x and y but the div only allows x overflow, so we need to set the svg to overflow x and y and then limit it in div its container.

    <div
      style={{
        display: "flex",
        // we add two pixel for the borders, because using absolute for child we have to set the height to match with the parent relative else
        // other elements will overlapp
        height:
          configOptions.current.displayMode === "full"
            ? svgHeight.current + 2
            : configOptions.current.height + 2,
        position: "relative",
      }}
    >
      {configOptions.current.displayMode === "full" ? (
        <div
          style={{
            position: "absolute",
            lineHeight: 0,
            right: updateSide.current === "left" ? `${xPos.current}px` : "",
            left: updateSide.current === "right" ? `${xPos.current}px` : "",
            backgroundColor: configOptions.current.backgroundColor,
          }}
        >
          {svgComponents}
        </div>
      ) : (
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
      )}
      {toolTipVisible ? toolTip : ""}
      {legend}
    </div>
  );
});

export default memo(BamTrack);
