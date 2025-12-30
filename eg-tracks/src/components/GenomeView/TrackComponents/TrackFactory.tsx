import React, { memo } from "react";
import { useEffect, useRef, useState } from "react";
import { TrackProps } from "../../../models/trackModels/trackProps";
import ReactDOM from "react-dom";
import { getTrackXOffset } from "./CommonTrackStateChangeFunctions.tsx/getTrackPixelXOffset";
import { getConfigChangeData } from "./CommonTrackStateChangeFunctions.tsx/getDataAfterConfigChange";
import OpenInterval from "../../../models/OpenInterval";

import {
  anchorTracks,
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
  trackFetchedDataCache,
  globalTrackState,
  isScreenShotOpen,
  posRef,
  highlightElements,
  viewWindowConfigData,
  metaSets,
  onColorBoxClick,
  messageData,
  Toolbar,
  handleRetryFetchTrack,
}) {
  const configOptions = useRef(
    trackOptionMap[trackModel.type]
      ? { ...trackOptionMap[`${trackModel.type}`].defaultOptions }
      : { ...trackOptionMap["error"].defaultOptions }
  );
  const initTrackStart = useRef(true);
  const svgHeight = useRef(0);
  const updateSide = useRef("right");
  const updatedLegend = useRef<any>(undefined);
  const fetchError = useRef<boolean>(false);

  const xPos = useRef(0);

  const [viewComponent, setViewComponent] = useState<{
    [key: string]: any;
  } | null>(null);

  const [toolTip, setToolTip] = useState<any>();
  const [toolTipVisible, setToolTipVisible] = useState(false);
  const [legend, setLegend] = useState<any>(null);

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
  function createSVGOrCanvas(
    trackState,
    genesArr,

    cacheDataIdx,
    xvalues = null
  ) {
    const curXPos = getTrackXOffset(trackState, windowWidth);

    trackState["viewWindow"] = trackState.viewWindow;

    const res = getDisplayModeFunction({
      basesByPixel: basePerPixel,
      genesArr,
      genomeConfig,
      genomeName: genomeConfig.genome.getName(),
      trackState,
      windowWidth,
      configOptions: configOptions.current,
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
    });

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

      setViewComponent({
        component: result,
        dataIdx: cacheDataIdx,
        numHidden: numHidden,
      });

      xPos.current = curXPos;
    }
  }
  function onClose() {
    setToolTip(null);
  }
  // MARK: clickTool
  function renderTooltip(event, gene) {
    const currtooltip = geneClickToolTipMap[`${trackModel.type}`]({
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
      configOptions: configOptions.current,
    });
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
    matplotCheck,
    skipNoData,
  }) {
    const primaryVisData =
      trackState.genomicFetchCoord[trackState.primaryGenName].primaryVisData;
    if (cacheTrackData.trackType !== "genomealign") {
      let visRegion = !cacheTrackData.usePrimaryNav
        ? trackState.genomicFetchCoord[cacheTrackData.queryGenome].queryRegion
        : primaryVisData.visRegion;
      trackState["visRegion"] = visRegion;
    }
    trackState["visWidth"] = primaryVisData.visWidth
      ? primaryVisData.visWidth
      : windowWidth * 3;

    if (isInit && initTrackStart.current) {
      if (interactionTracks.has(trackModel.type)) {
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
        usePrimaryNav: cacheTrackData.usePrimaryNav,
      });
      fetchError.current = cacheTrackData["Error"]
        ? cacheTrackData["Error"]
        : null;
      initTrackStart.current = false;
    }

    if (fetchError.current) {
      trackState["recreate"] = false;
      createSVGOrCanvas(trackState, [], dataIdx, null);
      return;
    }

    if (!cacheTrackData.useExpandedLoci && cacheTrackData.usePrimaryNav) {
      let combinedData: Array<any> = [];
      let currIdx = dataIdx + 1;
      let noData = false;
      for (let i = 0; i < 3; i++) {
        if (!cacheTrackData[currIdx] || !cacheTrackData[currIdx].dataCache) {
          noData = true;
          continue;
        }
        combinedData.push(cacheTrackData[currIdx]);
        currIdx--;
      }
      if (matplotCheck && dynamicMatplotTracks.has(trackModel.type)) {
        if (
          cacheTrackData[`${dataIdx}`] &&
          cacheTrackData[`${dataIdx}`]["xvalues"]
        ) {
          combinedData = [];
        } else {
          combinedData = groupTracksArrMatPlot(combinedData);
        }
      }
      if (!noData || skipNoData) {
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
          xvalues ? xvalues : null
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
          xvalues ? xvalues : null
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
        !trackFetchedDataCache.current[`${id}`] ||
        !globalTrackState.current.trackStates[dataIdx] ||
        !globalTrackState.current.trackStates[dataIdx].trackState
          .genomicFetchCoord
      ) {
        return;
      }
      const cacheTrackData = trackFetchedDataCache.current[`${id}`];
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
        isInit: true,
        matplotCheck: true,
        skipNoData: false,
      });
    }
  }, [newDrawData]);

  // MARK: [applyConfig]
  useEffect(() => {
    if (viewComponent !== null) {
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
        });
        let cacheDataIdx = dataIdx;
        let cacheTrackData = trackFetchedDataCache.current[`${id}`];
        let trackState = _.cloneDeep(
          globalTrackState.current.trackStates[cacheDataIdx].trackState
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
          isInit: false,
          matplotCheck: true,
          skipNoData: false,
        });
      }
    }
  }, [applyTrackConfigChange]);

  // MARK: [viewWindowConfigChange]

  useEffect(() => {
    if (
      viewWindowConfigChange &&
      id in viewWindowConfigChange.trackToDrawId &&
      (trackModel.type in numericalTracks ||
        configOptions.current.displayMode === "density")
    ) {
      let trackState = _.cloneDeep(
        globalTrackState.current.trackStates[dataIdx].trackState
      );
      let cacheTrackData = trackFetchedDataCache.current[`${id}`];
      trackState["recreate"] = true;
      handleTrackDraw({
        cacheTrackData,
        trackState,
        viewWindow: viewWindowConfigChange.viewWindow,
        groupScale:
          globalTrackState.current.trackStates[dataIdx].trackState[
            "groupScale"
          ],
        xvalues: cacheTrackData[dataIdx]?.xvalues,
        isInit: false,
        matplotCheck: true,
        skipNoData: false,
      });
    }
  }, [viewWindowConfigChange]);

  // MARK: Screenshot
  useEffect(() => {
    if (isScreenShotOpen) {
      async function handle() {
        let cacheDataIdx = dataIdx;

        let cacheTrackData = trackFetchedDataCache.current[`${id}`];
        let combinedData: any = [];
        let trackState = _.cloneDeep(
          globalTrackState.current.trackStates[cacheDataIdx].trackState
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

            combinedData.push(cacheTrackData[currIdx]);

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
            ? cacheTrackData[dataIdx].dataCache
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
              trackFetchedDataCache.current[`${id}`].queryGenome
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
                windowWidth * 3 + -(dragX! + (xPos.current + windowWidth))
              )
            : new OpenInterval(
                -(dragX! - (xPos.current + windowWidth)) + windowWidth,
                windowWidth * 3 -
                  (dragX! - (xPos.current + windowWidth)) +
                  windowWidth
              );
        let start = expandedViewWindow.start + width / 3;

        let end = expandedViewWindow.end - width / 3;

        trackState["viewWindow"] = new OpenInterval(start, end);
        let drawOptions = { ...configOptions.current };
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
                configOptions.current.displayMode === "full"
                  ? svgHeight.current
                  : configOptions.current.height,
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
        style={{
          zIndex: 2,
          width: 120,
          backgroundColor: trackModel.isSelected ? "yellow" : "var(--bg-color)",
          color: trackModel.isSelected ? "black" : "var(--font-color)",
          marginBottom: "1px", // we need 1 px margin here for tracklegend axis, since it uses the full height and we are using outline
        }}
      >
        {legend}
      </div>

      {/* Show Loading component when loading, or HiddenIndicator when data is loaded and items are hidden */}
      <Loading
        buttonLabel={
          (viewComponent && dataIdx !== viewComponent.dataIdx) || !viewComponent
            ? "Loading View"
            : "Getting Data"
        }
        height={
          !viewComponent
            ? 40
            : configOptions.current.displayMode === "full"
            ? !fetchError.current
              ? svgHeight.current
              : 40
            : !fetchError.current
            ? configOptions.current.height
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
          configOptions.current.displayMode === "full"
            ? !fetchError.current
              ? svgHeight.current
              : 40
            : !fetchError.current
            ? configOptions.current.height
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

      {Toolbar.skeleton && !viewComponent ? (
        <div style={{}}>
          <Toolbar.skeleton width={windowWidth} height={40} />
        </div>
      ) : (
        ""
      )}
      <div
        ref={posRef}
        style={{
          display: "flex",
          height:
            configOptions.current.displayMode === "full"
              ? !fetchError.current
                ? svgHeight.current
                : 40
              : !fetchError.current
              ? configOptions.current.height
              : 40,
          position: "relative",
          WebkitBackfaceVisibility: "hidden", // this stops lag for when there are a lot of svg components on the screen when using translate3d
          WebkitPerspective: `${0}px`,
          backfaceVisibility: "hidden",
          perspective: `${0}px`,
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
          {viewComponent ? viewComponent.component : ""}
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

      <div
        style={{
          position: "absolute",
          zIndex: 3,
          height:
            configOptions.current.displayMode === "full"
              ? !fetchError.current
                ? svgHeight.current
                : 40
              : !fetchError.current
              ? configOptions.current.height
              : 40,
          left: windowWidth + (120 - (15 * metaSets.terms.length - 1)), // add legendwidth to push element to correct position but need to subtract 15 and * number of terms because width of colorbox
        }}
      >
        <MetadataIndicator
          track={trackModel}
          terms={metaSets.terms}
          onClick={onColorBoxClick}
          height={
            configOptions.current.displayMode === "full"
              ? !fetchError.current
                ? svgHeight.current
                : 40
              : !fetchError.current
              ? configOptions.current.height
              : 40
          }
        />
      </div>
    </div>
  );
});

export default memo(TrackFactory);
