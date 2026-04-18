import React, { memo } from "react";
import { startTransition, useEffect, useRef, useState } from "react";
import { TrackProps } from "../../../models/trackModels/trackProps";
import ReactDOM from "react-dom";
import { getTrackXOffset } from "./CommonTrackStateChangeFunctions.tsx/getTrackPixelXOffset";
import OpenInterval from "../../../models/OpenInterval";
import ErrorBoundary from "./commonComponents/ErrorBoundary";

import {
  dynamicMatplotTracks,
  getDisplayModeFunction,
  interactionTracks,
} from "./displayModeComponentMap";
const TOP_PADDING = 2;
import { trackOptionMap } from "./defaultOptionsMap";
import _ from "lodash";
import MetadataIndicator from "./commonComponents/MetadataIndicator";
import { numericalTracks } from "./GroupedTrackManager";
import Loading from "./commonComponents/Loading";
import "./commonComponents/loading.css";
import { geneClickToolTipMap } from "./renderClickTooltipMap";
import HiddenIndicator from "./commonComponents/HiddenIndicator";
import { groupTracksArrMatPlot } from "./CommonTrackStateChangeFunctions.tsx/cacheFetchedData";
import VerticalDivider from "./commonComponents/VerticalDivider";
import TrackLegend from "./commonComponents/TrackLegend";

const TrackFactory: React.FC<TrackProps> = memo(function TrackFactory({
  trackManagerRef,
  basePerPixel,
  updateGlobalTrackConfig,
  side,
  windowWidth = 0,
  genomeConfig,
  trackModel,
  dataIdx,
  signalTrackLoadComplete,
  trackIdx,
  id,
  setShow3dGene,
  isThereG3dTrack,
  viewWindowConfigChange,
  applyTrackConfigChange,
  sentScreenshotData,
  dragX,
  newDrawData,
  trackManagerState,
  globalTrackState,
  isScreenShotOpen,
  legendRef,
  highlightElements,
  viewWindowConfigData,
  metaSets,
  onColorBoxClick,
  messageData,
  Toolbar,
  handleRetryFetchTrack,
  initialLoad,
  selectedRegionSet,
}) {
  function getConfigOptions() {
    try {
      const globalCfg = trackManagerState.current.globalConfig;
      if (globalCfg) {
        // support either a ref-like shape (legacy) or plain object
        const entry = globalCfg.current ? globalCfg.current[`${id}`] : globalCfg[`${id}`];
        if (entry && entry.configOptions) {
          return entry.configOptions;
        }
      }
    } catch (e) {
      // fallthrough to defaults
    }
    return trackOptionMap[trackModel.type]
      ? { ...trackOptionMap[`${trackModel.type}`].defaultOptions, ...(trackModel.options || {}) }
      : { ...trackOptionMap["error"].defaultOptions };
  }
  const initTrackStart = useRef(true);
  const svgHeight = useRef(40);
  const updateSide = useRef("right");
  const updatedLegend = useRef<any>(undefined);
  const fetchError = useRef<string | null>(null);

  const caches = trackManagerState.current.caches;

  const xPos = useRef(0);

  const [viewComponent, setViewComponent] = useState<{
    [key: string]: any;
  } | null>(null);

  const [toolTip, setToolTip] = useState<any>();
  const [toolTipVisible, setToolTipVisible] = useState(false);
  const [legend, setLegend] = useState<any>(null);

  function getHeight(numRows: number): number {
    let rowHeight = trackOptionMap[`${trackModel.type}`].ROW_HEIGHT;
    let options = getConfigOptions();
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
  function createSVGOrCanvas(
    trackState,
    genesArr,

    cacheDataIdx,
    xvalues = null,
    placeFeature = null,
  ) {
    const curXPos = getTrackXOffset(trackState, windowWidth);

    const displayArgs: any = {
      basesByPixel: basePerPixel,
      genesArr,
      genomeConfig,
      genomeName: genomeConfig.genome.getName(),
      trackState,
      windowWidth,
      configOptions: getConfigOptions(),
      renderTooltip:
        trackModel.type === "modbed" ? renderTooltipModbed : renderTooltip,
      svgHeight,
      updatedLegend,
      trackModel,
      getGenePadding: trackOptionMap[`${trackModel.type}`]
        ? trackOptionMap[`${trackModel.type}`].getGenePadding
        : trackOptionMap["error"].getGenePadding,
      getHeight,
      ROW_HEIGHT: trackOptionMap[`${trackModel.type}`]
        ? trackOptionMap[`${trackModel.type}`].ROW_HEIGHT
        : trackOptionMap["error"].ROW_HEIGHT,
      groupScale: trackState.groupScale,
      xvaluesData: xvalues,
      onClose,
      errorInfo: fetchError.current,
      handleRetryFetchTrack: handleRetryFetchTrack,
      initialLoad: initialLoad.current,
      placeFeature
    };
    let res;
    // try {
    res = getDisplayModeFunction(displayArgs);
    // } 
    // catch (e) {
    //   fetchError.current = "error when creating drawData";
    //   displayArgs.errorInfo = fetchError.current;
    //   res = getDisplayModeFunction(displayArgs);
    // }

    if (cacheDataIdx === dataIdx) {
      signalTrackLoadComplete(id);
      updateSide.current = side;
      let result;
      let numHidden = 0;

      if (
        typeof res === "object" &&
        Object.prototype.hasOwnProperty.call(res, "numHidden")
      ) {
        result = res.component;
        numHidden = res.numHidden;
      } else {
        result = res;
      }

      // Wrap the track component with an ErrorBoundary so render errors
      // inside the display components don't crash the whole app.
      try {
        result = (
          <ErrorBoundary errorDrawData={displayArgs}>{result as any}</ErrorBoundary>
        );
      } catch (wrapErr) {
        console.error("Error wrapping result with ErrorBoundary:", wrapErr);
      }

      xPos.current = curXPos;
      // startTransition(() => 
      setViewComponent({
        component: result,
        dataIdx: cacheDataIdx,
        numHidden: numHidden,
        visData: trackState.visData,
        xPos: curXPos,
      })
      // )

    }
  }
  function onClose() {
    setToolTip(null);
  }
  // MARK: clickTool
  function renderTooltip(event, gene) {
    let currtooltip;
    try {
      const trackType =
        trackModel.type === "rmskv2" ? "repeatmasker" : trackModel.type;
      currtooltip = geneClickToolTipMap[`${trackType}`]({
        gene,
        feature: gene,
        snp: gene,
        vcf: gene,
        trackModel,
        pageX: event.pageX,
        pageY: event.pageY,
        name: genomeConfig.genome._name,
        onClose: onClose,
        isThereG3dTrack: isThereG3dTrack,
        setShow3dGene: setShow3dGene,
        configOptions: getConfigOptions(),
      });
    } catch (err) {
      currtooltip = (
        <div
          style={{
            position: "absolute",
            left: event.pageX,
            top: event.pageY,
            background: "#fff0f0",
            border: "1px solid red",
            padding: "8px",
            zIndex: 1001,
            borderRadius: 4,
          }}
        >
          <span style={{ color: "red" }}>Tooltip error: {String(err)}</span>
          <button style={{ marginLeft: 8 }} onClick={onClose}>
            ✕
          </button>
        </div>
      );
    }
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
    total = "",
  ) {
    let currtooltip;
    try {
      if (type === "norm") {
        currtooltip = geneClickToolTipMap["normModbed"]({
          bs,
          pageX: event.pageX,
          pageY: event.pageY,
          feature,
          onClose,
        });
      } else {
        currtooltip = geneClickToolTipMap["barModbed"]({
          feature,
          pageX: event.pageX,
          pageY: event.pageY,
          onCount,
          onPct,
          total,
          onClose,
        });
      }
    } catch (err) {
      currtooltip = ReactDOM.createPortal(
        <div
          style={{
            position: "absolute",
            left: event.pageX,
            top: event.pageY,
            background: "#fff0f0",
            border: "1px solid red",
            padding: "8px",
            zIndex: 1001,
            borderRadius: 4,
          }}
        >
          <span style={{ color: "red" }}>Tooltip error: {String(err)}</span>
          <button style={{ marginLeft: 8 }} onClick={onClose}>
            ✕
          </button>
        </div>,
        document.body,
      );
    }
    setToolTipVisible(true);
    setToolTip(currtooltip);
  }

  useEffect(() => {
    if (viewComponent && viewComponent.dataIdx === dataIdx) {
      setLegend(updatedLegend.current);
    }
  }, [viewComponent]);

  // MARK:[newDrawDat
  // Helper function to handle track drawing logic for newDrawData, viewWindowConfigChange, and configChange
  function handleTrackDraw({
    cacheTrackData,
    trackState,
    viewWindow,
    groupScale,
    xvalues,
    isInit,
    placeFeature,

  }) {
    const primaryVisData = trackState.genomicFetchCoord
      ? trackState.genomicFetchCoord[trackState.primaryGenName].primaryVisData
      : trackState.visData;
    if (cacheTrackData.trackType !== "genomealign") {
      let visRegion =
        !cacheTrackData.usePrimaryNav &&
          trackState.genomicFetchCoord[cacheTrackData.queryGenome]?.queryRegion
          ? trackState.genomicFetchCoord[cacheTrackData.queryGenome].queryRegion
          : primaryVisData.visRegion;
      trackState["visRegion"] = visRegion;
    }
    trackState["visWidth"] = primaryVisData.visWidth
      ? primaryVisData.visWidth
      : windowWidth * 3;
    trackState["dataIdx"] = dataIdx;
    if (isInit && initTrackStart.current) {
      const baseOptions = getConfigOptions();
      if (interactionTracks.has(trackModel.type)) {
        updateGlobalTrackConfig({
          configOptions: { ...baseOptions, trackManagerRef },
          trackModel: trackModel,
          id: id,
          trackIdx: trackIdx,
          usePrimaryNav: cacheTrackData.usePrimaryNav,
        });
      } else {
        updateGlobalTrackConfig({
          configOptions: { ...baseOptions, ...(trackModel.options || {}) },
          trackModel: trackModel,
          id: id,
          trackIdx: trackIdx,
          usePrimaryNav: cacheTrackData.usePrimaryNav,
        });
      }

      initTrackStart.current = false;
    }
    // ensure usePrimaryNav is reflected in global config
    updateGlobalTrackConfig({
      configOptions: { ...getConfigOptions(), usePrimaryNav: cacheTrackData.usePrimaryNav },
      trackModel: trackModel,
      id: id,
      trackIdx: trackIdx,
    });

    fetchError.current = cacheTrackData["error"]
      ? cacheTrackData["error"]
      : null;

    if (cacheTrackData["error"]) {
      createSVGOrCanvas(
        trackState,
        fetchError.current,
        dataIdx,
        xvalues ? xvalues : null,
      );
    } else if (
      !cacheTrackData.useExpandedLoci &&
      cacheTrackData.usePrimaryNav
    ) {
      let combinedData: Array<any> = [];
      let currIdx = dataIdx + 1;
      let noData = false;

      if (cacheTrackData[`${dataIdx}`]["xvalues"] || cacheTrackData[`${dataIdx}`]["placeFeature"]) {

        console.log("TESSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS", cacheTrackData[`${dataIdx}`])
        combinedData = [];
      }
      else if (dynamicMatplotTracks.has(trackModel.type)) {
        if (
          cacheTrackData[`${dataIdx}`] &&
          cacheTrackData[`${dataIdx}`]["xvalues"]
        ) {
          combinedData = [];
        } else {
          combinedData = groupTracksArrMatPlot(combinedData);
        }
      }
      else {

        console.log("NOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO", cacheTrackData[`${dataIdx}`])
        for (let i = 0; i < 3; i++) {
          if (!cacheTrackData[currIdx] || !cacheTrackData[currIdx].dataCache) {
            noData = true;
            continue;
          }
          combinedData.push(cacheTrackData[currIdx]);
          currIdx--;
        }
      }
      if (!noData) {
        if (viewWindow) {
          trackState["viewWindow"] = viewWindow;
        }
        if (groupScale !== undefined) {
          trackState["groupScale"] = groupScale;
        }
        createSVGOrCanvas(
          trackState,
          combinedData,
          dataIdx,
          xvalues ? xvalues : null,
          placeFeature ? placeFeature : null,
        );
      }
    } else {
      const combinedData = cacheTrackData[dataIdx]
        ? cacheTrackData[dataIdx].dataCache
        : null;
      if (viewWindow) {
        trackState["viewWindow"] = viewWindow;
      }

      if (combinedData) {
        createSVGOrCanvas(
          trackState,
          combinedData,
          dataIdx,
          xvalues ? xvalues : null,
          placeFeature ? placeFeature : null,
        );
      }
    }
  }

  useEffect(() => {
    if (
      newDrawData.completedFetchedRegion &&
      newDrawData.completedFetchedRegion.current["done"][id] === false
    ) {
      if (dataIdx === newDrawData.completedFetchedRegion.current["key"]) {
        newDrawData.completedFetchedRegion.current["done"][id] = true;
      } else {
        return;
      }

      if (
        !caches[`${id}`] ||
        !globalTrackState.current.trackStates[dataIdx] ||
        !globalTrackState.current.trackStates[dataIdx].trackState
          .genomicFetchCoord
      ) {
        return;
      }

      const cacheTrackData = caches[`${id}`];
      let trackState = {
        ...globalTrackState.current.trackStates[dataIdx].trackState,
      };

      handleTrackDraw({
        cacheTrackData,
        trackState,
        viewWindow: newDrawData.viewWindow,
        groupScale:
          globalTrackState.current.trackStates[dataIdx].trackState[
          "groupScale"
          ],
        xvalues: cacheTrackData[dataIdx]?.xvalues,
        placeFeature: cacheTrackData[dataIdx]?.placeFeature,
        isInit: true,

      });
    }
  }, [newDrawData]);

  // MARK: [applyConfig]
  useEffect(() => {
    if (viewComponent !== null) {
      if (id in applyTrackConfigChange) {
        // global config is updated centrally in TrackManager; TrackFactory only handles redraw/cache responses here
        // config options that needs a refetch so we can't reuse data
        if (
          !applyTrackConfigChange[`${id}`]["normalization"] &&
          !applyTrackConfigChange[`${id}`]["binSize"]
        ) {

          let cacheDataIdx = dataIdx;
          let cacheTrackData = caches[`${id}`];
          let trackState = _.cloneDeep(
            globalTrackState.current.trackStates[cacheDataIdx].trackState,
          );


          handleTrackDraw({
            cacheTrackData,
            trackState,
            viewWindow: viewWindowConfigData.current?.viewWindow,
            groupScale:
              globalTrackState.current.trackStates[dataIdx].trackState[
              "groupScale"
              ],
            xvalues: cacheTrackData[dataIdx]?.xvalues,
            placeFeature: cacheTrackData[dataIdx]?.placeFeature,
            isInit: false,


          });
        }
      }
    }
  }, [applyTrackConfigChange]);

  // MARK: [viewWindowConfigChange]

  useEffect(() => {
    if (
      viewWindowConfigChange &&
      id in viewWindowConfigChange.trackToDrawId &&
      (trackModel.type in numericalTracks ||
        getConfigOptions().displayMode === "density")
    ) {
      let trackState = _.cloneDeep(
        globalTrackState.current.trackStates[dataIdx].trackState,
      );
      let cacheTrackData = caches[`${id}`];
      handleTrackDraw({
        cacheTrackData,
        trackState,
        viewWindow: viewWindowConfigChange.viewWindow,
        groupScale:
          globalTrackState.current.trackStates[dataIdx].trackState[
          "groupScale"
          ],
        xvalues: cacheTrackData[dataIdx]?.xvalues,
        placeFeature: cacheTrackData[dataIdx]?.placeFeature,
        isInit: false,


      });
    }
  }, [viewWindowConfigChange]);

  // MARK: Screenshot
  useEffect(() => {
    if (isScreenShotOpen) {
      async function handle() {
        let cacheDataIdx = dataIdx;

        let cacheTrackData = caches[`${id}`];
        let combinedData: any = [];
        let trackState = _.cloneDeep(
          globalTrackState.current.trackStates[cacheDataIdx].trackState,
        );
        if (!cacheTrackData.useExpandedLoci) {
          let currIdx = dataIdx + 1;
          var noData = false;
          for (let i = 0; i < 3; i++) {
            if (
              !cacheTrackData[currIdx] ||
              !cacheTrackData[currIdx].dataCache
            ) {
              noData = true;
              continue;
            }

            combinedData.push(_.clone(cacheTrackData[currIdx]));

            currIdx--;
          }

          if (!noData) {
            if (newDrawData.viewWindow) {
              trackState["viewWindow"] = newDrawData.viewWindow;
            }
            trackState["groupScale"] =
              globalTrackState.current.trackStates[dataIdx].trackState[
              "groupScale"
              ];
          }
        } else {
          combinedData = cacheTrackData[dataIdx]
            ? _.clone(cacheTrackData[dataIdx].dataCache)
            : null;

          if (combinedData) {
            if (newDrawData.viewWindow) {
              trackState["viewWindow"] = newDrawData.viewWindow;
            }
          }
        }
        const primaryVisData =
          trackState.genomicFetchCoord[trackState.primaryGenName]
            .primaryVisData;
        let visRegion = !cacheTrackData.usePrimaryNav
          ? trackState.genomicFetchCoord[
            caches[`${id}`].queryGenome
          ].queryRegion
          : primaryVisData.visRegion;
        // need to create visRegion to use for draw because trackState doesn't globaltrackState don't keep it
        trackState["visRegion"] = visRegion;

        const width = primaryVisData.visWidth
          ? primaryVisData.visWidth
          : windowWidth * 3;

        const expandedViewWindow =
          updateSide.current === "right"
            ? new OpenInterval(
              -(dragX! + (xPos.current + windowWidth)),
              windowWidth * 3 + -(dragX! + (xPos.current + windowWidth)),
            )
            : new OpenInterval(
              -(dragX! - (xPos.current + windowWidth)) + windowWidth,
              windowWidth * 3 -
              (dragX! - (xPos.current + windowWidth)) +
              windowWidth,
            );
        let start = expandedViewWindow.start + width / 3;

        let end = expandedViewWindow.end - width / 3;

        trackState["viewWindow"] = new OpenInterval(start, end);
        let drawOptions = { ...getConfigOptions() };
        drawOptions["forceSvg"] = true;
        trackState["groupScale"] =
          globalTrackState.current.trackStates[dataIdx].trackState[
          "groupScale"
          ];

        if (combinedData) {
          sentScreenshotData({
            fetchData: {
              genomeName: genomeConfig.genome.getName(),
              genesArr: combinedData,
              trackState,
              windowWidth,
              configOptions: drawOptions,
              svgHeight:
                getConfigOptions().displayMode === "full"
                  ? svgHeight.current
                  : getConfigOptions().height,
              trackModel,
              basesByPixel: basePerPixel,
              genomeConfig,
              xvaluesData: cacheTrackData[dataIdx].xvalues
                ? cacheTrackData[dataIdx].xvalues
                : null,
              isError: fetchError.current,
            },
            trackId: id,
          });
        }
      }

      handle();
    }
  }, [isScreenShotOpen]);

  // MARK: RENDER

  return (
    <div
      style={{
        display: "flex",
        position: "relative",
      }}
    >
      <div
        ref={legendRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,

          willChange: "transform",
          zIndex: 2,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: 120,
            backgroundColor: trackModel.isSelected
              ? "yellow"
              : "var(--bg-color)",
            color: trackModel.options?.legendFontColor
              ? trackModel.options.legendFontColor
              : trackModel.isSelected
                ? "black"
                : "var(--font-color)",

            pointerEvents: "auto",
          }}
        >
          {legend ?? (
            <TrackLegend
              trackModel={trackModel}
              height={
                getConfigOptions().displayMode === "full"
                  ? !fetchError.current
                    ? svgHeight.current
                    : 40
                  : !fetchError.current
                    ? getConfigOptions().height
                    : 40
              }
            />
          )}
        </div>
        {/* Show Loading component when loading, or HiddenIndicator when data is loaded and items are hidden */}
        <Loading
          buttonLabel={
            (viewComponent && dataIdx !== viewComponent.dataIdx) ||
              !viewComponent
              ? "Loading View"
              : "Getting Data"
          }
          height={
            !viewComponent
              ? 40
              : getConfigOptions().displayMode === "full"
                ? !fetchError.current
                  ? svgHeight.current
                  : 40
                : !fetchError.current
                  ? getConfigOptions().height
                  : 40
          }
          color={trackModel.isSelected ? "black" : "var(--font-color)"}
          // Control visibility - show when loading
          isVisible={
            trackModel.id in messageData ||
            !viewComponent ||
            (viewComponent && dataIdx !== viewComponent.dataIdx)
          }
        // windowWidth + (120 - (15 * metaSets.terms.length - 1)) - 200
        // xOffset={0}
        >
          <div>
            {trackModel.id in messageData
              ? messageData[`${trackModel.id}`].map((item, index) => {
                return (
                  <div key={`${trackModel.index}loading-` + `${index}`}>
                    {item.genomicLoci
                      ? item.genomicLoci.map((item) => item.toString())
                      : ""}{" "}
                  </div>
                );
              })
              : ""}
          </div>
        </Loading>

        <HiddenIndicator
          numHidden={
            viewComponent && viewComponent.numHidden
              ? viewComponent.numHidden
              : ""
          }
          color={trackModel.isSelected ? "black" : "var(--font-color)"}
          height={
            getConfigOptions().displayMode === "full"
              ? !fetchError.current
                ? svgHeight.current
                : 40
              : !fetchError.current
                ? getConfigOptions().height
                : 40
          }
          xOffset={windowWidth / 2 + 120 - (15 * metaSets.terms.length - 1)}
          // Control visibility - show when data is loaded and items are hidden, but not when loading
          isVisible={
            viewComponent &&
            viewComponent.numHidden &&
            !(
              trackModel.id in messageData ||
              !viewComponent ||
              (viewComponent && dataIdx !== viewComponent.dataIdx)
            )
          }
        />

        <div
          style={{
            position: "absolute",
            top: 0,
            zIndex: 3,
            pointerEvents: "auto",
            height: fetchError.current
              ? 40
              : getConfigOptions().displayMode === "full"
                ? svgHeight.current
                : !getConfigOptions().isCombineStrands &&
                  trackModel.type === "methylc"
                  ? getConfigOptions().height * 2
                  : getConfigOptions().height,
            left: windowWidth + (120 - (15 * metaSets.terms.length - 1)), // add legendwidth to push element to correct position but need to subtract 15 and * number of terms because width of colorbox
          }}
        >
          <MetadataIndicator
            track={trackModel}
            terms={metaSets.terms}
            onClick={onColorBoxClick}
            height={
              fetchError.current
                ? 40
                : getConfigOptions().displayMode === "full"
                  ? svgHeight.current
                  : !getConfigOptions().isCombineStrands &&
                    trackModel.type === "methylc"
                    ? getConfigOptions().height * 2
                    : getConfigOptions().height
            }
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          height: fetchError.current
            ? 40
            : getConfigOptions().displayMode === "full"
              ? svgHeight.current
              : !getConfigOptions().isCombineStrands &&
                trackModel.type === "methylc"
                ? getConfigOptions().height * 2
                : getConfigOptions().height,

          position: "relative",
          willChange: "transform",
          left: 120,
        }}
      >
        {Toolbar.skeleton && !viewComponent ? (
          <div style={{}}>
            <Toolbar.skeleton width={windowWidth} height={40} />
          </div>
        ) : (
          ""
        )}
        <div
          style={{
            position: "absolute",
            lineHeight: 0,

            transform: `translateX(${viewComponent ? viewComponent.xPos : 0}px)`,
            backgroundColor: getConfigOptions().backgroundColor,
          }}
        >
          {viewComponent ? (
            <div style={{ position: "relative", overflow: "hidden" }}>
              {viewComponent.component}
              {selectedRegionSet ? (
                <VerticalDivider visData={viewComponent.visData} />
              ) : (
                ""
              )}
            </div>
          ) : (
            ""
          )}
        </div>

        <div className={toolTipVisible ? "visible" : "hidden"}>{toolTip}</div>

        {
          // highlight element is inside the track component because it has pixel relative to bp location, so we have to set them within the
          // track
          highlightElements.length > 0
            ? highlightElements.map((item, index) => {
              if (item.display) {
                return (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      position: "relative",
                      height: "100%",
                    }}
                  >
                    <div
                      key={index}
                      style={{
                        position: "absolute",
                        backgroundColor: item.color,
                        top: "0",
                        height: "100%",
                        left: item.side === "right" ? `${item.xPos}px` : "",
                        right: item.side === "left" ? `${item.xPos}px` : "",
                        width: item.width,
                        pointerEvents: "none", // This makes the highlighted area non-interactive
                      }}
                    ></div>
                  </div>
                );
              }
            })
            : ""
        }
      </div>
    </div>
  );
});

export default memo(TrackFactory);
