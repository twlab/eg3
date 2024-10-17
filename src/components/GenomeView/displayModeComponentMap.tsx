import { ReactNode } from "react";
import ChromosomeInterval from "../../models/ChromosomeInterval";
import DisplayedRegionModel from "../../models/DisplayedRegionModel";
import Feature, { NumericalFeature } from "../../models/Feature";
import FeatureArranger, {
  PlacedFeatureGroup,
} from "../../models/FeatureArranger";
import Gene, { IdbRecord } from "../../models/Gene";
import OpenInterval from "../../models/OpenInterval";
import { SortItemsOptions } from "../../models/SortItemsOptions";
import NumericalTrack from "./commonComponents/numerical/NumericalTrack";

import TrackLegend from "./commonComponents/TrackLegend";
import GeneAnnotation from "./geneAnnotationTrackComponents/GeneAnnotation";
import GeneAnnotationScaffold from "./geneAnnotationTrackComponents/GeneAnnotationScaffold";
import { objToInstanceAlign } from "./TrackManager";
import BedAnnotation from "./bedComponents/BedAnnotation";
import CategoricalAnnotation from "./CategoricalComponents/CategoricalAnnotation";
import { RepeatDASFeature } from "./RepeatMaskerTrack";
import { RepeatMaskerFeature } from "../../models/RepeatMaskerFeature";
import BackgroundedText from "./geneAnnotationTrackComponents/BackgroundedText";
import AnnotationArrows from "./commonComponents/annotation/AnnotationArrows";
import { TranslatableG } from "./geneAnnotationTrackComponents/TranslatableG";
import { getContrastingColor } from "../../models/util";
import { scaleLinear } from "d3-scale";
enum BedColumnIndex {
  CATEGORY = 3,
}
const TOP_PADDING = 2;
export const displayModeComponentMap: { [key: string]: any } = {
  full: function getFull(
    formattedData,
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

        return getAnnotationElementMap[`${trackModel.type}`](
          placedGroup,
          y,
          rowIndex === maxRowIndex,
          i,
          configOptions.height
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
          options={configOptions}
          onClick={renderTooltip}
        >
          {placedGroup.placedFeatures.map((placedGene, i) => (
            <GeneAnnotation
              key={i}
              id={i}
              placedGene={placedGene}
              y={y}
              options={configOptions}
            />
          ))}
        </GeneAnnotationScaffold>
      );
    }
    function getBedAnnotationElement(placedGroup, y, isLastRow, index) {
      return placedGroup.placedFeatures.map((placement, i) => (
        <BedAnnotation
          key={i}
          feature={placement.feature}
          xSpan={placement.xSpan}
          y={y}
          isMinimal={isLastRow}
          color={configOptions.color}
          reverseStrandColor={configOptions.color2}
          isInvertArrowDirection={placement.isReverse}
          onClick={renderTooltip}
          alwaysDrawLabel={configOptions.alwaysDrawLabel}
          hiddenPixels={configOptions.hiddenPixels}
        />
      ));
    }
    const getAnnotationElementMap: { [key: string]: any } = {
      geneannotation: (placedGroup, y, isLastRow, index) =>
        getAnnotationElement(placedGroup, y, isLastRow, index),

      refbed: (placedGroup, y, isLastRow, index) =>
        getAnnotationElement(placedGroup, y, isLastRow, index),
      bed: (placedGroup, y, isLastRow, index) =>
        getBedAnnotationElement(placedGroup, y, isLastRow, index),
      bigbed: (placedGroup, y, isLastRow, index) =>
        getBedAnnotationElement(placedGroup, y, isLastRow, index),

      repeatmasker: function getAnnotationElement(
        placedGroup,
        y,
        isLastRow,
        index,
        height
      ) {
        const { categoryColors } = configOptions;
        const TEXT_HEIGHT = 9; // height for both text label and arrows.
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
          let scale = scaleLinear()
            .domain([1, 0])
            .range([TOP_PADDING, configOptions.height]);
          let y = scale(feature.value);
          const drawHeight = configOptions.height - y;
          console.log(drawHeight);
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
      },
      categorical: function getAnnotationElement(
        placedGroup,
        y,
        isLastRow,
        index,
        height
      ) {
        return placedGroup.placedFeatures.map((placement, i) => {
          const featureName = placement.feature.getName();
          const color =
            configOptions.category && configOptions.category[featureName]
              ? configOptions.category[`${featureName}`].color
              : "blue";

          return (
            <CategoricalAnnotation
              key={i}
              feature={placement.feature}
              xSpan={placement.xSpan}
              y={y}
              isMinimal={false}
              color={color}
              onClick={renderTooltip}
              category={configOptions.category}
              height={configOptions.height}
              alwaysDrawLabel={configOptions.alwaysDrawLabel}
            />
          );
        });
      },
    };

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

    let placeFeatureData = featureArrange.arrange(
      formattedData,
      useFineOrSecondaryParentNav
        ? objToInstanceAlign(trackState.visRegion)
        : currDisplayNav,
      useFineOrSecondaryParentNav ? trackState.visWidth : windowWidth * 3,
      getGenePadding,
      configOptions.hiddenPixels,
      sortType
    );
    let height;
    height =
      trackModel.type === "repeatmasker"
        ? configOptions.height
        : getHeight(placeFeatureData.numRowsAssigned);
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
    formattedData,
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

    function getNumLegend(legend: ReactNode) {
      //this will be trigger when creating canvaselemebt here and the saved canvaselement
      // is set to canvasComponent state which will update the legend ref without having to update manually

      updatedLegend.current = legend;
    }
    let canvasElements = (
      <NumericalTrack
        data={formattedData}
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
  drawData: { [key: string]: any },
  displaySetter,
  displayCache,
  cacheIdx,
  curXPos
) {
  if (drawData.configOptions.displayMode === "full") {
    let formattedData: Array<any> = [];
    if (drawData.trackModel.type === "geneannotation") {
      formattedData = drawData.genesArr.map((record) => new Gene(record));
    } else if (drawData.trackModel.type === "refbed") {
      formattedData = drawData.genesArr.map((record) => {
        const refBedRecord = {} as IdbRecord;
        refBedRecord.chrom = record.chr;
        refBedRecord.txStart = record.start;
        refBedRecord.txEnd = record.end;
        refBedRecord.id = record[7];
        refBedRecord.name = record[6];
        refBedRecord.description = record[11] ? record[11] : "";
        refBedRecord.transcriptionClass = record[8];
        refBedRecord.exonStarts = record[9];
        refBedRecord.exonEnds = record[10];
        refBedRecord.cdsStart = Number.parseInt(record[3], 10);
        refBedRecord.cdsEnd = Number.parseInt(record[4], 10);
        refBedRecord.strand = record[5];
        return new Gene(refBedRecord);
      });
    } else if (drawData.trackModel.type === "bed") {
      formattedData = drawData.genesArr.map((record) => {
        let newChrInt = new ChromosomeInterval(
          record.chr,
          record.start,
          record.end
        );
        return new Feature(
          newChrInt.toStringWithOther(newChrInt),
          newChrInt,
          ""
        );
      });
    } else if (drawData.trackModel.type === "categorical") {
      formattedData = drawData.genesArr.map(
        (record) =>
          new Feature(
            record[BedColumnIndex.CATEGORY],
            new ChromosomeInterval(record.chr, record.start, record.end)
          )
      );
    } else if (drawData.trackModel.type === "bigbed") {
      formattedData = drawData.genesArr.map((record) => {
        const fields = record["rest"].split("\t");

        const name = fields[0];
        const numVal = fields[1];
        const strand = fields[2];

        return new Feature(
          name,
          new ChromosomeInterval(record.chr, record.start, record.end),
          strand
        );
      });
    } else if (drawData.trackModel.type === "repeatmasker") {
      let rawDataArr: Array<RepeatDASFeature> = [];
      drawData.genesArr.map((record) => {
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
      });

      formattedData = rawDataArr.map(
        (feature) => new RepeatMaskerFeature(feature)
      );
    }
    let svgDATA = displayModeComponentMap["full"](
      formattedData,
      drawData.useFineOrSecondaryParentNav,
      drawData.trackState,
      drawData.windowWidth,
      drawData.configOptions,
      drawData.renderTooltip,
      drawData.svgHeight,
      drawData.updatedLegend,
      drawData.trackModel,
      drawData.getGenePadding,
      drawData.getHeight,
      drawData.ROW_HEIGHT
    );
    displaySetter.full.setComponents(svgDATA);
    displayCache.current.full[cacheIdx] = {
      svgDATA,
      height: drawData.svgHeight.current,
      xPos: curXPos,
    };
  } else if (drawData.configOptions.displayMode === "density") {
    let formattedData;
    if (drawData.trackModel.type === "geneannotation") {
      formattedData = drawData.genesArr.map((record) => {
        let newChrInt = new ChromosomeInterval(
          record.chrom,
          record.txStart,
          record.txEnd
        );
        return new NumericalFeature("", newChrInt).withValue(record.score);
      });
    } else if (drawData.trackModel.type === "bigbed") {
      formattedData = drawData.genesArr.map((record) => {
        const fields = record["rest"].split("\t");

        const name = fields[0];
        const numVal = fields[1];
        const strand = fields[2];
        let newChrInt = new ChromosomeInterval(
          record.chr,
          record.start,
          record.end
        );
        return new NumericalFeature(name, newChrInt, strand).withValue(
          record.score
        );
      });
    } else {
      formattedData = drawData.genesArr.map((record) => {
        let newChrInt = new ChromosomeInterval(
          record.chr,
          record.start,
          record.end
        );
        return new NumericalFeature("", newChrInt).withValue(record.score);
      });
    }

    let tmpObj = { ...drawData.configOptions };
    tmpObj.displayMode = "auto";

    let canvasElements = displayModeComponentMap["density"](
      formattedData,
      drawData.useFineOrSecondaryParentNav,
      drawData.trackState,
      drawData.windowWidth,
      tmpObj,
      drawData.updatedLegend,
      drawData.trackModel
    );

    displaySetter.density.setComponents(canvasElements);
    displayCache.current.density[cacheIdx] = {
      canvasData: canvasElements,
      height: tmpObj,
      xPos: curXPos,
    };
  }
}
