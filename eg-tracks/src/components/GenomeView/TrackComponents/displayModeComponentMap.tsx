import ChromosomeInterval from "../../../models/ChromosomeInterval";
import Feature, {
  ColoredFeature,
  Fiber,
  JasparFeature,
  NumericalArrayFeature,
  NumericalFeature,
} from "../../../models/Feature";

import { Rmskv2Feature } from "../../../models/Rmskv2Feature";
import FeatureArranger from "../../../models/FeatureArranger";
import Gene from "../../../models/Gene";
import OpenInterval from "../../../models/OpenInterval";
import { SortItemsOptions } from "../../../models/SortItemsOptions";
import NumericalTrack from "./commonComponents/numerical/NumericalTrack";
import TrackLegend from "./commonComponents/TrackLegend";
import GeneAnnotationScaffold from "./geneAnnotationTrackComponents/GeneAnnotationScaffold";
import { objToInstanceAlign } from "../TrackManager";
import BedAnnotation from "./bedComponents/BedAnnotation";
import CategoricalAnnotation from "./CategoricalComponents/CategoricalAnnotation";
import { RepeatMaskerFeature } from "../../../models/RepeatMaskerFeature";
import BackgroundedText from "./geneAnnotationTrackComponents/BackgroundedText";
import AnnotationArrows from "./commonComponents/annotation/AnnotationArrows";
import { TranslatableG } from "./geneAnnotationTrackComponents/TranslatableG";
import { getContrastingColor, parseNumberString } from "../../../models/util";
import { scaleLinear } from "d3-scale";
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
import QBedTrackComponents from "./QBedComponents/QBedTrackComponents";
import BoxplotTrackComponents from "./commonComponents/stats/BoxplotTrackComponents";
import { Model } from "flexlayout-react";
import DynamicInteractionTrackComponents from "./InteractionComponents/DynamicInteractionTrackComponents";
import DynamicBedTrackComponents from "./bedComponents/DynamicBedTrackComponents";
import DynamicNumericalTrack from "./commonComponents/numerical/DynamicNumericalTrack";
import Snp from "../../../models/Snp";
import SnpAnnotation from "./SnpComponents/SnpAnnotation";
import { BamAlignment } from "../../../models/BamAlignment";
import { BamAnnotation } from "./BamComponents/BamAnnotation";
import ImageRecord from "../../../models/ImageRecord";
import OmeroTrackComponents, {
  MAX_NUMBER_THUMBNAILS,
  THUMBNAIL_PADDING,
} from "./imageTrackComponents/OmeroTrackComponents";
import { initialLayout } from "../../../models/layoutUtils";
import _ from "lodash";
import RulerComponent from "./RulerComponents/RulerComponent";
import HoverToolTip from "./commonComponents/HoverToolTips/HoverToolTip";
import QBed from "../../../models/QBed";
import React from "react";
import VcfAnnotation from "./VcfComponents/VcfAnnotation";
import Vcf from "./VcfComponents/Vcf";
import Bedcolor from "./bedComponents/Bedcolor";
import { FiberDisplayModes } from "../../../trackConfigs/config-menu-models.tsx/DisplayModes";
import { chromAlias } from "../../../getRemoteData/fetchFunctions";
export const interactionTracks = new Set(["hic", "biginteract", "longrange"]);

export const dynamicMatplotTracks = new Set([
  "matplot",
  "dynamic",
  "dynamicbed",
]);
export const densityTracks = new Set(["bigwig", "qbed", "bedgraph"]);

export const FIBER_DENSITY_CUTOFF_LENGTH = 300000;
const dynamicTracks = new Set(["dynamic", "dynamicbed", "dynamiclongrange"]);
const simpleTracks = new Set(["qbed", "dbedgraph", "boxplot"]);
enum BedColumnIndex {
  CATEGORY = 3,
}
const BED_ROW_ELEMENT_HEIGHT = 9;
const TOP_PADDING = 2;
export const MAX_BASES_PER_PIXEL = 1000; // The higher this number, the more zooming out we support
// Extracted FullVisualizer component moved outside of the displayModeComponentMap
// Factory to create annotation element map given rendering context
function makeAnnotationElementMap(context: any) {
  const {
    configOptions,
    trackState,
    renderTooltip,
    scales,
    onClose,
    onHideTooltip,
    trackModel,
  } = context;

  function getAnnotationElement(
    placedGroup: any,
    y: number,
    isLastRow: boolean,
    index: number,
  ) {
    const gene = placedGroup.feature;

    return (
      <GeneAnnotationScaffold
        key={index}
        gene={gene}
        xSpan={placedGroup.xSpan}
        viewWindow={
          trackState.viewWindow
            ? trackState.viewWindow
            : new OpenInterval(0, trackState.visWidth)
        }
        y={y}
        isMinimal={isLastRow}
        options={configOptions}
        onClick={renderTooltip ? renderTooltip : () => {}}
        placedGroup={placedGroup}
        configOptions={configOptions}
      />
    );
  }

  function getBedAnnotationElement(
    placedGroup: any,
    y: number,
    isLastRow: boolean,
    index: number,
  ) {
    return placedGroup.placedFeatures.map((placement: any, i: number) => (
      <BedAnnotation
        key={i}
        feature={placement.feature}
        xSpan={placement.xSpan}
        y={y}
        isMinimal={isLastRow}
        color={configOptions.color}
        reverseStrandColor={configOptions.color2}
        isInvertArrowDirection={placement.isReverse}
        onClick={renderTooltip ? renderTooltip : () => {}}
        alwaysDrawLabel={configOptions.alwaysDrawLabel}
        hiddenPixels={configOptions.hiddenPixels}
        height={BED_ROW_ELEMENT_HEIGHT}
      />
    ));
  }

  function getBedColorAnnotationElement(
    placedGroup: any,
    y: number,
    isLastRow: boolean,
    index: number,
  ) {
    return placedGroup.placedFeatures.map((placement: any, i: number) => (
      <BedAnnotation
        key={i}
        feature={placement.feature}
        xSpan={placement.xSpan}
        y={y}
        isMinimal={isLastRow}
        color={
          placement?.feature?.color
            ? placement.feature.color
            : configOptions.color
        }
        reverseStrandColor={
          placement?.feature?.color
            ? placement.feature.color
            : configOptions.color2
        }
        isInvertArrowDirection={placement.isReverse}
        onClick={renderTooltip ? renderTooltip : () => {}}
        alwaysDrawLabel={configOptions.alwaysDrawLabel}
        hiddenPixels={configOptions.hiddenPixels}
        height={configOptions.height}
      />
    ));
  }
  return {
    geneannotation: (
      placedGroup: any,
      y: number,
      isLastRow: boolean,
      index: number,
    ) => getAnnotationElement(placedGroup, y, isLastRow, index),
    refbed: (placedGroup: any, y: number, isLastRow: boolean, index: number) =>
      getAnnotationElement(placedGroup, y, isLastRow, index),
    bed: (placedGroup: any, y: number, isLastRow: boolean, index: number) =>
      getBedAnnotationElement(placedGroup, y, isLastRow, index),
    bedcolor: function renderAnnotation(
      placedGroup: any,
      y: number,
      isLastRow: boolean,
      index: number,
    ) {
      return placedGroup.placedFeatures.map((placement: any, i: number) => (
        <Bedcolor
          key={i}
          feature={placement.feature}
          xSpan={placement.xSpan}
          y={y}
          isMinimal={isLastRow}
          height={configOptions.rowHeight}
          onClick={renderTooltip}
        />
      ));
    },
    vcf: function renderAnnotation(
      placedGroup: any,
      y: number,
      isLastRow: boolean,
      index: number,
    ) {
      return placedGroup.placedFeatures.map((placement: any, i: number) => (
        <VcfAnnotation
          key={i}
          feature={placement.feature as Vcf}
          xSpan={placement.xSpan}
          y={y}
          isMinimal={isLastRow}
          height={configOptions.rowHeight}
          colorScale={scales}
          onClick={renderTooltip}
          alwaysDrawLabel={configOptions.alwaysDrawLabel}
        />
      ));
    },
    jaspar: function getAnnotationElement(
      placedGroup: any,
      y: number,
      isLastRow: boolean,
      index: number,
      height?: number,
    ) {
      let scoreScale = scaleLinear()
        .domain([0, 1000])
        .range([0, 1])
        .clamp(true);
      return placedGroup.placedFeatures.map((placement: any, i: number) => (
        <BedAnnotation
          key={i}
          feature={placement.feature}
          xSpan={placement.xSpan}
          y={y}
          isMinimal={isLastRow}
          color={configOptions.color}
          reverseStrandColor={configOptions.color2}
          isInvertArrowDirection={placement.isReverse}
          onClick={renderTooltip ? renderTooltip : () => {}}
          alwaysDrawLabel={configOptions.alwaysDrawLabel}
          hiddenPixels={configOptions.hiddenPixels}
          opacity={scoreScale(placement.feature.score)}
        />
      ));
    },
    bigbed: (placedGroup: any, y: number, isLastRow: boolean, index: number) =>
      getBedAnnotationElement(placedGroup, y, isLastRow, index),
    bigbedcolor: (
      placedGroup: any,
      y: number,
      isLastRow: boolean,
      index: number,
    ) => getBedColorAnnotationElement(placedGroup, y, isLastRow, index),
    modbed: function getAnnotationElement(
      placedGroup: any,
      y: number,
      isLastRow: boolean,
      index: number,
      height?: number,
    ) {
      return placedGroup.placedFeatures.map((placement: any, i: number) => (
        <FiberAnnotation
          key={i}
          y={y}
          isMinimal={isLastRow}
          placement={placement}
          color={configOptions.color}
          color2={configOptions.color2}
          rowHeight={configOptions.rowHeight}
          renderTooltip={renderTooltip ? renderTooltip : () => {}}
          onHideTooltip={onClose}
          hiddenPixels={configOptions.hiddenPixels}
          hideMinimalItems={configOptions.hideMinimalItems}
          pixelsPadding={configOptions.pixelsPadding}
          displayMode={configOptions.displayMode}
        />
      ));
    },
    repeatmasker: function getAnnotationElement(
      placedGroup: any,
      y: number,
      isLastRow: boolean,
      index: number,
      height?: number,
    ) {
      const { categoryColors } = configOptions;
      const TEXT_HEIGHT = 9;
      return placedGroup.placedFeatures.map((placement: any, i: number) => {
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

        let yv = scale(feature.repeatValue);
        const drawHeight = configOptions.height - yv;

        const width = xSpan.getLength();
        if (drawHeight <= 0) {
          return null;
        }
        const mainBody = (
          <rect
            x={xSpan.start}
            y={yv}
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
            onClick={(event) => {
              if (renderTooltip) {
                renderTooltip(event, feature);
              }
            }}
            key={i}
          >
            {mainBody}
            {arrows}
            {label}
          </TranslatableG>
        );
      });
    },
    rmskv2: function getAnnotationElement(
      placedGroup: any,
      y: number,
      isLastRow: boolean,
      index: number,
      height?: number,
    ) {
      const { categoryColors } = configOptions;
      const TEXT_HEIGHT = 9;
      return placedGroup.placedFeatures.map((placement: any, i: number) => {
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
        let yv = scale(feature.repeatValue);

        const drawHeight = configOptions.height - yv;

        const width = xSpan.getLength();
        if (drawHeight <= 0) {
          return null;
        }
        const mainBody = (
          <rect
            x={xSpan.start}
            y={yv}
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
            onClick={(event) => {
              if (renderTooltip) {
                renderTooltip(event, feature);
              }
            }}
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
      placedGroup: any,
      y: number,
      isLastRow: boolean,
      index: number,
      height?: number,
    ) {
      return placedGroup.placedFeatures.map((placement: any, i: number) => {
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
            isMinimal={isLastRow}
            color={color}
            onClick={renderTooltip ? renderTooltip : () => {}}
            category={configOptions.category}
            height={configOptions.height}
            alwaysDrawLabel={configOptions.alwaysDrawLabel}
          />
        );
      });
    },
    snp: function getAnnotationElement(
      placedGroup: any,
      y: number,
      isLastRow: boolean,
      index: number,
      height?: number,
    ) {
      return placedGroup.placedFeatures.map((placement: any, i: number) => (
        <SnpAnnotation
          key={i}
          snp={placement.feature}
          xSpan={placement.xSpan}
          y={y}
          isMinimal={isLastRow}
          color={configOptions.color}
          reverseStrandColor={configOptions.color2}
          isInvertArrowDirection={placement.isReverse}
          onClick={renderTooltip ? renderTooltip : () => {}}
          alwaysDrawLabel={configOptions.alwaysDrawLabel}
          hiddenPixels={configOptions.hiddenPixels}
        />
      ));
    },
    bam: function getAnnotationElement(
      placedGroup: any,
      y: number,
      isLastRow: boolean,
      index: number,
      height?: number,
    ) {
      return placedGroup.placedFeatures.map((placement: any, i: number) => (
        <BamAnnotation
          key={i}
          placedRecord={placement}
          y={y}
          onClick={renderTooltip ? renderTooltip : () => {}}
          options={configOptions}
        />
      ));
    },
  };
}

const FullVisualizer: React.FC<any> = ({
  placements,
  width,
  height,
  rowHeight,
  maxRows,
  legend,
  windowWidth,
  trackState,
  configOptions,
  trackModel,
  renderTooltip,
  scales,
  onClose,
}) => {
  const getAnnotationElementMap = makeAnnotationElementMap({
    configOptions,
    trackState,
    renderTooltip,
    scales,
    onClose,
    trackModel,
  });

  function renderAnnotation(placedGroup: any, i: number) {
    const maxRowIndex = (maxRows || Infinity) - 1;
    const rowIndex = Math.min(placedGroup.row, maxRowIndex);
    const y = rowIndex * rowHeight + TOP_PADDING;

    return getAnnotationElementMap[`${trackModel.type}`](
      placedGroup,
      y,
      rowIndex === maxRowIndex,
      i,
      configOptions.height ?? 0,
    );
  }

  if (configOptions.forceSvg || configOptions.packageVersion) {
    const curParentStyle: any = configOptions.forceSvg
      ? { position: "relative", overflow: "hidden", width: windowWidth }
      : {};
    const curEleStyle: any = configOptions.forceSvg
      ? {
          position: "relative",
          transform: `translateX(${-trackState.viewWindow.start}px)`,
        }
      : {};

    return (
      <React.Fragment>
        <div style={{ display: "flex", ...curParentStyle }}>
          {configOptions.forceSvg || configOptions.packageVersion ? legend : ""}
          <div
            style={{ display: "flex", flexDirection: "column", ...curEleStyle }}
          >
            <svg
              key={trackModel.id + "forcesvg"}
              width={trackState.visWidth}
              height={height}
            >
              {placements.map(renderAnnotation)}
            </svg>
          </div>
        </div>
      </React.Fragment>
    );
  }

  return (
    <svg
      key={trackModel.id + "svg"}
      width={trackState.visWidth}
      height={height}
    >
      {placements.map(renderAnnotation)}
      {/* <line
        x1={
          trackState?.genomicFetchCoord[trackState.primaryGenName]
            ?.primaryVisData?.viewWindow?.start
        }
        y1={0}
        x2={
          trackState?.genomicFetchCoord[trackState.primaryGenName]
            ?.primaryVisData?.viewWindow?.start
        }
        y2={height}
        stroke="black"
        strokeWidth={1}
      />
      <line
        x1={
          trackState?.genomicFetchCoord[trackState.primaryGenName]
            ?.primaryVisData?.viewWindow?.start +
          trackState.visData.viewWindow.start
        }
        y1={0}
        x2={
          trackState?.genomicFetchCoord[trackState.primaryGenName]
            ?.primaryVisData?.viewWindow?.start +
          trackState.visData.viewWindow.start
        }
        y2={height}
        stroke="black"
        strokeWidth={1}
      /> */}
    </svg>
  );
};

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
    ROW_HEIGHT,
    onClose,
    scales,
    placeFeature,
    legendWidth,
  }) {
    // Full visualizer is now extracted to `FullVisualizer` component above

    // create annotation element map using top-level factory so closures (renderTooltip, etc.) are preserved

    if (trackModel.type === "omeroidr") {
      const calcTrackHeight = () => {
        let viewWindow = {
          start: 0,
          end: trackState.visWidth,
        };
        const totalImgCount = _.sum(
          formattedData.map((item) => item.images.length),
        );
        const imgCount = Math.min(totalImgCount, MAX_NUMBER_THUMBNAILS);
        const totalImageWidth = Math.max(
          (configOptions.imageHeight[0] * configOptions.imageAspectRatio +
            THUMBNAIL_PADDING) *
            imgCount -
            THUMBNAIL_PADDING,
          0,
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
        updatedLegend.current = {
          height: svgHeight.current,
          trackModel,
          label: configOptions.label
            ? configOptions.label
            : trackModel.options.label
              ? trackModel.options.label
              : "",
        };
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

    let placeFeatureData;
    let numHidden = 0;
    let height = 0;
    if (!placeFeature) {
      function getHeight(numRows: number): number {
        let rowHeight = ROW_HEIGHT;
        let options = configOptions;

        let rowsToDraw = Math.min(numRows, options.maxRows);
        if (options.hideMinimalItems) {
          rowsToDraw -= 1;
        }
        if (rowsToDraw < 1) {
          rowsToDraw = 1;
        }

        return trackModel.type === "modbed"
          ? (rowsToDraw + 1) * rowHeight + 2
          : rowsToDraw * rowHeight + TOP_PADDING;
      }

      let featureArrange = new FeatureArranger();
      let sortType = SortItemsOptions.NOSORT;

      placeFeatureData = featureArrange.arrange(
        formattedData,
        trackState.visRegion,
        trackState.visWidth,
        getGenePadding,
        configOptions.hiddenPixels,
        sortType,
        trackState.viewWindow,
      );

      numHidden = placeFeatureData.numHidden;
      height =
        trackModel.type === "repeatmasker" ||
        trackModel.type === "rmskv2" ||
        trackModel.type === "categorical"
          ? configOptions.height
          : placeFeatureData.numRowsAssigned
            ? getHeight(placeFeatureData.numRowsAssigned)
            : 40;
    } else {
      placeFeatureData = placeFeature.placements;
      height = placeFeature.height;
      numHidden = placeFeature.numHidden;
    }
    const legendProps = {
      height,
      trackModel,
      label: configOptions.label
        ? configOptions.label
        : trackModel.options.label
          ? trackModel.options.label
          : "",
      forceSvg: configOptions.forceSvg,
      legendWidth: legendWidth,
    };
    if (updatedLegend) {
      updatedLegend.current = legendProps;
    }
    if (svgHeight) {
      svgHeight.current = height;
    }
    const legend = configOptions.forceSvg ? (
      <TrackLegend {...legendProps} />
    ) : null;

    const svgDATA = (
      <FullVisualizer
        placements={placeFeatureData.placements}
        width={trackState.visWidth}
        height={height}
        rowHeight={ROW_HEIGHT}
        maxRows={configOptions.maxRows}
        legend={legend}
        windowWidth={windowWidth}
        trackState={trackState}
        configOptions={configOptions}
        trackModel={trackModel}
        renderTooltip={renderTooltip}
        scales={scales}
        onClose={onClose}
      />
    );

    return { component: svgDATA, numHidden: numHidden };
  },

  density: function getDensity({
    formattedData,
    trackState,
    configOptions,
    updatedLegend,
    trackModel,
    groupScale,
    xvaluesData,
    initialLoad,
    windowWidth,
    legendWidth,
  }) {
    const canvasElements = (
      <NumericalTrack
        data={formattedData}
        options={configOptions}
        viewWindow={
          trackState.viewWindow
            ? trackState.viewWindow
            : new OpenInterval(0, trackState.visWidth)
        }
        viewRegion={trackState.visRegion}
        width={trackState.visWidth}
        forceSvg={configOptions.forceSvg}
        trackModel={trackModel}
        updatedLegend={updatedLegend}
        groupScale={groupScale}
        xvaluesData={xvaluesData}
        dataIdx={trackState.dataIdx}
        initialLoad={initialLoad}
        windowWidth={windowWidth}
        legendWidth={legendWidth ? legendWidth : 120}
      />
    );
    return canvasElements;
  },
  qbed: function getqbed({
    formattedData,
    trackState,
    configOptions,
    updatedLegend,
    trackModel,
    initialLoad,
    windowWidth,
    xvaluesData,
    legendWidth,
  }) {
    const canvasElements = (
      <QBedTrackComponents
        data={formattedData}
        options={configOptions}
        viewRegion={trackState.visRegion}
        width={trackState.visWidth}
        viewWindow={
          trackState.viewWindow
            ? trackState.viewWindow
            : new OpenInterval(0, trackState.visWidth)
        }
        trackModel={trackModel}
        isLoading={false}
        error={undefined}
        forceSvg={configOptions.forceSvg}
        updatedLegend={updatedLegend}
        dataIdx={trackState.dataIdx}
        initialLoad={initialLoad}
        windowWidth={windowWidth}
        legendWidth={legendWidth}
        xvaluesData={xvaluesData}
      />
    );
    return canvasElements;
  },

  boxplot: function getboxplot({
    formattedData,
    trackState,
    configOptions,
    updatedLegend,
    trackModel,
    windowWidth,
    xvaluesData,
    legendWidth,
  }) {
    const canvasElements = (
      <BoxplotTrackComponents
        data={formattedData}
        options={configOptions}
        viewWindow={
          trackState.viewWindow
            ? trackState.viewWindow
            : new OpenInterval(0, trackState.visWidth)
        }
        viewRegion={trackState.visRegion}
        width={trackState.visWidth}
        forceSvg={configOptions.forceSvg}
        trackModel={trackModel}
        updatedLegend={updatedLegend}
        dataIdx={trackState.dataIdx}
        unit={""}
        windowWidth={windowWidth}
        legendWidth={legendWidth}
        xvaluesData={xvaluesData}
      />
    );
    return canvasElements;
  },

  matplot: function getMatplot({
    formattedData,
    trackState,
    configOptions,
    updatedLegend,
    trackModel,
    xvaluesData,
    initialLoad,
    legendWidth,
    windowWidth,
  }) {
    const canvasElements = (
      <MatplotTrackComponent
        data={formattedData}
        options={configOptions}
        viewWindow={
          trackState.viewWindow
            ? trackState.viewWindow
            : new OpenInterval(0, trackState.visWidth)
        }
        viewRegion={trackState.visRegion}
        width={trackState.visWidth}
        forceSvg={configOptions.forceSvg}
        trackModel={trackModel}
        updatedLegend={updatedLegend}
        xvaluesData={xvaluesData}
        dataIdx={trackState.dataIdx}
        initialLoad={initialLoad}
        windowWidth={windowWidth}
        legendWidth={legendWidth}
      />
    );
    return canvasElements;
  },

  dynamichic: function getDynamichic({
    formattedData,
    trackState,
    configOptions,
    updatedLegend,
    trackModel,
    initialLoad,
    windowWidth,
  }) {
    const canvasElements = (
      <DynamicInteractionTrackComponents
        data={formattedData}
        options={configOptions}
        viewWindow={
          trackState.viewWindow
            ? trackState.viewWindow
            : new OpenInterval(0, trackState.visWidth)
        }
        visRegion={trackState.visRegion}
        width={trackState.visWidth}
        trackModel={trackModel}
        updatedLegend={updatedLegend}
        dataIdx={trackState.dataIdx}
        initialLoad={initialLoad}
        windowWidth={windowWidth}
      />
    );
    return canvasElements;
  },

  dynamicbed: function getdynamicbed({
    formattedData,
    trackState,
    configOptions,
    trackModel,
    svgHeight,
    updatedLegend,
    windowWidth,
    placeFeature,
  }) {
    const canvasElements = (
      <DynamicBedTrackComponents
        data={formattedData}
        options={configOptions}
        viewWindow={
          trackState.viewWindow
            ? trackState.viewWindow
            : new OpenInterval(0, trackState.visWidth)
        }
        placeFeature={placeFeature}
        visRegion={trackState.visRegion}
        width={trackState.visWidth}
        trackModel={trackModel}
        svgHeight={svgHeight}
        updatedLegend={updatedLegend}
        dataIdx={trackState.dataIdx}
        windowWidth={windowWidth}
      />
    );
    return canvasElements;
  },

  dbedgraph: function getdbedgraph({
    formattedData,
    trackState,
    configOptions,
    updatedLegend,
    trackModel,
    xvaluesData,
    initialLoad,
    windowWidth,
    legendWidth,
  }) {
    const canvasElements = (
      <DynamicNumericalTrack
        data={formattedData}
        options={configOptions}
        viewWindow={
          trackState.viewWindow
            ? trackState.viewWindow
            : new OpenInterval(0, trackState.visWidth)
        }
        viewRegion={trackState.visRegion}
        width={trackState.visWidth}
        trackModel={trackModel}
        updatedLegend={updatedLegend}
        xvaluesData={xvaluesData}
        dataIdx={trackState.dataIdx}
        initialLoad={initialLoad}
        windowWidth={windowWidth}
        legendWidth={legendWidth}
      />
    );
    return canvasElements;
  },

  dynamic: function dynamic({
    formattedData,
    trackState,

    configOptions,
    updatedLegend,
    trackModel,
    xvaluesData,
    initialLoad,
    windowWidth,
    legendWidth,
  }) {
    const canvasElements = (
      <DynamicplotTrackComponent
        data={formattedData}
        options={configOptions}
        viewWindow={new OpenInterval(0, trackState.visWidth)}
        viewRegion={trackState.visRegion}
        width={trackState.visWidth}
        trackModel={trackModel}
        updatedLegend={updatedLegend}
        xvaluesData={xvaluesData}
        dataIdx={trackState.dataIdx}
        initialLoad={initialLoad}
        windowWidth={windowWidth}
        legendWidth={legendWidth}
      />
    );
    return canvasElements;
  },

  modbed: function getModbed({
    formattedData,
    trackState,
    configOptions,
    updatedLegend,
    trackModel,
    renderTooltip,
    svgHeight,
    getGenePadding,
    getHeight,
    ROW_HEIGHT,
    onClose,
    xvaluesData,
    windowWidth,
    legendWidth,
  }) {
    const canvasElements = (
      <FiberTrackComponent
        data={formattedData}
        options={configOptions}
        viewWindow={
          trackState.viewWindow
            ? trackState.viewWindow
            : new OpenInterval(0, trackState.visWidth)
        }
        width={trackState.visWidth}
        forceSvg={configOptions.forceSvg}
        visRegion={trackState.visRegion}
        trackModel={trackModel}
        updatedLegend={updatedLegend}
        isLoading={false}
        trackState={trackState}
        getAnnotationTrack={displayModeComponentMap}
        renderTooltip={renderTooltip}
        svgHeight={svgHeight}
        getGenePadding={getGenePadding}
        getHeight={getHeight}
        ROW_HEIGHT={ROW_HEIGHT}
        onClose={onClose}
        xvaluesData={xvaluesData}
        dataIdx={trackState.dataIdx}
        windowWidth={windowWidth}
        legendWidth={legendWidth ? legendWidth : 120}
      />
    );

    return canvasElements;
  },

  interaction: function getInteraction({
    formattedData,
    trackState,

    configOptions,
    updatedLegend,
    trackModel,
    initialLoad,
    windowWidth,
    legendWidth,
  }) {
    const canvasElements = (
      <InteractionTrackComponent
        data={formattedData}
        options={configOptions}
        viewWindow={
          trackState.viewWindow
            ? trackState.viewWindow
            : new OpenInterval(0, trackState.visWidth)
        }
        visRegion={trackState.visRegion}
        width={trackState.visWidth}
        forceSvg={configOptions.forceSvg}
        trackModel={trackModel}
        updatedLegend={updatedLegend}
        dataIdx={trackState.dataIdx}
        initialLoad={initialLoad}
        windowWidth={windowWidth}
        legendWidth={legendWidth ? legendWidth : 120}
      />
    );

    return canvasElements;
  },

  methylc: function getMethylc({
    formattedData,
    trackState,

    configOptions,
    updatedLegend,
    trackModel,
    xvaluesData,
    initialLoad,
    windowWidth,
  }) {
    const canvasElements = (
      <MethylCTrackComputation
        data={formattedData}
        options={configOptions}
        viewWindow={
          trackState.viewWindow
            ? trackState.viewWindow
            : new OpenInterval(0, trackState.visWidth)
        }
        viewRegion={trackState.visRegion}
        width={trackState.visWidth}
        forceSvg={configOptions.forceSvg}
        trackModel={trackModel}
        updatedLegend={updatedLegend}
        xvaluesData={xvaluesData}
        dataIdx={trackState.dataIdx}
        initialLoad={initialLoad}
        windowWidth={windowWidth}
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
    xvaluesData,
    initialLoad,
  }) {
    const canvasElements = (
      <DynseqTrackComponents
        data={formattedData}
        options={configOptions}
        viewWindow={
          trackState.viewWindow
            ? trackState.viewWindow
            : new OpenInterval(0, trackState.visWidth)
        }
        viewRegion={trackState.visRegion}
        width={trackState.visWidth}
        forceSvg={configOptions.forceSvg}
        trackModel={trackModel}
        updatedLegend={updatedLegend}
        basesByPixel={basesByPixel}
        genomeConfig={genomeConfig}
        xvaluesData={xvaluesData}
        dataIdx={trackState.dataIdx}
        initialLoad={initialLoad}
        windowWidth={windowWidth}
      />
    );

    return canvasElements;
  },
  ruler: function getRuler({
    trackState,
    configOptions,
    updatedLegend,
    trackModel,
    genomeName,
    genomeConfig,
    windowWidth,
  }) {
    const canvasElements = (
      <RulerComponent
        viewRegion={trackState.visRegion}
        width={trackState.visWidth}
        trackModel={trackModel}
        selectedRegion={
          trackState.genomicFetchCoord
            ? objToInstanceAlign(
                trackState.genomicFetchCoord[`${genomeName}`].primaryVisData
                  .viewWindowRegion,
              )
            : trackState.visRegion
        }
        viewWindow={
          trackState.viewWindow
            ? trackState.viewWindow
            : new OpenInterval(0, trackState.visWidth)
        }
        updatedLegend={updatedLegend}
        genomeConfig={genomeConfig}
        options={configOptions}
        windowWidth={windowWidth}
      />
    );
    return canvasElements;
  },
  genomealign: function getGenomeAlign(drawData) {
    let result = drawData.genesArr;
    if (!result) {
      return null;
    }
    let svgElements;
    if (drawData.svgHeight) {
      drawData.svgHeight.current = drawData.configOptions.height;
    }
    const legendProps = {
      height: drawData.configOptions.height,
      trackModel: drawData.trackModel,
      label: drawData.configOptions.label
        ? drawData.configOptions.label
        : drawData.trackModel.options.label
          ? drawData.trackModel.options.label
          : "",
      forceSvg: drawData.configOptions.forceSvg,
    };
    const legend = drawData.configOptions.forceSvg ? (
      <TrackLegend {...legendProps} />
    ) : null;
    if (drawData.basesByPixel <= 10) {
      const drawDatas = result.drawData as PlacedAlignment[];

      if (drawData.updatedLegend) {
        drawData.updatedLegend.current = legendProps;
      }
      svgElements = drawDatas.map((item, index) =>
        renderFineAlignment(item, index, drawData.configOptions),
      );
      const drawGapText = result.drawGapText as GapText[];
      svgElements.push(
        drawGapText.map((item, index) =>
          renderGapText(item, index, drawData.configOptions),
        ),
      );

      let element;
      if (drawData.configOptions.forceSvg) {
        element = (
          <div
            style={{
              display: "flex",
              position: "relative",
              width: drawData.windowWidth + drawData.legendWidth,
              overflow: "hidden",
            }}
          >
            {legend}
            <div
              style={{
                position: "relative",
                transform: `translateX(${-drawData.trackState.viewWindow
                  .start}px)`,
              }}
            >
              <svg
                key={drawData.trackModel.id + "fine" + "forcesvg"}
                width={drawData.trackState.visWidth}
                height={drawData.configOptions.height}
              >
                {svgElements}
              </svg>
            </div>
          </div>
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
              {!drawData.forceSvg ? (
                <HoverToolTip
                  data={drawData.genesArr}
                  windowWidth={drawData.trackState.visWidth}
                  trackType={"genomealignFine"}
                  height={drawData.configOptions.height}
                  viewRegion={drawData.trackState.visRegion}
                  side={drawData.trackState.side}
                  options={drawData.configOptions}
                />
              ) : (
                ""
              )}
            </div>

            <svg
              key={drawData.trackModel.id + "fine" + "forcesvg"}
              width={drawData.trackState.visWidth}
              height={drawData.configOptions.height}
            >
              {svgElements}
            </svg>
          </React.Fragment>
        );
      }

      return element;
    } else {
      const drawDatas = result.drawData as PlacedMergedAlignment[];

      if (drawData.updatedLegend) {
        drawData.updatedLegend.current = legendProps;
      }
      const strand = result.plotStrand;
      const targetGenome = result.primaryGenome;
      const queryGenome = result.queryGenome;
      svgElements = drawDatas.map((placement) =>
        renderRoughAlignment(
          placement,
          strand === "-",
          80,
          targetGenome,
          queryGenome,
          drawData.configOptions,
        ),
      );
      const arrows = renderRoughStrand(
        "+",
        0,
        new OpenInterval(0, drawData.trackState.visWidth),
        false,
      );
      svgElements.push(arrows);

      const primaryArrows = renderRoughStrand(
        strand,
        80 - 15,
        new OpenInterval(0, drawData.trackState.visWidth),
        true,
      );
      svgElements.push(primaryArrows);
      let element;

      if (drawData.configOptions.forceSvg) {
        let curParentStyle: any = drawData.configOptions.forceSvg
          ? {
              position: "relative",

              overflow: "hidden",
              width: drawData.trackState.visWidth / 3 + drawData.legendWidth,
            }
          : {};
        let curEleStyle: any = drawData.configOptions.forceSvg
          ? {
              position: "relative",
              transform: `translateX(${-drawData.trackState.viewWindow
                .start}px)`,
            }
          : {};

        element = (
          <React.Fragment>
            <div style={{ display: "flex", ...curParentStyle }}>
              {drawData.configOptions.forceSvg ||
              drawData.configOptions.packageVersion
                ? legend
                : ""}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  ...curEleStyle,
                }}
              >
                <svg
                  key={drawData.trackModel.id + "rough" + "forcesvg"}
                  width={drawData.trackState.visWidth}
                  height={drawData.configOptions.height}
                >
                  {svgElements}
                </svg>
              </div>
            </div>
          </React.Fragment>
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
              key={drawData.trackModel.id + "rough"}
              width={drawData.trackState.visWidth}
              height={drawData.configOptions.height}
            >
              {svgElements}
            </svg>
          </React.Fragment>
        );
      }

      return element;
    }
  },

  error: function getError({
    trackState,
    configOptions,
    updatedLegend,
    trackModel,
    errorInfo,
    handleRetryFetchTrack,
    legendWidth,
  }) {
    const legendProps = {
      height: 40,
      trackModel,
      label: configOptions.label
        ? configOptions.label
        : trackModel.options.label
          ? trackModel.options.label
          : "",
      legendWidth: legendWidth ? legendWidth : 120,
    };
    if (updatedLegend) {
      updatedLegend.current = legendProps;
    }
    const legend = configOptions.forceSvg ? (
      <TrackLegend {...legendProps} />
    ) : null;

    return errorInfo && errorInfo === "Please zoom in to see content. " ? (
      <div
        onClick={() => handleRetryFetchTrack(trackModel.id)}
        style={{
          width: trackState.visWidth,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // gap: "8px",
          backgroundColor: "#DFF1F1",
          // border: "1px solid #BBD5DA",
          borderRadius: "8px",
          fontFamily: "Google Sans, Roboto, sans-serif",
          fontSize: "16px",
          color: "#254c53",
          cursor: "pointer",
          transition: "background-color 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLDivElement).style.backgroundColor = "#BBD5DA";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLDivElement).style.backgroundColor = "#DFF1F1";
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "2px",
          }}
        >
          <span>{errorInfo ? errorInfo : "Something went wrong"}</span>
        </div>
      </div>
    ) : (
      <div
        style={{
          width: trackState.visWidth,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          backgroundColor: "#fdf2f2",
          border: "1px solid #f5c6cb",
          borderRadius: "8px",
          fontFamily: "Google Sans, Roboto, sans-serif",
          fontSize: "16px",
          color: "#721c24",
          cursor: "pointer",
          transition: "background-color 0.2s",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "2px",
          }}
          onClick={() => handleRetryFetchTrack(trackModel.id)}
          onMouseEnter={(e) => {
            (e.target as HTMLDivElement).style.backgroundColor = "#f8d7da";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLDivElement).style.backgroundColor = "#fdf2f2";
          }}
        >
          <span>{errorInfo ? errorInfo : "Something went wrong"}</span>
          <span>! Refresh page or click track to try again.</span>
          <span
            style={{
              marginLeft: "4px",
              color: "#dc3545",
              fontSize: "16px",
              transform: "rotate(90deg)",
            }}
          >
            ↻
          </span>
        </div>
      </div>
    );
  },
};
// MARK: use draw function
export function getDisplayModeFunction(drawData: { [key: string]: any }) {
  const { trackModel, configOptions, trackState, legendWidth } = drawData;

  const trackType = trackModel.type;

  // The cache holds raw fetched data; when a view draws straight from it (no
  // precomputed placeFeature/xvalues), format it into model objects here,
  // lazily. Raw numerical tracks are left untouched.
  let genesArr = drawData.genesArr;
  if (Array.isArray(genesArr) && genesArr.length > 0) {
    genesArr =
      genesArr[0] && genesArr[0].dataCache !== undefined
        ? formatCombinedData(genesArr, trackType)
        : getFormattedFromCache(genesArr, trackType);
    drawData.genesArr = genesArr;
  }

  if (trackState?.visRegion)
    trackState["visRegion"] = objToInstanceAlign(trackState.visRegion);
  // Helper function to create common parameters
  const createCommonParams = (extraParams = {}) => ({
    trackState: drawData.trackState,
    configOptions: drawData.configOptions,
    updatedLegend: drawData.updatedLegend,
    trackModel: drawData.trackModel,
    initialLoad: drawData.initialLoad,
    legendWidth: drawData.legendWidth,
    windowWidth:
      configOptions.forceSvg || configOptions.packageVersion
        ? legendWidth + drawData.windowWidth
        : drawData.windowWidth,
    ...extraParams,
  });

  const createFullParams = (extraParams = {}) => ({
    formattedData: genesArr,

    renderTooltip: drawData.renderTooltip,
    svgHeight: drawData.svgHeight,
    getGenePadding: drawData.getGenePadding,
    getHeight: drawData.getHeight,
    xvaluesData: drawData.xvaluesData,
    placeFeature: drawData.placeFeature,
    genomeConfig: drawData.genomeConfig,
    basesByPixel: drawData.basesByPixel,
    ...createCommonParams(extraParams),
  });

  // when theres an error
  if (drawData.errorInfo) {
    return displayModeComponentMap.error(
      createCommonParams({
        errorInfo: drawData.errorInfo,
        handleRetryFetchTrack: drawData.handleRetryFetchTrack,
      }),
    );
  }

  //  unique parameter patterns
  if (trackType === "ruler") {
    return displayModeComponentMap.ruler(
      createCommonParams({
        genomeName: drawData.genomeName,
        genomeConfig: drawData.genomeConfig,
      }),
    );
  }

  if (trackType === "genomealign") {
    return displayModeComponentMap.genomealign(drawData);
  }

  // Full display mode condition
  const excludedFromFull = new Set([
    "genomealign",
    "dynamicbed",
    "dbedgraph",
    "dynamic",
    "dynamiclongrange",
    "dynamichic",
    "vcf",
  ]);
  if (drawData.svgHeight) {
    if (
      (drawData.trackModel.type === "methylc" ||
        drawData.trackModel.type === "dynseq") &&
      !drawData.configOptions.isCombineStrands
    ) {
      drawData.svgHeight.current = configOptions.height * 2;
    } else {
      drawData.svgHeight.current = configOptions.height;
    }
  }

  const isFullMode =
    (configOptions.displayMode === "full" &&
      !excludedFromFull.has(trackType)) ||
    (trackType === "omeroidr" && configOptions.displayMode !== "density");
  if (trackType === "boxplot" || trackType === "qbed") {
    return displayModeComponentMap[trackType](createFullParams());
  } else if (trackType === "dbedgraph") {
    return displayModeComponentMap[trackType](createFullParams());
  } else if (isFullMode) {
    return displayModeComponentMap.full(
      createFullParams({
        ROW_HEIGHT: configOptions.rowHeight
          ? configOptions.rowHeight + 2
          : drawData.ROW_HEIGHT,
      }),
    );
  }

  // Special parameter cases
  else if (trackType === "modbed") {
    if (trackState.visRegion) {
      if (
        (trackState.visRegion.getWidth() > FIBER_DENSITY_CUTOFF_LENGTH &&
          configOptions.displayMode === FiberDisplayModes.AUTO) ||
        configOptions.displayMode === FiberDisplayModes.SUMMARY
      ) {
        return displayModeComponentMap.modbed(
          createFullParams({
            ROW_HEIGHT: configOptions.rowHeight + 2,
            onHideToolTip: drawData.onHideToolTip,
            onClose: drawData.onClose,
          }),
        );
      } else {
        return displayModeComponentMap.full(
          createFullParams({
            ROW_HEIGHT: configOptions.rowHeight + 2,
            onHideToolTip: drawData.onHideToolTip,
            onClose: drawData.onClose,
          }),
        );
      }
    }
  } else if (trackType === "vcf") {
    const currentViewLength =
      (trackState.visRegion.getWidth() *
        (drawData.trackState.viewWindow.end -
          drawData.trackState.viewWindow.start)) /
      drawData.trackState.visData.visWidth;
    if (
      (drawData.configOptions.displayMode === "auto" &&
        currentViewLength > 100000) ||
      drawData.configOptions.displayMode === "density"
    ) {
      return displayModeComponentMap.density(createFullParams());
    } else {
      return displayModeComponentMap.full(
        createFullParams({
          scales: drawData.placeFeature.scales,
          ROW_HEIGHT: configOptions.rowHeight + 2,
        }),
      );
    }
  } else if (interactionTracks.has(trackType)) {
    return displayModeComponentMap.interaction(createFullParams());
  } else if (
    trackType === "matplot" ||
    trackType === "methylc" ||
    trackType === "dynseq" ||
    simpleTracks.has(trackType)
  ) {
    return displayModeComponentMap[trackType](createFullParams());
  } else if (trackType === "dynamichic" || trackType === "dynamiclongrange") {
    // displayMode comes from the config menu (heatmap/arc) and already
    // defaults to heatmap via DEFAULT_OPTIONS — pinning it here made picking
    // arc a no-op.
    return displayModeComponentMap.dynamichic(createFullParams());
  } else if (dynamicTracks.has(trackType)) {
    const displayType =
      trackType === "dynamiclongrange" ? "dynamichic" : trackType;
    return displayModeComponentMap[displayType](
      createFullParams({
        ROW_HEIGHT: drawData.ROW_HEIGHT,
      }),
    );
  }
  // Density tracks (fallback)
  else if (
    densityTracks.has(trackType) ||
    configOptions.displayMode === "density"
  ) {
    // All density track types use the same formatted data (genesArr)
    return displayModeComponentMap.density(
      createFullParams({
        formattedData: genesArr, // Override since all cases use genesArr directly
        configOptions: { ...configOptions }, // Copy to avoid mutation
        groupScale: drawData.groupScale,
      }),
    );
  }

  // Fallback (should not reach here in normal operation)
  return null;
}

// MARK: FORMATData
// Helper function to check if two genomic ranges overlap
function checkOverlap(
  featureChr: string,
  featureStart: number,
  featureEnd: number,
  regionChr: string,
  regionStart: number,
  regionEnd: number,
): boolean {
  if (featureChr !== regionChr) return false;
  // Check if there's any overlap: feature.start < region.end AND feature.end > region.start
  return featureStart < regionEnd && featureEnd > regionStart;
}

// Helper function to check if feature overlaps with any region in a region group
function checkOverlapWithRegionGroup(
  featureChr: string,
  featureStart: number,
  featureEnd: number,
  regionGroup: Array<{ chr: string; start: number; end: number }>,
): boolean {
  return regionGroup.some((region) =>
    checkOverlap(
      featureChr,
      featureStart,
      featureEnd,
      region.chr,
      region.start,
      region.end,
    ),
  );
}

function formatGeneAnnotationData(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci?: Array<any>,
) {
  if (initialLoad && regionLoci && regionLoci.length > 0) {
    const regionGroups: any[][] = regionLoci.map(() => []);

    for (const record of genesArr) {
      const gene = new Gene(record);
      for (let i = 0; i < regionLoci.length; i++) {
        if (
          checkOverlapWithRegionGroup(
            gene.locus.chr,
            gene.locus.start,
            gene.locus.end,
            regionLoci[i],
          )
        ) {
          regionGroups[i].push(gene);
        }
      }
    }
    return regionGroups;
  }

  return genesArr.map((record) => new Gene(record));
}
function formatRepeatMasker(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci?: Array<any>,
) {
  if (initialLoad && regionLoci && regionLoci.length > 0) {
    const regionGroups: any[][] = regionLoci.map(() => []);

    for (const record of genesArr) {
      const feature = new RepeatMaskerFeature(record);

      for (let i = 0; i < regionLoci.length; i++) {
        if (
          checkOverlapWithRegionGroup(
            feature.locus.chr,
            feature.locus.start,
            feature.locus.end,
            regionLoci[i],
          )
        ) {
          regionGroups[i].push(feature);
        }
      }
    }
    return regionGroups;
  }

  return genesArr.map((feature) => new RepeatMaskerFeature(feature));
}
function formatRmskv2Masker(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci?: Array<any>,
) {
  if (initialLoad && regionLoci && regionLoci.length > 0) {
    const regionGroups: any[][] = regionLoci.map(() => []);

    for (const record of genesArr) {
      const feature = new Rmskv2Feature(record);
      for (let i = 0; i < regionLoci.length; i++) {
        if (
          checkOverlapWithRegionGroup(
            feature.locus.chr,
            feature.locus.start,
            feature.locus.end,
            regionLoci[i],
          )
        ) {
          regionGroups[i].push(feature);
        }
      }
    }
    return regionGroups;
  }

  return genesArr.map((record) => new Rmskv2Feature(record));
}
function formatRefBedData(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci?: Array<any>,
) {
  if (initialLoad && regionLoci && regionLoci.length > 0) {
    const regionGroups: any[][] = regionLoci.map(() => []);

    for (const record of genesArr) {
      const gene = new Gene({
        chrom: normalizeChrName(record.chr),
        txStart: record.start,
        txEnd: record.end,
        id: record[7],
        name: record[6],
        description: record[11] ? record[11] : "",
        transcriptionClass: record[8],
        exonStarts: record[9],
        exonEnds: record[10],
        cdsStart: Number.parseInt(record[3], 10),
        cdsEnd: Number.parseInt(record[4], 10),
        strand: record[5],
      });

      for (let i = 0; i < regionLoci.length; i++) {
        if (
          checkOverlapWithRegionGroup(
            gene.locus.chr,
            gene.locus.start,
            gene.locus.end,
            regionLoci[i],
          )
        ) {
          regionGroups[i].push(gene);
        }
      }
    }
    return regionGroups;
  }

  return genesArr.map(
    (record) =>
      new Gene({
        chrom: normalizeChrName(record.chr),
        txStart: record.start,
        txEnd: record.end,
        id: record[7],
        name: record[6],
        description: record[11] ? record[11] : "",
        transcriptionClass: record[8],
        exonStarts: record[9],
        exonEnds: record[10],
        cdsStart: Number.parseInt(record[3], 10),
        cdsEnd: Number.parseInt(record[4], 10),
        strand: record[5],
      }),
  );
}

function formatBedColorData(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci?: Array<any>,
) {
  if (initialLoad && regionLoci && regionLoci.length > 0) {
    const regionGroups: any[][] = regionLoci.map(() => []);

    for (const record of genesArr) {
      const feature = new ColoredFeature(
        "",
        new ChromosomeInterval(
          normalizeChrName(record.chr),
          record.start,
          record.end,
        ),
        "+",
      ).withColor(record[3]);

      for (let i = 0; i < regionLoci.length; i++) {
        if (
          checkOverlapWithRegionGroup(
            feature.locus.chr,
            feature.locus.start,
            feature.locus.end,
            regionLoci[i],
          )
        ) {
          regionGroups[i].push(feature);
        }
      }
    }
    return regionGroups;
  }

  return genesArr.map((record) =>
    new ColoredFeature(
      "",
      new ChromosomeInterval(
        normalizeChrName(record.chr),
        record.start,
        record.end,
      ),
      "+",
    ).withColor(record[3]),
  );
}

function formatBedData(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci?: Array<any>,
) {
  if (initialLoad && regionLoci && regionLoci.length > 0) {
    const regionGroups: any[][] = regionLoci.map(() => []);

    for (const record of genesArr) {
      const feature = new ColoredFeature(
        record[3],
        new ChromosomeInterval(
          normalizeChrName(record.chr),
          record.start,
          record.end,
        ),
        record[5],
      ).withColor(record[3]);

      for (let i = 0; i < regionLoci.length; i++) {
        if (
          checkOverlapWithRegionGroup(
            feature.locus.chr,
            feature.locus.start,
            feature.locus.end,
            regionLoci[i],
          )
        ) {
          regionGroups[i].push(feature);
        }
      }
    }
    return regionGroups;
  }

  return genesArr.map((record) =>
    new ColoredFeature(
      "",
      new ChromosomeInterval(
        normalizeChrName(record.chr),
        record.start,
        record.end,
      ),
      "+",
    ).withColor(record[3]),
  );
}
function formatBamData(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci?: Array<any>,
) {
  // const filteredArray = removeDuplicates(genesArr, "_id");

  const formattedData = BamAlignment.makeBamAlignments(genesArr);

  if (initialLoad && regionLoci && regionLoci.length > 0) {
    const regionGroups: any[][] = regionLoci.map(() => []);

    for (const bam of formattedData) {
      for (let i = 0; i < regionLoci.length; i++) {
        if (
          checkOverlapWithRegionGroup(
            bam.locus.chr,
            bam.locus.start,
            bam.locus.end,
            regionLoci[i],
          )
        ) {
          regionGroups[i].push(bam);
        }
      }
    }
    return regionGroups;
  }

  return formattedData;
}

function formatOmeroidrData(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci?: Array<any>,
) {
  if (initialLoad && regionLoci && regionLoci.length > 0) {
    const regionGroups: any[][] = regionLoci.map(() => []);

    for (const record of genesArr) {
      const image = new ImageRecord(record);
      for (let i = 0; i < regionLoci.length; i++) {
        if (
          checkOverlapWithRegionGroup(
            image.locus.chr,
            image.locus.start,
            image.locus.end,
            regionLoci[i],
          )
        ) {
          regionGroups[i].push(image);
        }
      }
    }
    return regionGroups;
  }

  return genesArr.map((record) => new ImageRecord(record));
}

function formatBigBedData(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci?: Array<any>,
) {
  if (initialLoad && regionLoci && regionLoci.length > 0) {
    const regionGroups: any[][] = regionLoci.map(() => []);

    for (const record of genesArr) {
      // Handle both old format (segment/min/max) and new format (chr/start/end)
      const chr = normalizeChrName(record.segment || record.chr);
      const start = record.min ?? record.start;
      const end = record.max ?? record.end;

      // Parse rest field if present (format: "name\tscore\torientation")
      let name = record.name || record.label || "";
      let score = record.score;
      let orientation = record.orientation;
      if (record.rest) {
        const [parsedName, parsedScore, parsedOrientation] =
          record.rest.split("\t");
        name = parsedName || name;
        score = parsedScore ? Number(parsedScore) : score;
        orientation = parsedOrientation || orientation;
      }

      const feature = new Feature(
        name,
        new ChromosomeInterval(chr, start, end),
        orientation,
        score,
      );

      for (let i = 0; i < regionLoci.length; i++) {
        if (
          checkOverlapWithRegionGroup(
            feature.locus.chr,
            feature.locus.start,
            feature.locus.end,
            regionLoci[i],
          )
        ) {
          regionGroups[i].push(feature);
        }
      }
    }
    return regionGroups;
  }

  return genesArr.map((record) => {
    // Handle both old format (segment/min/max) and new format (chr/start/end)
    const chr = normalizeChrName(record.segment || record.chr);
    const start = record.min ?? record.start;
    const end = record.max ?? record.end;

    // Parse rest field if present (format: "name\tscore\torientation")
    let name = record.name || record.label || "";
    let score = record.score;
    let orientation = record.orientation;

    if (record.rest) {
      const [parsedName, parsedScore, parsedOrientation] =
        record.rest.split("\t");
      name = parsedName || name;
      score = parsedScore ? Number(parsedScore) : score;
      orientation = parsedOrientation || orientation;
    }

    return new Feature(
      name,
      new ChromosomeInterval(chr, start, end),
      orientation,
      score,
    );
  });
}
function formatBigBedColorData(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci?: Array<any>,
) {
  if (initialLoad && regionLoci && regionLoci.length > 0) {
    const regionGroups: any[][] = regionLoci.map(() => []);

    for (const record of genesArr) {
      // Handle both old format (segment/min/max) and new format (chr/start/end)
      const chr = normalizeChrName(record.segment || record.chr);
      const start = record.min ?? record.start;
      const end = record.max ?? record.end;

      // Parse rest field if present (format: "name\tscore\torientation")
      let name = record.name || record.label || "";
      let score = record.score;
      let orientation = record.orientation;
      let color = record.color;
      if (record.rest) {
        const [parsedName, parsedScore, parsedOrientation] =
          record.rest.split("\t");
        name = parsedName || name;
        score = parsedScore ? Number(parsedScore) : score;
        orientation = parsedOrientation || orientation;
      }

      const feature = new Feature(
        name,
        new ChromosomeInterval(chr, start, end),
        orientation,
        score,
        color,
      );

      for (let i = 0; i < regionLoci.length; i++) {
        if (
          checkOverlapWithRegionGroup(
            feature.locus.chr,
            feature.locus.start,
            feature.locus.end,
            regionLoci[i],
          )
        ) {
          regionGroups[i].push(feature);
        }
      }
    }
    return regionGroups;
  }

  return genesArr.map((record) => {
    // Handle both old format (segment/min/max) and new format (chr/start/end)
    const chr = normalizeChrName(record.segment || record.chr);
    const start = record.min ?? record.start;
    const end = record.max ?? record.end;

    // Parse rest field if present (format: "name\tscore\torientation")
    let name = record.name || record.label || "";
    let score = record.score;
    let orientation = record.orientation;
    let color = record.color;
    if (record.rest) {
      const [parsedName, parsedScore, parsedOrientation] =
        record.rest.split("\t");
      name = parsedName || name;
      score = parsedScore ? Number(parsedScore) : score;
      orientation = parsedOrientation || orientation;
    }

    return new Feature(
      name,
      new ChromosomeInterval(chr, start, end),
      orientation,
      score,
      color,
    );
  });
}
function formatSnpData(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci?: Array<any>,
) {
  if (initialLoad && regionLoci && regionLoci.length > 0) {
    const regionGroups: any[][] = regionLoci.map(() => []);

    for (const record of genesArr) {
      const snp = new Snp(record);
      for (let i = 0; i < regionLoci.length; i++) {
        if (
          checkOverlapWithRegionGroup(
            snp.locus.chr,
            snp.locus.start,
            snp.locus.end,
            regionLoci[i],
          )
        ) {
          regionGroups[i].push(snp);
        }
      }
    }
    return regionGroups;
  }

  return genesArr.map((record) => new Snp(record));
}
function formatCategoricalData(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci?: Array<any>,
) {
  if (initialLoad && regionLoci && regionLoci.length > 0) {
    const regionGroups: any[][] = regionLoci.map(() => []);

    for (const record of genesArr) {
      const feature = new Feature(
        record[BedColumnIndex.CATEGORY],
        new ChromosomeInterval(
          normalizeChrName(record.chr),
          record.start,
          record.end,
        ),
      );

      for (let i = 0; i < regionLoci.length; i++) {
        if (
          checkOverlapWithRegionGroup(
            feature.locus.chr,
            feature.locus.start,
            feature.locus.end,
            regionLoci[i],
          )
        ) {
          regionGroups[i].push(feature);
        }
      }
    }
    return regionGroups;
  }

  return genesArr.map(
    (record) =>
      new Feature(
        record[BedColumnIndex.CATEGORY],
        new ChromosomeInterval(
          normalizeChrName(record.chr),
          record.start,
          record.end,
        ),
      ),
  );
}
function formatJasper(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci?: Array<any>,
) {
  if (initialLoad && regionLoci && regionLoci.length > 0) {
    const regionGroups: any[][] = regionLoci.map(() => []);

    for (const record of genesArr) {
      const rest = record.rest.split("\t");
      const feature = new JasparFeature(
        rest[3],
        new ChromosomeInterval(
          normalizeChrName(record.chr),
          record.start,
          record.end,
        ),
        rest[2],
      ).withJaspar(Number.parseInt(rest[1], 10), rest[0]);

      for (let i = 0; i < regionLoci.length; i++) {
        if (
          checkOverlapWithRegionGroup(
            feature.locus.chr,
            feature.locus.start,
            feature.locus.end,
            regionLoci[i],
          )
        ) {
          regionGroups[i].push(feature);
        }
      }
    }
    return regionGroups;
  }

  return genesArr.map((record) => {
    const rest = record.rest.split("\t");
    return new JasparFeature(
      rest[3],
      new ChromosomeInterval(
        normalizeChrName(record.chr),
        record.start,
        record.end,
      ),
      rest[2],
    ).withJaspar(Number.parseInt(rest[1], 10), rest[0]);
  });
}
function formatModBedData(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci?: Array<any>,
) {
  if (initialLoad && regionLoci && regionLoci.length > 0) {
    const regionGroups: any[][] = regionLoci.map(() => []);

    for (const record of genesArr) {
      const fiber = new Fiber(
        record[3],
        new ChromosomeInterval(
          normalizeChrName(record.chr),
          record.start,
          record.end,
        ),
        record[5],
      ).withFiber(parseNumberString(record[4]), record[6], record[7]);

      for (let i = 0; i < regionLoci.length; i++) {
        if (
          checkOverlapWithRegionGroup(
            fiber.locus.chr,
            fiber.locus.start,
            fiber.locus.end,
            regionLoci[i],
          )
        ) {
          regionGroups[i].push(fiber);
        }
      }
    }
    return regionGroups;
  }

  return genesArr.map((record) =>
    new Fiber(
      record[3],
      new ChromosomeInterval(
        normalizeChrName(record.chr),
        record.start,
        record.end,
      ),
      record[5],
    ).withFiber(parseNumberString(record[4]), record[6], record[7]),
  );
}
// Reverse index of chromAlias: maps any file-native chromosome name (e.g. "1",
// "MT", "NC_000001.11") back to the browser's naming (e.g. "chr1", "chrM").
const aliasToRefName: { [alias: string]: string } = (() => {
  const map: { [alias: string]: string } = {};
  for (const refName in chromAlias) {
    map[refName] = refName;
    for (const alias of chromAlias[refName]) {
      map[alias] = refName;
    }
  }
  return map;
})();

// Normalizes a feature's chromosome name to the browser's naming convention.
// Unknown names (e.g. non-human scaffolds) are returned unchanged.
function normalizeChrName(chr: string): string {
  return aliasToRefName[chr] ?? chr;
}

function formatBigWigData(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci?: Array<any>,
) {
  //dynseq, boxplot track also
  // record.chr is stamped from the fetched locus group (see
  // normalizeLocusGroupedData); the raw bigwig features carry no chr of their own.
  if (initialLoad && regionLoci && regionLoci.length > 0) {
    const regionGroups: any[][] = regionLoci.map(() => []);

    for (const record of genesArr) {
      const feature = new NumericalFeature(
        "",
        new ChromosomeInterval(
          normalizeChrName(record.chr),
          record.start,
          record.end,
        ),
      ).withValue(record.score);

      for (let i = 0; i < regionLoci.length; i++) {
        if (
          checkOverlapWithRegionGroup(
            feature.locus.chr,
            feature.locus.start,
            feature.locus.end,
            regionLoci[i],
          )
        ) {
          regionGroups[i].push(feature);
        }
      }
    }
    return regionGroups;
  }

  return genesArr.map((record) =>
    new NumericalFeature(
      "",
      new ChromosomeInterval(
        normalizeChrName(record.chr),
        record.start,
        record.end,
      ),
    ).withValue(record.score),
  );
}
// Multi-file tracks (matplot/dynamic/dynamicbed) share the same nested shape:
// `genesArr` is an array of files, and each file is an array of per-locus groups
// `{ chr, data }` (or, for legacy data, flat records that already carry `chr`).
// These helpers read `chr` straight from the group so we never stamp (and thus
// never mutate) the raw records — which are read-only once they cross the worker
// boundary. `makeFeature(record, chr)` builds the per-track feature.
function forEachGroupRecord(
  file: any[],
  cb: (record: any, chr: string) => void,
) {
  if (!Array.isArray(file)) {
    return;
  }
  for (const entry of file) {
    if (isLocusGroup(entry)) {
      for (const record of entry.data) {
        cb(record, entry.chr);
      }
    } else if (Array.isArray(entry)) {
      // Per-region groups nested inside a sub-track bucket (produced by
      // groupTracksArrMatPlot). Recurse rather than treating the array as a
      // record.
      forEachGroupRecord(entry, cb);
    } else if (entry && entry.dataCache) {
      forEachGroupRecord(entry.dataCache, cb);
    } else if (entry) {
      cb(entry, entry.chr);
    }
  }
}

function formatMultiFileGrouped(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci: Array<any> | undefined,
  makeFeature: (record: any, chr: string) => any,
) {
  if (initialLoad && regionLoci?.length) {
    // `[region][file] = features` — grouped by region first, matching the shape
    // the initial multi-region placement consumes.
    const groupResult: any[][] = regionLoci.map(() => []);

    genesArr.forEach((file: any[]) => {
      const perRegion: any[][] = regionLoci.map(() => []);

      forEachGroupRecord(file, (record, chr) => {
        const feature = makeFeature(record, chr);
        if (!feature) {
          return;
        }
        regionLoci.forEach((region, index) => {
          if (
            checkOverlapWithRegionGroup(
              feature.locus.chr,
              feature.locus.start,
              feature.locus.end,
              region,
            )
          ) {
            perRegion[index].push(feature);
          }
        });
      });

      perRegion.forEach((group, index) => {
        groupResult[index].push(group);
      });
    });

    return groupResult;
  }

  return genesArr.map((file: any[]) => {
    const features: any[] = [];
    forEachGroupRecord(file, (record, chr) => {
      const feature = makeFeature(record, chr);
      if (feature) {
        features.push(feature);
      }
    });
    return features;
  });
}

function formatMatplotData(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci?: Array<any>,
) {
  return formatMultiFileGrouped(
    genesArr,
    initialLoad,
    regionLoci,
    (record, chr) => {
      const unsafeValue = Number(record[3]);
      const value = record.score
        ? record.score
        : Number.isFinite(unsafeValue)
          ? unsafeValue
          : 0;
      return new NumericalFeature(
        "",
        new ChromosomeInterval(normalizeChrName(chr), record.start, record.end),
      ).withValue(value);
    },
  );
}

function formatMethylcData(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci?: Array<any>,
) {
  if (initialLoad && regionLoci && regionLoci.length > 0) {
    const regionGroups: any[][] = regionLoci.map(() => []);

    for (const record of genesArr) {
      record.chr = normalizeChrName(record.chr);
      for (let i = 0; i < regionLoci.length; i++) {
        if (
          checkOverlapWithRegionGroup(
            record.chr,
            record.start,
            record.end,
            regionLoci[i],
          )
        ) {
          regionGroups[i].push(record);
        }
      }
    }
    return regionGroups;
  }

  return genesArr.map((record) => {
    record.chr = normalizeChrName(record.chr);
    return record;
  });
}

function formatDynamicBed(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci?: Array<any>,
) {
  return formatMultiFileGrouped(
    genesArr,
    initialLoad,
    regionLoci,
    (record, chr) =>
      new Feature(
        record[3],
        new ChromosomeInterval(normalizeChrName(chr), record.start, record.end),
      ),
  );
}
function formatDynamicLongRange(genesArr: any[]) {
  return genesArr.map((geneArr: any) =>
    geneArr
      .map((record) => {
        const regexMatch = record[3].match(/([\w.]+)\W+(\d+)\W+(\d+)\W+(\d+)/);

        if (regexMatch) {
          const chr = regexMatch[1];
          const start = Number.parseInt(regexMatch[2], 10);
          const end = Number.parseInt(regexMatch[3], 10);
          const score = Number.parseFloat(record[3].split(",")[1]);
          return new GenomeInteraction(
            new ChromosomeInterval(
              normalizeChrName(record.chr),
              record.start,
              record.end,
            ),
            new ChromosomeInterval(chr, start, end),
            score,
          );
        } else {
          console.error(
            `${record[3]} not formatted correctly in longrange track`,
          );
          return null;
        }
      })
      .filter(Boolean),
  );
}

function formatqBedData(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci?: Array<any>,
) {
  if (initialLoad && regionLoci && regionLoci.length > 0) {
    const regionGroups: any[][] = regionLoci.map(() => []);

    for (const record of genesArr) {
      record.chr = normalizeChrName(record.chr);
      const qbed = new QBed(record);
      for (let i = 0; i < regionLoci.length; i++) {
        if (
          checkOverlapWithRegionGroup(
            qbed.locus.chr,
            qbed.locus.start,
            qbed.locus.end,
            regionLoci[i],
          )
        ) {
          regionGroups[i].push(qbed);
        }
      }
    }
    return regionGroups;
  }

  return genesArr.map((record) => {
    record.chr = normalizeChrName(record.chr);
    return new QBed(record);
  });
}
function formatDynamic(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci?: Array<any>,
) {
  return formatMultiFileGrouped(
    genesArr,
    initialLoad,
    regionLoci,
    (record, chr) =>
      new NumericalFeature(
        "",
        new ChromosomeInterval(normalizeChrName(chr), record.start, record.end),
      ).withValue(record.score),
  );
}

function formatBedgraph(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci?: Array<any>,
) {
  const VALUE_COLUMN_INDEX = 3;

  const formattedData = genesArr.map((record) => {
    const unsafeValue = Number(record[VALUE_COLUMN_INDEX]);
    const value = Number.isFinite(unsafeValue) ? unsafeValue : 0;
    return new NumericalFeature(
      "",
      new ChromosomeInterval(
        normalizeChrName(record.chr),
        record.start,
        record.end,
      ),
    ).withValue(value);
  });

  if (initialLoad && regionLoci && regionLoci.length > 0) {
    const regionGroups: any[][] = [];
    for (const regionGroup of regionLoci) {
      const overlappingFeatures = formattedData.filter((feature: any) =>
        checkOverlapWithRegionGroup(
          feature.locus.chr,
          feature.locus.start,
          feature.locus.end,
          regionGroup,
        ),
      );
      regionGroups.push(overlappingFeatures);
    }
    return regionGroups;
  }

  return formattedData;
}
function formatdBedGraph(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci?: Array<any>,
) {
  const VALUE_COLUMN_INDEX = 3;

  if (initialLoad && regionLoci && regionLoci.length > 0) {
    const regionGroups: any[][] = regionLoci.map(() => []);

    for (const record of genesArr) {
      let parsedValue;
      try {
        parsedValue = JSON.parse(record[VALUE_COLUMN_INDEX]);
      } catch (e) {
        console.error(e);
        parsedValue = [0];
      }
      const feature = new NumericalArrayFeature(
        "",
        new ChromosomeInterval(
          normalizeChrName(record.chr),
          record.start,
          record.end,
        ),
      ).withValues(parsedValue);

      for (let i = 0; i < regionLoci.length; i++) {
        if (
          checkOverlapWithRegionGroup(
            feature.locus.chr,
            feature.locus.start,
            feature.locus.end,
            regionLoci[i],
          )
        ) {
          regionGroups[i].push(feature);
        }
      }
    }
    return regionGroups;
  }

  return genesArr.map((record) => {
    let parsedValue;
    try {
      parsedValue = JSON.parse(record[VALUE_COLUMN_INDEX]);
    } catch (e) {
      console.error(e);
      parsedValue = [0];
    }
    return new NumericalArrayFeature(
      "",
      new ChromosomeInterval(
        normalizeChrName(record.chr),
        record.start,
        record.end,
      ),
    ).withValues(parsedValue);
  });
}
function formatVcf(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci?: Array<any>,
) {
  if (initialLoad && regionLoci && regionLoci.length > 0) {
    const regionGroups: any[][] = regionLoci.map(() => []);

    for (const record of genesArr) {
      const vcf = new Vcf(record);
      for (let i = 0; i < regionLoci.length; i++) {
        if (
          checkOverlapWithRegionGroup(
            vcf.locus.chr,
            vcf.locus.start,
            vcf.locus.end,
            regionLoci[i],
          )
        ) {
          regionGroups[i].push(vcf);
        }
      }
    }

    return regionGroups;
  }

  return genesArr.map((record) => new Vcf(record));
}
function formatBigInteract(genesArr: any[]) {
  return genesArr
    .map((record) => {
      const regexMatch = record.rest.match(/([\w.]+)\W+(\d+)\W+(\d+)\W+(\d+)/);

      if (regexMatch) {
        const fields = record.rest.split("\t");
        const score = parseInt(fields[1]);
        return new GenomeInteraction(
          new ChromosomeInterval(
            fields[5],
            parseInt(fields[6]),
            parseInt(fields[7]),
          ),
          new ChromosomeInterval(
            fields[10],
            parseInt(fields[11]),
            parseInt(fields[12]),
          ),
          score,
        );
      } else {
        console.error(
          `${record[3]} not formatted correctly in BIGinteract track`,
        );
        return null;
      }
    })
    .filter(Boolean);
}
function formatLongRange(genesArr: any[]) {
  return genesArr
    .map((record) => {
      const regexMatch = record[3].match(/([\w.]+)\W+(\d+)\W+(\d+)\W+(\d+)/);
      if (regexMatch) {
        const chr = regexMatch[1];
        const start = Number.parseInt(regexMatch[2], 10);
        const end = Number.parseInt(regexMatch[3], 10);
        const score = Number.parseFloat(record[3].split(",")[1]);
        return new GenomeInteraction(
          new ChromosomeInterval(
            normalizeChrName(record.chr),
            record.start,
            record.end,
          ),
          new ChromosomeInterval(chr, start, end),
          score,
        );
      } else {
        console.error(`${record[3]} not formated correctly in longrange track`);
        return null;
      }
    })
    .filter(Boolean);
}

const formatFunctions: {
  [key: string]: (
    genesArr: any[],
    initialLoad: boolean,
    regionLoci?: Array<any>,
  ) => any[];
} = {
  geneannotation: formatGeneAnnotationData,
  repeatmasker: formatRepeatMasker,
  rmskv2: formatRmskv2Masker,
  refbed: formatRefBedData,
  bed: formatBedData,
  bedcolor: formatBedColorData,
  categorical: formatCategoricalData,
  bam: formatBamData,
  omeroidr: formatOmeroidrData,
  bigbed: formatBigBedData,
  bigbedcolor: formatBigBedColorData,
  snp: formatSnpData,
  jaspar: formatJasper,
  modbed: formatModBedData,
  bigwig: formatBigWigData,
  dynseq: formatBigWigData,
  boxplot: formatBigWigData,
  matplot: formatMatplotData,
  methylc: formatMethylcData,
  dynamicbed: formatDynamicBed,
  dynamiclongrange: formatDynamicLongRange,
  qbed: formatqBedData,
  dynamic: formatDynamic,
  bedgraph: formatBedgraph,
  dbedgraph: formatdBedGraph,
  biginteract: formatBigInteract,
  vcf: formatVcf,
  longrange: formatLongRange,
};
// A per-locus source returns its data grouped as `{ chr, data }[]` (one group
// per requested locus) instead of stamping every feature with `chr`. That keeps
// the chromosome name out of every feature as the data crosses the worker
// boundary. Here we flatten those groups back into plain records, stamping each
// record with its group's chr, so the existing per-type formatters (which read
// `record.chr` / `record.CHROM`) work unchanged.
function isLocusGroup(x: any): boolean {
  return (
    x !== null &&
    typeof x === "object" &&
    !Array.isArray(x) &&
    Array.isArray(x.data) &&
    "chr" in x
  );
}

function flattenLocusGroups(groups: any[]): any[] {
  const flat: any[] = [];
  for (const group of groups) {
    if (isLocusGroup(group)) {
      for (const record of group.data) {
        // Source records can be frozen — the screenshot path passes data
        // through Redux/Immer, which deep-freezes state — so stamp onto a
        // shallow copy in that case instead of mutating in place (which throws
        // on a read-only property). Non-frozen records keep the cheap in-place
        // path used during normal rendering.
        const stamped =
          record !== null &&
          typeof record === "object" &&
          Object.isFrozen(record)
            ? { ...record }
            : record;
        stamped.chr = group.chr;
        if (stamped.CHROM !== undefined) {
          stamped.CHROM = group.chr;
        }
        flat.push(stamped);
      }
    } else {
      flat.push(group);
    }
  }
  return flat;
}

// Normalizes raw source data (which may be grouped by locus) into the flat
// record shape the formatters expect. Handles single-file tracks (a flat list
// of groups) and multi-file tracks such as matplot/dynamic (a list of per-file
// group lists). Legacy flat data passes through untouched.
function normalizeLocusGroupedData(genesArr: any[]): any[] {
  if (!Array.isArray(genesArr) || genesArr.length === 0) {
    return genesArr;
  }
  const first = genesArr[0];
  if (isLocusGroup(first)) {
    return flattenLocusGroups(genesArr);
  }
  if (Array.isArray(first)) {
    return genesArr.map((subTrack) =>
      Array.isArray(subTrack) ? flattenLocusGroups(subTrack) : subTrack,
    );
  }
  return genesArr;
}

export function formatDataByType(
  genesArr: any[],
  type: string,
  initialLoad: boolean = false,
  regionLoci?: Array<any>,
) {
  if (!genesArr) {
    return { error: "No data available" };
  }

  // if genesArr has an error property then something wrong with fetch or other errors
  if (
    !Array.isArray(genesArr) &&
    typeof genesArr === "object" &&
    (genesArr as any).error
  ) {
    return genesArr;
  }
  if (Array.isArray(genesArr) && genesArr.length > 0) {
    for (const obj of genesArr) {
      if (typeof obj === "object" && obj !== null && obj.error) {
        return { error: obj.error };
      }
    }
  }
  // matplot/dynamic/dynamicbed consume the per-locus grouped shape
  // (`{ chr, data }` per file) directly, reading chr from each group without
  // mutating records, so they skip the flattening normalize step.
  const normalizedData = dynamicMatplotTracks.has(type)
    ? genesArr
    : normalizeLocusGroupedData(genesArr);

  const formatter = formatFunctions[type];

  if (formatter) {
    return formatter(normalizedData, initialLoad, regionLoci);
  } else {
    return initialLoad ? [[], [], []] : genesArr; //fallback if no formatter is found
  }
}

// Track types whose aggregation only needs a record's chr/start/end/value, so
// they can be cached as raw records and aggregated straight from the cache
// (via the getFeature* accessors) without ever building Feature objects. These
// are the dense numerical density tracks — the biggest memory savers.
export const rawAggregatableTracks: { [type: string]: string } = {
  bigwig: "",
  bedgraph: "",
  dynseq: "",
  methylc: "",
};

// Annotation tracks that render straight from raw records (via the getFeature*
// accessors) instead of Feature model objects — the placer/aggregator read
// chr/start/end and the renderer reads name/strand off the raw record, so no
// formatting step is needed.
export const rawRenderTracks: { [type: string]: string } = {
  dynamicbed: "",
  matplot: "",
};

/**
 * Lazily formats a cache entry's raw data into model objects, memoized by the
 * raw array. Numerical raw-aggregatable tracks (bigwig/bedgraph/dynseq) never
 * need models and are returned untouched.
 */
const formattedByRawData = new WeakMap<object, any[]>();

export function getFormattedFromCache(rawData: any, type: string): any {
  if (
    type in rawAggregatableTracks ||
    !rawData ||
    typeof rawData !== "object"
  ) {
    return rawData;
  }
  let formatted = formattedByRawData.get(rawData);
  if (!formatted) {
    const result = formatDataByType(rawData, type);
    formatted = Array.isArray(result) ? result : [];
    formattedByRawData.set(rawData, formatted);
  }
  return formatted;
}

/**
 * Formats the per-region cache entries a track hands to the aggregator/draw.
 * `combinedData` is an array of cache entries shaped `{ dataCache, ... }`; each
 * entry's raw `dataCache` is replaced with its lazily-formatted models. Raw
 * numerical tracks pass through unchanged.
 */
export function formatCombinedData(combinedData: any, type: string): any {
  if (
    type in rawAggregatableTracks ||
    type in rawRenderTracks ||
    !Array.isArray(combinedData)
  ) {
    return combinedData;
  }
  return combinedData.map((entry: any) =>
    entry && entry.dataCache
      ? { ...entry, dataCache: getFormattedFromCache(entry.dataCache, type) }
      : entry,
  );
}
