import React, { memo } from "react";
import { useEffect, useRef, useState } from "react";
import { TrackProps } from "../../../models/trackModels/trackProps";
import ReactDOM from "react-dom";
import { Manager, Popper, Reference } from "react-popper";
import OutsideClickDetector from "./commonComponents/OutsideClickDetector";
import GeneDetail from "./geneAnnotationTrackComponents/GeneDetail";
import { DEFAULT_OPTIONS as defaultGeneAnnotationTrack } from "./geneAnnotationTrackComponents/GeneAnnotation";
import { DEFAULT_OPTIONS as defaultNumericalTrack } from "./commonComponents/numerical/NumericalTrack";
import { DEFAULT_OPTIONS as defaultAnnotationTrack } from "../../../trackConfigs/config-menu-models.tsx/AnnotationTrackConfig";
import { getTrackXOffset } from "./CommonTrackStateChangeFunctions.tsx/getTrackPixelXOffset";
import { getCacheData } from "./CommonTrackStateChangeFunctions.tsx/getCacheData";
import { getConfigChangeData } from "./CommonTrackStateChangeFunctions.tsx/getDataAfterConfigChange";
import { cacheTrackData } from "./CommonTrackStateChangeFunctions.tsx/cacheTrackData";
import { getDisplayModeFunction } from "./displayModeComponentMap";
import { useGenome } from "@/lib/contexts/GenomeContext";
import OpenInterval from "@/models/OpenInterval";

const BACKGROUND_COLOR = "rgba(173, 216, 230, 0.9)"; // lightblue with opacity adjustment
const ARROW_SIZE = 16;

export const DEFAULT_OPTIONS = {
  ...defaultGeneAnnotationTrack,
  ...defaultNumericalTrack,
  ...defaultAnnotationTrack,
};
DEFAULT_OPTIONS.aggregateMethod = "COUNT";
const ROW_VERTICAL_PADDING = 5;
const ROW_HEIGHT = 9 + ROW_VERTICAL_PADDING;
const getGenePadding = (gene) => gene.getName().length * 9;
const TOP_PADDING = 2;

const RefGeneTrack: React.FC<TrackProps> = memo(function RefGeneTrack({
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
  dragX,
}) {
  const { screenshotOpen } = useGenome();
  const configOptions = useRef({ ...DEFAULT_OPTIONS });
  const svgHeight = useRef(0);
  const rightIdx = useRef(0);
  const leftIdx = useRef(1);
  const updateSide = useRef("right");
  const updatedLegend = useRef<any>();
  const usePrimaryNav = useRef<boolean>(true);
  const fetchedDataCache = useRef<{ [key: string]: any }>({});
  const displayCache = useRef<{ [key: string]: any }>({
    full: {},
    density: {},
  });

  const xPos = useRef(0);
  const [svgComponents, setSvgComponents] = useState<any>(null);
  const [test, settest] = useState<any>(null);
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

  async function createSVGOrCanvas(trackState, genesArr) {
    let curXPos = getTrackXOffset(trackState, windowWidth);
    trackState["viewWindow"] = new OpenInterval(0, trackState.visWidth);
    const result = await getDisplayModeFunction({
      genesArr,
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
    });

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
        ? setSvgComponents(result)
        : setCanvasComponents(result);
    }
  }
  // Function to create individual feature element from the GeneAnnotation track, passed to full visualizer
  function refGeneClickTooltip(gene: any, pageX, pageY, name, onClose) {
    const contentStyle = Object.assign({
      marginTop: ARROW_SIZE,
      pointerEvents: "auto",
    });

    const tooltipElement = (
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
                <GeneDetail
                  gene={gene}
                  collectionName={name}
                  queryEndpoint={{}}
                />
                {isThereG3dTrack ? (
                  <div>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => setShow3dGene(gene)}
                    >
                      Show in 3D
                    </button>
                  </div>
                ) : (
                  ""
                )}
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
      </Manager>
    );

    return tooltipElement;
  }

  function renderTooltip(event, gene) {
    const currtooltip = refGeneClickTooltip(
      gene,
      event.pageX,
      event.pageY,
      genomeArr![genomeIdx!].genome._name,
      onClose
    );
    setToolTipVisible(true);
    setToolTip(ReactDOM.createPortal(currtooltip, document.body));
  }

  function onClose() {
    setToolTipVisible(false);
  }

  useEffect(() => {
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

      if ("result" in trackData![`${id}`]) {
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
  }, [trackData]);

  useEffect(() => {
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
    if (!genomeArr![genomeIdx!].isInitial) {
      checkTrackPreload(id);
    }
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

        displayCache.current[`${configOptions.current.displayMode}`] = {};
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

  useEffect(() => {
    if (screenshotOpen) {
      async function handle() {
        let genesArr = [
          fetchedDataCache.current[dataIdx! + 1],
          fetchedDataCache.current[dataIdx!],
          fetchedDataCache.current[dataIdx! - 1],
        ];
        let trackState = {
          ...fetchedDataCache.current[dataIdx!].trackState,
        };

        trackState["viewWindow"] =
          updateSide.current === "right"
            ? new OpenInterval(
                -(dragX! + (xPos.current + windowWidth)),
                windowWidth * 3 + -(dragX! + (xPos.current + windowWidth))
              )
            : new OpenInterval(
                -(dragX! - (xPos.current + windowWidth)) + windowWidth,
                windowWidth * 3 -
                  (dragX! - (xPos.current + windowWidth)) +
                  windowWidth
              );

        genesArr = genesArr.map((item) => item.dataCache).flat(1);
        let drawOptions = { ...configOptions.current };
        drawOptions["forceSvg"] = true;

        let result = await getDisplayModeFunction({
          genesArr,
          trackState,
          windowWidth,
          configOptions: drawOptions,
          renderTooltip,
          svgHeight,
          updatedLegend,
          trackModel,
          getGenePadding,
          getHeight,
          ROW_HEIGHT,
        });

        sentScreenshotData({
          component: result,
          trackId: id,
          trackState: trackState,
          trackLegend: updatedLegend.current,
        });
      }

      handle();
    }
  }, [screenshotOpen]);
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
          {test}
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

export default memo(RefGeneTrack);
