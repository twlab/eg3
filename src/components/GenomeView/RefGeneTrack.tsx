import React, { memo } from "react";
import { useEffect, useRef, useState } from "react";
import { TrackProps } from "../../models/trackModels/trackProps";
import FeatureArranger, {
  PlacedFeatureGroup,
} from "../../models/FeatureArranger";
import Gene from "../../models/Gene";
import { GeneAnnotationScaffold } from "./geneAnnotationTrack/GeneAnnotationScaffold";
import { GeneAnnotation } from "./geneAnnotationTrack/GeneAnnotation";
import { SortItemsOptions } from "../../models/SortItemsOptions";
import OpenInterval from "../../models/OpenInterval";

import { AnnotationDisplayModes } from "./commonComponents/track-context-menu/DisplayModes";
import NumericalTrack from "./commonComponents/numerical/NumericalTrack";
import { AnnotationDisplayModeConfig } from "./commonComponents/track-context-menu/DisplayModeConfig";
import ReactDOM from "react-dom";
import { Manager, Popper, Reference } from "react-popper";
import OutsideClickDetector from "./commonComponents/OutsideClickDetector";
import { removeDuplicates } from "./commonComponents/check-obj-dupe";
import GeneDetail from "./geneAnnotationTrack/GeneDetail";
import DisplayedRegionModel from "../../models/DisplayedRegionModel";
import "./TrackContextMenu.css";
import { GeneAnnotationTrackConfig } from "../../trackConfigs/GeneAnnotationTrackConfig";
const BACKGROUND_COLOR = "rgba(173, 216, 230, 0.9)"; // lightblue with opacity adjustment
const ARROW_SIZE = 16;
interface AnnotationOptions {
  displayMode: any; // Assuming you have an enum or type for AnnotationDisplayModes
  color: string;
  color2: string;
  maxRows: number;
  height?: number; // Optional property for density display mode
  hideMinimalItems: boolean;
  sortItems: boolean;

  backgroundColor: string;
  categoryColors: {
    coding: string;
    protein_coding: string;
    nonCoding: string;
    pseudogene: string;
    pseudo: string;
    problem: string;
    polyA: string;
    other: string;
  };
  hiddenPixels: number;
  italicizeText: boolean;
}
export const DEFAULT_OPTIONS = {
  full: {
    displayMode: AnnotationDisplayModes.FULL,
    color: "blue",
    color2: "red",
    maxRows: 20,
    height: 40, // For density display mode
    hideMinimalItems: false,
    sortItems: false,

    backgroundColor: "var(--bg-color)",
    categoryColors: {
      coding: "rgb(101,1,168)",
      protein_coding: "rgb(101,1,168)",
      nonCoding: "rgb(1,193,75)",
      pseudogene: "rgb(230,0,172)",
      pseudo: "rgb(230,0,172)",
      problem: "rgb(224,2,2)",
      polyA: "rgb(237,127,2)",
      other: "rgb(128,128,128)",
    },
    hiddenPixels: 0.5,
    italicizeText: false,
  },
  density: {
    aggregateMethod: "COUNT",
    displayMode: "auto",
    height: 40,
    color: "blue",
    colorAboveMax: "red",
    color2: "red",
    color2BelowMin: "darkgreen",
    yScale: "auto",
    yMax: 10,
    yMin: 0,
    smooth: 0,
    ensemblStyle: false,
    maxRows: 20,
    hideMinimalItems: false,
    sortItems: false,
    backgroundColor: "var(--bg-color)",
    categoryColors: {
      coding: "rgb(101,1,168)",
      protein_coding: "rgb(101,1,168)",
      nonCoding: "rgb(1,193,75)",
      pseudogene: "rgb(230,0,172)",
      pseudo: "rgb(230,0,172)",
      problem: "rgb(224,2,2)",
      polyA: "rgb(237,127,2)",
      other: "rgb(128,128,128)",
    },
    hiddenPixels: 0.5,
    italicizeText: false,
    label: "refGene",
  },
};

const ROW_VERTICAL_PADDING = 5;
const ROW_HEIGHT = GeneAnnotation.HEIGHT + ROW_VERTICAL_PADDING;

const getGenePadding = (gene) => gene.getName().length * GeneAnnotation.HEIGHT;
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
}) {
  const svgHeight = useRef(DEFAULT_OPTIONS.full.height);
  const rightIdx = useRef(0);
  const leftIdx = useRef(1);
  const fetchedDataCache = useRef<{ [key: string]: any }>({});
  const prevDataIdx = useRef(0);
  const xPos = useRef(0);
  const svgConfig = useRef<{ [key: string]: any }>(DEFAULT_OPTIONS.full);
  const canvasConfig = useRef<{ [key: string]: any }>(DEFAULT_OPTIONS.density);
  const curRegionData = useRef<{ [key: string]: any }>({});
  const displayMode = useRef("full");
  const configMenuPos = useRef<{ [key: string]: any }>({});
  const [svgComponents, setSvgComponents] = useState<Array<any>>([]);
  const [canvasComponents, setCanvasComponents] = useState<Array<any>>([]);
  const [toolTip, setToolTip] = useState<any>();
  const [toolTipVisible, setToolTipVisible] = useState(false);

  const [configChanged, setConfigChanged] = useState(false);

  // These states are used to update the tracks with new fetched data
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track
  function getHeight(numRows: number): number {
    let rowHeight = ROW_HEIGHT;
    let options = DEFAULT_OPTIONS.full;
    let rowsToDraw = Math.min(numRows, options.maxRows);
    if (options.hideMinimalItems) {
      rowsToDraw -= 1;
    }
    if (rowsToDraw < 1) {
      rowsToDraw = 1;
    }
    return rowsToDraw * rowHeight + TOP_PADDING;
  }
  function createSVGOrCanvas(curTrackData, genesArr, initial: number = 0) {
    if (curTrackData.index === 0) {
      xPos.current = -windowWidth;
    } else if (curTrackData.side === "right") {
      xPos.current =
        (Math.floor(-curTrackData!.xDist / windowWidth) - 1) * windowWidth;
    } else if (curTrackData.side === "left") {
      xPos.current =
        (Math.floor(curTrackData!.xDist / windowWidth) - 1) * windowWidth;
    }

    if (curTrackData!.side === "right") {
      let algoData = genesArr.map((record) => new Gene(record));
      let featureArrange = new FeatureArranger();
      // newest navcoord and region are the lastest so to get the correct navcoords for previous two region
      // we have to get coord of prev regions by subtracting of the last region
      let currDisplayNav: DisplayedRegionModel = new DisplayedRegionModel(
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
      if (displayMode.current === "full") {
        let placeFeatureData = featureArrange.arrange(
          algoData,
          currDisplayNav,
          windowWidth * 3,
          getGenePadding,
          DEFAULT_OPTIONS.full.hiddenPixels,
          SortItemsOptions.NONE
        );

        const height = getHeight(placeFeatureData.numRowsAssigned);
        let svgDATA = createFullVisualizer(
          placeFeatureData.placements,
          windowWidth * 3,
          height,
          ROW_HEIGHT,
          DEFAULT_OPTIONS.full.maxRows,
          DEFAULT_OPTIONS.full
        );

        setSvgComponents([...[svgDATA]]);

        svgHeight.current = height;
      }
      //_________________________________________________________________________________________density
      else if (displayMode.current === "density") {
        let canvasElements = (
          <NumericalTrack
            data={algoData}
            options={DEFAULT_OPTIONS.density}
            viewWindow={new OpenInterval(0, windowWidth * 3)}
            viewRegion={currDisplayNav}
            width={windowWidth * 3}
            forceSvg={false}
            trackModel={trackModel}
          />
        );

        setCanvasComponents([...[canvasElements]]);
      }
    } else if (curTrackData.side === "left") {
      let algoData = genesArr.map((record) => new Gene(record));
      let currDisplayNav: DisplayedRegionModel = new DisplayedRegionModel(
        curTrackData.regionNavCoord._navContext,
        curTrackData.regionNavCoord._startBase,

        curTrackData.regionNavCoord._endBase +
          (curTrackData.regionNavCoord._endBase -
            curTrackData.regionNavCoord._startBase) *
            2
      );
      if (displayMode.current === "full") {
        let featureArrange = new FeatureArranger();
        // newest navcoord and region are the lastest so to get the correct navcoords for previous two region
        // we have to get coord of prev regions by subtracting of the last region

        let placeFeatureData = featureArrange.arrange(
          algoData,
          currDisplayNav,
          windowWidth * 3,
          getGenePadding,
          DEFAULT_OPTIONS.full.hiddenPixels,
          SortItemsOptions.NONE
        );

        const height = getHeight(placeFeatureData.numRowsAssigned);
        svgHeight.current = height;
        let svgDATA = createFullVisualizer(
          placeFeatureData.placements,
          windowWidth * 3,
          height,
          ROW_HEIGHT,
          DEFAULT_OPTIONS.full.maxRows,
          DEFAULT_OPTIONS.full
        );

        setSvgComponents([...[svgDATA]]);
      } else if (displayMode.current === "density") {
        let canvasElements = (
          <NumericalTrack
            data={algoData}
            options={DEFAULT_OPTIONS.density}
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
      </svg>
    );
  }
  function getAnnotationElement(placedGroup, y, isLastRow, index) {
    const gene = placedGroup.feature;
    // const { viewWindow, options } = this.props;

    return (
      <GeneAnnotationScaffold
        key={index}
        gene={gene}
        xSpan={placedGroup.xSpan}
        viewWindow={new OpenInterval(0, windowWidth * 3)}
        y={y}
        isMinimal={isLastRow}
        options={DEFAULT_OPTIONS.full}
        onClick={renderTooltip}
      >
        {placedGroup.placedFeatures.map((placedGene, i) => (
          <GeneAnnotation
            key={i}
            placedGene={placedGene}
            y={y}
            options={DEFAULT_OPTIONS.full}
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
    console.log(key, value);
    if (key === "displayMode" && value !== displayMode.current) {
      console.log("huh1", configMenuPos.current);

      displayMode.current = value;

      setConfigChanged(true);
    }
  }
  function renderConfigMenu(event) {
    event.preventDefault();

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
                  {items.map((MenuComponent, index) => (
                    <MenuComponent
                      key={index}
                      optionsObjects={[DEFAULT_OPTIONS.full]}
                      onOptionSet={onConfigChange}
                    />
                  ))}
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
    if (trackData!.refGene) {
      if (trackData!.initial === 1) {
        let trackState0 = {
          initial: 0,
          side: "left",
          xDist: 0,
          regionNavCoord: new DisplayedRegionModel(
            genomeArr![genomeIdx!].navContext,
            trackData!.refGene[0].navLoci.start,
            trackData!.refGene[0].navLoci.end
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
            trackData!.refGene[2].navLoci.start,
            trackData!.refGene[2].navLoci.end
          ),
          index: -1,
        };

        fetchedDataCache[leftIdx.current] = {
          refGenes: trackData!.refGene[0].fetchData,
          trackState: trackState0,
        };
        leftIdx.current++;

        fetchedDataCache[rightIdx.current] = {
          refGenes: trackData!.refGene[1].fetchData,
          trackState: trackState1,
        };
        rightIdx.current--;
        fetchedDataCache[rightIdx.current] = {
          refGenes: trackData!.refGene[2].fetchData,
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
          initial: 1,
        };
        createSVGOrCanvas(trackState1, deDupRefGenesArr, 1);
      } else {
        let testData: Array<any> = [];
        if (trackData!.trackState.side === "right") {
          trackData!.trackState["index"] = rightIdx.current;
          fetchedDataCache[rightIdx.current] = {
            refGenes: trackData!.refGene,
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
            refGenes: trackData!.refGene,
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
    setToolTipVisible(false);
  }, [dragXDist]);

  useEffect(() => {
    if (configChanged === true) {
      createSVGOrCanvas(
        curRegionData.current.trackState,
        curRegionData.current.deDupRefGenesArr,
        curRegionData.current.initial
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
        overflow: "visible",

        flexDirection: "column",
      }}
      onContextMenu={renderConfigMenu}
    >
      <div
        style={{
          display: "flex",

          position: "relative",
          height: svgHeight.current,
        }}
      >
        {displayMode.current === "full" ? (
          <div
            style={{
              position: "absolute",

              right: side === "left" ? `${xPos.current}px` : "",
              left: side === "right" ? `${xPos.current}px` : "",
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
              height: "40px",
            }}
          >
            <div
              style={{
                position: "absolute",

                left: side === "right" ? `${xPos.current}px` : "",
                right: side === "left" ? `${xPos.current}px` : "",
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
