import React, { memo } from "react";
import { useEffect, useRef, useState } from "react";
import { TrackProps } from "../../../models/trackModels/trackProps";
import OpenInterval from "../../../models/OpenInterval";
import ReactDOM from "react-dom";
import { Manager, Popper, Reference } from "react-popper";
import OutsideClickDetector from "./commonComponents/OutsideClickDetector";

import { DEFAULT_OPTIONS as defaultCategorical } from "../../../trackConfigs/config-menu-models.tsx/CategoricalTrackConfig";
import { DEFAULT_OPTIONS as defaultAnnotationTrack } from "../../../trackConfigs/config-menu-models.tsx/AnnotationTrackConfig";

import Feature from "../../../models/Feature";
import FeatureDetail from "./commonComponents/annotation/FeatureDetail";
import { cacheTrackData } from "./CommonTrackStateChangeFunctions.tsx/cacheTrackData";
import { getCacheData } from "./CommonTrackStateChangeFunctions.tsx/getCacheData";
import { getConfigChangeData } from "./CommonTrackStateChangeFunctions.tsx/getDataAfterConfigChange";
import { getTrackXOffset } from "./CommonTrackStateChangeFunctions.tsx/getTrackPixelXOffset";
import { getDisplayModeFunction } from "./displayModeComponentMap";

const BACKGROUND_COLOR = "rgba(173, 216, 230, 0.9)"; // lightblue with opacity adjustment
const ARROW_SIZE = 16;
export const DEFAULT_OPTIONS = {
  ...defaultAnnotationTrack,
  ...defaultCategorical,
  height: 20,
  color: "blue",
  maxRows: 1,
  hiddenPixels: 0.5,
  backgroundColor: "var(--bg-color)",
  alwaysDrawLabel: true,
  category: {},
};

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

const CategoricalTrack: React.FC<TrackProps> = memo(function CategoricalTrack({
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
  const useFineOrSecondaryParentNav = useRef(useFineModeNav);

  const xPos = useRef(0);

  const [svgComponents, setSvgComponents] = useState<any>(null);
  const [toolTip, setToolTip] = useState<any>();
  const [toolTipVisible, setToolTipVisible] = useState(false);
  const [configChanged, setConfigChanged] = useState(false);
  const [legend, setLegend] = useState<any>();

  const displaySetter = {
    full: {
      setComponents: setSvgComponents,
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

  function renderTooltip(event, feature) {
    const currtooltip = featureClickTooltip(
      feature,
      event.pageX,
      event.pageY,
      genomeArr![genomeIdx!].genome._name,
      onClose
    );
    setToolTipVisible(true);
    setToolTip(currtooltip);
  }

  function featureClickTooltip(feature: any, pageX, pageY, name, onClose) {
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
              <OutsideClickDetector onOutsideClick={onClose}>
                <FeatureDetail
                  feature={feature}
                  category={configOptions.current.category}
                />
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
  }, [svgComponents]);
  useEffect(() => {
    if (svgComponents !== null) {
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
        getConfigChangeData(
          useFineOrSecondaryParentNav.current,
          fetchedDataCache.current,
          dataIdx,
          createSVGOrCanvas,
          "none"
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

      {toolTipVisible ? toolTip : ""}
      {legend}
    </div>
  );
});

export default memo(CategoricalTrack);
