import React, { memo } from "react";
import { useEffect, useRef, useState } from "react";
import { TrackProps } from "../../models/trackModels/trackProps";
import { objToInstanceAlign } from "./TrackManager";
import FeatureArranger, {
  PlacedFeatureGroup,
} from "../../models/FeatureArranger";
import Gene from "../../models/Gene";
import GeneAnnotationScaffold from "./geneAnnotationTrack/GeneAnnotationScaffold";
import GeneAnnotation from "./geneAnnotationTrack/GeneAnnotation";
import { SortItemsOptions } from "../../models/SortItemsOptions";
import OpenInterval from "../../models/OpenInterval";
import NumericalTrack from "./commonComponents/numerical/NumericalTrack";
import { bpNavToGenNav } from "./TrackManager";
import ReactDOM from "react-dom";
import { Manager, Popper, Reference } from "react-popper";
import OutsideClickDetector from "./commonComponents/OutsideClickDetector";
import { removeDuplicates } from "./commonComponents/check-obj-dupe";
import GeneDetail from "./geneAnnotationTrack/GeneDetail";
import "./TrackContextMenu.css";
import { GeneAnnotationTrackConfig } from "../../trackConfigs/config-menu-models.tsx/GeneAnnotationTrackConfig";
import { DEFAULT_OPTIONS as defaultGeneAnnotationTrack } from "./geneAnnotationTrack/GeneAnnotation";
import { DEFAULT_OPTIONS as defaultNumericalTrack } from "./commonComponents/numerical/NumericalTrack";
import { DEFAULT_OPTIONS as defaultAnnotationTrack } from "../../trackConfigs/config-menu-models.tsx/AnnotationTrackConfig";
import trackConfigMenu from "../../trackConfigs/config-menu-components.tsx/TrackConfigMenu";
import { v4 as uuidv4 } from "uuid";
import DisplayedRegionModel from "../../models/DisplayedRegionModel";

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
    if (curTrackData.index === 0) {
      xPos.current = fine ? -curTrackData.startWindow : -windowWidth;
    } else if (curTrackData.side === "right") {
      xPos.current = fine
        ? -curTrackData.xDist - curTrackData.startWindow
        : (Math.floor(-curTrackData.xDist / windowWidth) - 1) * windowWidth;
    } else if (curTrackData.side === "left") {
      xPos.current = fine
        ? curTrackData.xDist - curTrackData.startWindow
        : (Math.floor(curTrackData.xDist / windowWidth) - 1) * windowWidth;
    }

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

    let algoData = genesArr.map((record) => new Gene(record));
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
    const gene = placedGroup.feature;

    return (
      <GeneAnnotationScaffold
        key={uuidv4()}
        gene={gene}
        xSpan={placedGroup.xSpan}
        viewWindow={new OpenInterval(0, windowWidth * 3)}
        y={y}
        isMinimal={isLastRow}
        options={configOptions.current}
        onClick={renderTooltip}
      >
        {placedGroup.placedFeatures.map((placedGene, i) => (
          <GeneAnnotation
            key={i}
            placedGene={placedGene}
            y={y}
            options={configOptions.current}
          />
        ))}
      </GeneAnnotationScaffold>
    );
  }
  function refGeneClickTooltip(gene: any, pageX, pageY, name, onClose) {
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
                <GeneDetail
                  gene={gene}
                  collectionName={name}
                  queryEndpoint={{}}
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

  function onConfigChange(key, value) {
    if (value === configOptions.current[`${key}`]) {
      return;
    } else if (
      key === "displayMode" &&
      value !== configOptions.current.displayMode
    ) {
      configOptions.current.displayMode = value;

      genomeArr![genomeIdx!].options = configOptions.current;

      const renderer = new GeneAnnotationTrackConfig(genomeArr![genomeIdx!]);

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

    const renderer = new GeneAnnotationTrackConfig(genomeArr![genomeIdx!]);

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
  function renderTooltip(event, gene) {
    const currtooltip = refGeneClickTooltip(
      gene,
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

    if (
      useFineModeNav ||
      genomeArr![genomeIdx!].genome._name !== parentGenome.current
    ) {
      if (dataIdx! !== rightIdx.current && dataIdx! <= 0) {
        if (dataIdx === 1) {
          dataIdx = 0;
        }
        viewData = fetchedDataCache.current[dataIdx!].refGenes;
        curIdx = dataIdx!;
      } else if (dataIdx! !== leftIdx.current && dataIdx! > 0) {
        if (dataIdx === 1) {
          dataIdx = 0;
        }
        viewData = fetchedDataCache.current[dataIdx!].refGenes;
        curIdx = dataIdx!;
      }
    } else {
      if (dataIdx! !== rightIdx.current && dataIdx! <= 0) {
        if (prevDataIdx.current > dataIdx!) {
          viewData = [
            fetchedDataCache.current[dataIdx! + 2],
            fetchedDataCache.current[dataIdx! + 1],
            fetchedDataCache.current[dataIdx!],
          ];

          curIdx = dataIdx!;
        } else if (prevDataIdx.current < dataIdx!) {
          viewData = [
            fetchedDataCache.current[dataIdx! + 1],
            fetchedDataCache.current[dataIdx!],
            fetchedDataCache.current[dataIdx! - 1],
          ];

          curIdx = dataIdx! - 1;
          curIdx = dataIdx!;
        }
      } else if (dataIdx! !== leftIdx.current && dataIdx! > 0) {
        if (prevDataIdx.current < dataIdx!) {
          viewData = [
            fetchedDataCache.current[dataIdx!],
            fetchedDataCache.current[dataIdx! - 1],
            fetchedDataCache.current[dataIdx! - 2],
          ];

          curIdx = dataIdx!;
        } else if (prevDataIdx.current > dataIdx!) {
          viewData = [
            fetchedDataCache.current[dataIdx! + 1],
            fetchedDataCache.current[dataIdx!],

            fetchedDataCache.current[dataIdx! - 1],
          ];

          curIdx = dataIdx! + 1;
        }
      }
    }
    if (viewData.length > 0) {
      if (
        !useFineModeNav &&
        genomeArr![genomeIdx!].genome._name === parentGenome.current
      ) {
        let refGenesArray = viewData.map((item) => item.refGenes).flat(1);
        let deDupRefGenesArr = removeDuplicates(refGenesArray);
        viewData = deDupRefGenesArr;
        curRegionData.current = {
          trackState: fetchedDataCache.current[curIdx].trackState,
          deDupRefGenesArr: viewData,
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
      if (useFineModeNav || "genome" in trackData![`${id}`].metadata) {
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
          let visRegionArr =
            "genome" in trackData![`${id}`].metadata
              ? trackData!.trackState.genomicFetchCoord[
                  trackData![`${id}`].metadata.genome
                ].queryRegion
              : primaryVisData.map((item) => item.visRegion);

          const createTrackState = (index: number, side: string) => ({
            initial: index === 1 ? 1 : 0,
            side,
            xDist: 0,

            visRegion: visRegionArr[index],
            startWindow: primaryVisData[index].viewWindow.start,
            visWidth: primaryVisData[index].visWidth,
          });

          fetchedDataCache.current[leftIdx.current] = {
            refGenes: trackData![`${id}`].result[0].fetchData,
            trackState: createTrackState(0, "left"),
          };
          leftIdx.current++;

          fetchedDataCache.current[rightIdx.current] = {
            refGenes: trackData![`${id}`].result[1].fetchData,
            trackState: createTrackState(1, "right"),
          };
          rightIdx.current--;

          fetchedDataCache.current[rightIdx.current] = {
            refGenes: trackData![`${id}`].result[2].fetchData,
            trackState: createTrackState(2, "right"),
          };
          rightIdx.current--;

          const curDataArr = fetchedDataCache.current[0].refGenes;
          curRegionData.current = {
            trackState: createTrackState(1, "right"),
            deDupRefGenesArr: curDataArr,
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
              refGenes: trackData![`${id}`].result,
              trackState: newTrackState,
            };

            rightIdx.current--;

            curRegionData.current = {
              trackState:
                fetchedDataCache.current[rightIdx.current + 1].trackState,
              deDupRefGenesArr:
                fetchedDataCache.current[rightIdx.current + 1].refGenes,
              initial: 0,
            };

            createSVGOrCanvas(
              newTrackState,
              fetchedDataCache.current[rightIdx.current + 1].refGenes,
              true
            );
          } else if (trackData!.trackState.side === "left") {
            trackData!.trackState["index"] = leftIdx.current;
            fetchedDataCache.current[leftIdx.current] = {
              refGenes: trackData![`${id}`].result,
              trackState: newTrackState,
            };

            leftIdx.current++;

            curRegionData.current = {
              trackState:
                fetchedDataCache.current[leftIdx.current - 1].trackState,
              deDupRefGenesArr:
                fetchedDataCache.current[leftIdx.current - 1].refGenes,
              initial: 0,
            };

            createSVGOrCanvas(
              newTrackState,
              fetchedDataCache.current[leftIdx.current - 1].refGenes,
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
          };
          let trackState1 = {
            initial: 1,
            side: "right",
            xDist: 0,
            regionNavCoord: visRegionArr[1],
            index: 0,
          };
          let trackState2 = {
            initial: 0,
            side: "right",
            xDist: 0,
            regionNavCoord: visRegionArr[2],
            index: -1,
          };

          fetchedDataCache.current[leftIdx.current] = {
            refGenes: trackData![`${id}`].result[0].fetchData,
            trackState: trackState0,
          };
          leftIdx.current++;

          fetchedDataCache.current[rightIdx.current] = {
            refGenes: trackData![`${id}`].result[1].fetchData,
            trackState: trackState1,
          };
          rightIdx.current--;
          fetchedDataCache.current[rightIdx.current] = {
            refGenes: trackData![`${id}`].result[2].fetchData,
            trackState: trackState2,
          };
          rightIdx.current--;

          let testData = [
            fetchedDataCache.current[1],
            fetchedDataCache.current[0],
            fetchedDataCache.current[-1],
          ];

          let refGenesArray = testData.map((item) => item.refGenes).flat(1);

          let deDupRefGenesArr = removeDuplicates(refGenesArray);
          curRegionData.current = {
            trackState: trackState1,
            deDupRefGenesArr,
          };
          createSVGOrCanvas(trackState1, deDupRefGenesArr, false);
        } else {
          let testData: Array<any> = [];

          if (trackData!.trackState.side === "right") {
            trackData!.trackState["index"] = rightIdx.current;
            fetchedDataCache.current[rightIdx.current] = {
              refGenes: trackData![`${id}`].result,
              trackState: trackData!.trackState,
            };
            let currIdx = rightIdx.current + 2;
            for (let i = 0; i < 3; i++) {
              testData.push(fetchedDataCache.current[currIdx]);
              currIdx--;
            }

            rightIdx.current--;
            let refGenesArray = testData.map((item) => item.refGenes).flat(1);
            let deDupRefGenesArr = removeDuplicates(refGenesArray);
            curRegionData.current = {
              trackState: trackData!.trackState,
              deDupRefGenesArr,
              initial: 0,
            };
            createSVGOrCanvas(trackData!.trackState, deDupRefGenesArr, false);
          } else if (trackData!.trackState.side === "left") {
            trackData!.trackState["index"] = leftIdx.current;
            fetchedDataCache.current[leftIdx.current] = {
              refGenes: trackData![`${id}`].result,
              trackState: trackData!.trackState,
            };

            let currIdx = leftIdx.current - 2;
            for (let i = 0; i < 3; i++) {
              testData.push(fetchedDataCache.current[currIdx]);
              currIdx++;
            }

            leftIdx.current++;
            let refGenesArray = testData.map((item) => item.refGenes).flat(1);
            let deDupRefGenesArr = removeDuplicates(refGenesArray);
            curRegionData.current = {
              trackState: trackData!.trackState,
              deDupRefGenesArr,
              initial: 0,
            };
            createSVGOrCanvas(trackData!.trackState, deDupRefGenesArr, false);
          }
        }
      }
    }
  }, [trackData]);

  useEffect(() => {
    if (configChanged === true) {
      if (!useFineModeNav) {
        createSVGOrCanvas(
          curRegionData.current.trackState,
          curRegionData.current.deDupRefGenesArr,
          false
        );
      } else {
        createSVGOrCanvas(
          curRegionData.current.trackState,
          curRegionData.current.deDupRefGenesArr,
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

export default memo(RefGeneTrack);
