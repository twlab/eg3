import React, { memo } from "react";
import { useEffect, useRef, useState } from "react";
import { TrackProps } from "../../../models/trackModels/trackProps";
import ReactDOM from "react-dom";
import { Manager, Popper, Reference } from "react-popper";
import OutsideClickDetector from "./commonComponents/OutsideClickDetector";
import GeneDetail from "./geneAnnotationTrackComponents/GeneDetail";
import { getTrackXOffset } from "./CommonTrackStateChangeFunctions.tsx/getTrackPixelXOffset";
import { getCacheData } from "./CommonTrackStateChangeFunctions.tsx/getCacheData";
import { getConfigChangeData } from "./CommonTrackStateChangeFunctions.tsx/getDataAfterConfigChange";
import { getDisplayModeFunction } from "./displayModeComponentMap";
import OpenInterval from "@eg/core/src/eg-lib/models/OpenInterval";
import FeatureDetail from "./commonComponents/annotation/FeatureDetail";
import SnpDetail from "./SnpComponents/SnpDetail";
import JasparDetail from "./commonComponents/annotation/JasparDetail";
import { getDeDupeArrMatPlot } from "./CommonTrackStateChangeFunctions.tsx/cacheFetchedData";
const BACKGROUND_COLOR = "rgba(173, 216, 230, 0.9)"; // lightblue with opacity adjustment
const ARROW_SIZE = 16;
const TOP_PADDING = 2;
import { trackOptionMap } from "./defaultOptionsMap";

const TrackFactory: React.FC<TrackProps> = memo(function TrackFactory({
  trackManagerRef,
  basePerPixel,
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
  newDrawData,
  trackFetchedDataCache,
}) {
  const configOptions = useRef(
    trackOptionMap[trackModel.type]
      ? { ...trackOptionMap[`${trackModel.type}`].defaultOptions }
      : { ...trackOptionMap["error"].defaultOptions }
  );

  const svgHeight = useRef(0);
  const updateSide = useRef("right");
  const updatedLegend = useRef<any>(undefined);
  const fetchError = useRef<boolean>(false);
  const usePrimaryNav = useRef<boolean>(true);
  const useExpandedLoci = useRef<boolean>(false);
  const straw = useRef<{ [key: string]: any }>({});

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

  function resetState() {
    configOptions.current = trackOptionMap[trackModel.type]
      ? { ...trackOptionMap[`${trackModel.type}`].defaultOptions }
      : { ...trackOptionMap["error"].defaultOptions };
    svgHeight.current = 0;

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

    return trackModel.type === "modbed"
      ? (rowsToDraw + 1) * rowHeight + 2
      : rowsToDraw * rowHeight + TOP_PADDING;
  }
  // MARK: CREATESVG
  async function createSVGOrCanvas(trackState, genesArr, isError, trackIndex) {
    console.log(trackState, windowWidth);
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
        basesByPixel: basePerPixel,
        genesArr,
        genomeName: genomeConfig.genome.getName(),
        trackState,
        windowWidth,
        configOptions: configOptions.current,
        renderTooltip:
          trackModel.type === "modbed" ? renderTooltipModbed : renderTooltip,
        svgHeight,
        updatedLegend,
        trackModel,
        getGenePadding: trackOptionMap[`${trackModel.type}`].getGenePadding,
        getHeight,
        ROW_HEIGHT: trackOptionMap[`${trackModel.type}`].ROW_HEIGHT,
      })
    );

    if (trackIndex === dataIdx) {
      checkTrackPreload(id);
      updateSide.current = side;

      if (configOptions.current.displayMode === "full") {
        setSvgComponents(res);
        // if (!(trackIndex in displayCache.current["full"])) {
        //   displayCache.current["full"][trackIndex] = res;
        // }
      } else {
        setCanvasComponents(res);
        // if (!(trackIndex in displayCache.current["density"])) {
        //   displayCache.current["density"][trackIndex] = res;
        // }
      }

      xPos.current = curXPos;
    }
  }
  // Function to create individual feature element from the GeneAnnotation track, passed to full visualizer

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

  function renderTooltipModbed(
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
      currtooltip = geneClickToolTipMap["normModbed"](
        bs,
        event.pageX,
        event.pageY,
        feature
      );
    } else {
      currtooltip = geneClickToolTipMap["barModbed"](
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
  function onClose() {
    setToolTipVisible(false);
  }

  useEffect(() => {
    setLegend(ReactDOM.createPortal(updatedLegend.current, legendRef.current));
  }, [svgComponents, canvasComponents]);

  // MARK:[newDrawDat
  useEffect(() => {
    if (
      "curDataIdx" in newDrawData &&
      newDrawData.curDataIdx === dataIdx &&
      id in newDrawData.trackToDrawId &&
      newDrawData.curDataIdx in trackFetchedDataCache.current[`${id}`] &&
      trackFetchedDataCache.current[`${id}`][newDrawData.curDataIdx].trackState
    ) {
      let left, mid, right;
      let trackIndex = newDrawData.curDataIdx;
      console.log(newDrawData, trackFetchedDataCache.current[`${id}`]);
      let trackData = trackFetchedDataCache.current[`${id}`];
      usePrimaryNav.current = trackData.usePrimaryNav;
      useExpandedLoci.current = trackData.useExpandedLoci;

      if (trackData[trackIndex].trackState.initial === 1) {
        // use previous data before resetState

        if (
          trackModel.type in
          { hic: "", biginteract: "", longrange: "", dynamichic: "" }
        ) {
          configOptions.current["trackManagerRef"] = trackManagerRef;
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
          usePrimaryNav: usePrimaryNav.current,
        });
      }

      if (!useExpandedLoci.current) {
        if (trackData[trackIndex].trackState.initial === 1) {
          if (
            trackIndex in trackData &&
            trackIndex + 1 in trackData &&
            trackIndex - 1 in trackData
          ) {
            left = trackIndex + 1;
            mid = trackIndex;
            right = trackIndex - 1;
          } else {
            left = 1;
            mid = 0;
            right = -1;
          }
          let viewData: any = [
            trackData[left],
            trackData[mid],
            trackData[right],
          ];

          if (trackModel.type in { matplot: "", dynamic: "", dynamicbed: "" }) {
            viewData = getDeDupeArrMatPlot(viewData, false);
          } else {
            viewData = viewData.map((item) => item.dataCache).flat(1);
          }

          createSVGOrCanvas(
            trackData[mid].trackState,
            viewData,

            trackData[newDrawData.curDataIdx].trackState.isError,
            trackIndex
          );
        } else {
          if (trackData[newDrawData.curDataIdx].trackState.side === "right") {
            let viewData: any = [];
            let currIdx = newDrawData.curDataIdx + 1;
            for (let i = 0; i < 3; i++) {
              viewData.push(trackData[currIdx]);
              currIdx--;
            }
            var noData = false;

            if (
              trackModel.type in { matplot: "", dynamic: "", dynamicbed: "" }
            ) {
              viewData = getDeDupeArrMatPlot(viewData, false);
            } else {
              viewData = viewData
                .map((item) => {
                  if (item && "dataCache" in item) {
                    return item.dataCache;
                  } else {
                    noData = true;
                  }
                })
                .flat(1);
            }

            if (!noData) {
              createSVGOrCanvas(
                trackData[newDrawData.curDataIdx].trackState,
                viewData,

                trackData[newDrawData.curDataIdx].trackState.isError,
                trackIndex
              );
            }
          } else if (
            trackData[newDrawData.curDataIdx].trackState.side === "left"
          ) {
            let viewData: any = [];
            let currIdx = newDrawData.curDataIdx + 1;
            for (let i = 0; i < 3; i++) {
              viewData.push(trackData[currIdx]);
              currIdx--;
            }
            var noData = false;

            if (
              trackModel.type in { matplot: "", dynamic: "", dynamicbed: "" }
            ) {
              viewData = getDeDupeArrMatPlot(viewData, false);
            } else {
              viewData = viewData
                .map((item) => {
                  if (item && "dataCache" in item) {
                    return item.dataCache;
                  } else {
                    noData = true;
                  }
                })
                .flat(1);
            }
            if (!noData) {
              createSVGOrCanvas(
                trackData[newDrawData.curDataIdx].trackState,
                viewData,
                trackData[newDrawData.curDataIdx].trackState.isError,
                trackIndex
              );
            }
          }
        }
      } else {
        const viewData = trackData[newDrawData.curDataIdx].dataCache;

        createSVGOrCanvas(
          trackData[newDrawData.curDataIdx].trackState,
          viewData,
          trackData[newDrawData.curDataIdx].trackState.isError,
          trackIndex
        );
      }
    }
  }, [newDrawData]);

  // MARK: [applyConfig]
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

        getConfigChangeData({
          fetchedDataCache: trackFetchedDataCache.current[`${id}`],
          dataIdx,
          usePrimaryNav: usePrimaryNav.current,
          createSVGOrCanvas,
          trackType: trackModel.type,
        });
      }
    }
  }, [applyTrackConfigChange]);
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
                  <FeatureDetail
                    feature={feature}
                    category={undefined}
                    queryEndpoint={undefined}
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
                  <FeatureDetail
                    feature={feature}
                    category={undefined}
                    queryEndpoint={undefined}
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
                  <FeatureDetail
                    feature={feature}
                    category={undefined}
                    queryEndpoint={undefined}
                  />
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
    categorical: function featureClickTooltip(
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
                  <FeatureDetail
                    feature={feature}
                    category={configOptions.current.category}
                    queryEndpoint={undefined}
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
    },
    jaspar: function JasparClickTooltip(
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
                  <JasparDetail feature={feature} />
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
    normModbed: function normToolTip(bs: any, pageX, pageY, feature) {
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
    },

    barModbed: function barTooltip(
      feature: any,
      pageX,
      pageY,
      onCount,
      onPct,
      total
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
    },
  };

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
          basesByPixel: basePerPixel,
          genomeName: genomeConfig.genome.getName(),
          genesArr,
          trackState,
          windowWidth,
          configOptions: drawOptions,
          renderTooltip:
            trackModel.type === "modbed" ? renderTooltipModbed : renderTooltip,
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
});

export default memo(TrackFactory);
