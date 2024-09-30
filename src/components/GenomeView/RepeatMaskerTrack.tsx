import React, { memo } from "react";
import { useEffect, useRef, useState } from "react";
import { TrackProps } from "../../models/trackModels/trackProps";
import { objToInstanceAlign } from "./TrackManager";
import FeatureArranger, {
  PlacedFeatureGroup,
} from "../../models/FeatureArranger";
import { SortItemsOptions } from "../../models/SortItemsOptions";
import OpenInterval from "../../models/OpenInterval";
import ReactDOM from "react-dom";
import { Manager, Popper, Reference } from "react-popper";
import OutsideClickDetector from "./commonComponents/OutsideClickDetector";
import { removeDuplicates } from "./commonComponents/check-obj-dupe";

import "./TrackContextMenu.css";
import { RepeatMaskerTrackConfig } from "../../trackConfigs/config-menu-models.tsx/RepeatMaskerTrackConfig";

import { DEFAULT_OPTIONS as defaultAnnotationTrack } from "../../trackConfigs/config-menu-models.tsx/AnnotationTrackConfig";
import trackConfigMenu from "../../trackConfigs/config-menu-components.tsx/TrackConfigMenu";
import { v4 as uuidv4 } from "uuid";
import DisplayedRegionModel from "../../models/DisplayedRegionModel";
import Feature from "../../models/Feature";
import { getContrastingColor } from "../../models/util";
import { AnnotationDisplayModes } from "../../trackConfigs/config-menu-models.tsx/DisplayModes";
import { RepeatMaskerFeature } from "../../models/RepeatMaskerFeature";
import BackgroundedText from "./geneAnnotationTrackComponents/BackgroundedText";
import AnnotationArrows from "./commonComponents/annotation/AnnotationArrows";
import { TranslatableG } from "./geneAnnotationTrackComponents/TranslatableG";
import { scaleLinear } from "d3-scale";
import NumericalTrack from "./commonComponents/numerical/NumericalTrack";
const BACKGROUND_COLOR = "rgba(173, 216, 230, 0.9)"; // lightblue with opacity adjustment
export const MAX_BASES_PER_PIXEL = 1000; // The higher this number, the more zooming out we support
const ARROW_SIZE = 16;
const TEXT_HEIGHT = 9; // height for both text label and arrows.
export const DEFAULT_OPTIONS = {
  ...defaultAnnotationTrack,
  maxRows: 1,
  height: 40,
  categoryColors: RepeatMaskerFeature.DEFAULT_CLASS_COLORS,
  displayMode: AnnotationDisplayModes.FULL,
  hiddenPixels: 0.5,
  backgroundColor: "var(--bg-color)",
  alwaysDrawLabel: true,
};

export interface RepeatDASFeature {
  genoLeft: string;
  label: string;
  max: number;
  milliDel: string;
  milliDiv: string;
  milliIns: string;
  min: number;
  orientation: string;
  repClass: string;
  repEnd: string;
  repFamily: string;
  repLeft: string;
  repStart: string;
  score: number;
  segment: string;
  swScore: string;
  type: string;
  _chromId: number;
}
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

const RepeatMaskerTrack: React.FC<TrackProps> = memo(
  function RepeatMaskerTrack({
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
    const [toolTip, setToolTip] = useState<any>();
    const [toolTipVisible, setToolTipVisible] = useState(false);
    const newTrackWidth = useRef(windowWidth);
    const [configChanged, setConfigChanged] = useState(false);
    const [canvasComponents, setCanvasComponents] = useState<any>();
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

      let rawDataArr: Array<RepeatDASFeature> = [];
      genesArr.map((record) => {
        const regexMatch = record["rest"].match(
          /([\w.]+)\W+(\d+)\W+(\d+)\W+(\d+)/
        );

        if (regexMatch) {
          const restValues = record["rest"].split("\t");
          const output: RepeatDASFeature = {
            genoLeft: restValues[7],
            label: restValues[0],
            max: record.end,
            milliDel: restValues[5],
            milliDiv: restValues[4],
            milliIns: restValues[6],
            min: record.start,
            orientation: restValues[2],
            repClass: restValues[8],
            repEnd: restValues[11],
            repFamily: restValues[9],
            repLeft: restValues[12],
            repStart: restValues[10],
            score: Number(restValues[1]),
            segment: record.chr,
            swScore: restValues[3],
            type: "bigbed",
            _chromId: record.chromId,
          };

          rawDataArr.push(output);
        } else {
          console.error(
            `${record[3]} not formated correctly in  REPEATMASKER track`
          );
        }
      });

      let algoData = rawDataArr.map(
        (feature) => new RepeatMaskerFeature(feature)
      );

      let currDisplayNav;
      let sortType = SortItemsOptions.NOSORT;

      if (!fine) {
        if (curTrackData.initial === 1) {
          currDisplayNav = new DisplayedRegionModel(
            curTrackData.regionNavCoord._navContext,
            curTrackData.regionNavCoord._startBase -
              (curTrackData.regionNavCoord._endBase -
                curTrackData.regionNavCoord._startBase),
            curTrackData.regionNavCoord._endBase +
              (curTrackData.regionNavCoord._endBase -
                curTrackData.regionNavCoord._startBase)
          );
        } else if (curTrackData.side === "right") {
          currDisplayNav = new DisplayedRegionModel(
            curTrackData.regionNavCoord._navContext,
            curTrackData.regionNavCoord._startBase -
              (curTrackData.regionNavCoord._endBase -
                curTrackData.regionNavCoord._startBase) *
                2,
            curTrackData.regionNavCoord._endBase
          );
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

        const height = configOptions.current.height;
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
              new OpenInterval(
                0,
                fine ? curTrackData.visWidth : windowWidth * 3
              )
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

        return getAnnotationElement(
          placedGroup,
          y,
          rowIndex === maxRowIndex,
          i,
          height
        );
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
    function getAnnotationElement(placedGroup, y, isLastRow, index, height) {
      const { categoryColors } = configOptions.current;

      return placedGroup.placedFeatures.map((placement, i) => {
        const { xSpan, feature, isReverse } = placement;
        if (placement.xSpan.getLength <= 0) {
          return null;
        }
        let color;

        if (feature.rgb) {
          color = `rgb(${feature.rgb})`;
        } else {
          const categoryId = feature.getCategoryId();
          color = categoryColors[categoryId];
        }

        const contrastColor = getContrastingColor(color);
        let scale = scaleLinear().domain([1, 0]).range([TOP_PADDING, height]);
        const y = scale(feature.value);
        const drawHeight = height - y;
        const width = xSpan.getLength();
        if (drawHeight <= 0) {
          return null;
        }
        const mainBody = (
          <rect
            x={xSpan.start}
            y={y}
            width={width}
            height={drawHeight}
            fill={color}
            fillOpacity={0.75}
          />
        );
        let label;
        const labelText = feature.getName();
        const estimatedLabelWidth = labelText.length * TEXT_HEIGHT;
        if (estimatedLabelWidth < 0.9 * width) {
          const centerX = xSpan.start + 0.5 * width;
          const centerY = height - TEXT_HEIGHT * 2;
          label = (
            <BackgroundedText
              x={centerX}
              y={centerY}
              height={TEXT_HEIGHT - 1}
              fill={contrastColor}
              dominantBaseline="hanging"
              textAnchor="middle"
            >
              {labelText}
            </BackgroundedText>
          );
        }
        const arrows = (
          <AnnotationArrows
            startX={xSpan.start}
            endX={xSpan.end}
            y={height - TEXT_HEIGHT}
            height={TEXT_HEIGHT}
            opacity={0.75}
            isToRight={isReverse === (feature.strand === "-")}
            color="white"
          />
        );
        return (
          <TranslatableG
            onClick={(event) => renderTooltip(event, feature)}
            key={i}
          >
            {mainBody}
            {arrows}
            {label}
          </TranslatableG>
        );
      });
    }
    function repeatMaskLeftClick(feature: any, pageX, pageY, name, onClose) {
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

        const renderer = new RepeatMaskerTrackConfig(genomeArr![genomeIdx!]);

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

      const renderer = new RepeatMaskerTrackConfig(genomeArr![genomeIdx!]);

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
      const currtooltip = repeatMaskLeftClick(
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

      if (
        useFineModeNav ||
        genomeArr![genomeIdx!].genome._name !== parentGenome.current
      ) {
        if (dataIdx! > rightIdx.current && dataIdx! <= 0) {
          viewData = fetchedDataCache.current[dataIdx!].refGenes;
          curIdx = dataIdx!;
        } else if (dataIdx! < leftIdx.current - 1 && dataIdx! > 0) {
          viewData = fetchedDataCache.current[dataIdx! + 1].refGenes;
          curIdx = dataIdx! + 1;
        }
      } else {
        if (dataIdx! > rightIdx.current + 1 && dataIdx! <= 0) {
          viewData = [
            fetchedDataCache.current[dataIdx! + 1],
            fetchedDataCache.current[dataIdx!],
            fetchedDataCache.current[dataIdx! - 1],
          ];

          curIdx = dataIdx! - 1;
        } else if (dataIdx! < leftIdx.current - 2 && dataIdx! > 0) {
          viewData = [
            fetchedDataCache.current[dataIdx!],
            fetchedDataCache.current[dataIdx! + 1],
            fetchedDataCache.current[dataIdx! + 2],
          ];

          curIdx = dataIdx! + 2;
        }
      }
      if (viewData.length > 0) {
        curRegionData.current = {
          trackState: fetchedDataCache.current[curIdx].trackState,
          deDupRefGenesArr: viewData,
          initial: 0,
        };
        if (
          !useFineModeNav &&
          genomeArr![genomeIdx!].genome._name === parentGenome.current
        ) {
          let refGenesArray = viewData.map((item) => item.refGenes).flat(1);
          let deDupRefGenesArr = removeDuplicates(refGenesArray, "uniqueId");
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
        if (
          useFineModeNav ||
          trackData![`${id}`].metadata.genome !== undefined
        ) {
          const primaryVisData =
            trackData!.trackState.genomicFetchCoord[
              trackData!.trackState.primaryGenName
            ].primaryVisData;

          if (trackData!.trackState.initial === 1) {
            if (trackModel.options) {
              configOptions.current = {
                ...configOptions.current,
                ...trackModel.options,
              };
            }
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
              refGenes: trackData![`${id}`].result[0],
              trackState: createTrackState(1, "right"),
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
            if (trackModel.options) {
              configOptions.current = {
                ...configOptions.current,
                ...trackModel.options,
              };
            }
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
              refGenes: trackData![`${id}`].result[0],
              trackState: trackState0,
            };
            leftIdx.current++;

            fetchedDataCache.current[rightIdx.current] = {
              refGenes: trackData![`${id}`].result[1],
              trackState: trackState1,
            };
            rightIdx.current--;
            fetchedDataCache.current[rightIdx.current] = {
              refGenes: trackData![`${id}`].result[2],
              trackState: trackState2,
            };
            rightIdx.current--;

            let testData = [
              fetchedDataCache.current[1],
              fetchedDataCache.current[0],
              fetchedDataCache.current[-1],
            ];

            let refGenesArray = testData.map((item) => item.refGenes).flat(1);

            let deDupRefGenesArr = removeDuplicates(refGenesArray, "uniqueId");
            curRegionData.current = {
              trackState: trackState1,
              deDupRefGenesArr,
            };
            createSVGOrCanvas(trackState1, deDupRefGenesArr, false);
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
                refGenes: trackData![`${id}`].result,
                trackState: newTrackState,
              };
              let currIdx = rightIdx.current + 2;
              for (let i = 0; i < 3; i++) {
                testData.push(fetchedDataCache.current[currIdx]);
                currIdx--;
              }

              rightIdx.current--;
              let refGenesArray = testData.map((item) => item.refGenes).flat(1);
              let deDupRefGenesArr = removeDuplicates(
                refGenesArray,
                "uniqueId"
              );
              curRegionData.current = {
                trackState: newTrackState,
                deDupRefGenesArr,
                initial: 0,
              };
              createSVGOrCanvas(newTrackState, deDupRefGenesArr, false);
            } else if (trackData!.trackState.side === "left") {
              trackData!.trackState["index"] = leftIdx.current;
              fetchedDataCache.current[leftIdx.current] = {
                refGenes: trackData![`${id}`].result,
                trackState: newTrackState,
              };

              let currIdx = leftIdx.current - 2;
              for (let i = 0; i < 3; i++) {
                testData.push(fetchedDataCache.current[currIdx]);
                currIdx++;
              }

              leftIdx.current++;
              let refGenesArray = testData.map((item) => item.refGenes).flat(1);
              let deDupRefGenesArr = removeDuplicates(
                refGenesArray,
                "uniqueId"
              );
              curRegionData.current = {
                trackState: trackData!.trackState,
                deDupRefGenesArr,
                initial: 0,
              };
              createSVGOrCanvas(newTrackState, deDupRefGenesArr, false);
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
      prevDataIdx.current = dataIdx!;
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
  }
);

export default memo(RepeatMaskerTrack);
