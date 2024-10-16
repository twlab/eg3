import React, { memo, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { TrackProps } from "../../models/trackModels/trackProps";
import { objToInstanceAlign } from "./TrackManager";
import FeatureArranger, {
  PlacedFeatureGroup,
} from "../../models/FeatureArranger";
import Gene from "../../models/Gene";
import GeneAnnotationScaffold from "./geneAnnotationTrackComponents/GeneAnnotationScaffold";
import GeneAnnotation from "./geneAnnotationTrackComponents/GeneAnnotation";
import { SortItemsOptions } from "../../models/SortItemsOptions";
import OpenInterval from "../../models/OpenInterval";
import NumericalTrack from "./commonComponents/numerical/NumericalTrack";
import ReactDOM from "react-dom";
import { Manager, Popper, Reference } from "react-popper";
import OutsideClickDetector from "./commonComponents/OutsideClickDetector";
import { removeDuplicates } from "./commonComponents/check-obj-dupe";
import GeneDetail from "./geneAnnotationTrackComponents/GeneDetail";
import { GeneAnnotationTrackConfig } from "../../trackConfigs/config-menu-models.tsx/GeneAnnotationTrackConfig";
import { DEFAULT_OPTIONS as defaultGeneAnnotationTrack } from "./geneAnnotationTrackComponents/GeneAnnotation";
import { DEFAULT_OPTIONS as defaultNumericalTrack } from "./commonComponents/numerical/NumericalTrack";
import { DEFAULT_OPTIONS as defaultAnnotationTrack } from "../../trackConfigs/config-menu-models.tsx/AnnotationTrackConfig";
import trackConfigMenu from "../../trackConfigs/config-menu-components.tsx/TrackConfigMenu";
import DisplayedRegionModel from "../../models/DisplayedRegionModel";
import TrackLegend from "./commonComponents/TrackLegend";
import ChromosomeInterval from "../../models/ChromosomeInterval";
import { NumericalFeature } from "../../models/Feature";
import { getTrackXOffset } from "./CommonTrackFunctions.tsx/getCacheData";
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
  onTrackConfigChange,

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
  setShow3dGene,
  isThereG3dTrack,
  legendRef,
  selectConfigChange,
  trackManagerRef,
}) {
  const configOptions = useRef({ ...DEFAULT_OPTIONS });
  const svgHeight = useRef(0);
  const rightIdx = useRef(0);
  const leftIdx = useRef(1);
  const updateSide = useRef("right");
  const updatedLegend = useRef<any>();

  const fetchedDataCache = useRef<{ [key: string]: any }>({});
  const displayCache = useRef<{ [key: string]: any }>({
    full: {},
    density: {},
  });
  const prevDataIdx = useRef(0);

  const xPos = useRef(0);
  const curRegionData = useRef<{ [key: string]: any }>({});
  const parentGenome = useRef("");
  const configMenuPos = useRef<{ [key: string]: any }>({});
  const [svgComponents, setSvgComponents] = useState<any>(null);
  const [canvasComponents, setCanvasComponents] = useState<any>(null);
  const [toolTip, setToolTip] = useState<any>();
  const [toolTipVisible, setToolTipVisible] = useState(false);
  const newTrackWidth = useRef(windowWidth);
  const [configChanged, setConfigChanged] = useState(false);
  const [legend, setLegend] = useState<any>();

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
  async function createSVGOrCanvas(curTrackData, genesArr, fine, cacheIdx) {
    if (fine) {
      newTrackWidth.current = curTrackData.visWidth;
    }
    let curXPos = getTrackXOffset(
      fetchedDataCache.current[dataIdx!].trackState,
      windowWidth
    );
    xPos.current = curXPos;
    let sortType = SortItemsOptions.NOSORT;

    let currDisplayNav = new DisplayedRegionModel(
      curTrackData.regionNavCoord._navContext,
      curTrackData.regionNavCoord._startBase -
        (curTrackData.regionNavCoord._endBase -
          curTrackData.regionNavCoord._startBase),
      curTrackData.regionNavCoord._endBase +
        (curTrackData.regionNavCoord._endBase -
          curTrackData.regionNavCoord._startBase)
    );

    if (configOptions.current.displayMode === "full") {
      let algoData = genesArr.map((record) => new Gene(record));
      let featureArrange = new FeatureArranger();
      //FullDisplayMode part from eg2
      let placeFeatureData = await featureArrange.arrange(
        algoData,
        fine ? objToInstanceAlign(curTrackData.visRegion) : currDisplayNav,
        fine ? curTrackData.visWidth : windowWidth * 3,
        getGenePadding,
        configOptions.current.hiddenPixels,
        sortType
      );
      const height = getHeight(placeFeatureData.numRowsAssigned);

      svgHeight.current = getHeight(placeFeatureData.numRowsAssigned);

      updatedLegend.current = (
        <TrackLegend height={svgHeight.current} trackModel={trackModel} />
      );
      let svgDATA = createFullVisualizer(
        placeFeatureData.placements,
        fine ? curTrackData.visWidth : windowWidth * 3,
        height,
        ROW_HEIGHT,
        configOptions.current.maxRows,
        configOptions.current
      );

      setSvgComponents(svgDATA);

      displayCache.current.full[cacheIdx] = {
        svgDATA,
        height,
        xPos: curXPos,
      };
    } else if (configOptions.current.displayMode === "density") {
      let algoData = genesArr.map((record) => {
        let newChrInt = new ChromosomeInterval(
          record.chrom,
          record.txStart,
          record.txEnd
        );
        return new NumericalFeature("", newChrInt).withValue(record.score);
      });

      let tmpObj = { ...configOptions.current };
      tmpObj.displayMode = "auto";

      function getNumLegend(legend: ReactNode) {
        updatedLegend.current = legend;
      }
      //
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
          getNumLegend={getNumLegend}
        />
      );

      setCanvasComponents(canvasElements);

      displayCache.current.density[cacheIdx] = {
        canvasData: canvasElements,
        height: configOptions.current.height,
        xPos: curXPos,
      };
    }

    // if (curTrackData.initial === 1 || curTrackData.index === 1) {
    //   xPos.current = fine ? -curTrackData.startWindow : -windowWidth;
    // } else if (curTrackData.side === "right") {
    //   xPos.current = fine
    //     ? (Math.floor(-curTrackData.xDist / windowWidth) - 1) * windowWidth -
    //       windowWidth +
    //       curTrackData.startWindow
    //     : Math.floor(-curTrackData.xDist / windowWidth) * windowWidth;
    // } else if (curTrackData.side === "left") {
    //   xPos.current = fine
    //     ? (Math.floor(curTrackData.xDist / windowWidth) - 1) * windowWidth -
    //       windowWidth +
    //       curTrackData.startWindow
    //     : Math.floor(curTrackData.xDist / windowWidth) * windowWidth;
    // }

    updateSide.current = side;
    console.log(displayCache.current);
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
    // FullVisualizer class from eg2
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
  // the function to create individial feature element from the GeneAnnotation track which is passed down to fullvisualizer
  function getAnnotationElement(placedGroup, y, isLastRow, index) {
    const gene = placedGroup.feature;

    return (
      <GeneAnnotationScaffold
        key={gene.id + id}
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
            key={i + id + gene.id}
            id={i + id + gene.id}
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
                {isThereG3dTrack ? (
                  <div>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => setShow3dGene(gene)}
                    >
                      Show in 3D
                    </button>
                    {/* {" "}
                    <button className="btn btn-sm btn-secondary" onClick={this.clearGene3d}>
                        Clear in 3D
                    </button> */}
                  </div>
                ) : (
                  ""
                )}
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

      trackModel.options = configOptions.current;
      const renderer = new GeneAnnotationTrackConfig(trackModel);

      const items = renderer.getMenuComponents();

      let menu = trackConfigMenu[`${trackModel.type}`]({
        blockRef: trackManagerRef,
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

      getConfigMenu(menu, "singleSelect");
    } else {
      configOptions.current[`${key}`] = value;
    }
    setConfigChanged(true);
  }
  function renderConfigMenu(event) {
    event.preventDefault();

    const renderer = new GeneAnnotationTrackConfig(trackModel);

    // create object that has key as displayMode and the configmenu component as the value
    const items = renderer.getMenuComponents();
    let menu = trackConfigMenu[`${trackModel.type}`]({
      blockRef: trackManagerRef,
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

    getConfigMenu(menu, "singleSelect");
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
    // if (
    //   useFineModeNav ||
    //   genomeArr![genomeIdx!].genome._name !== parentGenome.current
    // ) {
    // CHANGE LEFT  NOT SUBTREACT BY 1 ANMORE
    let dataValid = false;
    if (
      (dataIdx! > rightIdx.current + 1 && dataIdx! <= 0) ||
      (dataIdx! < leftIdx.current - 1 && dataIdx! > 0)
    ) {
      dataValid = true;
    }
    if (dataValid) {
      let viewData: Array<any> = [];
      let curIdx;
      if (
        dataIdx! in displayCache.current[`${configOptions.current.displayMode}`]
      ) {
        let displayType = `${configOptions.current.displayMode}`;

        updatedLegend.current = (
          <TrackLegend
            height={displayCache.current[`${displayType}`][dataIdx!].height}
            trackModel={trackModel}
          />
        );
        xPos.current = displayCache.current[`${displayType}`][dataIdx!].xPos;
        updateSide.current = side;
        if (displayType === "full") {
          setSvgComponents(
            displayCache.current[`${displayType}`][dataIdx!].svgDATA
          );

          svgHeight.current =
            displayCache.current[`${displayType}`][dataIdx!].height;
        } else {
          setCanvasComponents(
            displayCache.current[`${displayType}`][dataIdx!].canvasData
          );
        }

        viewData = [
          fetchedDataCache.current[dataIdx! + 1],
          fetchedDataCache.current[dataIdx!],
          fetchedDataCache.current[dataIdx! - 1],
        ];
        if (fetchedDataCache.current[dataIdx!].trackState.side === "right") {
          curIdx = dataIdx!;
        } else if (
          fetchedDataCache.current[dataIdx!].trackState.side === "left"
        ) {
          curIdx = dataIdx!;
        }
        let refGenesArray = viewData.map((item) => item.refGenes).flat(1);
        let deDupRefGenesArr = removeDuplicates(refGenesArray, "id");
        viewData = deDupRefGenesArr;
        curRegionData.current = {
          trackState: fetchedDataCache.current[curIdx].trackState,
          deDupRefGenesArr: viewData,
          initial: 0,
          cacheIdx: curIdx,
        };
      } else {
        let viewData: Array<any> = [];
        let curIdx;

        if (
          useFineModeNav ||
          genomeArr![genomeIdx!].genome._name !== parentGenome.current
        ) {
          // CHANGE LEFT  NOT SUBTREACT BY 1 ANMORE
          if (dataIdx! > rightIdx.current && dataIdx! <= 0) {
            viewData = fetchedDataCache.current[dataIdx!].refGenes;
            curIdx = dataIdx!;
          } else if (dataIdx! < leftIdx.current && dataIdx! > 0) {
            viewData = fetchedDataCache.current[dataIdx!].refGenes;
            curIdx = dataIdx!;
          }
        } else {
          if (
            (dataIdx! > rightIdx.current + 1 && dataIdx! <= 0) ||
            (dataIdx! < leftIdx.current - 1 && dataIdx! > 0)
          ) {
            viewData = [
              fetchedDataCache.current[dataIdx! + 1],
              fetchedDataCache.current[dataIdx!],
              fetchedDataCache.current[dataIdx! - 1],
            ];
            if (
              fetchedDataCache.current[dataIdx!].trackState.side === "right"
            ) {
              curIdx = dataIdx!;
            } else if (
              fetchedDataCache.current[dataIdx!].trackState.side === "left"
            ) {
              curIdx = dataIdx!;
            }
          }
        }
        if (viewData.length > 0) {
          curRegionData.current = {
            trackState: fetchedDataCache.current[dataIdx!].trackState,
            deDupRefGenesArr: viewData,
            initial: 0,
            cacheIdx: dataIdx,
          };
          if (
            !useFineModeNav &&
            genomeArr![genomeIdx!].genome._name === parentGenome.current
          ) {
            let refGenesArray = viewData.map((item) => item.refGenes).flat(1);
            let deDupRefGenesArr = removeDuplicates(refGenesArray, "id");
            viewData = deDupRefGenesArr;
            curRegionData.current = {
              trackState: fetchedDataCache.current[curIdx].trackState,
              deDupRefGenesArr: viewData,
              initial: 0,
              cacheIdx: curIdx,
            };
            console.log(curRegionData.current);
            createSVGOrCanvas(
              fetchedDataCache.current[curIdx].trackState,
              viewData,
              false,
              curIdx
            );
          } else {
            createSVGOrCanvas(
              fetchedDataCache.current[curIdx].trackState,
              viewData,
              true,
              dataIdx!
            );
          }
        }
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
          //boxXpos.current = trackManagerRef.current!.getBoundingClientRect().x;
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
            cacheIdx: rightIdx.current + 1,
          };

          createSVGOrCanvas(
            createTrackState(1, "right"),
            curDataArr,
            true,
            rightIdx.current + 1
          );
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
              cacheIdx: rightIdx.current + 1,
            };

            createSVGOrCanvas(
              newTrackState,
              fetchedDataCache.current[rightIdx.current + 1].refGenes,
              true,
              rightIdx.current + 1
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
              cacheIdx: leftIdx.current - 1,
            };

            createSVGOrCanvas(
              newTrackState,
              fetchedDataCache.current[leftIdx.current - 1].refGenes,
              true,
              leftIdx.current - 1
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
          //boxXpos.current = trackManagerRef.current!.getBoundingClientRect().x;
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

          let deDupRefGenesArr = removeDuplicates(refGenesArray, "id");
          curRegionData.current = {
            trackState: trackState1,
            deDupRefGenesArr,
            cacheIdx: rightIdx.current + 2,
          };
          createSVGOrCanvas(
            trackState1,
            deDupRefGenesArr,
            false,
            rightIdx.current + 2
          );
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

            let refGenesArray = testData.map((item) => item.refGenes).flat(1);
            let deDupRefGenesArr = removeDuplicates(refGenesArray, "id");

            rightIdx.current--;
            curRegionData.current = {
              trackState:
                fetchedDataCache.current[rightIdx.current + 2].trackState,
              deDupRefGenesArr,
              initial: 0,
              cacheIdx: rightIdx.current + 2,
            };
            createSVGOrCanvas(
              fetchedDataCache.current[rightIdx.current + 2].trackState,
              deDupRefGenesArr,
              false,
              rightIdx.current + 2
            );
          } else if (trackData!.trackState.side === "left") {
            trackData!.trackState["index"] = leftIdx.current;
            fetchedDataCache.current[leftIdx.current] = {
              refGenes: trackData![`${id}`].result,
              trackState: newTrackState,
            };

            let currIdx = leftIdx.current;
            for (let i = 0; i < 3; i++) {
              testData.push(fetchedDataCache.current[currIdx]);
              currIdx--;
            }

            let refGenesArray = testData.map((item) => item.refGenes).flat(1);
            let deDupRefGenesArr = removeDuplicates(refGenesArray, "id");

            leftIdx.current++;
            curRegionData.current = {
              trackState:
                fetchedDataCache.current[leftIdx.current - 2].trackState,
              deDupRefGenesArr,
              initial: 0,
              cacheData: leftIdx.current - 2,
            };
            createSVGOrCanvas(
              fetchedDataCache.current[leftIdx.current - 2].trackState,
              deDupRefGenesArr,
              false,
              leftIdx.current - 2
            );
          }
        }
      }
    }
    if (trackData![`${id}`] && trackData!.initial === 1) {
      onTrackConfigChange({
        configOptions: configOptions.current,
        trackModel: trackModel,
        id: id,
        trackIdx: trackIdx,
        legendRef: legendRef,
      });
    }
  }, [trackData]);
  useEffect(() => {
    if (configChanged === true) {
      if (
        !useFineModeNav &&
        genomeArr![genomeIdx!].genome._name === parentGenome.current
      ) {
        console.log(curRegionData.current);
        createSVGOrCanvas(
          curRegionData.current.trackState,
          curRegionData.current.deDupRefGenesArr,
          false,
          dataIdx
        );
      } else {
        createSVGOrCanvas(
          curRegionData.current.trackState,
          curRegionData.current.deDupRefGenesArr,
          true,
          curRegionData.current.cacheIdx
        );
      }
      onTrackConfigChange({
        configOptions: configOptions.current,
        trackModel: trackModel,
        id: id,
        trackIdx: trackIdx,
        legendRef: legendRef,
      });
    }
    setConfigChanged(false);
  }, [configChanged]);

  useEffect(() => {
    //when dataIDx and rightRawData.current equals we have a new data since rightRawdata.current didn't have a chance to push new data yet
    //so this is for when there atleast 3 raw data length, and doesn't equal rightRawData.current length, we would just use the lastest three newest vaLUE
    // otherwise when there is new data cuz the user is at the end of the track
    console.log(dataIdx!);
    getCacheData();
    prevDataIdx.current = dataIdx!;
  }, [dataIdx]);
  useEffect(() => {
    setLegend(ReactDOM.createPortal(updatedLegend.current, legendRef.current));
  }, [svgComponents, canvasComponents]);

  useEffect(() => {
    if (svgComponents !== null || canvasComponents !== null) {
      configOptions.current = {
        ...configOptions.current,
        ...selectConfigChange.changedOption,
      };
      onTrackConfigChange({
        configOptions: configOptions.current,
        trackModel: trackModel,
        id: id,
        trackIdx: trackIdx,
        legendRef: legendRef,
      });
      setConfigChanged(true);
      console.log("ASDASDASDASDASDASD", selectConfigChange);
    }
  }, [selectConfigChange]);

  return (
    //svg allows overflow to be visible x and y but the div only allows x overflow, so we need to set the svg to overflow x and y and then limit it in div its container.

    <div
      onContextMenu={renderConfigMenu}
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
            position: "absolute",
            lineHeight: 0,
            right: updateSide.current === "left" ? `${xPos.current}px` : "",
            left: updateSide.current === "right" ? `${xPos.current}px` : "",
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
              position: "absolute",
              backgroundColor: configOptions.current.backgroundColor,
              left: updateSide.current === "right" ? `${xPos.current}px` : "",
              right: updateSide.current === "left" ? `${xPos.current}px` : "",
            }}
          >
            {canvasComponents}
          </div>
        </div>
      )}
      {toolTipVisible ? toolTip : ""}
      {legend}
    </div>
  );
});

export default memo(RefGeneTrack);
