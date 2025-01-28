import { ReactNode } from "react";
import ChromosomeInterval from "../../../models/ChromosomeInterval";
import { removeDuplicates } from "./commonComponents/check-obj-dupe";
import Feature, {
  Fiber,
  JasparFeature,
  NumericalArrayFeature,
  NumericalFeature,
} from "../../../models/Feature";
import FeatureArranger, {
  PlacedFeatureGroup,
} from "../../../models/FeatureArranger";
import Gene, { IdbRecord } from "../../../models/Gene";
import OpenInterval from "../../../models/OpenInterval";
import { SortItemsOptions } from "../../../models/SortItemsOptions";
import NumericalTrack from "./commonComponents/numerical/NumericalTrack";

import TrackLegend from "./commonComponents/TrackLegend";
import GeneAnnotation from "./geneAnnotationTrackComponents/GeneAnnotation";
import GeneAnnotationScaffold from "./geneAnnotationTrackComponents/GeneAnnotationScaffold";
import { objToInstanceAlign } from "../TrackManager";
import BedAnnotation from "./bedComponents/BedAnnotation";
import CategoricalAnnotation from "./CategoricalComponents/CategoricalAnnotation";
import { RepeatDASFeature } from "../../../models/RepeatMaskerFeature";
import { RepeatMaskerFeature } from "../../../models/RepeatMaskerFeature";
import BackgroundedText from "./geneAnnotationTrackComponents/BackgroundedText";
import AnnotationArrows from "./commonComponents/annotation/AnnotationArrows";
import { TranslatableG } from "./geneAnnotationTrackComponents/TranslatableG";
import { v4 as uuidv4 } from "uuid";
import { getContrastingColor, parseNumberString } from "../../../models/util";
import { scaleLinear } from "d3-scale";

import MethylCRecord from "../../../models/MethylCRecord";
import MethylCTrackComputation from "./MethylcComponents/MethylCTrackComputation";
import DynseqTrackComponents from "./DynseqComponents/DynseqTrackComponents";
import {
  PlacedAlignment,
  PlacedMergedAlignment,
  renderFineAlignment,
  renderGapText,
  renderRoughAlignment,
  renderRoughStrand,
} from "./GenomeAlignComponents/GenomeAlignComponents";
import { GapText } from "./GenomeAlignComponents/MultiAlignmentViewCalculator";
import MatplotTrackComponent from "./commonComponents/numerical/MatplotTrackComponent";
import InteractionTrackComponent from "./InteractionComponents/InteractionTrackComponent";
import { GenomeInteraction } from "../../../getRemoteData/GenomeInteraction";
import FiberTrackComponent from "./bedComponents/FiberTrackComponent";
import FiberAnnotation from "./bedComponents/FiberAnnotation";
import DynamicplotTrackComponent from "./commonComponents/numerical/DynamicplotTrackComponent";
import QBed from "@eg/core/src/eg-lib/models/QBed";
import QBedTrackComponents from "./QBedComponents/QBedTrackComponents";
import BoxplotTrackComponents from "./commonComponents/stats/BoxplotTrackComponents";
import { Model } from "flexlayout-react";
import DynamicInteractionTrackComponents from "./InteractionComponents/DynamicInteractionTrackComponents";
import DynamicBedTrackComponents from "./bedComponents/DynamicBedTrackComponents";

import DynamicNumericalTrack from "./commonComponents/numerical/DynamicNumericalTrack";
import Snp from "@eg/core/src/eg-lib/models/Snp";
import SnpAnnotation from "./SnpComponents/SnpAnnotation";
import { BamAlignment } from "@eg/core/src/eg-lib/models/BamAlignment";
import { BamAnnotation } from "./BamComponents/BamAnnotation";
import ImageRecord from "@eg/core/src/eg-lib/models/ImageRecord";

import OmeroTrackComponents, {
  MAX_NUMBER_THUMBNAILS,
  THUMBNAIL_PADDING,
} from "./imageTrackComponents/OmeroTrackComponents";
import { initialLayout } from "@eg/core/src/eg-lib/models/layoutUtils";
import _, { uniqueId } from "lodash";
import RulerComponent from "./RulerComponents/RulerComponent";
import { getGenomeConfig } from "@eg/core/src/eg-lib/models/genomes/allGenomes";
import HoverToolTip from "./commonComponents/HoverToolTips/HoverToolTip";
import React from "react";

enum BedColumnIndex {
  CATEGORY = 3,
}
const TOP_PADDING = 2;
export const displayModeComponentMap: { [key: string]: any } = {
  full: function getFull({
    formattedData,
    trackState,
    windowWidth,
    configOptions,
    renderTooltip,
    svgHeight,
    updatedLegend,
    trackModel,
    getGenePadding,
    getHeight,
    ROW_HEIGHT,
    onHideTooltip = undefined,
  }) {
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
      let svgKey = uuidv4();
      if (configOptions.forceSvg) {
        let start = trackState.viewWindow.start + trackState.visWidth / 3;

        let end = trackState.viewWindow.end - trackState.visWidth / 3;
        let svgWidth = end - start;
        return (
          <svg
            key={svgKey}
            width={width / 3}
            viewBox={`${start} 0 ${svgWidth} ${height}`}
            height={height}
            display={"block"}
          >
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

      return (
        <svg key={svgKey} width={width} height={height} display={"block"}>
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

    // the function to create individual feature element from the GeneAnnotation track which is passed down to full visualizer
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
      jaspar: function getAnnotationElement(
        placedGroup,
        y,
        isLastRow,
        index,
        height
      ) {
        let scoreScale = scaleLinear()
          .domain([0, 1000])
          .range([0, 1])
          .clamp(true);
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
            opacity={scoreScale(placement.feature.score)}
          />
        ));
      },
      bigbed: (placedGroup, y, isLastRow, index) =>
        getBedAnnotationElement(placedGroup, y, isLastRow, index),
      modbed: function getAnnotationElement(
        placedGroup,
        y,
        isLastRow,
        index,
        height
      ) {
        return placedGroup.placedFeatures.map((placement, i) => (
          <FiberAnnotation
            key={i}
            placement={placement}
            y={y}
            isMinimal={isLastRow}
            color={configOptions.color}
            color2={configOptions.color2}
            rowHeight={configOptions.rowHeight}
            renderTooltip={renderTooltip}
            onHideTooltip={onHideTooltip}
            hiddenPixels={configOptions.hiddenPixels}
            hideMinimalItems={configOptions.hideMinimalItems}
            pixelsPadding={configOptions.pixelsPadding}
          />
        ));
      },
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

      snp: function getAnnotationElement(
        placedGroup,
        y,
        isLastRow,
        index,
        height
      ) {
        return placedGroup.placedFeatures.map((placement, i) => (
          <SnpAnnotation
            key={i}
            snp={placement.feature}
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
      },

      bam: function getAnnotationElement(
        placedGroup,
        y,
        isLastRow,
        index,
        height
      ) {
        return placedGroup.placedFeatures.map((placement, i) => (
          <BamAnnotation
            key={i}
            placedRecord={placement}
            y={y}
            onClick={renderTooltip}
            options={configOptions}
          />
        ));
      },
    };

    if (trackModel.type === "omeroidr") {
      const calcTrackHeight = () => {
        let viewWindow = {
          start: 0,
          end: trackState.visWidth,
        };
        const totalImgCount = _.sum(
          formattedData.map((item) => item.images.length)
        );
        const imgCount = Math.min(totalImgCount, MAX_NUMBER_THUMBNAILS);
        const totalImageWidth = Math.max(
          (configOptions.imageHeight[0] * configOptions.imageAspectRatio +
            THUMBNAIL_PADDING) *
            imgCount -
            THUMBNAIL_PADDING,
          0
        );
        const screenWidth = viewWindow.end - viewWindow.start;
        const rowsNeed = Math.floor(totalImageWidth / screenWidth) + 1;
        const trackHeight =
          rowsNeed * (configOptions.imageHeight[0] + THUMBNAIL_PADDING) -
          THUMBNAIL_PADDING;
        return { trackHeight, numHidden: totalImgCount - imgCount };
      };
      let heightObj = calcTrackHeight();
      if (svgHeight) {
        svgHeight.current = heightObj.trackHeight;
      }

      if (updatedLegend) {
        updatedLegend.current = (
          <TrackLegend height={svgHeight.current} trackModel={trackModel} />
        );
      }

      return (
        <OmeroTrackComponents
          data={formattedData}
          options={configOptions}
          viewWindow={{
            start: 0,
            end: trackState.visWidth,
          }}
          trackModel={trackModel}
          forceSvg={false}
          width={0}
          layoutModel={Model.fromJson(initialLayout)}
          isThereG3dTrack={false}
          onSetImageInfo={() => {}}
          heightObj={heightObj}
        />
      );
    }
    let featureArrange = new FeatureArranger();

    let sortType = SortItemsOptions.NOSORT;
    let placeFeatureData = featureArrange.arrange(
      formattedData,
      objToInstanceAlign(trackState.visRegion),
      trackState.visWidth,
      getGenePadding,
      configOptions.hiddenPixels,
      sortType
    );

    // if (configOptions.forceSvg) {
    //   placeFeatureData.placements = placeFeatureData.placements.filter(
    //     (feature) => {
    //       const curXSpan = feature.xSpan;

    //       return !(
    //         curXSpan.end <
    //           trackState.viewWindow.start + trackState.visWidth / 3 ||
    //         curXSpan.start > trackState.viewWindow.end - trackState.visWidth / 3
    //       );
    //     }
    //   );
    // }
    var height;

    height =
      trackModel.type in { repeatmasker: "" }
        ? configOptions.height
        : getHeight(placeFeatureData.numRowsAssigned);

    var svgDATA = createFullVisualizer(
      placeFeatureData.placements,
      trackState.visWidth,
      height,
      ROW_HEIGHT,
      configOptions.maxRows
    );
    if (svgHeight) {
      svgHeight.current = height;
    }
    if (updatedLegend) {
      updatedLegend.current = (
        <TrackLegend height={height} trackModel={trackModel} />
      );
    }

    return svgDATA;
  },

  density: function getDensity({
    formattedData,
    trackState,
    windowWidth,
    configOptions,
    updatedLegend,
    trackModel,
  }) {
    function getNumLegend(legend: ReactNode) {
      updatedLegend.current = legend;
    }

    let canvasElements = (
      <NumericalTrack
        data={formattedData}
        options={configOptions}
        viewWindow={
          trackState.viewWindow
            ? trackState.viewWindow
            : new OpenInterval(0, trackState.visWidth)
        }
        viewRegion={objToInstanceAlign(trackState.visRegion)}
        width={trackState.visWidth}
        forceSvg={configOptions.forceSvg}
        trackModel={trackModel}
        getNumLegend={getNumLegend}
      />
    );
    return canvasElements;
  },

  qbed: function getqbed({
    formattedData,
    trackState,
    windowWidth,
    configOptions,
    updatedLegend,
    trackModel,
  }) {
    function getNumLegend(legend: ReactNode) {
      updatedLegend.current = legend;
    }
    let canvasElements = (
      <QBedTrackComponents
        data={formattedData}
        options={configOptions}
        viewRegion={objToInstanceAlign(trackState.visRegion)}
        width={trackState.visWidth}
        viewWindow={trackState.viewWindow}
        trackModel={trackModel}
        isLoading={false}
        error={undefined}
        forceSvg={configOptions.forceSvg}
      />
    );
    return canvasElements;
  },

  boxplot: function getboxplot({
    formattedData,
    trackState,
    windowWidth,
    configOptions,
    updatedLegend,
    trackModel,
  }) {
    function getNumLegend(legend: ReactNode) {
      updatedLegend.current = legend;
    }
    let canvasElements = (
      <BoxplotTrackComponents
        data={formattedData}
        options={configOptions}
        viewWindow={trackState.viewWindow}
        viewRegion={objToInstanceAlign(trackState.visRegion)}
        width={trackState.visWidth}
        forceSvg={configOptions.forceSvg}
        trackModel={trackModel}
        isLoading={false}
        error={undefined}
        unit={""}
      />
    );
    return canvasElements;
  },

  matplot: function getMatplot({
    formattedData,
    trackState,
    windowWidth,
    configOptions,
    updatedLegend,
    trackModel,
  }) {
    function getNumLegend(legend: ReactNode) {
      updatedLegend.current = legend;
    }

    let canvasElements = (
      <MatplotTrackComponent
        data={formattedData}
        options={configOptions}
        viewWindow={trackState.viewWindow}
        viewRegion={objToInstanceAlign(trackState.visRegion)}
        width={trackState.visWidth}
        forceSvg={configOptions.forceSvg}
        trackModel={trackModel}
        getNumLegend={getNumLegend}
      />
    );
    return canvasElements;
  },

  dynamichic: function getDynamichic({
    formattedData,
    trackState,
    windowWidth,
    configOptions,
    updatedLegend,
    trackModel,
  }) {
    let canvasElements = (
      <DynamicInteractionTrackComponents
        data={formattedData}
        options={configOptions}
        viewWindow={
          new OpenInterval(trackState.startWindow, trackState.startWindow * 2)
        }
        visRegion={objToInstanceAlign(trackState.visRegion)}
        width={trackState.visWidth}
        trackModel={trackModel}
      />
    );
    return canvasElements;
  },

  dynamicbed: function getdynamicbed({
    formattedData,
    trackState,
    windowWidth,
    configOptions,
    renderTooltip,
    trackModel,
    svgHeight,
    updatedLegend,
    getGenePadding,
    getHeight,
    ROW_HEIGHT,
  }) {
    let canvasElements = (
      <DynamicBedTrackComponents
        data={formattedData}
        options={configOptions}
        viewWindow={new OpenInterval(0, trackState.visWidth)}
        visRegion={objToInstanceAlign(trackState.visRegion)}
        width={trackState.visWidth}
        trackModel={trackModel}
      />
    );
    return canvasElements;
  },

  dbedgraph: function getdbedgraph({
    formattedData,
    trackState,
    windowWidth,
    configOptions,
    updatedLegend,
    trackModel,
  }) {
    let canvasElements = (
      <DynamicNumericalTrack
        data={formattedData}
        options={configOptions}
        viewWindow={new OpenInterval(0, trackState.visWidth)}
        viewRegion={objToInstanceAlign(trackState.visRegion)}
        width={trackState.visWidth}
        trackModel={trackModel}
      />
    );
    return canvasElements;
  },

  dynamic: function dynamic({
    formattedData,
    trackState,
    windowWidth,
    configOptions,
    updatedLegend,
    trackModel,
  }) {
    function getNumLegend(legend: ReactNode) {
      updatedLegend.current = legend;
    }
    let canvasElements = (
      <DynamicplotTrackComponent
        data={formattedData}
        options={configOptions}
        viewWindow={new OpenInterval(0, trackState.visWidth)}
        viewRegion={objToInstanceAlign(trackState.visRegion)}
        width={trackState.visWidth}
        trackModel={trackModel}
      />
    );
    return canvasElements;
  },

  modbed: function getModbed({
    formattedData,
    trackState,
    windowWidth,
    configOptions,
    updatedLegend,
    trackModel,
    renderTooltip,
    svgHeight,
    getGenePadding,
    getHeight,
    ROW_HEIGHT,
    onHideToolTip,
  }) {
    const FIBER_DENSITY_CUTOFF_LENGTH = 300000;
    let currDisplayNav;

    if (
      objToInstanceAlign(trackState.visRegion).getWidth() >
      FIBER_DENSITY_CUTOFF_LENGTH
    ) {
      function getNumLegend(legend: ReactNode) {
        updatedLegend.current = legend;
      }
      let canvasElements = (
        <FiberTrackComponent
          data={formattedData}
          options={configOptions}
          viewWindow={trackState.viewWindow}
          width={trackState.visWidth}
          forceSvg={configOptions.forceSvg}
          visRegion={objToInstanceAlign(trackState.visRegion)}
          trackModel={trackModel}
          getNumLegend={getNumLegend}
          isLoading={false}
        />
      );
      return canvasElements;
    } else {
      let elements = displayModeComponentMap["full"]({
        formattedData,
        trackState,
        windowWidth,

        configOptions,
        renderTooltip,
        svgHeight,
        updatedLegend,
        trackModel,
        getGenePadding,
        getHeight,
        ROW_HEIGHT,
        onHideToolTip,
      });
      return elements;
    }
  },

  interaction: function getInteraction({
    formattedData,
    trackState,
    windowWidth,
    configOptions,
    updatedLegend,
    trackModel,
  }) {
    function getNumLegend(legend: ReactNode) {
      updatedLegend.current = legend;
    }

    let canvasElements = (
      <InteractionTrackComponent
        data={formattedData}
        options={configOptions}
        viewWindow={trackState.viewWindow}
        visRegion={objToInstanceAlign(trackState.visRegion)}
        width={trackState.visWidth}
        forceSvg={configOptions.forceSvg}
        trackModel={trackModel}
        getNumLegend={getNumLegend}
      />
    );

    return canvasElements;
  },

  methylc: function getMethylc({
    formattedData,
    trackState,
    windowWidth,
    configOptions,
    updatedLegend,
    trackModel,
  }) {
    function getNumLegend(legend: ReactNode) {
      updatedLegend.current = legend;
    }

    let canvasElements = (
      <MethylCTrackComputation
        data={formattedData}
        options={configOptions}
        viewWindow={trackState.viewWindow}
        viewRegion={objToInstanceAlign(trackState.visRegion)}
        width={trackState.visWidth}
        forceSvg={configOptions.forceSvg}
        trackModel={trackModel}
        getNumLegend={getNumLegend}
      />
    );

    return canvasElements;
  },

  dynseq: function getDynseq({
    formattedData,
    trackState,
    windowWidth,
    configOptions,
    updatedLegend,
    trackModel,
    genomeConfig,
    basesByPixel,
  }) {
    function getNumLegend(legend: ReactNode) {
      updatedLegend.current = legend;
    }

    let canvasElements = (
      <DynseqTrackComponents
        data={formattedData}
        options={configOptions}
        viewWindow={trackState.viewWindow}
        viewRegion={objToInstanceAlign(trackState.visRegion)}
        width={trackState.visWidth}
        forceSvg={configOptions.forceSvg}
        trackModel={trackModel}
        getNumLegend={getNumLegend}
        basesByPixel={basesByPixel}
        genomeConfig={genomeConfig}
      />
    );

    return canvasElements;
  },
};

export function getDisplayModeFunction(
  drawData: { [key: string]: any },
  displaySetter?: any,
  displayCache?: any,
  cacheIdx?: any,
  curXPos?: any
) {
  if (drawData.trackModel.type === "ruler") {
    function getNumLegend(legend: ReactNode) {
      drawData.updatedLegend.current = legend;
    }

    let canvasElements = (
      <RulerComponent
        viewRegion={objToInstanceAlign(drawData.trackState.visRegion)}
        width={drawData.trackState.visWidth}
        trackModel={drawData.trackModel}
        selectedRegion={objToInstanceAlign(
          drawData.trackState.genomicFetchCoord[`${drawData.genomeName}`]
            .primaryVisData.viewWindowRegion
        )}
        viewWindow={drawData.trackState.viewWindow}
        getNumLegend={getNumLegend}
        genomeConfig={getGenomeConfig(drawData.genomeName)}
        options={drawData.configOptions}
      />
    );

    return canvasElements;
  } else if (
    drawData.configOptions.displayMode === "full" &&
    drawData.trackModel.type !== "genomealign"
  ) {
    let formattedData: Array<any> = [];
    if (drawData.trackModel.type === "geneannotation") {
      const filteredArray = removeDuplicates(drawData.genesArr, "id");
      formattedData = filteredArray.map((record) => new Gene(record));
    } else if (drawData.trackModel.type === "refbed") {
      const filteredArray = removeDuplicates(drawData.genesArr, 7);

      formattedData = filteredArray.map((record) => {
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
      const filteredArray = removeDuplicates(drawData.genesArr, "start", "end");
      formattedData = filteredArray.map((record) => {
        let newChrInt = new ChromosomeInterval(
          record.chr,
          record.start,
          record.end
        );
        return new Feature(
          newChrInt.toStringWithOther(newChrInt),
          newChrInt,
          drawData.trackModel.isText ? record[5] : ""
        );
      });
    } else if (drawData.trackModel.type === "categorical") {
      const filteredArray = removeDuplicates(drawData.genesArr, "start", "end");
      formattedData = filteredArray.map(
        (record) =>
          new Feature(
            record[BedColumnIndex.CATEGORY],
            new ChromosomeInterval(record.chr, record.start, record.end)
          )
      );
    } else if (drawData.trackModel.type === "bam") {
      const filteredArray = removeDuplicates(drawData.genesArr, "_id");
      formattedData = BamAlignment.makeBamAlignments(filteredArray);
    } else if (drawData.trackModel.type === "omeroidr") {
      formattedData = drawData.genesArr.map(
        (record) => new ImageRecord(record)
      );
    } else if (drawData.trackModel.type === "bigbed") {
      const filteredArray = removeDuplicates(drawData.genesArr, "rest");
      formattedData = filteredArray.map((record) => {
        const fields = record.rest.split("\t");

        const name = fields[0];
        const numVal = fields[1];
        const strand = fields[2];

        return new Feature(
          name,
          new ChromosomeInterval(record.chr, record.start, record.end),
          strand
        );
      });
    } else if (drawData.trackModel.type === "snp") {
      const filteredArray = removeDuplicates(drawData.genesArr, "id");
      formattedData = filteredArray.map((record) => new Snp(record));
    } else if (drawData.trackModel.type === "repeatmasker") {
      let rawDataArr: Array<RepeatDASFeature> = [];
      drawData.genesArr.map((record) => {
        const restValues = record.rest.split("\t");
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
    } else if (drawData.trackModel.type === "jaspar") {
      const filteredArray = removeDuplicates(drawData.genesArr, "uniqueId");

      formattedData = filteredArray.map((record) => {
        const rest = record.rest.split("\t");
        return new JasparFeature(
          rest[3],
          new ChromosomeInterval(record.chr, record.start, record.end),
          rest[2]
        ).withJaspar(Number.parseInt(rest[1], 10), rest[0]);
      });
    }
    if (!drawData.trackState.visRegion) console.log(drawData);
    let svgDATA = displayModeComponentMap.full({
      formattedData,
      trackState: drawData.trackState,
      windowWidth: drawData.windowWidth,
      configOptions: drawData.configOptions,
      renderTooltip: drawData.renderTooltip,
      svgHeight: drawData.svgHeight,
      updatedLegend: drawData.updatedLegend,
      trackModel: drawData.trackModel,
      getGenePadding: drawData.getGenePadding,
      getHeight: drawData.getHeight,
      ROW_HEIGHT: drawData.ROW_HEIGHT,
    });

    return svgDATA;
  } else if (drawData.trackModel.type === "genomealign") {
    let result = drawData.genesArr.records;
    let svgElements;

    if (drawData.basesByPixel <= 10) {
      const drawDatas = result.drawData as PlacedAlignment[];
      drawData.updatedLegend.current = (
        <TrackLegend
          height={drawData.configOptions.height}
          trackModel={drawData.trackModel}
        />
      );
      svgElements = drawDatas.map((item, index) =>
        renderFineAlignment(item, index, drawData.configOptions)
      );
      const drawGapText = result.drawGapText as GapText[];
      svgElements.push(
        drawGapText.map((item, index) =>
          renderGapText(item, index, drawData.configOptions)
        )
      );
      let element;
      if (drawData.configOptions.forceSvg) {
        let start =
          drawData.trackState.viewWindow.start +
          drawData.trackState.visWidth / 3;

        let end =
          drawData.trackState.viewWindow.end - drawData.trackState.visWidth / 3;
        let svgWidth = end - start;
        element = (
          <svg
            key={uuidv4()}
            width={drawData.trackState.visWidth / 3}
            viewBox={`${start} 0 ${svgWidth} ${drawData.configOptions.height}`}
            height={drawData.configOptions.height}
            display={"block"}
          >
            {svgElements}
          </svg>
        );
      } else {
        element = (
          <React.Fragment>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                position: "absolute",
                zIndex: 3,
              }}
            >
              <HoverToolTip
                data={drawData.genesArr}
                windowWidth={drawData.trackState.visWidth}
                trackType={"genomealignFine"}
                height={drawData.configOptions.height}
                viewRegion={drawData.trackState.visRegion}
                side={drawData.trackState.side}
                options={drawData.configOptions}
              />
            </div>

            <svg
              key={uuidv4()}
              width={drawData.trackState.visWidth}
              height={drawData.configOptions.height}
              display={"block"}
            >
              {svgElements}
            </svg>
          </React.Fragment>
        );
      }
      drawData.genesArr.records = "";
      return element;
    } else {
      console.log(drawData.genesArr);
      const drawDatas = result.drawData as PlacedMergedAlignment[];
      drawData.updatedLegend.current = (
        <TrackLegend
          height={drawData.configOptions.height}
          trackModel={drawData.trackModel}
        />
      );
      const strand = result.plotStrand;
      const targetGenome = result.primaryGenome;
      const queryGenome = result.queryGenome;
      svgElements = drawDatas.map((placement) =>
        renderRoughAlignment(
          placement,
          strand === "-",
          80,
          targetGenome,
          queryGenome
        )
      );
      const arrows = renderRoughStrand(
        "+",
        0,
        new OpenInterval(0, drawData.windowWidth * 3),
        false
      );
      svgElements.push(arrows);

      const primaryArrows = renderRoughStrand(
        strand,
        80 - 15,
        new OpenInterval(0, drawData.windowWidth * 3),
        true
      );
      svgElements.push(primaryArrows);
      let element;
      if (drawData.configOptions.forceSvg) {
        let start =
          drawData.trackState.viewWindow.start +
          drawData.trackState.visWidth / 3;

        let end =
          drawData.trackState.viewWindow.end - drawData.trackState.visWidth / 3;
        let svgWidth = end - start;
        element = (
          <svg
            width={drawData.trackState.visWidth / 3}
            viewBox={`${start} 0 ${svgWidth} ${drawData.configOptions.height}`}
            height={drawData.configOptions.height}
            display={"block"}
          >
            {svgElements}
          </svg>
        );
      } else {
        element = (
          <React.Fragment>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                position: "absolute",
                zIndex: 3,
              }}
            >
              <HoverToolTip
                data={drawData.genesArr}
                windowWidth={drawData.trackState.visWidth}
                trackType={"genomealignRough"}
                height={drawData.configOptions.height}
                viewRegion={drawData.trackState.visRegion}
                side={drawData.trackState.side}
                options={drawData.configOptions}
              />
            </div>

            <svg
              width={drawData.trackState.visWidth}
              height={drawData.configOptions.height}
              display={"block"}
            >
              {svgElements}
            </svg>
          </React.Fragment>
        );
      }
      drawData.genesArr.records = "";
      return element;
    }
  } else if (drawData.trackModel.type === "matplot") {
    let formattedData: Array<any> = [];

    for (let i = 0; i < drawData.genesArr.length; i++) {
      formattedData.push(
        drawData.genesArr[i].map((record) => {
          let newChrInt = new ChromosomeInterval(
            record.chr,
            record.start,
            record.end
          );
          return new NumericalFeature("", newChrInt).withValue(record.score);
        })
      );
    }
    let tmpObj = { ...drawData.configOptions };
    tmpObj.displayMode = "auto";

    let canvasElements = displayModeComponentMap["matplot"]({
      formattedData,
      trackState: drawData.trackState,
      windowWidth: drawData.windowWidth,
      configOptions: tmpObj,
      updatedLegend: drawData.updatedLegend,
      trackModel: drawData.trackModel,
    });

    return canvasElements;
  } else if (drawData.trackModel.type === "modbed") {
    let formattedData;
    formattedData = drawData.genesArr.map((record) => {
      return new Fiber(
        record[3],
        new ChromosomeInterval(record.chr, record.start, record.end),
        record[5]
      ).withFiber(parseNumberString(record[4]), record[6], record[7]);
    });

    let elements = displayModeComponentMap.modbed({
      formattedData,
      trackState: drawData.trackState,
      windowWidth: drawData.windowWidth,
      configOptions: drawData.configOptions,
      updatedLegend: drawData.updatedLegend,
      trackModel: drawData.trackModel,
      renderTooltip: drawData.renderTooltip,
      svgHeight: drawData.svgHeight,
      getGenePadding: drawData.getGenePadding,
      getHeight: drawData.getHeight,
      ROW_HEIGHT: drawData.configOptions.rowHeight + 2,
      onHideToolTip: drawData.onHideToolTip,
    });

    return elements;
  } else if (
    drawData.trackModel.type in { hic: "", biginteract: "", longrange: "" }
  ) {
    let formattedData: any = [];
    if (drawData.trackModel.type === "biginteract") {
      drawData.genesArr.map((record) => {
        const regexMatch = record.rest.match(
          /([\w.]+)\W+(\d+)\W+(\d+)\W+(\d+)/
        );

        if (regexMatch) {
          const fields = record.rest.split("\t");

          const score = parseInt(fields[1]);
          const region1Chrom = fields[5];
          const region1Start = parseInt(fields[6]);
          const region1End = parseInt(fields[7]);
          const region2Chrom = fields[10];
          const region2Start = parseInt(fields[11]);
          const region2End = parseInt(fields[12]);

          const recordLocus1 = new ChromosomeInterval(
            region1Chrom,
            region1Start,
            region1End
          );
          const recordLocus2 = new ChromosomeInterval(
            region2Chrom,
            region2Start,
            region2End
          );
          formattedData.push(
            new GenomeInteraction(recordLocus1, recordLocus2, score)
          );
        } else {
          console.error(
            `${record[3]} not formatted correctly in BIGinteract track`
          );
        }
      });
    } else if (drawData.trackModel.type === "longrange") {
      drawData.genesArr.map((record) => {
        const regexMatch = record[3].match(/([\w.]+)\W+(\d+)\W+(\d+)\W+(\d+)/);

        if (regexMatch) {
          const chr = regexMatch[1];
          const start = Number.parseInt(regexMatch[2], 10);
          const end = Number.parseInt(regexMatch[3], 10);
          const score = Number.parseFloat(record[3].split(",")[1]);
          const recordLocus1 = new ChromosomeInterval(
            record.chr,
            record.start,
            record.end
          );
          const recordLocus2 = new ChromosomeInterval(chr, start, end);
          formattedData.push(
            new GenomeInteraction(recordLocus1, recordLocus2, score)
          );
        } else {
          console.error(
            `${record[3]} not formatted correctly in longrange track`
          );
        }
      });
    } else {
      formattedData = drawData.genesArr;
    }

    let canvasElements = displayModeComponentMap.interaction({
      formattedData,
      trackState: drawData.trackState,
      windowWidth: drawData.windowWidth,
      configOptions: drawData.configOptions,
      updatedLegend: drawData.updatedLegend,
      trackModel: drawData.trackModel,
    });

    return canvasElements;
  } else if (drawData.trackModel.type === "dynamichic") {
    console.log(drawData);
    let formattedData = drawData.genesArr;
    let canvasElements = displayModeComponentMap[drawData.trackModel.type]({
      formattedData,
      trackState: drawData.trackState,
      windowWidth: drawData.windowWidth,
      configOptions: { ...drawData.configOptions, displayMode: "heatmap" },
      updatedLegend: drawData.updatedLegend,
      trackModel: drawData.trackModel,
    });

    return canvasElements;
  } else if (
    drawData.trackModel.type in
    { dynamic: "", dynamicbed: "", dynamiclongrange: "" }
  ) {
    let formattedData: Array<any> = [];
    if (drawData.trackModel.type === "dynamicbed") {
      formattedData = drawData.genesArr.map((geneArr: any) =>
        geneArr.map(
          (record) =>
            new Feature(
              record[3],
              new ChromosomeInterval(record.chr, record.start, record.end)
            )
        )
      );
    } else if (drawData.trackModel.type === "dynamiclongrange") {
      formattedData = drawData.genesArr.map((geneArr: any) => {
        let tempLongrangeData: any[] = [];
        geneArr.map((record) => {
          const regexMatch = record[3].match(
            /([\w.]+)\W+(\d+)\W+(\d+)\W+(\d+)/
          );
          if (regexMatch) {
            const chr = regexMatch[1];
            const start = Number.parseInt(regexMatch[2], 10);
            const end = Number.parseInt(regexMatch[3], 10);
            const score = Number.parseFloat(record[3].split(",")[1]);
            const recordLocus1 = new ChromosomeInterval(
              record.chr,
              record.start,
              record.end
            );
            const recordLocus2 = new ChromosomeInterval(chr, start, end);
            tempLongrangeData.push(
              new GenomeInteraction(recordLocus1, recordLocus2, score)
            );
          } else {
            console.error(
              `${record[3]} not formatted correctly in longrange track`
            );
          }
        });
        return tempLongrangeData;
      });
    } else {
      formattedData = drawData.genesArr.map((geneArr: any) =>
        geneArr.map((record) =>
          new NumericalFeature(
            "",
            new ChromosomeInterval(record.chr, record.start, record.end)
          ).withValue(record.score)
        )
      );
    }

    let canvasElements = displayModeComponentMap[
      drawData.trackModel.type === "dynamiclongrange"
        ? "dynamichic"
        : drawData.trackModel.type
    ]({
      formattedData,
      trackState: drawData.trackState,
      windowWidth: drawData.windowWidth,
      configOptions: drawData.configOptions,
      updatedLegend: drawData.updatedLegend,
      trackModel: drawData.trackModel,
      getGenePadding: drawData.getGenePadding,
      getHeight: drawData.getHeight,
      ROW_HEIGHT: drawData.ROW_HEIGHT,
    });

    return canvasElements;
  } else if (drawData.trackModel.type in { methylc: "", dynseq: "" }) {
    let formattedData = drawData.genesArr.map((record) => {
      if (drawData.trackModel.type === "methylc") {
        return new MethylCRecord(record);
      } else {
        let newChrInt = new ChromosomeInterval(
          record.chr,
          record.start,
          record.end
        );
        return new NumericalFeature("", newChrInt).withValue(record.score);
      }
    });

    let canvasElements = displayModeComponentMap[drawData.trackModel.type]({
      formattedData,
      trackState: drawData.trackState,
      windowWidth: drawData.windowWidth,
      configOptions: drawData.configOptions,
      updatedLegend: drawData.updatedLegend,
      trackModel: drawData.trackModel,
      genomeConfig: drawData.genomeConfig,
      basesByPixel: drawData.basesByPixel,
    });

    return canvasElements;
  } else if (drawData.trackModel.type === "qbed") {
    let formattedData = drawData.genesArr.map((record) => new QBed(record));

    let canvasElements = displayModeComponentMap.qbed({
      formattedData,
      trackState: drawData.trackState,
      windowWidth: drawData.windowWidth,
      configOptions: drawData.configOptions,
      updatedLegend: drawData.updatedLegend,
      trackModel: drawData.trackModel,
    });

    return canvasElements;
  } else if (drawData.trackModel.type === "dbedgraph") {
    const VALUE_COLUMN_INDEX = 3;
    let formattedData = drawData.genesArr.map((record) => {
      const locus = new ChromosomeInterval(
        record.chr,
        record.start,
        record.end
      );
      let parsedValue;
      try {
        parsedValue = JSON.parse(record[VALUE_COLUMN_INDEX]);
      } catch (e) {
        console.error(e);
        parsedValue = [0];
      }
      return new NumericalArrayFeature("", locus).withValues(parsedValue);
    });

    let canvasElements = displayModeComponentMap.dbedgraph({
      formattedData,
      trackState: drawData.trackState,
      windowWidth: drawData.windowWidth,
      configOptions: drawData.configOptions,
      updatedLegend: drawData.updatedLegend,
      trackModel: drawData.trackModel,
    });

    return canvasElements;
  } else if (drawData.trackModel.type === "boxplot") {
    let formattedData = drawData.genesArr.map((record) => {
      let newChrInt = new ChromosomeInterval(
        record.chr,
        record.start,
        record.end
      );
      return new NumericalFeature("", newChrInt).withValue(record.score);
    });

    let canvasElements = displayModeComponentMap.boxplot({
      formattedData,
      trackState: drawData.trackState,
      windowWidth: drawData.windowWidth,
      configOptions: drawData.configOptions,
      updatedLegend: drawData.updatedLegend,
      trackModel: drawData.trackModel,
    });

    return canvasElements;
  } else if (
    drawData.trackModel.type in { bigwig: "", qbed: "", bedgraph: "" } ||
    drawData.configOptions.displayMode === "density"
  ) {
    let formattedData;
    if (drawData.trackModel.type === "geneannotation") {
      const filteredArray = removeDuplicates(drawData.genesArr, "id");
      formattedData = filteredArray.map((record) => {
        let newChrInt = new ChromosomeInterval(
          record.chrom,
          record.txStart,
          record.txEnd
        );
        return new NumericalFeature("", newChrInt).withValue(record.score);
      });
    } else if (drawData.trackModel.type === "bigbed") {
      formattedData = drawData.genesArr.map((record) => {
        const fields = record.rest.split("\t");

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
    } else if (
      drawData.trackModel.type === "bedgraph" ||
      drawData.trackModel.filetype === "bedgraph"
    ) {
      const VALUE_COLUMN_INDEX = 3;
      formattedData = drawData.genesArr.map((record) => {
        let newChrInt = new ChromosomeInterval(
          record.chr,
          record.start,
          record.end
        );
        const unsafeValue = Number(record[VALUE_COLUMN_INDEX]);
        const value = Number.isFinite(unsafeValue) ? unsafeValue : 0;
        return new NumericalFeature("", newChrInt).withValue(value);
      });
    } else if (drawData.trackModel.type === "snp") {
      formattedData = drawData.genesArr.map((record) => new Snp(record));
    } else if (drawData.trackModel.type === "bam") {
      formattedData = BamAlignment.makeBamAlignments(drawData.genesArr);
    } else if (drawData.trackModel.type === "omeroidr") {
      formattedData = drawData.genesArr.map(
        (record) => new ImageRecord(record)
      );
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
    let newConfigOptions = { ...drawData.configOptions };
    if (drawData.trackModel.type !== "bigwig") {
      newConfigOptions.displayMode = "auto";
    }
    let canvasElements = displayModeComponentMap.density({
      formattedData,
      trackState: drawData.trackState,
      windowWidth: drawData.windowWidth,
      configOptions: newConfigOptions,
      updatedLegend: drawData.updatedLegend,
      trackModel: drawData.trackModel,
    });

    return canvasElements;
  }
}
