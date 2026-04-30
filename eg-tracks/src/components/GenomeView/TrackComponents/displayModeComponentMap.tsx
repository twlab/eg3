import { ReactNode } from "react";
import ChromosomeInterval from "../../../models/ChromosomeInterval";
import Feature, {
  ColoredFeature,
  Fiber,
  JasparFeature,
  NumericalArrayFeature,
  NumericalFeature,
} from "../../../models/Feature";
import { Rmskv2Feature } from "../../../models/Rmskv2Feature";
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
import VcfTrack from "./VcfComponents/VcfTrack";
import Bedcolor from "./bedComponents/Bedcolor";

import { generateUUID } from "../../../util";
import { FiberDisplayModes } from "../../../trackConfigs/config-menu-models.tsx/DisplayModes";
export const interactionTracks = new Set(["hic", "biginteract", "longrange"]);
export const bigWithNavTracks = new Set([
  "repeat",
  "jaspar",
  "bigbed",
  "rmskv2",
]);
export const instanceFetchTracks = new Set(["hic", "dynamichic", "bam"]);
export const dynamicMatplotTracks = new Set([
  "matplot",
  "dynamic",
  "dynamicbed",
]);
export const anchorTracks = new Set(["hic", "longrange"]);
export const densityTracks = new Set(["bigwig", "qbed", "bedgraph"]);
export const trackUsingExpandedLoci = {
  biginteract: "",
  dynamichic: "",
  dynamiclongrange: "",
  hic: "",
  longrange: "",
  genomealign: "",
};

export const FIBER_DENSITY_CUTOFF_LENGTH = 300000;

enum BedColumnIndex {
  CATEGORY = 3,
}
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
  } = context;

  function getAnnotationElement(placedGroup: any, y: number, isLastRow: boolean, index: number) {
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
      >
        {placedGroup.placedFeatures.map((placedGene: any, i: number) => (
          <GeneAnnotation key={i} placedGene={placedGene} y={y} options={configOptions} />
        ))}
      </GeneAnnotationScaffold>
    );
  }

  function getBedAnnotationElement(placedGroup: any, y: number, isLastRow: boolean, index: number) {
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
      />
    ));
  }

  return {
    geneannotation: (placedGroup: any, y: number, isLastRow: boolean, index: number) =>
      getAnnotationElement(placedGroup, y, isLastRow, index),
    refbed: (placedGroup: any, y: number, isLastRow: boolean, index: number) =>
      getAnnotationElement(placedGroup, y, isLastRow, index),
    bed: (placedGroup: any, y: number, isLastRow: boolean, index: number) =>
      getBedAnnotationElement(placedGroup, y, isLastRow, index),
    bedcolor: function renderAnnotation(placedGroup: any, y: number, isLastRow: boolean, index: number) {
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
    vcf: function renderAnnotation(placedGroup: any, y: number, isLastRow: boolean, index: number) {
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
    jaspar: function getAnnotationElement(placedGroup: any, y: number, isLastRow: boolean, index: number, height?: number) {
      let scoreScale = scaleLinear().domain([0, 1000]).range([0, 1]).clamp(true);
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
    modbed: function getAnnotationElement(placedGroup: any, y: number, isLastRow: boolean, index: number, height?: number) {
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
    repeatmasker: function getAnnotationElement(placedGroup: any, y: number, isLastRow: boolean, index: number, height?: number) {
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
        let scale = scaleLinear().domain([1, 0]).range([TOP_PADDING, configOptions.height]);

        let yv = scale(feature.repeatValue);
        const drawHeight = configOptions.height - yv;

        const width = xSpan.getLength();
        if (drawHeight <= 0) {
          return null;
        }
        const mainBody = (
          <rect x={xSpan.start} y={yv} width={width} height={drawHeight} fill={color} fillOpacity={0.75} />
        );
        let label;
        const labelText = feature.getName();
        const estimatedLabelWidth = labelText.length * TEXT_HEIGHT;
        if (estimatedLabelWidth < 0.9 * width) {
          const centerX = xSpan.start + 0.5 * width;
          const centerY = height - TEXT_HEIGHT * 2;

          label = (
            <BackgroundedText x={centerX} y={centerY} height={TEXT_HEIGHT - 1} fill={contrastColor} dominantBaseline="hanging" textAnchor="middle">
              {labelText}
            </BackgroundedText>
          );
        }
        const arrows = (
          <AnnotationArrows startX={xSpan.start} endX={xSpan.end} y={height - TEXT_HEIGHT} height={TEXT_HEIGHT} opacity={0.75} isToRight={isReverse === (feature.strand === "-")} color="white" />
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
    rmskv2: function getAnnotationElement(placedGroup: any, y: number, isLastRow: boolean, index: number, height?: number) {
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
        let scale = scaleLinear().domain([1, 0]).range([TOP_PADDING, configOptions.height]);
        let yv = scale(feature.repeatValue);

        const drawHeight = configOptions.height - yv;

        const width = xSpan.getLength();
        if (drawHeight <= 0) {
          return null;
        }
        const mainBody = (
          <rect x={xSpan.start} y={yv} width={width} height={drawHeight} fill={color} fillOpacity={0.75} />
        );
        let label;
        const labelText = feature.getName();
        const estimatedLabelWidth = labelText.length * TEXT_HEIGHT;
        if (estimatedLabelWidth < 0.9 * width) {
          const centerX = xSpan.start + 0.5 * width;
          const centerY = height - TEXT_HEIGHT * 2;

          label = (
            <BackgroundedText x={centerX} y={centerY} height={TEXT_HEIGHT - 1} fill={contrastColor} dominantBaseline="hanging" textAnchor="middle">
              {labelText}
            </BackgroundedText>
          );
        }
        const arrows = (
          <AnnotationArrows startX={xSpan.start} endX={xSpan.end} y={height - TEXT_HEIGHT} height={TEXT_HEIGHT} opacity={0.75} isToRight={isReverse === (feature.strand === "-")} color="white" />
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
    categorical: function getAnnotationElement(placedGroup: any, y: number, isLastRow: boolean, index: number, height?: number) {
      return placedGroup.placedFeatures.map((placement: any, i: number) => {
        const featureName = placement.feature.getName();
        const color = configOptions.category && configOptions.category[featureName] ? configOptions.category[`${featureName}`].color : "blue";

        return (
          <CategoricalAnnotation
            key={i}
            feature={placement.feature}
            xSpan={placement.xSpan}
            y={y}
            isMinimal={false}
            color={color}
            onClick={renderTooltip ? renderTooltip : () => {}}
            category={configOptions.category}
            height={configOptions.height}
            alwaysDrawLabel={configOptions.alwaysDrawLabel}
          />
        );
      });
    },
    snp: function getAnnotationElement(placedGroup: any, y: number, isLastRow: boolean, index: number, height?: number) {
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
    bam: function getAnnotationElement(placedGroup: any, y: number, isLastRow: boolean, index: number, height?: number) {
      return placedGroup.placedFeatures.map((placement: any, i: number) => (
        <BamAnnotation key={i} placedRecord={placement} y={y} onClick={renderTooltip ? renderTooltip : () => {}} options={configOptions} />
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
    const getAnnotationElementMap = makeAnnotationElementMap({ configOptions, trackState, renderTooltip, scales, onClose });

  function renderAnnotation(placedGroup: any, i: number) {
    const maxRowIndex = (maxRows || Infinity) - 1;
    const rowIndex = Math.min(placedGroup.row, maxRowIndex);
    const y = rowIndex * rowHeight + TOP_PADDING;

    return getAnnotationElementMap[`${trackModel.type}`](placedGroup, y, rowIndex === maxRowIndex, i, configOptions.height ?? 0);
  }

  const svgKey = generateUUID();

  if (configOptions.forceSvg || configOptions.packageVersion) {
    const curParentStyle: any = configOptions.forceSvg
      ? { position: "relative", overflow: "hidden", width: windowWidth }
      : {};
    const curEleStyle: any = configOptions.forceSvg
      ? { position: "relative", transform: `translateX(${ -trackState.viewWindow.start }px)` }
      : {};

    return (
      <React.Fragment>
        <div style={{ display: "flex", ...curParentStyle }}>
          {configOptions.forceSvg || configOptions.packageVersion ? legend : ""}
          <div style={{ display: "flex", flexDirection: "column", ...curEleStyle }}>
            <svg key={svgKey} width={trackState.visWidth} height={height}>
              {placements.map(renderAnnotation)}
            </svg>
          </div>
        </div>
      </React.Fragment>
    );
  }

  return (
    <svg key={svgKey} width={trackState.visWidth} height={height}>
      {placements.map(renderAnnotation)}
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
        updatedLegend.current = (
          <TrackLegend
            height={svgHeight.current}
            trackModel={trackModel}
            label={
              configOptions.label
                ? configOptions.label
                : trackModel.options.label
                  ? trackModel.options.label
                  : ""
            }
          />
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
        trackModel.type === "categorical" ||
        trackModel.type === "modbed"
          ? configOptions.height
          : placeFeatureData.numRowsAssigned
            ? getHeight(placeFeatureData.numRowsAssigned)
            : 40;
    } else {
      placeFeatureData = placeFeature.placements;
      height = placeFeature.height;
      numHidden = placeFeature.numHidden;
    }
    const legend = (
      <TrackLegend
        height={height}
        trackModel={trackModel}
        label={
          configOptions.label
            ? configOptions.label
            : trackModel.options.label
              ? trackModel.options.label
              : ""
        }
        forceSvg={configOptions.forceSvg}
      />
    );
    if (updatedLegend) {
      updatedLegend.current = legend;
    }
    if (svgHeight) {
      svgHeight.current = height;
    }
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
      />
    );
    return canvasElements;
  },

  vcf: function getVcf({
    formattedData,
    trackState,
    getHeight,
    configOptions,
    renderTooltip,
    svgHeight,
    updatedLegend,
    trackModel,
    getGenePadding,
    xvaluesData,
    initialLoad,
  }) {
    return (
      <VcfTrack
        viewWindow={
          trackState.viewWindow
            ? trackState.viewWindow
            : new OpenInterval(0, trackState.visWidth)
        }
        viewRegion={trackState.visRegion}
        width={trackState.visWidth}
        trackModel={trackModel}
        getGenePadding={getGenePadding}
        renderTooltip={renderTooltip}
        svgHeight={svgHeight}
        forceSvg={configOptions.forceSvg}
        data={formattedData}
        trackState={trackState}
        options={configOptions}
        getHeight={getHeight}
        xvaluesData={xvaluesData}
        updatedLegend={updatedLegend}
        dataIdx={trackState.dataIdx}
        initialLoad={initialLoad}

      />
    );
  },
  qbed: function getqbed({
    formattedData,
    trackState,
    configOptions,
    updatedLegend,
    trackModel,
    initialLoad,
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
  }) {
    const canvasElements = (
      <DynamicInteractionTrackComponents
        data={formattedData}
        options={configOptions}
        viewWindow={
          new OpenInterval(trackState.startWindow, trackState.startWindow * 2)
        }
        visRegion={trackState.visRegion}
        width={trackState.visWidth}
        trackModel={trackModel}
        updatedLegend={updatedLegend}
        dataIdx={trackState.dataIdx}
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
  }) {
    const canvasElements = (
      <DynamicBedTrackComponents
        data={formattedData}
        options={configOptions}
        viewWindow={new OpenInterval(0, trackState.visWidth)}
        visRegion={trackState.visRegion}
        width={trackState.visWidth}
        trackModel={trackModel}
        svgHeight={svgHeight}
        updatedLegend={updatedLegend}
        dataIdx={trackState.dataIdx}
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
  }) {
    const canvasElements = (
      <DynamicNumericalTrack
        data={formattedData}
        options={configOptions}
        viewWindow={new OpenInterval(0, trackState.visWidth)}
        viewRegion={trackState.visRegion}
        width={trackState.visWidth}
        trackModel={trackModel}
        updatedLegend={updatedLegend}
        dataIdx={trackState.dataIdx}
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
        dataIdx={trackState.dataIdx}
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
  }) {
    const canvasElements = (
      <RulerComponent
        viewRegion={objToInstanceAlign(trackState.visData.visRegion)}
        width={trackState.visData.visWidth}
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
    let legend = (
      <TrackLegend
        height={drawData.configOptions.height}
        trackModel={drawData.trackModel}
        label={
          drawData.configOptions.label
            ? drawData.configOptions.label
            : drawData.trackModel.options.label
              ? drawData.trackModel.options.label
              : ""
        }
        forceSvg={drawData.configOptions.forceSvg}
      />
    );
    if (drawData.basesByPixel <= 10) {
      const drawDatas = result.drawData as PlacedAlignment[];

      if (drawData.updatedLegend) {
        drawData.updatedLegend.current = legend;
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
              width: drawData.trackState.visWidth / 3 + 120,
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
                key={generateUUID()}
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
              key={generateUUID()}
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
        drawData.updatedLegend.current = legend;
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
              width: drawData.trackState.visWidth / 3 + 120,
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
  }) {
    function getErrorLegend(legend: ReactNode) {
      if (updatedLegend) {
        updatedLegend.current = legend;
      }
    }

    const legend = (
      <TrackLegend
        height={40}
        trackModel={trackModel}
        label={
          configOptions.label
            ? configOptions.label
            : trackModel.options.label
              ? trackModel.options.label
              : ""
        }
      />
    );

    getErrorLegend(legend);

    return (
      <div
        onClick={() => handleRetryFetchTrack(trackModel.id)}
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
        onMouseEnter={(e) => {
          (e.target as HTMLDivElement).style.backgroundColor = "#f8d7da";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLDivElement).style.backgroundColor = "#fdf2f2";
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
  const { trackModel, configOptions, genesArr, trackState } = drawData;

  const trackType = trackModel.type;

  if (trackState?.visRegion)
    trackState["visRegion"] = objToInstanceAlign(trackState.visRegion);
  // Helper function to create common parameters
  const createCommonParams = (extraParams = {}) => ({
    trackState: drawData.trackState,
    configOptions: drawData.configOptions,
    updatedLegend: drawData.updatedLegend,
    trackModel: drawData.trackModel,
    initialLoad: drawData.initialLoad,
    ...extraParams,
  });

  const createFullParams = (extraParams = {}) => ({
    formattedData: genesArr,
    windowWidth:
      configOptions.forceSvg || configOptions.packageVersion
        ? 120 + drawData.windowWidth
        : drawData.windowWidth,
    renderTooltip: drawData.renderTooltip,
    svgHeight: drawData.svgHeight,
    getGenePadding: drawData.getGenePadding,
    getHeight: drawData.getHeight,
    xvaluesData: drawData.xvaluesData,
    placeFeature: drawData.placeFeature,
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

  const isFullMode =
    (configOptions.displayMode === "full" &&
      !excludedFromFull.has(trackType)) ||
    (trackType === "omeroidr" && configOptions.displayMode !== "density");

  if (isFullMode) {
    return displayModeComponentMap.full(
      createFullParams({
        ROW_HEIGHT: configOptions.rowHeight
          ? configOptions.rowHeight + 2
          : drawData.ROW_HEIGHT,
      }),
    );
  }

  // Track types with standard full parameters
  const standardFullTracks = ["vcf", "matplot"];
  if (standardFullTracks.includes(trackType)) {
    return displayModeComponentMap[trackType](createFullParams());
  }

  // Special parameter cases
  if (trackType === "modbed") {
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
  }

  if (interactionTracks.has(trackType)) {
    return displayModeComponentMap.interaction(createFullParams());
  }

  if (trackType === "dynamichic") {
    return displayModeComponentMap.dynamichic(
      createFullParams({
        configOptions: { ...configOptions, displayMode: "heatmap" },
      }),
    );
  }

  // Dynamic track types
  const dynamicTracks = new Set(["dynamic", "dynamicbed", "dynamiclongrange"]);
  if (dynamicTracks.has(trackType)) {
    const displayType =
      trackType === "dynamiclongrange" ? "dynamichic" : trackType;
    return displayModeComponentMap[displayType](
      createFullParams({
        ROW_HEIGHT: drawData.ROW_HEIGHT,
      }),
    );
  }

  // Genome-specific tracks
  if (trackType === "methylc" || trackType === "dynseq") {
    return displayModeComponentMap[trackType](
      createFullParams({
        genomeConfig: drawData.genomeConfig,
        basesByPixel: drawData.basesByPixel,
      }),
    );
  }

  // Simple track types with standard parameters
  const simpleTracks = ["qbed", "dbedgraph", "boxplot"];
  if (simpleTracks.includes(trackType)) {
    return displayModeComponentMap[trackType](createFullParams());
  }

  // Density tracks (fallback)
  if (densityTracks.has(trackType) || configOptions.displayMode === "density") {
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
        chrom: record.chr,
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
        chrom: record.chr,
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
        new ChromosomeInterval(record.chr, record.start, record.end),
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
      new ChromosomeInterval(record.chr, record.start, record.end),
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
        "",
        new ChromosomeInterval(record.chr, record.start, record.end),
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
      new ChromosomeInterval(record.chr, record.start, record.end),
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
      const chr = record.segment || record.chr;
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
    const chr = record.segment || record.chr;
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
        new ChromosomeInterval(record.chr, record.start, record.end),
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
        new ChromosomeInterval(record.chr, record.start, record.end),
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
        new ChromosomeInterval(record.chr, record.start, record.end),
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
      new ChromosomeInterval(record.chr, record.start, record.end),
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
        new ChromosomeInterval(record.chr, record.start, record.end),
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
      new ChromosomeInterval(record.chr, record.start, record.end),
      record[5],
    ).withFiber(parseNumberString(record[4]), record[6], record[7]),
  );
}
function formatBigWigData(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci?: Array<any>,
) {
  //dynseq, boxplot track also
  if (initialLoad && regionLoci && regionLoci.length > 0) {
    const regionGroups: any[][] = regionLoci.map(() => []);

    for (const record of genesArr) {
      const feature = new NumericalFeature(
        "",
        new ChromosomeInterval(record.chr, record.start, record.end),
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
      new ChromosomeInterval(record.chr, record.start, record.end),
    ).withValue(record.score),
  );
}
function formatMatplotData(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci?: Array<any>,
) {

  if (initialLoad && regionLoci?.length) {
    const groupResult: any = regionLoci.map(() => []);

    genesArr.forEach((geneArr: any[]) => {
      const regionGroups: any = regionLoci.map(() => []);

      geneArr.forEach((record) => {
            const unsafeValue = Number(record[3]);
    const value = record.score? record.score : Number.isFinite(unsafeValue) ? unsafeValue : 0;
        const feature = new NumericalFeature(
          "",
          new ChromosomeInterval(record.chr, record.start, record.end),
        ).withValue(value);

        regionLoci.forEach((region, index) => {
          if (
            checkOverlapWithRegionGroup(
              feature.locus.chr,
              feature.locus.start,
              feature.locus.end,
              region,
            )
          ) {
            regionGroups[index].push(feature);
          }
        });
      });

      regionGroups.forEach((group, index) => {
        groupResult[index].push(group);
      });
    });

    return groupResult;
  }

  return genesArr.map((geneArr) =>
    geneArr.map((record) => {  const unsafeValue = Number(record[3]);
    const value = record.score? record.score : Number.isFinite(unsafeValue) ? unsafeValue : 0;
  
  return new NumericalFeature(
        "",
        new ChromosomeInterval(record.chr, record.start, record.end),
      ).withValue(value)} ,
    ),
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
      const methylc = new MethylCRecord(record);
      for (let i = 0; i < regionLoci.length; i++) {
        if (
          checkOverlapWithRegionGroup(
            methylc.locus.chr,
            methylc.locus.start,
            methylc.locus.end,
            regionLoci[i],
          )
        ) {
          regionGroups[i].push(methylc);
        }
      }
    }
    return regionGroups;
  }

  return genesArr.map((record) => new MethylCRecord(record));
}

function formatDynamicBed(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci?: Array<any>,
) {
  if (initialLoad && regionLoci && regionLoci.length > 0) {
    return genesArr.map((geneArr: any[]) => {
      const regionGroups: any[][] = regionLoci.map(() => []);

      for (const record of geneArr) {
        const feature = new Feature(
          record[3],
          new ChromosomeInterval(record.chr, record.start, record.end),
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
    });
  }

  return genesArr.map((geneArr: any) =>
    geneArr.map(
      (record) =>
        new Feature(
          record[3],
          new ChromosomeInterval(record.chr, record.start, record.end),
        ),
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
            new ChromosomeInterval(record.chr, record.start, record.end),
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

  return genesArr.map((record) => new QBed(record));
}
function formatDynamic(
  genesArr: any[],
  initialLoad: boolean,
  regionLoci?: Array<any>,
) {
  if (initialLoad && regionLoci && regionLoci.length > 0) {
    return genesArr.map((geneArr: any[]) => {
      const regionGroups: any[][] = regionLoci.map(() => []);

      for (const record of geneArr) {
        const feature = new NumericalFeature(
          "",
          new ChromosomeInterval(record.chr, record.start, record.end),
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
    });
  }

  return genesArr.map((geneArr: any) =>
    geneArr.map((record) =>
      new NumericalFeature(
        "",
        new ChromosomeInterval(record.chr, record.start, record.end),
      ).withValue(record.score),
    ),
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
      new ChromosomeInterval(record.chr, record.start, record.end),
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
        new ChromosomeInterval(record.chr, record.start, record.end),
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
      new ChromosomeInterval(record.chr, record.start, record.end),
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
          new ChromosomeInterval(record.chr, record.start, record.end),
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
export const twoDataTypeTracks = {
  // bigbed: "",
  // geneannotation: "",
  // refbed: "",
  // bed: "",
  // repeatmasker: "",
  // omeroidr: "",
  // bam: "",
  // snp: "",
};

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
  const formatter = formatFunctions[type];

  if (formatter) {
    return formatter(genesArr, initialLoad, regionLoci);
  } else {
    return initialLoad ? [[], [], []] : genesArr; //fallback if no formatter is found
  }
}
