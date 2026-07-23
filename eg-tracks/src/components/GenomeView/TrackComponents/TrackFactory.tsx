import React, { memo } from "react";
import { useEffect, useRef, useState } from "react";
import { TrackProps } from "../../../models/trackModels/trackProps";
import ReactDOM from "react-dom";
import { getTrackXOffset } from "./CommonTrackStateChangeFunctions.tsx/getTrackPixelXOffset";

import ErrorBoundary from "./commonComponents/ErrorBoundary";

import {
  dynamicMatplotTracks,
  getDisplayModeFunction,
} from "./displayModeComponentMap";
const TOP_PADDING = 2;
import { trackOptionMap } from "./defaultOptionsMap";
import _ from "lodash";
import MetadataIndicator from "./commonComponents/MetadataIndicator";
import Loading from "./commonComponents/Loading";
import "./commonComponents/loading.css";
import { geneClickToolTipMap } from "./renderClickTooltipMap";
import HiddenIndicator from "./commonComponents/HiddenIndicator";
import { groupTracksArrMatPlot } from "./CommonTrackStateChangeFunctions.tsx/cacheFetchedData";
import VerticalDivider from "./commonComponents/VerticalDivider";
import TrackLegend from "./commonComponents/TrackLegend";
import { fetchGenomicData } from "../../../getRemoteData/fetchFunctions";

const TrackFactory: React.FC<TrackProps> = memo(function TrackFactory({
  basePerPixel,
  side,
  windowWidth = 0,
  genomeConfig,
  trackModel,
  dataIdx,
  signalTrackLoadComplete,
  id,
  setShow3dGene,
  isThereG3dTrack,
  viewWindowConfigChange,
  sentScreenshotData,
  newDrawData,
  selfFetchTrigger,
  selfFetchApi,
  trackManagerState,
  globalTrackState,
  isScreenShotOpen,
  legendRef,
  metaSets,
  onColorBoxClick,
  messageData,
  Toolbar,
  handleRetryFetchTrack,
  initialLoad,
  selectedRegionSet,
  legendWidth,
}) {
  function getConfigOptions() {
    try {
      const globalCfg = trackManagerState.current.globalConfig;
      if (globalCfg) {
        // support either a ref-like shape (legacy) or plain object
        const entry = globalCfg.current
          ? globalCfg.current[`${id}`]
          : globalCfg[`${id}`];
        if (entry && entry.configOptions) {
          return entry.configOptions;
        }
      }
    } catch (e) {
      // fallthrough to defaults
    }
    return trackOptionMap[trackModel.type]
      ? {
          ...trackOptionMap[`${trackModel.type}`].defaultOptions,
          ...(trackModel.options || {}),
        }
      : { ...trackOptionMap["error"].defaultOptions };
  }

  const svgHeight = useRef(40);
  const updateSide = useRef("right");
  const updatedLegend = useRef<any>(undefined);
  const fetchError = useRef<string | null>(null);

  const caches = trackManagerState.current.caches;

  const xPos = useRef(0);
  const [legend, setLegend] = useState<any>(null);
  const [viewComponent, setViewComponent] = useState<{
    [key: string]: any;
  } | null>(null);

  const [toolTip, setToolTip] = useState<any>();
  const [toolTipVisible, setToolTipVisible] = useState(false);

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
      placeFeature,
      legendWidth: legendWidth ? legendWidth : 120,
    };

    // try {
    const res = getDisplayModeFunction(displayArgs);
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
          <ErrorBoundary errorDrawData={displayArgs} fetchError={fetchError}>
            {result as any}
          </ErrorBoundary>
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
        viewWindow: trackState.viewWindow,
      });
      // ,
      // );
    }
  }
  function onClose() {
    setToolTipVisible(false);
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

      if (dynamicMatplotTracks.has(trackModel.type)) {
        // matplot/dynamic use precomputed xvalues when available. dynamicbed is
        // arranged in GroupedTrackManager (placeFeature), but we still always
        // hand it the raw per-sub-track data as a fallback so it never renders
        // empty on a draw where placeFeature isn't cached yet — its component
        // prefers placeFeature and only arranges this data when it's absent.
        // Gather the 3 stitched regions and bucket them by sub-track. This runs
        // before the placeFeature/xvalues short-circuit below.
        if (
          trackModel.type !== "dynamicbed" &&
          cacheTrackData[`${dataIdx}`]?.["xvalues"]
        ) {
          combinedData = [];
        } else {
          for (let i = 0; i < 3; i++) {
            if (cacheTrackData[currIdx]?.dataCache) {
              combinedData.push(cacheTrackData[currIdx]);
            }
            currIdx--;
          }
          combinedData = groupTracksArrMatPlot(combinedData);
        }
      } else if (
        cacheTrackData[`${dataIdx}`]?.["xvalues"] ||
        cacheTrackData[`${dataIdx}`]?.["placeFeature"]
      ) {
        combinedData = [];
      } else {
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

  // MARK: [selfFetch]
  // Fetch this track's own data (on the main thread) and draw it as soon as the
  // fetch resolves, instead of waiting for the centralized queue + shared
  // setDraw broadcast. Only eligible tracks get a non-null plan; coordinated
  // tracks (genomealign views, grouped scale, query-aligned, interaction) return
  // null here and keep drawing through the newDrawData path above.
  function drawFromCache(viewWindow, groupScale) {
    if (
      !caches[`${id}`] ||
      !globalTrackState.current.trackStates[dataIdx] ||
      !globalTrackState.current.trackStates[dataIdx].trackState
        .genomicFetchCoord
    ) {
      return;
    }
    const cacheTrackData = caches[`${id}`];
    const trackState = {
      ...globalTrackState.current.trackStates[dataIdx].trackState,
    };
    handleTrackDraw({
      cacheTrackData,
      trackState,
      viewWindow,
      groupScale,
      xvalues: cacheTrackData[dataIdx]?.xvalues,
      placeFeature: cacheTrackData[dataIdx]?.placeFeature,
      isInit: true,
    });
  }

  useEffect(() => {
    if (!selfFetchTrigger || !selfFetchApi?.current) {
      return;
    }
    const api = selfFetchApi.current;
    const curDataIdx = dataIdx;
    const plan = api.getTrackFetchPlan(id, curDataIdx);
    if (!plan) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        if (plan.drawNow) {
          const commit = await api.commitTrackFetch(id, [], curDataIdx);
          if (!cancelled && commit.ready) {
            drawFromCache(commit.viewWindow, commit.groupScale);
          }
          return;
        }

        const resultsNested = await Promise.all(
          plan.argsArr.map((arg: any) => fetchGenomicData([arg])),
        );
        // Always commit the fetched data to the cache (even if this effect was
        // superseded by a newer region) so the cache slot isn't left stuck as
        // in-flight. commitTrackFetch itself no-ops the shared draw bookkeeping
        // when the region is stale; we additionally gate the draw on cancelled.
        const flatResults = resultsNested.flat();
        const commit = await api.commitTrackFetch(id, flatResults, curDataIdx);
        if (cancelled) {
          return;
        }
        if (commit.ready) {
          drawFromCache(commit.viewWindow, commit.groupScale);
        }
      } catch (e) {
        console.error("Error in self-fetch for track", id, e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selfFetchTrigger]);

  // MARK: [viewWindowConfigChange]

  useEffect(() => {
    if (
      viewWindowConfigChange &&
      id in viewWindowConfigChange.trackToDrawId
      // &&
      // (trackModel.type in numericalTracks ||
      //   getConfigOptions().displayMode === "density")
    ) {
      let trackState = _.cloneDeep(
        globalTrackState.current.trackStates[dataIdx].trackState,
      );
      let cacheTrackData = caches[`${id}`];
      const xDiff =
        viewWindowConfigChange.viewWindow.start -
        trackState?.visData?.viewWindow.start;
      const sameRegionViewWindow = {
        start:
          trackState?.genomicFetchCoord[trackState.primaryGenName]
            ?.primaryVisData?.viewWindow?.start + xDiff,
        end:
          trackState?.genomicFetchCoord[trackState.primaryGenName]
            ?.primaryVisData?.viewWindow?.end + xDiff,
      };

      handleTrackDraw({
        cacheTrackData,
        trackState,
        viewWindow: sameRegionViewWindow,
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
        if (!viewComponent) {
          return;
        }
        let cacheDataIdx = dataIdx;

        let cacheTrackData = caches[`${id}`];
        let combinedData: any = [];
        let trackState = _.cloneDeep(
          globalTrackState.current.trackStates[cacheDataIdx].trackState,
        );
        if (cacheTrackData["error"]) {
          sentScreenshotData({
            isError: fetchError.current,
            trackId: id,
          });
          return;
        } else if (
          !cacheTrackData.useExpandedLoci &&
          cacheTrackData.usePrimaryNav
        ) {
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
            trackState["groupScale"] =
              globalTrackState.current.trackStates[dataIdx].trackState[
                "groupScale"
              ];
          }
        } else {
          combinedData = cacheTrackData[dataIdx]
            ? _.clone(cacheTrackData[dataIdx].dataCache)
            : null;
        }

        const primaryVisData =
          trackState.genomicFetchCoord[trackState.primaryGenName]
            .primaryVisData;
        let visRegion = !cacheTrackData.usePrimaryNav
          ? trackState.genomicFetchCoord[caches[`${id}`].queryGenome]
              .queryRegion
          : primaryVisData.visRegion;
        // need to create visRegion to use for draw because trackState doesn't globaltrackState don't keep it
        trackState["visRegion"] = visRegion;
        trackState["viewWindow"] = viewComponent.viewWindow;
        let drawOptions = { ...getConfigOptions() };
        drawOptions["forceSvg"] = true;
        trackState["groupScale"] =
          globalTrackState.current.trackStates[dataIdx].trackState[
            "groupScale"
          ];

        if (combinedData) {
          sentScreenshotData({
            genomeName: genomeConfig.genome.getName(),
            genesArr: combinedData,
            trackState,
            windowWidth,
            configOptions: drawOptions,
            svgHeight: svgHeight.current
              ? svgHeight.current
              : getConfigOptions().height,
            trackModel,
            basesByPixel: basePerPixel,
            genomeConfig,
            xvaluesData: cacheTrackData[dataIdx].xvalues
              ? cacheTrackData[dataIdx].xvalues
              : null,
            isError: fetchError.current,
            trackId: id,
            legendWidth: legendWidth ? legendWidth : 120,

            placeFeature: cacheTrackData[dataIdx]?.placeFeature,
            visData: viewComponent.visData,
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
            width: legendWidth,
            display: "flex",
            flexDirection: "column",
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
          {/* <p
            className="TrackLegend-label"
            style={{
              position: "absolute",
              wordWrap: "break-word",
              whiteSpace: "normal",
              margin: 0,
              zIndex: 1,
            }}
          >
            {trackModel.options?.label ?? legend?.label ?? ""}
          </p> */}
          <TrackLegend
            trackModel={trackModel}
            height={
              legend?.height ??
              (fetchError.current
                ? 40
                : getConfigOptions().displayMode === "full" ||
                    getConfigOptions().displayMode === "detail" ||
                    (svgHeight.current &&
                      getConfigOptions().displayMode === "auto")
                  ? svgHeight.current
                  : getConfigOptions().height)
            }
            axisScale={legend?.axisScale}
            axisLegend={legend?.axisLegend}
            label={trackModel.options?.label ?? legend?.label ?? ""}
            forceSvg={legend?.forceSvg}
            trackViewRegion={legend?.trackViewRegion}
            selectedRegion={legend?.selectedRegion}
            trackWidth={legend?.trackWidth}
            noShiftFirstAxisLabel={legend?.noShiftFirstAxisLabel}
            legendWidth={legendWidth}
          />
          {legend?.reverseStrandLegendProps && (
            <TrackLegend
              {...legend.reverseStrandLegendProps}
              legendWidth={legendWidth}
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
          legendWidth={legendWidth}
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
          xOffset={
            windowWidth / 2 + legendWidth - (15 * metaSets.terms.length - 1)
          }
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
          legendWidth={legendWidth}
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
            left:
              windowWidth + (legendWidth - (15 * metaSets.terms.length - 1)), // add legendwidth to push element to correct position but need to subtract 15 and * number of terms because width of colorbox
          }}
        >
          <MetadataIndicator
            track={trackModel}
            terms={metaSets.terms}
            onClick={onColorBoxClick}
            height={
              fetchError.current
                ? 40
                : svgHeight.current
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
            : getConfigOptions().displayMode === "full" ||
                getConfigOptions().displayMode === "detail" ||
                (svgHeight.current && getConfigOptions().displayMode === "auto")
              ? svgHeight.current
              : !getConfigOptions().isCombineStrands &&
                  trackModel.type === "methylc"
                ? getConfigOptions().height * 2
                : getConfigOptions().height,

          position: "relative",
          willChange: "transform",
          left: legendWidth,
          //  + viewComponent?.xOffset || 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            lineHeight: 0,

            transform: `translateX(${viewComponent ? viewComponent.xPos : 0}px)`,
            backgroundColor: getConfigOptions().backgroundColor,
          }}
        >
          {Toolbar.skeleton && !viewComponent ? (
            <div style={{}}>
              <Toolbar.skeleton width={windowWidth} height={40} />
            </div>
          ) : (
            ""
          )}
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
      </div>
    </div>
  );
});

export default memo(TrackFactory);
