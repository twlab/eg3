import React, { memo } from "react";
import { useEffect, useRef, useState } from "react";
import { TrackProps } from "../../models/trackModels/trackProps";
import { objToInstanceAlign } from "./TrackManager";
import FeatureArranger, {
  PlacedFeatureGroup,
} from "../../models/FeatureArranger";
import FeatureDetail from "./commonComponents/annotation/FeatureDetail";
import { SortItemsOptions } from "../../models/SortItemsOptions";
import OpenInterval from "../../models/OpenInterval";
import NumericalTrack from "./commonComponents/numerical/NumericalTrack";
import ReactDOM from "react-dom";
import { Manager, Popper, Reference } from "react-popper";
import OutsideClickDetector from "./commonComponents/OutsideClickDetector";
import { removeDuplicatesWithoutId } from "./commonComponents/check-obj-dupe";

import "./TrackContextMenu.css";

import BedAnnotation, {
  DEFAULT_OPTIONS as defaultBedTrack,
} from "./bedComponents/BedAnnotation";
import { DEFAULT_OPTIONS as defaultNumericalTrack } from "./commonComponents/numerical/NumericalTrack";
import { DEFAULT_OPTIONS as defaultAnnotationTrack } from "../../trackConfigs/config-menu-models.tsx/AnnotationTrackConfig";
import trackConfigMenu from "../../trackConfigs/config-menu-components.tsx/TrackConfigMenu";
import { v4 as uuidv4 } from "uuid";
import DisplayedRegionModel from "../../models/DisplayedRegionModel";
import Feature from "../../models/Feature";
import ChromosomeInterval from "../../models/ChromosomeInterval";
import { BedTrackConfig } from "../../trackConfigs/config-menu-models.tsx/BedTrackConfig";

const BACKGROUND_COLOR = "rgba(173, 216, 230, 0.9)"; // lightblue with opacity adjustment
const ARROW_SIZE = 16;

export const DEFAULT_OPTIONS = {
  ...defaultBedTrack,
  ...defaultNumericalTrack,
  ...defaultAnnotationTrack,
};
DEFAULT_OPTIONS.aggregateMethod = "COUNT";
const ROW_VERTICAL_PADDING = 5;
const ROW_HEIGHT = 9 + ROW_VERTICAL_PADDING;

const getGenePadding = (gene) => gene.getName().length * 9;
const TOP_PADDING = 2;
const BedTrack: React.FC<TrackProps> = memo(function BedTrack({
  trackData,
  side,
  windowWidth = 0,
  genomeArr,
  genomeIdx,
  trackModel,
  dataIdx,
  getConfigMenu,
  onCloseConfigMenu,
  handleDelete,
  trackIdx,
  id,
  useFineModeNav,
}) {
  const configOptions = useRef({ ...DEFAULT_OPTIONS });
  const svgHeight = useRef(0);
  const rightIdx = useRef(0);
  const leftIdx = useRef(1);
  const fetchedDataCache = useRef<{ [key: string]: any }>({});
  const prevDataIdx = useRef(0);
  const xPos = useRef(0);
  const curRegionData = useRef<{ [key: string]: any }>({});
  const parentGenome = useRef("");
  const configMenuPos = useRef<{ [key: string]: any }>({});
  const [svgComponents, setSvgComponents] = useState<any>();
  const [canvasComponents, setCanvasComponents] = useState<any>();
  const [toolTip, setToolTip] = useState<any>();
  const [toolTipVisible, setToolTipVisible] = useState(false);
  const newTrackWidth = useRef(windowWidth);
  const [configChanged, setConfigChanged] = useState(false);

  // These states are used to update the tracks with new fetched data
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track
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
  async function createSVGOrCanvas(curTrackData, genesArr, fine) {
    if (fine) {
      newTrackWidth.current = curTrackData.visWidth;
    }

    let currDisplayNav;
    let sortType = SortItemsOptions.NOSORT;

    if (!fine) {
      if (curTrackData.side === "right") {
        currDisplayNav = new DisplayedRegionModel(
          curTrackData.regionNavCoord._navContext,
          curTrackData.regionNavCoord._startBase -
            (curTrackData.regionNavCoord._endBase -
              curTrackData.regionNavCoord._startBase) *
              2,
          curTrackData.regionNavCoord._endBase
        );
        if (curTrackData.index === 0) {
          currDisplayNav = new DisplayedRegionModel(
            curTrackData.regionNavCoord._navContext,
            curTrackData.regionNavCoord._startBase -
              (curTrackData.regionNavCoord._endBase -
                curTrackData.regionNavCoord._startBase),
            curTrackData.regionNavCoord._endBase +
              (curTrackData.regionNavCoord._endBase -
                curTrackData.regionNavCoord._startBase)
          );
        }
      } else if (curTrackData.side === "left") {
        currDisplayNav = new DisplayedRegionModel(
          curTrackData.regionNavCoord._navContext,
          curTrackData.regionNavCoord._startBase,
          curTrackData.regionNavCoord._endBase +
            (curTrackData.regionNavCoord._endBase -
              curTrackData.regionNavCoord._startBase) *
              2
        );
      }
    }

    let algoData = genesArr.map((record) => {
      let newChrInt = new ChromosomeInterval(
        record.chr,
        record.start,
        record.end
      );
      return new Feature(newChrInt.toStringWithOther(newChrInt), newChrInt, "");
    });
    let featureArrange = new FeatureArranger();
    if (configOptions.current.displayMode === "full") {
      let placeFeatureData = await featureArrange.arrange(
        algoData,
        fine ? objToInstanceAlign(curTrackData.visRegion) : currDisplayNav,
        fine ? curTrackData.visWidth : windowWidth * 3,
        getGenePadding,
        configOptions.current.hiddenPixels,
        sortType
      );

      const height = getHeight(placeFeatureData.numRowsAssigned);
      svgHeight.current = height;
      let svgDATA = createFullVisualizer(
        placeFeatureData.placements,
        fine ? curTrackData.visWidth : windowWidth * 3,
        height,
        ROW_HEIGHT,
        configOptions.current.maxRows,
        configOptions.current
      );
      setSvgComponents(svgDATA);
    } else if (configOptions.current.displayMode === "density") {
      let tmpObj = { ...configOptions.current };
      tmpObj.displayMode = "auto";
      let canvasElements = (
        <NumericalTrack
          data={algoData}
          options={tmpObj}
          viewWindow={
            new OpenInterval(0, fine ? curTrackData.visWidth : windowWidth * 3)
          }
          viewRegion={
            fine ? objToInstanceAlign(curTrackData.visRegion) : currDisplayNav
          }
          width={fine ? curTrackData.visWidth : windowWidth * 3}
          forceSvg={false}
          trackModel={trackModel}
        />
      );
      setCanvasComponents(canvasElements);
    }

    if (curTrackData.initial === 1) {
      xPos.current = fine ? -curTrackData.startWindow : -windowWidth;
    } else if (curTrackData.side === "right") {
      xPos.current = fine
        ? (Math.floor(-curTrackData.xDist / windowWidth) - 1) * windowWidth -
          windowWidth +
          curTrackData.startWindow
        : (Math.floor(-curTrackData.xDist / windowWidth) - 1) * windowWidth;
    } else if (curTrackData.side === "left") {
      xPos.current = fine
        ? Math.floor(curTrackData.xDist / windowWidth) * windowWidth -
          windowWidth +
          curTrackData.startWindow
        : Math.floor(curTrackData.xDist / windowWidth) * windowWidth;
    }
  }

  //________________________________________________________________________________________________________________________________________________________

  function createFullVisualizer(
    placements,
    width,
    height,
    rowHeight,
    maxRows,
    options
  ) {
    function renderAnnotation(placedGroup: PlacedFeatureGroup, i: number) {
      const maxRowIndex = (maxRows || Infinity) - 1;
      // Compute y
      const rowIndex = Math.min(placedGroup.row, maxRowIndex);
      const y = rowIndex * rowHeight + TOP_PADDING;

      return getAnnotationElement(placedGroup, y, rowIndex === maxRowIndex, i);
    }
    return (
      <svg width={width} height={height} display={"block"}>
        {placements.map(renderAnnotation)}
        <line
          x1={width / 3}
          y1={0}
          x2={width / 3}
          y2={height}
          stroke="black"
          strokeWidth={1}
        />

        <line
          x1={(2 * width) / 3}
          y1={0}
          x2={(2 * width) / 3}
          y2={height}
          stroke="black"
          strokeWidth={1}
        />
      </svg>
    );
  }
  function getAnnotationElement(placedGroup, y, isLastRow, index) {
    return placedGroup.placedFeatures.map((placement, i) => (
      <BedAnnotation
        key={i}
        feature={placement.feature}
        xSpan={placement.xSpan}
        y={y}
        isMinimal={isLastRow}
        color={configOptions.current.color}
        reverseStrandColor={configOptions.current.color2}
        isInvertArrowDirection={placement.isReverse}
        onClick={renderTooltip}
        alwaysDrawLabel={configOptions.current.alwaysDrawLabel}
        hiddenPixels={configOptions.current.hiddenPixels}
      />
    ));
  }
  function bedClickToolTip(feature: any, pageX, pageY, name, onClose) {
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
  }

  function onConfigChange(key, value) {
    if (value === configOptions.current[`${key}`]) {
      return;
    } else if (
      key === "displayMode" &&
      value !== configOptions.current.displayMode
    ) {
      configOptions.current.displayMode = value;

      genomeArr![genomeIdx!].options = configOptions.current;

      const renderer = new BedTrackConfig(genomeArr![genomeIdx!]);

      const items = renderer.getMenuComponents();

      let menu = trackConfigMenu[`${trackModel.type}`]({
        trackIdx,
        handleDelete,
        id,
        pageX: configMenuPos.current.left,
        pageY: configMenuPos.current.top,
        onCloseConfigMenu,
        trackModel,
        configOptions: configOptions.current,
        items,
        onConfigChange,
      });

      getConfigMenu(menu);
    } else {
      configOptions.current[`${key}`] = value;
    }
    setConfigChanged(true);
  }
  function renderConfigMenu(event) {
    event.preventDefault();

    genomeArr![genomeIdx!].options = configOptions.current;

    const renderer = new BedTrackConfig(genomeArr![genomeIdx!]);

    // create object that has key as displayMode and the configmenu component as the value
    const items = renderer.getMenuComponents();
    let menu = trackConfigMenu[`${trackModel.type}`]({
      trackIdx,
      handleDelete,
      id,
      pageX: event.pageX,
      pageY: event.pageY,
      onCloseConfigMenu,
      trackModel,
      configOptions: configOptions.current,
      items,
      onConfigChange,
    });

    getConfigMenu(menu);
    configMenuPos.current = { left: event.pageX, top: event.pageY };
  }
  function renderTooltip(event, feature) {
    const currtooltip = bedClickToolTip(
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

  function getCacheData() {
    let viewData: Array<any> = [];
    let curIdx;
    let hasData = false;
    if (
      useFineModeNav ||
      genomeArr![genomeIdx!].genome._name !== parentGenome.current
    ) {
      if (dataIdx! > rightIdx.current && dataIdx! <= 0) {
        viewData = fetchedDataCache.current[dataIdx!].cacheData;
        curIdx = dataIdx!;
        hasData = true;
      } else if (dataIdx! < leftIdx.current - 1 && dataIdx! > 0) {
        viewData = fetchedDataCache.current[dataIdx! + 1].cacheData;
        curIdx = dataIdx! + 1;
        hasData = true;
      }
    } else {
      if (dataIdx! > rightIdx.current + 1 && dataIdx! <= 0) {
        viewData = [
          fetchedDataCache.current[dataIdx! + 1],
          fetchedDataCache.current[dataIdx!],
          fetchedDataCache.current[dataIdx! - 1],
        ];
        hasData = true;
        curIdx = dataIdx! - 1;
      } else if (dataIdx! < leftIdx.current - 2 && dataIdx! > 0) {
        viewData = [
          fetchedDataCache.current[dataIdx!],
          fetchedDataCache.current[dataIdx! + 1],
          fetchedDataCache.current[dataIdx! + 2],
        ];
        hasData = true;
        curIdx = dataIdx! + 2;
      }
    }
    if (hasData) {
      curRegionData.current = {
        trackState: fetchedDataCache.current[curIdx].trackState,
        deDupcacheDataArr: viewData,
        initial: 0,
      };
      if (
        !useFineModeNav &&
        genomeArr![genomeIdx!].genome._name === parentGenome.current
      ) {
        let cacheDataArray = viewData.map((item) => item.cacheData).flat(1);
        let deDupcacheDataArr = removeDuplicatesWithoutId(cacheDataArray);
        viewData = deDupcacheDataArr;
        curRegionData.current = {
          trackState: fetchedDataCache.current[curIdx].trackState,
          deDupcacheDataArr: viewData,
          initial: 0,
        };

        createSVGOrCanvas(
          fetchedDataCache.current[curIdx].trackState,
          viewData,
          false
        );
      } else {
        createSVGOrCanvas(
          fetchedDataCache.current[curIdx].trackState,
          viewData,
          true
        );
      }
    }
  }
  useEffect(() => {
    if (trackData![`${id}`]) {
      if (useFineModeNav || trackData![`${id}`].metadata.genome !== undefined) {
        const primaryVisData =
          trackData!.trackState.genomicFetchCoord[
            trackData!.trackState.primaryGenName
          ].primaryVisData;

        if (trackData!.trackState.initial === 1) {
          if ("genome" in trackData![`${id}`].metadata) {
            parentGenome.current = trackData![`${id}`].metadata.genome;
          } else {
            parentGenome.current = trackData!.trackState.primaryGenName;
          }
          let visRegion =
            "genome" in trackData![`${id}`].metadata
              ? trackData!.trackState.genomicFetchCoord[
                  trackData![`${id}`].metadata.genome
                ].queryRegion
              : primaryVisData.visRegion;

          const createTrackState = (index: number, side: string) => ({
            initial: index === 1 ? 1 : 0,
            side,
            xDist: 0,

            visRegion: visRegion,
            startWindow: primaryVisData.viewWindow.start,
            visWidth: primaryVisData.visWidth,
          });

          fetchedDataCache.current[rightIdx.current] = {
            cacheData: trackData![`${id}`].result[0],
            trackState: createTrackState(1, "right"),
          };
          rightIdx.current--;

          const curDataArr = fetchedDataCache.current[0].cacheData;
          curRegionData.current = {
            trackState: createTrackState(1, "right"),
            deDupcacheDataArr: curDataArr,
          };

          createSVGOrCanvas(createTrackState(1, "right"), curDataArr, true);
        } else {
          let visRegion;
          if ("genome" in trackData![`${id}`].metadata) {
            visRegion =
              trackData!.trackState.genomicFetchCoord[
                `${trackData![`${id}`].metadata.genome}`
              ].queryRegion;
          } else {
            visRegion = primaryVisData.visRegion;
          }
          let newTrackState = {
            initial: 0,
            side: trackData!.trackState.side,
            xDist: trackData!.trackState.xDist,
            visRegion: visRegion,
            startWindow: primaryVisData.viewWindow.start,
            visWidth: primaryVisData.visWidth,
            useFineModeNav: true,
          };

          if (trackData!.trackState.side === "right") {
            newTrackState["index"] = rightIdx.current;
            fetchedDataCache.current[rightIdx.current] = {
              cacheData: trackData![`${id}`].result,
              trackState: newTrackState,
            };

            rightIdx.current--;

            curRegionData.current = {
              trackState:
                fetchedDataCache.current[rightIdx.current + 1].trackState,
              deDupcacheDataArr:
                fetchedDataCache.current[rightIdx.current + 1].cacheData,
              initial: 0,
            };

            createSVGOrCanvas(
              newTrackState,
              fetchedDataCache.current[rightIdx.current + 1].cacheData,
              true
            );
          } else if (trackData!.trackState.side === "left") {
            trackData!.trackState["index"] = leftIdx.current;
            fetchedDataCache.current[leftIdx.current] = {
              cacheData: trackData![`${id}`].result,
              trackState: newTrackState,
            };

            leftIdx.current++;

            curRegionData.current = {
              trackState:
                fetchedDataCache.current[leftIdx.current - 1].trackState,
              deDupcacheDataArr:
                fetchedDataCache.current[leftIdx.current - 1].cacheData,
              initial: 0,
            };

            createSVGOrCanvas(
              newTrackState,
              fetchedDataCache.current[leftIdx.current - 1].cacheData,
              true
            );
          }
        }
      } else {
        //_________________________________________________________________________________________________________________________________________________
        const primaryVisData =
          trackData!.trackState.genomicFetchCoord[
            `${trackData!.trackState.primaryGenName}`
          ];

        if (trackData!.initial === 1) {
          if ("genome" in trackData![`${id}`].metadata) {
            parentGenome.current = trackData![`${id}`].metadata.genome;
          } else {
            parentGenome.current = trackData!.trackState.primaryGenName;
          }
          const visRegionArr = primaryVisData.initNavLoci.map(
            (item) =>
              new DisplayedRegionModel(
                genomeArr![genomeIdx!].navContext,
                item.start,
                item.end
              )
          );
          let trackState0 = {
            initial: 0,
            side: "left",
            xDist: 0,
            regionNavCoord: visRegionArr[0],
            index: 1,
            startWindow: primaryVisData.primaryVisData.viewWindow.start,
            visWidth: primaryVisData.primaryVisData.visWidth,
          };
          let trackState1 = {
            initial: 1,
            side: "right",
            xDist: 0,
            regionNavCoord: visRegionArr[1],
            index: 0,
            startWindow: primaryVisData.primaryVisData.viewWindow.start,
            visWidth: primaryVisData.primaryVisData.visWidth,
          };
          let trackState2 = {
            initial: 0,
            side: "right",
            xDist: 0,
            regionNavCoord: visRegionArr[2],
            index: -1,
            startWindow: primaryVisData.primaryVisData.viewWindow.start,
            visWidth: primaryVisData.primaryVisData.visWidth,
          };

          fetchedDataCache.current[leftIdx.current] = {
            cacheData: trackData![`${id}`].result[0],
            trackState: trackState0,
          };
          leftIdx.current++;

          fetchedDataCache.current[rightIdx.current] = {
            cacheData: trackData![`${id}`].result[1],
            trackState: trackState1,
          };
          rightIdx.current--;
          fetchedDataCache.current[rightIdx.current] = {
            cacheData: trackData![`${id}`].result[2],
            trackState: trackState2,
          };
          rightIdx.current--;

          let testData = [
            fetchedDataCache.current[1],
            fetchedDataCache.current[0],
            fetchedDataCache.current[-1],
          ];

          let cacheDataArray = testData.map((item) => item.cacheData).flat(1);

          let deDupcacheDataArr = removeDuplicatesWithoutId(cacheDataArray);
          curRegionData.current = {
            trackState: trackState1,
            deDupcacheDataArr,
          };
          createSVGOrCanvas(trackState1, deDupcacheDataArr, false);
        } else {
          let testData: Array<any> = [];
          let newTrackState = {
            ...trackData!.trackState,
            startWindow: primaryVisData.primaryVisData.viewWindow.start,
            visWidth: primaryVisData.primaryVisData.visWidth,
          };
          if (trackData!.trackState.side === "right") {
            trackData!.trackState["index"] = rightIdx.current;
            fetchedDataCache.current[rightIdx.current] = {
              cacheData: trackData![`${id}`].result,
              trackState: newTrackState,
            };
            let currIdx = rightIdx.current + 2;
            for (let i = 0; i < 3; i++) {
              testData.push(fetchedDataCache.current[currIdx]);
              currIdx--;
            }

            rightIdx.current--;
            let cacheDataArray = testData.map((item) => item.cacheData).flat(1);
            let deDupcacheDataArr = removeDuplicatesWithoutId(cacheDataArray);
            curRegionData.current = {
              trackState: newTrackState,
              deDupcacheDataArr,
              initial: 0,
            };
            createSVGOrCanvas(newTrackState, deDupcacheDataArr, false);
          } else if (trackData!.trackState.side === "left") {
            trackData!.trackState["index"] = leftIdx.current;
            fetchedDataCache.current[leftIdx.current] = {
              cacheData: trackData![`${id}`].result,
              trackState: newTrackState,
            };

            let currIdx = leftIdx.current - 2;
            for (let i = 0; i < 3; i++) {
              testData.push(fetchedDataCache.current[currIdx]);
              currIdx++;
            }

            leftIdx.current++;
            let cacheDataArray = testData.map((item) => item.cacheData).flat(1);
            let deDupcacheDataArr = removeDuplicatesWithoutId(cacheDataArray);
            curRegionData.current = {
              trackState: trackData!.trackState,
              deDupcacheDataArr,
              initial: 0,
            };
            createSVGOrCanvas(newTrackState, deDupcacheDataArr, false);
          }
        }
      }
    }
  }, [trackData]);
  useEffect(() => {
    if (configChanged === true) {
      if (
        !useFineModeNav &&
        genomeArr![genomeIdx!].genome._name === parentGenome.current
      ) {
        createSVGOrCanvas(
          curRegionData.current.trackState,
          curRegionData.current.deDupcacheDataArr,
          false
        );
      } else {
        createSVGOrCanvas(
          curRegionData.current.trackState,
          curRegionData.current.deDupcacheDataArr,
          true
        );
      }
    }
    setConfigChanged(false);
  }, [configChanged]);
  useEffect(() => {
    //when dataIDx and rightRawData.current equals we have a new data since rightRawdata.current didn't have a chance to push new data yet
    //so this is for when there atleast 3 raw data length, and doesn't equal rightRawData.current length, we would just use the lastest three newest vaLUE
    // otherwise when there is new data cuz the user is at the end of the track
    getCacheData();
  }, [dataIdx]);

  return (
    //svg allows overflow to be visible x and y but the div only allows x overflow, so we need to set the svg to overflow x and y and then limit it in div its container.

    <div
      style={{
        display: "flex",

        flexDirection: "column",
      }}
      onContextMenu={renderConfigMenu}
    >
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
              borderTop: "1px solid Dodgerblue",
              borderBottom: "1px solid Dodgerblue",
              position: "absolute",
              lineHeight: 0,
              right: side === "left" ? `${xPos.current}px` : "",
              left: side === "right" ? `${xPos.current}px` : "",
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
                borderTop: "1px solid Dodgerblue",
                borderBottom: "1px solid Dodgerblue",
                position: "absolute",
                backgroundColor: configOptions.current.backgroundColor,
                left: side === "right" ? `${xPos.current}px` : "",
                right: side === "left" ? `${xPos.current}px` : "",
              }}
            >
              {canvasComponents}
            </div>
          </div>
        )}

        {toolTipVisible ? toolTip : ""}
      </div>
    </div>
  );
});

export default memo(BedTrack);
