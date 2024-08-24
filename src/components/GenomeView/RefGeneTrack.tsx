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
import { AnnotationDisplayModeConfig } from "./commonComponents/track-context-menu/DisplayModeConfig";
import ReactDOM from "react-dom";
import { Manager, Popper, Reference } from "react-popper";
import OutsideClickDetector from "./commonComponents/OutsideClickDetector";
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

  const [rightHTML, setRightHTML] = useState<Array<any>>([]);
  const [leftHTML, setLeftHTML] = useState<Array<any>>([]);
  const [toolTip, setToolTip] = useState<any>();
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
  function fetchGenomeData(initial: number = 0) {
    // TO - IF STRAND OVERFLOW THEN NEED TO SET TO MAX WIDTH OR 0 to NOT AFFECT THE LOGIC.

    // initialize the first index of the interval so we can start checking for prev overlapping intervals
    if (result) {
      if (trackData!.side === "right") {
        let testData = result.map((record) => new Gene(record));
        let featureArrange = new FeatureArranger();
        let placeFeatureData = featureArrange.arrange(
          testData,
          trackData!.regionNavCoord,
          windowWidth,
          getGenePadding,
          DEFAULT_OPTIONS.hiddenPixels,
          SortItemsOptions.ASC,
          testPrevOverflowStrand.current,
          trackData!.side
        );
        console.log(placeFeatureData, trackData!.regionNavCoord);
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
            curFeature.placedFeatures[0].contextLocation.end >=
            trackData!.regionNavCoord._endBase
          ) {
            tempOverFlow[curFeature.feature.id!] = curFeature;
          }
        }

        testPrevOverflowStrand.current = tempOverFlow;
        setRightHTML([...rightHTML, ...[svgDATA]]);

        if (trackData!.initial) {
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
        }
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
          testPrevOverflowStrandLeft.current,
          trackData!.side
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
        console.log(leftHTML);
      } else {
        return;
      }

      //_____________________________________________________________________________________________________________________________________________
    }
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
      console.log(y);
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
  function onChange(value, value2) {
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
                    onOptionSet={onChange}
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
    const currtooltip = getToolTip["refGene"](
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
    fetchGenomeData();
  }, [trackData]);

  useEffect(() => {
    setToolTipVisible(false);
  }, [dragXDist]);

  return (
    //svg allows overflow to be visible x and y but the div only allows x overflow, so we need to set the svg to overflow x and y and then limit it in div its container.

    <>
      <div
        style={{ display: "flex", overflowX: "visible", overflowY: "hidden" }}
        onContextMenu={renderConfigMenu}
      >
        {side === "right"
          ? rightHTML.map((item, index) => <div key={index}>{item}</div>)
          : leftHTML.map((item, index) => (
              <div key={leftHTML.length - index - 1}>
                {leftHTML[leftHTML.length - index - 1]}
              </div>
            ))}
        {toolTipVisible ? toolTip : ""}
        {configMenuVisible ? configMenu : ""}
        {/* {configMenu.map((MenuComponent, index) =>
          ReactDOM.createPortal(
            <Manager>
              <Reference>
                {({ ref }) => (
                  <div
                    ref={ref}
                    style={{
                      position: "absolute",
                      left: 300 - 8 * 2,
                      top: 300,
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
                    <OutsideClickDetector onOutsideClick={onClose}>
                      <MenuComponent
                        key={index}
                        optionsObjects={[DEFAULT_OPTIONS]}
                        onOptionSet={onChange}
                      />
                    </OutsideClickDetector>
                  </div>
                )}
              </Popper>
            </Manager>,
            document.body
          )
        )} */}
      </div>
    </>
  );
});

export default memo(RefGeneTrack);
