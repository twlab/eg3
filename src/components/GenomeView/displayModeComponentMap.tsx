import { ReactNode } from "react";
import ChromosomeInterval from "../../models/ChromosomeInterval";
import DisplayedRegionModel from "../../models/DisplayedRegionModel";
import { NumericalFeature } from "../../models/Feature";
import FeatureArranger, {
  PlacedFeatureGroup,
} from "../../models/FeatureArranger";
import Gene from "../../models/Gene";
import OpenInterval from "../../models/OpenInterval";
import { SortItemsOptions } from "../../models/SortItemsOptions";
import NumericalTrack from "./commonComponents/numerical/NumericalTrack";

import TrackLegend from "./commonComponents/TrackLegend";
import GeneAnnotation from "./geneAnnotationTrackComponents/GeneAnnotation";
import GeneAnnotationScaffold from "./geneAnnotationTrackComponents/GeneAnnotationScaffold";
import { objToInstanceAlign } from "./TrackManager";
const TOP_PADDING = 2;
export const displayModeComponentMap: { [key: string]: any } = {
  full: function getFull(
    genesArr,
    useFineOrSecondaryParentNav,
    trackState,
    windowWidth,
    configOptions,
    renderTooltip,
    svgHeight,
    updatedLegend,
    trackModel,
    getGenePadding,
    getHeight,
    ROW_HEIGHT
  ) {
    function createFullVisualizer(
      placements,
      width,
      height,
      rowHeight,
      maxRows
    ) {
      // FullVisualizer class from eg2
      function renderAnnotation(placedGroup: PlacedFeatureGroup, i: number) {
        const maxRowIndex = (maxRows || Infinity) - 1;
        // Compute y
        const rowIndex = Math.min(placedGroup.row, maxRowIndex);
        const y = rowIndex * rowHeight + TOP_PADDING;

        return getAnnotationElement(
          placedGroup,
          y,
          rowIndex === maxRowIndex,
          i
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
    // the function to create individial feature element from the GeneAnnotation track which is passed down to fullvisualizer
    function getAnnotationElement(placedGroup, y, isLastRow, index) {
      const gene = placedGroup.feature;

      return (
        <GeneAnnotationScaffold
          key={index}
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
              id={i}
              placedGene={placedGene}
              y={y}
              options={configOptions.current}
            />
          ))}
        </GeneAnnotationScaffold>
      );
    }

    let algoData = genesArr.map((record) => new Gene(record));
    let featureArrange = new FeatureArranger();

    let sortType = SortItemsOptions.NOSORT;
    let currDisplayNav;
    if (!useFineOrSecondaryParentNav) {
      currDisplayNav = new DisplayedRegionModel(
        trackState.regionNavCoord._navContext,
        trackState.regionNavCoord._startBase -
          (trackState.regionNavCoord._endBase -
            trackState.regionNavCoord._startBase),
        trackState.regionNavCoord._endBase +
          (trackState.regionNavCoord._endBase -
            trackState.regionNavCoord._startBase)
      );
    }
    //FullDisplayMode part from eg2
    console.log(trackState, useFineOrSecondaryParentNav);
    let placeFeatureData = featureArrange.arrange(
      algoData,
      useFineOrSecondaryParentNav
        ? objToInstanceAlign(trackState.visRegion)
        : currDisplayNav,
      useFineOrSecondaryParentNav ? trackState.visWidth : windowWidth * 3,
      getGenePadding,
      configOptions.hiddenPixels,
      sortType
    );
    const height = getHeight(placeFeatureData.numRowsAssigned);
    let svgDATA = createFullVisualizer(
      placeFeatureData.placements,
      useFineOrSecondaryParentNav ? trackState.visWidth : windowWidth * 3,
      height,
      ROW_HEIGHT,
      configOptions.maxRows
    );

    svgHeight.current = height;

    updatedLegend.current = (
      <TrackLegend height={svgHeight.current} trackModel={trackModel} />
    );
    return svgDATA;
  },

  density: function getDensity(
    genesArr,
    useFineOrSecondaryParentNav,
    trackState,
    windowWidth,
    configOptions,
    updatedLegend,
    trackModel
  ) {
    let currDisplayNav;
    if (!useFineOrSecondaryParentNav) {
      currDisplayNav = new DisplayedRegionModel(
        trackState.regionNavCoord._navContext,
        trackState.regionNavCoord._startBase -
          (trackState.regionNavCoord._endBase -
            trackState.regionNavCoord._startBase),
        trackState.regionNavCoord._endBase +
          (trackState.regionNavCoord._endBase -
            trackState.regionNavCoord._startBase)
      );
    }
    let algoData = genesArr.map((record) => {
      let newChrInt = new ChromosomeInterval(
        record.chrom,
        record.txStart,
        record.txEnd
      );
      return new NumericalFeature("", newChrInt).withValue(record.score);
    });

    function getNumLegend(legend: ReactNode) {
      //this will be trigger when creating canvaselemebt here and the saved canvaselement
      // is set to canvasComponent state which will update the legend ref without having to update manually

      updatedLegend.current = legend;
    }
    let canvasElements = (
      <NumericalTrack
        data={algoData}
        options={configOptions}
        viewWindow={
          new OpenInterval(
            0,
            useFineOrSecondaryParentNav ? trackState.visWidth : windowWidth * 3
          )
        }
        viewRegion={
          useFineOrSecondaryParentNav
            ? objToInstanceAlign(trackState.visRegion)
            : currDisplayNav
        }
        width={
          useFineOrSecondaryParentNav ? trackState.visWidth : windowWidth * 3
        }
        forceSvg={false}
        trackModel={trackModel}
        getNumLegend={getNumLegend}
      />
    );
    return canvasElements;
  },
};

export function getDisplayModeFunction(
  drawDate: { [key: string]: any },
  displaySetter,
  displayCache,
  cacheIdx,
  curXPos
) {
  if (drawDate.configOptions.displayMode === "full") {
    let svgDATA = displayModeComponentMap["full"](
      drawDate.genesArr,
      drawDate.useFineOrSecondaryParentNav,
      drawDate.trackState,
      drawDate.windowWidth,
      drawDate.configOptions,
      drawDate.renderTooltip,
      drawDate.svgHeight,
      drawDate.updatedLegend,
      drawDate.trackModel,
      drawDate.getGenePadding,
      drawDate.getHeight,
      drawDate.ROW_HEIGHT
    );
    displaySetter.full.setComponents(svgDATA);
    displayCache.current.full[cacheIdx] = {
      svgDATA,
      height: drawDate.svgHeight.current,
      xPos: curXPos,
    };
  } else if (drawDate.configOptions.displayMode === "density") {
    let tmpObj = { ...drawDate.configOptions };
    tmpObj.displayMode = "auto";
    let canvasElements = displayModeComponentMap["density"](
      drawDate.genesArr,
      drawDate.useFineOrSecondaryParentNav,
      drawDate.trackState,
      drawDate.windowWidth,
      tmpObj,
      drawDate.updatedLegend,
      drawDate.trackModel
    );

    displaySetter.density.setComponents(canvasElements);
    displayCache.current.density[cacheIdx] = {
      canvasData: canvasElements,
      height: tmpObj,
      xPos: curXPos,
    };
  }
}
