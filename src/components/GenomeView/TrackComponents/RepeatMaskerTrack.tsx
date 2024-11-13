import React, { memo } from "react";
import { useEffect, useRef, useState } from "react";
import { TrackProps } from "../../../models/trackModels/trackProps";
import OpenInterval from "../../../models/OpenInterval";
import ReactDOM from "react-dom";
import { Manager, Popper, Reference } from "react-popper";
import OutsideClickDetector from "./commonComponents/OutsideClickDetector";
import { DEFAULT_OPTIONS as defaultAnnotationTrack } from "../../../trackConfigs/config-menu-models.tsx/AnnotationTrackConfig";
import Feature from "../../../models/Feature";
import { AnnotationDisplayModes } from "../../../trackConfigs/config-menu-models.tsx/DisplayModes";
import { RepeatMaskerFeature } from "../../../models/RepeatMaskerFeature";
import { cacheTrackData } from "./CommonTrackStateChangeFunctions.tsx/cacheTrackData";
import { getCacheData } from "./CommonTrackStateChangeFunctions.tsx/getCacheData";
import { getConfigChangeData } from "./CommonTrackStateChangeFunctions.tsx/getDataAfterConfigChange";
import { getTrackXOffset } from "./CommonTrackStateChangeFunctions.tsx/getTrackPixelXOffset";
import { getDisplayModeFunction } from "./displayModeComponentMap";
const BACKGROUND_COLOR = "rgba(173, 216, 230, 0.9)"; // lightblue with opacity adjustment
export const MAX_BASES_PER_PIXEL = 1000; // The higher this number, the more zooming out we support
const ARROW_SIZE = 16;
const TEXT_HEIGHT = 9; // height for both text label and arrows.
export const DEFAULT_OPTIONS = {
  ...defaultAnnotationTrack,
  maxRows: 1,
  height: 40,
  categoryColors: RepeatMaskerFeature.DEFAULT_CLASS_COLORS,
  displayMode: AnnotationDisplayModes.FULL,
  hiddenPixels: 0.5,
  backgroundColor: "var(--bg-color)",
  alwaysDrawLabel: true,
};

export interface RepeatDASFeature {
  genoLeft: string;
  label: string;
  max: number;
  milliDel: string;
  milliDiv: string;
  milliIns: string;
  min: number;
  orientation: string;
  repClass: string;
  repEnd: string;
  repFamily: string;
  repLeft: string;
  repStart: string;
  score: number;
  segment: string;
  swScore: string;
  type: string;
  _chromId: number;
}
const ROW_VERTICAL_PADDING = 5;
const ROW_HEIGHT = 9 + ROW_VERTICAL_PADDING;
function getGenePadding(feature: Feature, xSpan: OpenInterval) {
  const width = xSpan.end - xSpan.start;
  const estimatedLabelWidth = feature.getName().length * 9;
  if (estimatedLabelWidth < 0.5 * width) {
    return 5;
  } else {
    return 9 + estimatedLabelWidth;
  }
}
const TOP_PADDING = 2;

const RepeatMaskerTrack: React.FC<TrackProps> = memo(
  function RepeatMaskerTrack({
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
    legendRef,
    applyTrackConfigChange,
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
    const useFineOrSecondaryParentNav = useRef(false);
    const xPos = useRef(0);
    const [svgComponents, setSvgComponents] = useState<any>(null);
    const [canvasComponents, setCanvasComponents] = useState<any>(null);
    const [toolTip, setToolTip] = useState<any>();
    const [toolTipVisible, setToolTipVisible] = useState(false);
    const [configChanged, setConfigChanged] = useState(false);
    const [legend, setLegend] = useState<any>();

    const displaySetter = {
      full: {
        setComponents: setSvgComponents,
      },
      density: {
        setComponents: setCanvasComponents,
      },
    };

    function getHeight(numRows: number): number {
      let rowHeight = ROW_HEIGHT;
      let options = configOptions.current;
      let rowsToDraw = Math.min(numRows, options.maxRows);
      if (options.hideMinimalItems) {
        rowsToDraw -= 1;
      }
      if (rowsToDraw < 1) {
        rowsToDraw = 1;
      }
      return rowsToDraw * rowHeight + TOP_PADDING;
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
          svgHeight,
          updatedLegend,
          trackModel,
          getGenePadding,
          getHeight,
          ROW_HEIGHT,
        },
        displaySetter,
        displayCache,
        cacheIdx,
        curXPos
      );

      xPos.current = curXPos;
      updateSide.current = side;
    }

    function repeatMaskLeftClick(feature: any, pageX, pageY, name, onClose) {
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
                  <div>
                    <div>
                      <span
                        className="Tooltip-major-text"
                        style={{ marginRight: 5 }}
                      >
                        {feature.getName()}
                      </span>
                      <span className="Tooltip-minor-text">
                        {feature.getClassDetails()}
                      </span>
                    </div>
                    <div>
                      {feature.getLocus().toString()} (
                      {feature.getLocus().getLength()}bp)
                    </div>
                    <div>(1 - divergence%) = {feature.value.toFixed(2)}</div>
                    <div>strand: {feature.strand}</div>
                    <div className="Tooltip-minor-text">
                      {trackModel.getDisplayLabel()}
                    </div>
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
      const currtooltip = repeatMaskLeftClick(
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
      if (trackData![`${id}`]) {
        if (trackData!.initial === 1) {
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
          trackData![`${id}`].metadata.genome !== undefined
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
          "uniqueId"
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
        "uniqueId"
      );
    }, [dataIdx]);

    useEffect(() => {
      setLegend(
        ReactDOM.createPortal(updatedLegend.current, legendRef.current)
      );
    }, [svgComponents, canvasComponents]);

    useEffect(() => {
      if (svgComponents !== null || canvasComponents !== null) {
        if (id in applyTrackConfigChange) {
          configOptions.current = {
            ...configOptions.current,
            ...applyTrackConfigChange[`${id}`],
          };
          updateGlobalTrackConfig({
            configOptions: configOptions.current,
            trackModel: trackModel,
            id: id,
            trackIdx: trackIdx,
            legendRef: legendRef,
          });
          getConfigChangeData(
            useFineOrSecondaryParentNav.current,
            fetchedDataCache.current,
            dataIdx,
            createSVGOrCanvas,
            "uniqueId"
          );
        }
      }
    }, [applyTrackConfigChange]);
    return (
      <div
        style={{
          display: "flex",
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
          </div>
        )}
        {toolTipVisible ? toolTip : ""}
        {legend}
      </div>
    );
  }
);

export default memo(RepeatMaskerTrack);
