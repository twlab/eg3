import React, { memo } from "react";
import { useEffect, useRef, useState } from "react";
import { TrackProps } from "../../../models/trackModels/trackProps";
import ReactDOM from "react-dom";
import { getTrackXOffset } from "./CommonTrackStateChangeFunctions.tsx/getTrackPixelXOffset";
import { getConfigChangeData } from "./CommonTrackStateChangeFunctions.tsx/getDataAfterConfigChange";
import OpenInterval from "../../../models/OpenInterval";
import { getDeDupeArrMatPlot } from "./CommonTrackStateChangeFunctions.tsx/cacheFetchedData";
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
    isError,
    cacheDataIdx,
    xvalues = null
  ) {
    let curXPos = getTrackXOffset(trackState, windowWidth);
    if (isError) {
      fetchError.current = true;
    }

    trackState["viewWindow"] = trackState.viewWindow;

    let res = fetchError.current ? (
      <div
        style={{
          width: trackState.visWidth,
          height: 40,
          backgroundColor: "#F37199",
          textAlign: "center",
          lineHeight: "40px",
        }}
      >
        {genesArr[0]}
      </div>
    ) : (
      getDisplayModeFunction({
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
        getGenePadding: trackOptionMap[`${trackModel.type}`].getGenePadding,
        getHeight,
        ROW_HEIGHT: trackOptionMap[`${trackModel.type}`].ROW_HEIGHT,
        groupScale: trackState.groupScale,
        xvaluesData: xvalues,
        onClose,
      })
    );

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
  useEffect(() => {
    if (
      newDrawData.trackToDrawId &&
      id in newDrawData.trackToDrawId &&
      dataIdx in trackFetchedDataCache.current[`${id}`] &&
      dataIdx in globalTrackState.current.trackStates
    ) {
      let cacheTrackData = trackFetchedDataCache.current[`${id}`];
      let trackState = {
        ...globalTrackState.current.trackStates[dataIdx].trackState,
      };
      const primaryVisData =
        trackState.genomicFetchCoord[trackState.primaryGenName].primaryVisData;
      if (cacheTrackData.trackType !== "genomealign") {
        let visRegion = !cacheTrackData.usePrimaryNav
          ? trackState.genomicFetchCoord[
              trackFetchedDataCache.current[`${id}`].queryGenome
            ].queryRegion
          : primaryVisData.visRegion;
        trackState["visRegion"] = visRegion;
      }
      trackState["visWidth"] = primaryVisData.visWidth
        ? primaryVisData.visWidth
        : windowWidth * 3;

      if (initTrackStart.current) {
        // use previous data before resetState

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
        initTrackStart.current = false;
      }

      if (!cacheTrackData.useExpandedLoci) {
        let combinedData: any = [];
        let hasError = false;
        let currIdx = dataIdx + 1;
        var noData = false;
        for (let i = 0; i < 3; i++) {
          if (!cacheTrackData[currIdx] || !cacheTrackData[currIdx].dataCache) {
            noData = true;
            continue;
          }
          if (
            cacheTrackData[currIdx].dataCache &&
            "error" in cacheTrackData[currIdx].dataCache
          ) {
            hasError = true;
            combinedData.push(cacheTrackData[currIdx].dataCache.error);
          } else {
            combinedData.push(cacheTrackData[currIdx]);
          }

          currIdx--;
        }

        if (!hasError) {
          if (dynamicMatplotTracks.has(trackModel.type)) {
            combinedData = getDeDupeArrMatPlot(combinedData, false);
          } else {
            combinedData = combinedData
              .map((item) => {
                if (item && "dataCache" in item && item.dataCache) {
                  return item.dataCache;
                } else {
                  noData = true;
                }
              })
              .flat(1);
          }
        }

        if (!noData) {
          if (newDrawData.viewWindow) {
            trackState["viewWindow"] = newDrawData.viewWindow;
          }
          trackState["groupScale"] =
            globalTrackState.current.trackStates[dataIdx].trackState[
              "groupScale"
            ];

          createSVGOrCanvas(
            trackState,
            combinedData,
            hasError,
            dataIdx,
            cacheTrackData[dataIdx].xvalues
              ? cacheTrackData[dataIdx].xvalues
              : null
          );
        }
      } else {
        const combinedData = cacheTrackData[dataIdx]
          ? cacheTrackData[dataIdx].dataCache
          : null;

        if (combinedData) {
          if (newDrawData.viewWindow) {
            trackState["viewWindow"] = newDrawData.viewWindow;
          }

          createSVGOrCanvas(
            trackState,
            combinedData,
            "error" in combinedData ? true : false,
            dataIdx,
            cacheTrackData[dataIdx].xvalues
              ? cacheTrackData[dataIdx].xvalues
              : null
          );
        }
      }
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

        if (cacheTrackData.trackType !== "genomealign") {
          const primaryVisData =
            trackState.genomicFetchCoord[trackState.primaryGenName]
              .primaryVisData;
          let visRegion = !cacheTrackData.usePrimaryNav
            ? trackState.genomicFetchCoord[
                trackFetchedDataCache.current[`${id}`].queryGenome
              ].queryRegion
            : primaryVisData.visRegion;
          trackState["visRegion"] = visRegion;
        }
        if (viewWindowConfigData.current) {
          trackState.viewWindow = viewWindowConfigData.current.viewWindow;
        }

        getConfigChangeData({
          fetchedDataCache: trackFetchedDataCache.current[`${id}`],
          dataIdx,
          trackState,
          usePrimaryNav: trackFetchedDataCache.current[`${id}`].usePrimaryNav,
          createSVGOrCanvas,
          trackType: trackModel.type,
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
      if (anchorTracks.has(trackModel.type)) {
        if (
          !configOptions.current.fetchViewWindowOnly &&
          !configOptions.current.bothAnchorsInView
        ) {
          return;
        }
      }
      let trackState = _.cloneDeep(
        globalTrackState.current.trackStates[dataIdx].trackState
      );
      let cacheTrackData = trackFetchedDataCache.current[`${id}`];
      let noData = false;
      if (!cacheTrackData.useExpandedLoci) {
        let curIdx = dataIdx + 1;

        for (let i = 0; i < 3; i++) {
          if (!cacheTrackData[curIdx] || !cacheTrackData[curIdx].dataCache) {
            noData = true;
          }
          if (
            cacheTrackData[curIdx].dataCache &&
            "error" in cacheTrackData[curIdx].dataCache
          ) {
            fetchError.current = true;
          } else {
            fetchError.current = false;
          }
          curIdx--;
        }
      } else {
        const combinedData = cacheTrackData[dataIdx]
          ? cacheTrackData[dataIdx].dataCache
          : null;
        if (combinedData) {
          if (typeof combinedData === "object" && "error" in combinedData) {
            fetchError.current = true;
            noData = true;
          }
        } else {
          noData = true;
        }
      }
      if (!noData) {
        if (cacheTrackData.trackType !== "genomealign") {
          const primaryVisData =
            trackState.genomicFetchCoord[trackState.primaryGenName]
              .primaryVisData;
          let visRegion = !cacheTrackData.usePrimaryNav
            ? trackState.genomicFetchCoord[
                trackFetchedDataCache.current[`${id}`].queryGenome
              ].queryRegion
            : primaryVisData.visRegion;
          trackState["visRegion"] = visRegion;
        }
        trackState.viewWindow = viewWindowConfigChange.viewWindow;
        trackState["groupScale"] = viewWindowConfigChange.groupScale;

        getConfigChangeData({
          fetchedDataCache: trackFetchedDataCache.current[`${id}`],
          dataIdx,
          trackState,
          usePrimaryNav: trackFetchedDataCache.current[`${id}`].usePrimaryNav,
          createSVGOrCanvas,
          trackType: trackModel.type,
        });
      }
    }
  }, [viewWindowConfigChange]);

  // MARK: Screenshot
  useEffect(() => {
    if (isScreenShotOpen) {
      async function handle() {
        let cacheDataIdx = dataIdx;

        let cacheTrackData = trackFetchedDataCache.current[`${id}`];
        let combinedData: any = [];
        let hasError = false;
        let currIdx = dataIdx + 1;
        let trackState = _.cloneDeep(
          globalTrackState.current.trackStates[cacheDataIdx].trackState
        );
        if (trackModel.type !== "genomealign") {
          if (!interactionTracks.has(trackModel.type)) {
            for (let i = 0; i < 3; i++) {
              if (!cacheTrackData[currIdx].dataCache) {
                continue;
              }
              if (
                cacheTrackData[currIdx].dataCache &&
                "error" in cacheTrackData[currIdx].dataCache
              ) {
                hasError = true;
                combinedData.push(cacheTrackData[currIdx].dataCache.error);
              } else {
                combinedData.push(cacheTrackData[currIdx]);
              }

              currIdx--;
            }
          } else {
            combinedData = cacheTrackData[dataIdx].dataCache;

            if (!combinedData) {
              hasError = true;
            }
          }

          var noData = false;
          if (!hasError) {
            if (dynamicMatplotTracks.has(trackModel.type)) {
              combinedData = getDeDupeArrMatPlot(combinedData, false);
            } else if (!interactionTracks.has(trackModel.type)) {
              combinedData = combinedData
                .map((item) => {
                  if (item && "dataCache" in item) {
                    return item.dataCache;
                  } else {
                    noData = true;
                  }
                })
                .flat(1);
            } else if (combinedData && "error" in combinedData) {
              noData = true;
            }
          }
          if (noData || !combinedData) {
            return;
          }

          const primaryVisData =
            trackState.genomicFetchCoord[trackState.primaryGenName]
              .primaryVisData;
          let visRegion = !cacheTrackData.usePrimaryNav
            ? trackState.genomicFetchCoord[
                trackFetchedDataCache.current[`${id}`].queryGenome
              ].queryRegion
            : primaryVisData.visRegion;
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
        } else {
          const tmpCombinedData = cacheTrackData[dataIdx]
            ? cacheTrackData[dataIdx].dataCache
            : null;

          if (tmpCombinedData) {
            if (newDrawData.viewWindow) {
              trackState["viewWindow"] = newDrawData.viewWindow;
            }
            combinedData = tmpCombinedData;
          }
        }

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

      {/* <div className="button-60" role="button" style={{ zIndex: 2 }}>
        Button 60
      </div> */}
      <Loading
        buttonLabel={
          (viewComponent && dataIdx !== viewComponent.dataIdx) || !viewComponent
            ? "Loading View"
            : "Getting Data"
        }
        height={
          configOptions.current.displayMode === "full"
            ? !fetchError.current
              ? svgHeight.current
              : 40
            : !fetchError.current
            ? configOptions.current.height
            : 40
        }
        // Control visibility
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
      {viewComponent && viewComponent.numHidden ? (
        <div
          style={{
            position: "absolute",
            zIndex: 3,
            height: 16,

            top:
              configOptions.current.displayMode === "full"
                ? !fetchError.current
                  ? svgHeight.current
                  : 40
                : !fetchError.current
                ? configOptions.current.height
                : 40, // 16 is the height of the button, shift it up to align
            left: windowWidth / 2 + 120 - (15 * metaSets.terms.length - 1),
          }}
        >
          {viewComponent.numHidden}
        </div>
      ) : (
        ""
      )}
      {viewComponent && viewComponent.numHidden ? (
        <HiddenIndicator
          numHidden={viewComponent.numHidden}
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
        />
      ) : (
        ""
      )}

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
          WebkitPerspective: `${windowWidth * 3 + 120}px`,
          backfaceVisibility: "hidden",
          perspective: `${windowWidth * 3 + 120}px`,
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
