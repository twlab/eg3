import React, { memo } from "react";
import { useEffect, useRef, useState } from "react";
import { TrackProps } from "../../models/trackModels/trackProps";
import FeatureArranger, {
  PlacedFeatureGroup,
} from "../../models/FeatureArranger";
import Gene from "../../models/Gene";
import GeneAnnotationScaffold from "./geneAnnotationTrack/GeneAnnotationScaffold";
import GeneAnnotation from "./geneAnnotationTrack/GeneAnnotation";
import { SortItemsOptions } from "../../models/SortItemsOptions";
import OpenInterval from "../../models/OpenInterval";
import NumericalTrack from "./commonComponents/numerical/NumericalTrack";
import { MenuTitle, RemoveOption } from "../../trackConfigs/TrackContextMenu";
import ReactDOM from "react-dom";
import { Manager, Popper, Reference } from "react-popper";
import OutsideClickDetector from "./commonComponents/OutsideClickDetector";
import { removeDuplicates } from "./commonComponents/check-obj-dupe";
import GeneDetail from "./geneAnnotationTrack/GeneDetail";
import DisplayedRegionModel from "../../models/DisplayedRegionModel";
import "./TrackContextMenu.css";
import { GeneAnnotationTrackConfig } from "../../trackConfigs/GeneAnnotationTrackConfig";
import { DEFAULT_OPTIONS as defaultGeneAnnotationTrack } from "./geneAnnotationTrack/GeneAnnotation";
import { DEFAULT_OPTIONS as defaultNumericalTrack } from "./commonComponents/numerical/NumericalTrack";
import { DEFAULT_OPTIONS as defaultAnnotationTrack } from "../../trackConfigs/AnnotationTrackConfig";

import { v4 as uuidv4 } from "uuid";

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
  dragXDist,
  trackModel,
  dataIdx,
  getConfigMenu,
  onCloseConfigMenu,
  handleDelete,
  trackIdx,
  id,
  visData,
}) {
  const configOptions = useRef(DEFAULT_OPTIONS);

  const rightIdx = useRef(0);
  const leftIdx = useRef(1);
  const fetchedDataCache = useRef<{ [key: string]: any }>({});
  const prevDataIdx = useRef(0);
  const xPos = useRef(0);
  const curRegionData = useRef<{ [key: string]: any }>({});
  const svgHeight = useRef(DEFAULT_OPTIONS.height);

  const configMenuPos = useRef<{ [key: string]: any }>({});
  const [svgComponents, setSvgComponents] = useState<Array<any>>([]);
  const [canvasComponents, setCanvasComponents] = useState<Array<any>>([]);
  const [toolTip, setToolTip] = useState<any>();
  const [toolTipVisible, setToolTipVisible] = useState(false);
  const newTrackWidth = useRef(visData);
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
  function createSVGOrCanvas(curTrackData, genesArr) {
    console.log(visData!, visData?.viewWindow.start!, curTrackData!.xDist);
    newTrackWidth.current = visData;
    if (curTrackData.index === 0) {
      xPos.current = -visData?.viewWindow.start!;
    } else if (curTrackData.side === "right") {
      xPos.current =
        (Math.floor(curTrackData!.xDist / visData?.viewWindow.start!) - 1) *
        visData?.viewWindow.start!;
    } else if (curTrackData.side === "left") {
      xPos.current = curTrackData!.xDis;
      console.log(xPos.current - newTrackWidth.current!.viewWindow.start);
    }
    let currDisplayNav;
    let sortType;
    if (curTrackData!.side === "right") {
      currDisplayNav = new DisplayedRegionModel(
        visData!.visRegion._navContext,
        visData!.visRegion._startBase!,

        visData!.visRegion._endBase!
      );

      sortType = SortItemsOptions.NOSORT;
    } else if (curTrackData.side === "left") {
      // newest navcoord and region are the lastest so to get the correct navcoords for previous two region
      // for left we subtract the endbase by 2 times
      currDisplayNav = new DisplayedRegionModel(
        visData!.visRegion._navContext,
        visData!.visRegion._startBase!,

        visData!.visRegion._endBase!
      );
      sortType = SortItemsOptions.NONE;
    }

    let algoData = genesArr.map((record) => new Gene(record));
    let featureArrange = new FeatureArranger();

    //_
    if (configOptions.current.displayMode === "full") {
      let placeFeatureData = featureArrange.arrange(
        algoData,
        currDisplayNav,
        visData!.visWidth,
        getGenePadding,
        configOptions.current.hiddenPixels,
        sortType
      );

      const height = getHeight(placeFeatureData.numRowsAssigned);
      let svgDATA = createFullVisualizer(
        placeFeatureData.placements,
        visData!.visWidth,
        height,
        ROW_HEIGHT,
        configOptions.current.maxRows,
        configOptions.current
      );

      setSvgComponents([...[svgDATA]]);

      svgHeight.current = height;
    }

    //_________________________________________________________________________________________density
    else if (configOptions.current.displayMode === "density") {
      let tmpObj = { ...configOptions.current };
      tmpObj.displayMode = "auto";
      let canvasElements = (
        <NumericalTrack
          data={algoData}
          options={tmpObj}
          viewWindow={new OpenInterval(0, windowWidth * 3)}
          viewRegion={currDisplayNav}
          width={windowWidth * 3}
          forceSvg={false}
          trackModel={trackModel}
        />
      );

      setCanvasComponents([...[canvasElements]]);
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
      <svg width={width} height={height}>
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

      let configsOptions = renderer.getMenuComponents();
      // create object that has key as displayMode and the configmenu component as the value
      const items = [...configsOptions];

      let menu = ReactDOM.createPortal(
        <Manager>
          <Reference>
            {({ ref }) => (
              <div
                ref={ref}
                style={{
                  position: "absolute",
                  left: configMenuPos.current.pageX,
                  top: configMenuPos.current.pageY,
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
                  position: "absolute",
                  zIndex: 1000,
                }}
              >
                <OutsideClickDetector onOutsideClick={onCloseConfigMenu}>
                  <div className="TrackContextMenu-body">
                    <MenuTitle
                      title={trackModel.getDisplayLabel()}
                      numTracks={trackIdx}
                    />
                    {items.map((MenuComponent, index) => (
                      <MenuComponent
                        key={index}
                        defaultValue={
                          index !== 2 && index !== 7 && index !== 0
                            ? configOptions.current.displayMode
                            : 0
                        }
                        optionsObjects={[configOptions.current]}
                        onOptionSet={onConfigChange}
                      />
                    ))}
                    <RemoveOption onClick={handleDelete} numTracks={trackIdx} />
                  </div>
                </OutsideClickDetector>
              </div>
            )}
          </Popper>
        </Manager>,
        document.body
      );

      getConfigMenu(menu);
      setConfigChanged(true);
    } else {
      configOptions.current[`${key}`] = value;
      setConfigChanged(true);
    }
  }
  function renderConfigMenu(event) {
    event.preventDefault();

    genomeArr![genomeIdx!].options = configOptions.current;

    const renderer = new GeneAnnotationTrackConfig(genomeArr![genomeIdx!]);

    let configsOptions = renderer.getMenuComponents();
    // create object that has key as displayMode and the configmenu component as the value
    const items = [...configsOptions];

    let menu = ReactDOM.createPortal(
      <Manager>
        <Reference>
          {({ ref }) => (
            <div
              ref={ref}
              style={{
                position: "absolute",
                left: event.pageX,
                top: event.pageY,
              }}
            />
          )}
        </Reference>
        <Popper
          placement="top-start"
          modifiers={[
            {
              name: "flip",
              options: {
                fallbackPlacements: ["bottom-start", "top-start"],
              },
            },
          ]}
        >
          {({ ref, style, placement, arrowProps }) => (
            <div
              ref={ref}
              style={{
                ...style,
                position: "absolute",
                zIndex: 1000,
              }}
            >
              <OutsideClickDetector onOutsideClick={onCloseConfigMenu}>
                <div className="TrackContextMenu-body">
                  <MenuTitle
                    title={trackModel.getDisplayLabel()}
                    numTracks={trackIdx}
                  />
                  {items.map((MenuComponent, index) => (
                    <MenuComponent
                      key={index}
                      optionsObjects={[configOptions.current]}
                      defaultValue={
                        index !== 2 && index !== 7
                          ? index !== 0
                            ? configOptions.current.displayMode
                            : trackModel.name
                          : 0
                      }
                      onOptionSet={onConfigChange}
                    />
                  ))}
                  <RemoveOption onClick={handleDelete} numTracks={trackIdx} />
                </div>
              </OutsideClickDetector>
            </div>
          )}
        </Popper>
      </Manager>,
      document.body
    );

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

    if (dataIdx! !== rightIdx.current && dataIdx! <= 0) {
      if (prevDataIdx.current > dataIdx!) {
        viewData = [
          fetchedDataCache[dataIdx! + 2],
          fetchedDataCache[dataIdx! + 1],
          fetchedDataCache[dataIdx!],
        ];

        curIdx = dataIdx!;
      } else if (prevDataIdx.current < dataIdx!) {
        viewData = [
          fetchedDataCache[dataIdx! + 1],
          fetchedDataCache[dataIdx!],
          fetchedDataCache[dataIdx! - 1],
        ];

        curIdx = dataIdx! - 1;
        curIdx = dataIdx!;
      }
    } else if (dataIdx! !== leftIdx.current && dataIdx! > 0) {
      if (prevDataIdx.current < dataIdx!) {
        viewData = [
          fetchedDataCache[dataIdx! - 2],
          fetchedDataCache[dataIdx! - 1],
          fetchedDataCache[dataIdx!],
        ];

        curIdx = dataIdx!;
      } else if (prevDataIdx.current > dataIdx!) {
        viewData = [
          fetchedDataCache[dataIdx! - 1],
          fetchedDataCache[dataIdx!],
          fetchedDataCache[dataIdx! + 1],
        ];

        curIdx = dataIdx! + 1;
      }
    }
    if (viewData.length > 0) {
      let refGenesArray = viewData.map((item) => item.refGenes).flat(1);
      let deDupRefGenesArr = removeDuplicates(refGenesArray);
      curRegionData.current = {
        trackState: fetchedDataCache[curIdx].trackState,
        deDupRefGenesArr,
        initial: 0,
      };
      createSVGOrCanvas(fetchedDataCache[curIdx].trackState, deDupRefGenesArr);
    }
    prevDataIdx.current = dataIdx!;
  }
  useEffect(() => {
    if (trackData![`${id}`]) {
      if (trackData!.initial === 1) {
        let trackState0 = {
          initial: 0,
          side: "left",
          xDist: 0,
          regionNavCoord: new DisplayedRegionModel(
            genomeArr![genomeIdx!].navContext,
            trackData![`${id}`][0].navLoci.start,
            trackData![`${id}`][0].navLoci.end
          ),
          index: 1,
        };
        let trackState1 = {
          initial: 1,
          side: "right",
          xDist: 0,
          regionNavCoord: trackData!.regionNavCoord,
          index: 0,
        };
        let trackState2 = {
          initial: 0,
          side: "right",
          xDist: 0,
          regionNavCoord: new DisplayedRegionModel(
            genomeArr![genomeIdx!].navContext,
            trackData![`${id}`][2].navLoci.start,
            trackData![`${id}`][2].navLoci.end
          ),
          index: -1,
        };

        fetchedDataCache[leftIdx.current] = {
          refGenes: trackData![`${id}`][0].fetchData,
          trackState: trackState0,
        };
        leftIdx.current++;

        fetchedDataCache[rightIdx.current] = {
          refGenes: trackData![`${id}`][1].fetchData,
          trackState: trackState1,
        };
        rightIdx.current--;
        fetchedDataCache[rightIdx.current] = {
          refGenes: trackData![`${id}`][2].fetchData,
          trackState: trackState2,
        };
        rightIdx.current--;

        let testData = [
          fetchedDataCache[1],
          fetchedDataCache[0],
          fetchedDataCache[-1],
        ];

        let refGenesArray = testData.map((item) => item.refGenes).flat(1);

        let deDupRefGenesArr = removeDuplicates(refGenesArray);
        curRegionData.current = {
          trackState: trackState1,
          deDupRefGenesArr,
        };
        createSVGOrCanvas(trackState1, deDupRefGenesArr);
      } else {
        let testData: Array<any> = [];
        if (trackData!.trackState.side === "right") {
          trackData!.trackState["index"] = rightIdx.current;
          fetchedDataCache[rightIdx.current] = {
            refGenes: trackData![`${id}`],
            trackState: trackData!.trackState,
          };
          let currIdx = rightIdx.current + 2;
          for (let i = 0; i < 3; i++) {
            testData.push(fetchedDataCache[currIdx]);
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
          createSVGOrCanvas(trackData!.trackState, deDupRefGenesArr);
        } else if (trackData!.trackState.side === "left") {
          trackData!.trackState["index"] = leftIdx.current;
          fetchedDataCache[leftIdx.current] = {
            refGenes: trackData![`${id}`],
            trackState: trackData!.trackState,
          };
          let currIdx = leftIdx.current - 2;
          for (let i = 0; i < 3; i++) {
            testData.push(fetchedDataCache[currIdx]);
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

          createSVGOrCanvas(trackData!.trackState, deDupRefGenesArr);
        }
      }
    }
  }, [trackData]);

  useEffect(() => {
    if (configChanged === true) {
      createSVGOrCanvas(
        curRegionData.current.trackState,
        curRegionData.current.deDupRefGenesArr
      );
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
          height:
            configOptions.current.displayMode === "full"
              ? svgHeight.current
              : configOptions.current.height,
          position: "relative",
        }}
      >
        {configOptions.current.displayMode === "full" ? (
          <div
            style={{
              borderTop: "1px solid Dodgerblue", // Set your desired border color for the child
              borderBottom: "1px solid Dodgerblue", // Set your desired border
              position: "absolute",
              height: svgHeight.current,
              right:
                side === "left"
                  ? `${
                      xPos.current! - newTrackWidth.current!.viewWindow.start
                    }px`
                  : "",
              // right: side === "left" ? `${xPos.current}px` : "",
              left: side === "right" ? `${xPos.current}px` : "",
              backgroundColor: configOptions.current.backgroundColor,
            }}
          >
            {svgComponents.map((item, index) => (
              <div key={index}>{item}</div>
            ))}
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
                borderTop: "1px solid Dodgerblue", // Set your desired border color for the child
                borderBottom: "1px solid Dodgerblue", // Set your desired border
                position: "absolute",
                backgroundColor: configOptions.current.backgroundColor,
                right:
                  side === "left"
                    ? `${
                        xPos.current! - newTrackWidth.current!.viewWindow.start
                      }px`
                    : "",
                left: side === "right" ? `${xPos.current}px` : "",
                // right: side === "left" ? `${xPos.current}px` : "",
              }}
            >
              {canvasComponents.map((item, index) => (
                <div key={index}>{item}</div>
              ))}
            </div>
          </div>
        )}

        {toolTipVisible ? toolTip : ""}
      </div>
    </div>
  );
});

export default memo(RefGeneTrack);
