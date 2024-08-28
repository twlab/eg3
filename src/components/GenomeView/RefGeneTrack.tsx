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
import { getToolTip } from "./commonComponents/hover-and-tooltip/toolTipGenomealign";
import { AnnotationDisplayModes } from "./commonComponents/track-context-menu/DisplayModes";
import NumericalTrack from "./commonComponents/numerical/NumericalTrack";
import { AnnotationDisplayModeConfig } from "./commonComponents/track-context-menu/DisplayModeConfig";
import ReactDOM from "react-dom";
import { Manager, Popper, Reference } from "react-popper";
import OutsideClickDetector from "./commonComponents/OutsideClickDetector";
import TooltipGenomealign from "./commonComponents/hover-and-tooltip/toolTipGenomealign";
import GeneDetail from "./geneAnnotationTrack/GeneDetail";
import DisplayedRegionModel from "../../models/DisplayedRegionModel";
import NavigationContext from "../../models/NavigationContext";
const BACKGROUND_COLOR = "rgba(173, 216, 230, 0.9)"; // lightblue with opacity adjustment
const ARROW_SIZE = 16;

export const DEFAULT_OPTIONS = {
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
};
const canvasOptions = {
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
};
const ROW_VERTICAL_PADDING = 5;
const ROW_HEIGHT = GeneAnnotation.HEIGHT + ROW_VERTICAL_PADDING;
console.log(ROW_HEIGHT);
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
}) {
  let start, end;

  let result;
  if (Object.keys(trackData!).length > 0) {
    [start, end] = trackData!.location.split(":");
    result = trackData!.refGene;

    start = Number(start);
    end = Number(end);
  }

  //useRef to store data between states without re render the component
  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates
  const rightRawData = useRef<Array<any>>([]);
  const [rightHTML, setRightHTML] = useState<Array<any>>([]);
  const [rightAlgo, setRightAlgo] = useState<Array<any>>([]);
  const [rightData, setRightData] = useState<Array<any>>([]);
  const [dataIdx, setDataIdx] = useState(0);
  const [rightCanvas, setRightCanvas] = useState<Array<any>>([]);
  const [leftHTML, setLeftHTML] = useState<Array<any>>([]);
  const [toolTip, setToolTip] = useState<any>();
  const [xPos, setXPos] = useState(0);
  const view = useRef(0);
  const [toolTipVisible, setToolTipVisible] = useState(false);
  const [configMenu, setConfigMenu] = useState<Array<any>>([]);
  const [configMenuVisible, setConfigMenuVisible] = useState(false);
  const testPrevOverflowStrand = useRef<{ [key: string]: any }>({});
  const testPrevOverflowStrandLeft = useRef<{ [key: string]: any }>({});

  // These states are used to update the tracks with new fetched data
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track
  function getHeight(numRows: number): number {
    let rowHeight = ROW_HEIGHT;
    let options = DEFAULT_OPTIONS;
    let rowsToDraw = Math.min(numRows, options.maxRows);
    if (options.hideMinimalItems) {
      rowsToDraw -= 1;
    }
    if (rowsToDraw < 1) {
      rowsToDraw = 1;
    }
    return rowsToDraw * rowHeight + TOP_PADDING;
  }
  function fetchGenomeData(fetchedData, testAlgo, idxPos) {
    // TO - IF STRAND OVERFLOW THEN NEED TO SET TO MAX WIDTH OR 0 to NOT AFFECT THE LOGIC.

    // initialize the first index of the interval so we can start checking for prev overlapping intervals
    if (testAlgo.length > 0) {
      let algoData = testAlgo.map((record) => new Gene(record));
      let featureArrange = new FeatureArranger();
      let placeFeatureData = featureArrange.arrange(
        algoData,

        rightRawData.current.length < 3
          ? fetchedData.regionNavCoord
          : new DisplayedRegionModel(
              fetchedData.regionNavCoord._navContext,
              fetchedData.regionNavCoord._startBase -
                (fetchedData.regionNavCoord._endBase -
                  fetchedData.regionNavCoord._startBase) *
                  2,

              fetchedData.regionNavCoord._endBase
            ),
        rightRawData.current.length < 3
          ? windowWidth * rightRawData.current.length
          : windowWidth * 3,
        getGenePadding,
        DEFAULT_OPTIONS.hiddenPixels,
        SortItemsOptions.ASC,
        fetchedData.side,
        {}
      );

      const height = getHeight(placeFeatureData.numRowsAssigned);
      let svgDATA = createFullVisualizer(
        placeFeatureData.placements,
        rightRawData.current.length < 3
          ? windowWidth * rightRawData.current.length
          : windowWidth * 3,
        height,
        ROW_HEIGHT,
        DEFAULT_OPTIONS.maxRows,
        DEFAULT_OPTIONS
      );

      setRightAlgo([...[svgDATA]]);
      view.current = -trackData!.xDist - windowWidth;
    }
    if (fetchedData) {
      if (trackData!.side === "right") {
        let testData = fetchedData.refGene.map((record) => new Gene(record));
        setRightData([...rightData, testData]);
        let canvasElements = (
          <NumericalTrack
            data={testData}
            options={canvasOptions}
            viewWindow={new OpenInterval(0, windowWidth)}
            viewRegion={trackData!.regionNavCoord}
            width={windowWidth}
            forceSvg={false}
            trackModel={trackModel}
          />
        );

        setRightCanvas([...rightCanvas, canvasElements]);
        //_____________________________________________________________________________________________________________________
        // let featureArrange = new FeatureArranger();
        // let placeFeatureData = featureArrange.arrange(
        //   testData,
        //   trackData!.regionNavCoord,
        //   windowWidth,
        //   getGenePadding,
        //   DEFAULT_OPTIONS.hiddenPixels,
        //   SortItemsOptions.ASC,
        //   trackData!.side,
        //   testPrevOverflowStrand.current
        // );

        // const height = getHeight(placeFeatureData.numRowsAssigned);
        // let svgDATA = createFullVisualizer(
        //   placeFeatureData.placements,
        //   windowWidth,
        //   height,
        //   ROW_HEIGHT,
        //   DEFAULT_OPTIONS.maxRows,
        //   DEFAULT_OPTIONS
        // );
        // let tempOverFlow = {};

        // for (var i = 0; i < placeFeatureData.placements.length; i++) {
        //   let curFeature = placeFeatureData.placements[i];
        //   if (
        //     curFeature.placedFeatures[0].contextLocation.end >=
        //     trackData!.regionNavCoord._endBase
        //   ) {
        //     tempOverFlow[curFeature.feature.id!] = curFeature;
        //   }
        // }

        // testPrevOverflowStrand.current = tempOverFlow;
        // setRightHTML([...rightHTML, ...[svgDATA]]);

        // if (trackData!.initial) {
        //   let tempOverFlow = {};
        //   for (var i = 0; i < placeFeatureData.placements.length; i++) {
        //     let curFeature = placeFeatureData.placements[i];
        //     if (
        //       curFeature.placedFeatures[0].contextLocation.start <=
        //       trackData!.regionNavCoord._startBase
        //     ) {
        //       tempOverFlow[curFeature.feature.id!] = curFeature;
        //     }
        //   }
        //   testPrevOverflowStrandLeft.current = tempOverFlow;
        //   setLeftHTML([...leftHTML, ...[svgDATA]]);
        // }
      } else if (trackData!.side === "left") {
        result.sort((a, b) => {
          return b.txEnd - a.txEnd;
        });
        let testData = result.map((record) => new Gene(record));
        let featureArrange = new FeatureArranger();
        let placeFeatureData = featureArrange.arrange(
          testData,
          trackData!.regionNavCoord,
          windowWidth,
          getGenePadding,
          DEFAULT_OPTIONS.hiddenPixels,
          SortItemsOptions.ASC,
          trackData!.side,
          testPrevOverflowStrandLeft.current
        );

        const height = getHeight(placeFeatureData.numRowsAssigned);
        let svgDATA = createFullVisualizer(
          placeFeatureData.placements,
          windowWidth,
          height,
          ROW_HEIGHT,
          DEFAULT_OPTIONS.maxRows,
          DEFAULT_OPTIONS
        );
        let tempOverFlow = {};
        for (var i = 0; i < placeFeatureData.placements.length; i++) {
          let curFeature = placeFeatureData.placements[i];
          if (
            curFeature.placedFeatures[0].contextLocation.start <=
            trackData!.regionNavCoord._startBase
          ) {
            tempOverFlow[curFeature.feature.id!] = curFeature;
          }
        }
        testPrevOverflowStrandLeft.current = tempOverFlow;
        setLeftHTML([...leftHTML, ...[svgDATA]]);
      } else {
        return;
      }

      //_____________________________________________________________________________________________________________________________________________
    }

    setXPos((Math.floor(idxPos / windowWidth) - 1) * windowWidth);
  }

  //________________________________________________________________________________________________________________________________________________________
  //________________________________________________________________________________________________________________________________________________________

  // check each strand interval on each level to see if they overlapp and place it there
  // they are already in order of not overlapp. so we just just check  Loop previousIndex <- (currentIndex interval)
  //update the previous level start and end
  // placeFeatureSegments from e g 2
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
      <svg
        style={{
          display: "block",
          // overflow: "visible",
        }}
        width={width}
        height={height}
      >
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
        options={DEFAULT_OPTIONS}
        onClick={renderTooltip}
      >
        {placedGroup.placedFeatures.map((placedGene, i) => (
          <GeneAnnotation
            key={i}
            placedGene={placedGene}
            y={y}
            options={DEFAULT_OPTIONS}
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
  function getMenuComponents() {
    const items = [AnnotationDisplayModeConfig];
    setConfigMenu([...items]);
  }
  const handleRightClick = (event) => {
    event.preventDefault(); // Prevent the default context menu

    getMenuComponents();
  };
  function onConfigChange(value, value2) {
    console.log(value, value2);
  }
  function renderConfigMenu(event) {
    event.preventDefault(); // Prevent the default context menu
    const items = [AnnotationDisplayModeConfig];

    let menu = items.map((MenuComponent, index) =>
      ReactDOM.createPortal(
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
                }}
                className="Tooltip"
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
              >
                <OutsideClickDetector onOutsideClick={onCloseMenu}>
                  <MenuComponent
                    key={index}
                    optionsObjects={[DEFAULT_OPTIONS]}
                    onOptionSet={onConfigChange}
                  />
                </OutsideClickDetector>
              </div>
            )}
          </Popper>
        </Manager>,
        document.body
      )
    );
    setConfigMenuVisible(true);
    setConfigMenu([...menu]);
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
  function onCloseMenu() {
    setConfigMenuVisible(false);
  }
  useEffect(() => {
    if (trackData!.refGene) {
      rightRawData.current.push({
        refGenes: trackData!.refGene,
        trackData: trackData!,
      });
    }
    let testData = rightRawData.current.slice(-3);
    let refGenesArray = testData.map((item) => item.refGenes).flat(1);

    fetchGenomeData(trackData!, refGenesArray, -trackData!.xDist);
  }, [trackData]);

  useEffect(() => {
    setToolTipVisible(false);
    setConfigMenuVisible(false);
    setDataIdx(Math.floor(dragXDist! / windowWidth));
  }, [dragXDist]);

  useEffect(() => {
    //when dataIDx and rightRawData.current equals we have a new data since rightRawdata.current didn't have a chance to push new data yet
    //so this is for when there atleast 3 raw data length, and doesn't equal rightRawData.current length, we would just use the lastest three newest vaLUE
    // otherwise when there is new data cuz the user is at the end of the track

    if (
      rightRawData.current.length > 3 &&
      -dataIdx !== rightRawData.current.length
    ) {
      let testData = rightRawData.current.slice(-dataIdx - 1, -dataIdx + 2);
      let refGenesArray = testData.map((item) => item.refGenes).flat(1);

      fetchGenomeData(
        rightRawData.current[-dataIdx].trackData,
        refGenesArray,
        -rightRawData.current[-dataIdx].trackData.xDist
      );
    }
  }, [dataIdx]);
  return (
    //svg allows overflow to be visible x and y but the div only allows x overflow, so we need to set the svg to overflow x and y and then limit it in div its container.

    <div
      style={{
        display: "flex",
        overflow: "visible",

        flexDirection: "column",
      }}
      // onContextMenu={renderConfigMenu}
    >
      <div
        style={{
          display: "flex",
        }}
      >
        {side === "right"
          ? rightCanvas.map((item, index) => <div key={index}>{item}</div>)
          : leftHTML.map((item, index) => (
              <div key={leftHTML.length - index - 1}>
                {leftHTML[leftHTML.length - index - 1]}
              </div>
            ))}
        {/* <div
          style={{
            display: "flex",
            flexDirection: "row",
            position: "absolute",
            opacity: 0.5,

            zIndex: 3,
          }}
        >
          {rightData.map((item, index) => (
            <TooltipGenomealign
              key={index}
              data={rightData[index]}
              windowWidth={windowWidth}
              trackIdx={index}
              trackType={"refGene"}
              side={"right"}
              trackModel={trackModel}
              height={DEFAULT_OPTIONS.height}
            />
          ))}
        </div> */}
      </div>
      {/* <div
        style={{
          display: "flex",
          overflowX: "visible",
          overflowY: "hidden",
          position: "relative",
        }}
      >
        {side === "right"
          ? rightHTML.map((item, index) => <div key={index}>{item}</div>)
          : leftHTML.map((item, index) => (
              <div key={leftHTML.length - index - 1}>
                {leftHTML[leftHTML.length - index - 1]}
              </div>
            ))}
      </div> */}
      <div
        style={{
          display: "flex",

          position: "relative",
          height: 200,
        }}
      >
        <div
          style={{
            position: "absolute",

            left:
              side === "right"
                ? `${rightRawData.current.length > 3 ? xPos : 0}px`
                : "",
          }}
        >
          {side === "right" ? rightAlgo : ""}
        </div>
        {toolTipVisible ? toolTip : ""}
        {configMenuVisible ? configMenu : ""}
      </div>
    </div>
  );
});

export default memo(RefGeneTrack);
