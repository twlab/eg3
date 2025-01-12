import React, { memo } from "react";
import { useEffect, useRef, useState } from "react";
import { TrackProps } from "../../../models/trackModels/trackProps";
import ReactDOM from "react-dom";
import { Manager, Popper, Reference } from "react-popper";
import OutsideClickDetector from "./commonComponents/OutsideClickDetector";
import GeneDetail from "./geneAnnotationTrackComponents/GeneDetail";
import { DEFAULT_OPTIONS as defaultGeneAnnotationTrack } from "./geneAnnotationTrackComponents/GeneAnnotation";
import { DEFAULT_OPTIONS as defaultBedTrack } from "./bedComponents/BedAnnotation";
import { DEFAULT_OPTIONS as defaultBigBedTrack } from "./bedComponents/BedAnnotation";
import { DEFAULT_OPTIONS as defaultNumericalTrack } from "./commonComponents/numerical/NumericalTrack";
import { DEFAULT_OPTIONS as defaultAnnotationTrack } from "../../../trackConfigs/config-menu-models.tsx/AnnotationTrackConfig";
import { DEFAULT_OPTIONS as defaultOmeroTrack } from "./imageTrackComponents/OmeroTrackComponents";

import { getTrackXOffset } from "./CommonTrackStateChangeFunctions.tsx/getTrackPixelXOffset";
import { getCacheData } from "./CommonTrackStateChangeFunctions.tsx/getCacheData";
import { getConfigChangeData } from "./CommonTrackStateChangeFunctions.tsx/getDataAfterConfigChange";
import { cacheTrackData } from "./CommonTrackStateChangeFunctions.tsx/cacheTrackData";
import { getDisplayModeFunction } from "./displayModeComponentMap";
import { RepeatMaskerFeature } from "../../../models/RepeatMaskerFeature";
import OpenInterval from "@eg/core/src/eg-lib/models/OpenInterval";
import { AnnotationDisplayModes } from "../../../trackConfigs/config-menu-models.tsx/DisplayModes";
import Feature from "../../../models/Feature";
import { DefaultAggregators } from "@eg/core/src/eg-lib/models/FeatureAggregator";
import FeatureDetail from "./commonComponents/annotation/FeatureDetail";
import SnpDetail from "./SnpComponents/SnpDetail";
const BACKGROUND_COLOR = "rgba(173, 216, 230, 0.9)"; // lightblue with opacity adjustment
const ARROW_SIZE = 16;

const ROW_VERTICAL_PADDING = 5;
const ROW_HEIGHT = 9 + ROW_VERTICAL_PADDING;
const TOP_PADDING = 2;

// bam options
const ROW_PADDING = 2;
const BAM_HEIGHT = 10;
const BAM_ROW_HEIGHT = BAM_HEIGHT + ROW_PADDING;

// snp options

const SNP_HEIGHT = 9;
const SNP_ROW_VERTICAL_PADDING = 2;
const SNP_ROW_HEIGHT = SNP_HEIGHT + SNP_ROW_VERTICAL_PADDING;

const trackOptionMap: { [key: string]: any } = {
  bigbed: {
    defaultOptions: {
      ...defaultBigBedTrack,
      ...defaultNumericalTrack,
      ...defaultAnnotationTrack,
    },
    getGenePadding: function getGenePadding(gene) {
      return gene.getName().length * 9;
    },
    ROW_HEIGHT: 9 + ROW_VERTICAL_PADDING,
  },
  geneannotation: {
    defaultOptions: {
      ...defaultGeneAnnotationTrack,
      ...defaultNumericalTrack,
      ...defaultAnnotationTrack,
    },
    getGenePadding: function getGenePadding(gene) {
      return gene.getName().length * 9;
    },
    ROW_HEIGHT: 9 + ROW_VERTICAL_PADDING,
  },
  refbed: {
    defaultOptions: {
      ...defaultGeneAnnotationTrack,
      ...defaultNumericalTrack,
      ...defaultAnnotationTrack,
    },
    getGenePadding: function getGenePadding(gene) {
      return gene.getName().length * 9;
    },
    ROW_HEIGHT: 9 + ROW_VERTICAL_PADDING,
  },
  bed: {
    defaultOptions: {
      ...defaultBedTrack,
      ...defaultNumericalTrack,
      ...defaultAnnotationTrack,
    },
    getGenePadding: function getGenePadding(gene) {
      return gene.getName().length * 9;
    },
    ROW_HEIGHT: 9 + ROW_VERTICAL_PADDING,
  },
  repeatmasker: {
    defaultOptions: {
      ...defaultAnnotationTrack,
      maxRows: 1,
      height: 40,
      categoryColors: RepeatMaskerFeature.DEFAULT_CLASS_COLORS,
      displayMode: AnnotationDisplayModes.FULL,
      hiddenPixels: 0.5,
      backgroundColor: "var(--bg-color)",
      alwaysDrawLabel: true,
    },
    getGenePadding: function getGenePadding(
      feature: Feature,
      xSpan: OpenInterval
    ) {
      const width = xSpan.end - xSpan.start;
      const estimatedLabelWidth = feature.getName().length * 9;
      if (estimatedLabelWidth < 0.5 * width) {
        return 5;
      } else {
        return 9 + estimatedLabelWidth;
      }
    },
    ROW_HEIGHT: 9 + ROW_VERTICAL_PADDING,
  },
  omeroidr: {
    defaultOptions: {
      ...defaultOmeroTrack,
      ...defaultNumericalTrack,
      aggregateMethod: DefaultAggregators.types.IMAGECOUNT,
      displayMode: "density",
    },
    getGenePadding: function getGenePadding(gene) {
      return gene.getName().length * 9;
    },
    ROW_HEIGHT: 9 + ROW_VERTICAL_PADDING,
  },
  bam: {
    defaultOptions: {
      ...defaultNumericalTrack,
      ...defaultAnnotationTrack,
      mismatchColor: "yellow",
      deletionColor: "black",
      insertionColor: "green",
      color: "red",
      color2: "blue",
      smooth: 0, // for density mode

      aggregateMethod: "COUNT",
    },
    getGenePadding: 5,
    ROW_HEIGHT: BAM_ROW_HEIGHT,
  },
  snp: {
    defaultOptions: {
      ...defaultBedTrack,
      ...defaultNumericalTrack,
      ...defaultAnnotationTrack,
    },
    getGenePadding: 5,
    ROW_HEIGHT: SNP_ROW_HEIGHT,
  },

  bigwig: {
    defaultOptions: {
      ...defaultNumericalTrack,
    },
  },
};
const SvgOrCanvasTracks: React.FC<TrackProps> = memo(
  function SvgOrCanvasTracks({
    trackData,
    updateGlobalTrackConfig,
    side,
    windowWidth = 0,
    genomeConfig,
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
    const configOptions = useRef({
      ...trackOptionMap[`${trackModel.type}`].defaultOptions,
    });
    const svgHeight = useRef(0);
    const rightIdx = useRef(0);
    const leftIdx = useRef(1);
    const updateSide = useRef("right");
    const updatedLegend = useRef<any>();
    const fetchError = useRef<boolean>(false);
    const usePrimaryNav = useRef<boolean>(true);
    const fetchedDataCache = useRef<{ [key: string]: any }>({});
    const displayCache = useRef<{ [key: string]: any }>({
      full: {},
      density: {},
    });

    const xPos = useRef(0);
    const screenshotOpen = null;
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

    function resetState() {
      configOptions.current = {
        ...trackOptionMap[`${trackModel.type}`].defaultOptions,
      };
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

      setToolTip(undefined);
      setToolTipVisible(false);
      setLegend(undefined);
    }

    function getHeight(numRows: number): number {
      let rowHeight = trackOptionMap[`${trackModel.type}`].ROW_HEIGHT;
      let options = configOptions.current;
      let rowsToDraw = Math.min(numRows, options.maxRows);
      if (options.hideMinimalItems) {
        rowsToDraw -= 1;
      }
      if (rowsToDraw < 1) {
        rowsToDraw = 1;
      }
      console.log();
      return rowsToDraw * rowHeight + TOP_PADDING;
    }

    async function createSVGOrCanvas(trackState, genesArr, isError) {
      let curXPos = getTrackXOffset(trackState, windowWidth);
      if (isError) {
        fetchError.current = true;
      }
      trackState["viewWindow"] = new OpenInterval(0, trackState.visWidth);
      if (isError) {
        fetchError.current = true;
      }

      let res = fetchError.current ? (
        <div
          style={{
            width: trackState.visWidth,
            height: 60,
            backgroundColor: "orange",
            textAlign: "center",
            lineHeight: "40px", // Centering vertically by matching the line height to the height of the div
          }}
        >
          Error remotely getting track data
        </div>
      ) : (
        await getDisplayModeFunction({
          genesArr,
          trackState,
          windowWidth,
          configOptions: configOptions.current,
          renderTooltip,
          svgHeight,
          updatedLegend,
          trackModel,
          getGenePadding: trackOptionMap[`${trackModel.type}`].getGenePadding,
          getHeight,
          ROW_HEIGHT: trackOptionMap[`${trackModel.type}`].ROW_HEIGHT,
        })
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
        checkTrackPreload(id);
        updateSide.current = side;

        configOptions.current.displayMode === "full"
          ? setSvgComponents(res)
          : setCanvasComponents(res);
      }
    }
    // Function to create individual feature element from the GeneAnnotation track, passed to full visualizer

    const geneClickToolTipMap: { [key: string]: any } = {
      bigbed: function bedClickToolTip(
        feature: any,
        pageX,
        pageY,
        name,
        onClose
      ) {
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
                    <FeatureDetail feature={feature} />
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
      },
      geneannotation: function refGeneClickTooltip(
        gene: any,
        pageX,
        pageY,
        name,
        onClose
      ) {
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
      },
      refbed: function refGeneClickTooltip(
        gene: any,
        pageX,
        pageY,
        name,
        onClose
      ) {
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
                        {/* {" "}
                    <button className="btn btn-sm btn-secondary" onClick={this.clearGene3d}>
                        Clear in 3D
                    </button> */}
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
          </Manager>,
          document.body
        );
      },
      bed: function bedClickTooltip(feature: any, pageX, pageY, name, onClose) {
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
                    <FeatureDetail feature={feature} />
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
      },
      repeatmasker: function repeatMaskLeftClick(
        feature: any,
        pageX,
        pageY,
        name,
        onClose
      ) {
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
      },
      omeroidr: function omeroidrClickToolTip(snp: any, pageX, pageY, onClose) {
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
                    <SnpDetail snp={snp} />
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
      },
      bam: function bamClickTooltip(feature: any, pageX, pageY, name, onClose) {
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
      },
      snp: function SnpClickToolTip(snp: any, pageX, pageY, onClose) {
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
                    <SnpDetail snp={snp} />
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
      },
    };

    function renderTooltip(event, gene) {
      const currtooltip = geneClickToolTipMap[`${trackModel.type}`](
        gene,
        event.pageX,
        event.pageY,
        genomeConfig.genome._name,
        onClose
      );
      setToolTipVisible(true);
      setToolTip(ReactDOM.createPortal(currtooltip, document.body));
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
                genomeConfig.genome.getName()
            ) {
              usePrimaryNav.current = false;
            }
            if (
              !genomeConfig.isInitial &&
              genomeConfig.sizeChange &&
              Object.keys(fetchedDataCache.current).length > 0
            ) {
              const trackIndex = trackData![`${id}`].trackDataIdx;
              const cache = fetchedDataCache.current;
              if (
                "genome" in trackData![`${id}`].metadata &&
                trackData![`${id}`].metadata.genome !==
                  genomeConfig.genome.getName()
              ) {
                let idx = trackIndex in cache ? trackIndex : 0;
                trackData![`${id}`].result =
                  fetchedDataCache.current[idx].dataCache;
              } else {
                let left, mid, right;

                if (
                  trackIndex in cache &&
                  trackIndex + 1 in cache &&
                  trackIndex - 1 in cache
                ) {
                  left = trackIndex + 1;
                  mid = trackIndex;
                  right = trackIndex - 1;
                } else {
                  left = 1;
                  mid = 0;
                  right = -1;
                }

                trackData![`${id}`].result = [
                  cache[left].dataCache,
                  cache[mid].dataCache,
                  cache[right].dataCache,
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
          if (trackModel.type === "bam") {
            let tmpRawData: Array<Promise<any>> = [];

            trackData![`${id}`].curFetchNav.forEach((locuses) => {
              tmpRawData.push(
                trackData![`${id}`].fetchInstance.getData(locuses)
              );
            });

            trackData![`${id}`]["result"] = await Promise.all(tmpRawData);
            if (!trackData!.trackState.initial) {
              trackData![`${id}`]["result"] =
                trackData![`${id}`]["result"].flat();
            }
          }
          if ("result" in trackData![`${id}`]) {
            if (trackData![`${id}`].result) {
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
        }
      }
      handle();
    }, [trackData]);

    useEffect(() => {
      getCacheData({
        isError: fetchError.current,
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
      setLegend(
        ReactDOM.createPortal(updatedLegend.current, legendRef.current)
      );
    }, [svgComponents, canvasComponents]);

    useEffect(() => {
      if (svgComponents !== null || canvasComponents !== null) {
        if (id in applyTrackConfigChange) {
          if ("type" in applyTrackConfigChange) {
            configOptions.current = {
              ...trackOptionMap[`${trackModel.type}`].defaultOptions,
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
            getGenePadding: trackOptionMap[`${trackModel.type}`].getGenePadding,
            getHeight,
            ROW_HEIGHT: trackOptionMap[`${trackModel.type}`].ROW_HEIGHT,
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
              ? !fetchError.current
                ? svgHeight.current + 2
                : 40 + 2
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
  }
);

export default memo(SvgOrCanvasTracks);
