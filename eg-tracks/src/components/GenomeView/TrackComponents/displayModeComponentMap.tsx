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
export const FIBER_DENSITY_CUTOFF_LENGTH = 300000;

enum BedColumnIndex {
  CATEGORY = 3,
}
const TOP_PADDING = 2;
export const MAX_BASES_PER_PIXEL = 1000; // The higher this number, the more zooming out we support
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
  }) {
    function createFullVisualizer(
      placements,
      width,
      height,
      rowHeight,
      maxRows,
      legend
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
      let svgKey = generateUUID();

      if (configOptions.forceSvg || configOptions.packageVersion) {
        let curParentStyle: any = configOptions.forceSvg
          ? {
            position: "relative",

            overflow: "hidden",
            width: width / 3,
          }
          : {};
        let curEleStyle: any = configOptions.forceSvg
          ? {
            position: "relative",
            transform: `translateX(${-trackState.viewWindow.start}px)`,
          }
          : {};

        return (
          <React.Fragment>
            <div style={{ display: "flex", ...curParentStyle }}>
              {configOptions.forceSvg || configOptions.packageVersion
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
                  key={svgKey}
                  width={width}
                  height={height}
                  display={"block"}
                >
                  {placements.map(renderAnnotation)}
                </svg>
              </div>
            </div>
          </React.Fragment>
        );
      }

      return (
        <svg key={svgKey} width={width} height={height}>
          {placements.map(renderAnnotation)}
          {/* <line
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
          /> */}
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
          viewWindow={
            configOptions.forceSvg
              ? trackState.viewWindow
              : new OpenInterval(0, windowWidth * 3)
          }
          y={y}
          isMinimal={isLastRow}
          options={configOptions}
          onClick={renderTooltip ? renderTooltip : () => { }}
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
          onClick={renderTooltip ? renderTooltip : () => { }}
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
      bedcolor: function renderAnnotation(
        placedGroup: PlacedFeatureGroup,
        y: number,
        isLastRow: boolean,
        index: number
      ) {
        return placedGroup.placedFeatures.map((placement, i) => (
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
        placedGroup: PlacedFeatureGroup,
        y: number,
        isLastRow: boolean,
        index: number
      ) {
        return placedGroup.placedFeatures.map((placement, i) => (
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
            onClick={renderTooltip ? renderTooltip : () => { }}
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
            y={y}
            isMinimal={isLastRow}
            placement={placement}
            color={configOptions.color}
            color2={configOptions.color2}
            rowHeight={configOptions.rowHeight}
            renderTooltip={renderTooltip ? renderTooltip : () => { }}
            onHideTooltip={onClose}
            hiddenPixels={configOptions.hiddenPixels}
            hideMinimalItems={configOptions.hideMinimalItems}
            pixelsPadding={configOptions.pixelsPadding}
            displayMode={configOptions.displayMode}
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

          let y = scale(feature.repeatValue);
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
          let y = scale(feature.repeatValue);

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
              onClick={renderTooltip ? renderTooltip : () => { }}
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
            onClick={renderTooltip ? renderTooltip : () => { }}
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
            onClick={renderTooltip ? renderTooltip : () => { }}
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
          onSetImageInfo={() => { }}
          heightObj={heightObj}
        />
      );
    }

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

    // let newFormattedData;
    // if (configOptions.forceSvg) {
    //   const viewStart = trackState.regionLoci[0].start;

    //   const viewEnd = trackState.regionLoci[0].end;

    //   const adjustXSpan = (xSpan, viewWindow) => {
    //     return new OpenInterval(
    //       xSpan.start - viewWindow.start,
    //       xSpan.end - viewWindow.start
    //     );
    //   };

    //   newFormattedData = formattedData.filter(
    //     (obj) => obj.locus.start <= viewEnd && obj.locus.end >= viewStart
    //   );
    // } else {
    //   newFormattedData = formattedData;
    // }
    let placeFeatureData = featureArrange.arrange(
      formattedData,
      objToInstanceAlign(trackState.visRegion),
      trackState.visWidth,
      getGenePadding,
      configOptions.hiddenPixels,
      sortType,
      trackState.viewWindow
    );

    // if (configOptions.forceSvg) {
    //   placeFeatureData.placements = placeFeatureData.placements.filter(
    //     (feature) => {
    //       const curXSpan = feature.xSpan;

    //       return !(
    //         curXSpan.end < trackState.viewWindow.start ||
    //         curXSpan.start > trackState.viewWindow.end
    //       );
    //     }
    //   );
    // }
    let height;

    height =
      trackModel.type === "repeatmasker" ||
        trackModel.type === "rmskv2" ||
        trackModel.type === "categorical"
        ? configOptions.height
        : placeFeatureData.numRowsAssigned
          ? getHeight(placeFeatureData.numRowsAssigned)
          : 40;

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
      // component doesn't update because trackModel doesn't trigger anything so component doesn;t change state need to give prop label that changes

      updatedLegend.current = legend;
    }

    var svgDATA = createFullVisualizer(
      placeFeatureData.placements,
      trackState.visWidth,
      height,
      ROW_HEIGHT,
      configOptions.maxRows,
      legend
    );
    if (svgHeight) {
      svgHeight.current = height;
    }

    return { component: svgDATA, numHidden: placeFeatureData.numHidden };
  },

  density: function getDensity({
    formattedData,
    trackState,
    windowWidth,
    configOptions,
    updatedLegend,
    trackModel,
    groupScale,
    xvaluesData,
    initialLoad,
  }) {
    function getNumLegend(legend: ReactNode) {
      if (updatedLegend) {
        if (updatedLegend) {
          updatedLegend.current = legend;
        }
      }
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
    function getNumLegend(legend: ReactNode) {
      if (updatedLegend) {
        if (updatedLegend) {
          updatedLegend.current = legend;
        }
      }
    }

    return (
      <VcfTrack
        viewWindow={
          trackState.viewWindow
            ? trackState.viewWindow
            : new OpenInterval(0, trackState.visWidth)
        }
        viewRegion={objToInstanceAlign(trackState.visRegion)}
        width={trackState.visWidth}
        trackModel={trackModel}
        getGenePadding={getGenePadding}
        renderTooltip={renderTooltip}
        svgHeight={svgHeight}
        updatedLegend={updatedLegend}
        data={formattedData}
        trackState={trackState}
        options={configOptions}
        getHeight={getHeight}
        xvaluesData={xvaluesData}
        getNumLegend={getNumLegend}
        dataIdx={trackState.dataIdx}
        initialLoad={initialLoad}
      />
    );
  },
  qbed: function getqbed({
    formattedData,
    trackState,
    windowWidth,
    configOptions,
    updatedLegend,
    trackModel,
    initialLoad,
  }) {
    function getNumLegend(legend: ReactNode) {
      if (updatedLegend) {
        if (updatedLegend) {
          updatedLegend.current = legend;
        }
      }
    }
    let canvasElements = (
      <QBedTrackComponents
        data={formattedData}
        options={configOptions}
        viewRegion={objToInstanceAlign(trackState.visRegion)}
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
        getNumLegend={getNumLegend}
        dataIdx={trackState.dataIdx}
        initialLoad={initialLoad}
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
      if (updatedLegend) {
        if (updatedLegend) {
          updatedLegend.current = legend;
        }
      }
    }

    let canvasElements = (
      <BoxplotTrackComponents
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
        dataIdx={trackState.dataIdx}
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
    xvaluesData,
  }) {
    function getNumLegend(legend: ReactNode) {
      if (updatedLegend) {
        updatedLegend.current = legend;
      }
    }

    let canvasElements = (
      <MatplotTrackComponent
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
        xvaluesData={xvaluesData}
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
        updatedLegend={updatedLegend}
        dataIdx={trackState.dataIdx}
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
    function getNumLegend(legend: ReactNode) {
      if (updatedLegend) {
        updatedLegend.current = legend;
      }
    }

    let canvasElements = (
      <DynamicBedTrackComponents
        data={formattedData}
        options={configOptions}
        viewWindow={new OpenInterval(0, trackState.visWidth)}
        visRegion={objToInstanceAlign(trackState.visRegion)}
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
        updatedLegend={updatedLegend}
        dataIdx={trackState.dataIdx}
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
    let canvasElements = (
      <DynamicplotTrackComponent
        data={formattedData}
        options={configOptions}
        viewWindow={new OpenInterval(0, trackState.visWidth)}
        viewRegion={objToInstanceAlign(trackState.visRegion)}
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
    windowWidth,
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
    function getNumLegend(legend: ReactNode) {
      if (updatedLegend) {
        updatedLegend.current = legend;
      }
    }

    let canvasElements = (
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
        visRegion={objToInstanceAlign(trackState.visRegion)}
        trackModel={trackModel}
        getNumLegend={getNumLegend}
        isLoading={false}
        trackState={trackState}
        getAnnotationTrack={displayModeComponentMap}
        renderTooltip={renderTooltip}
        svgHeight={svgHeight}
        updatedLegend={updatedLegend}
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
    windowWidth,
    configOptions,
    updatedLegend,
    trackModel,
  }) {
    function getNumLegend(legend: ReactNode) {
      if (updatedLegend) {
        updatedLegend.current = legend;
      }
    }

    let canvasElements = (
      <InteractionTrackComponent
        data={formattedData}
        options={configOptions}
        viewWindow={
          trackState.viewWindow
            ? trackState.viewWindow
            : new OpenInterval(0, trackState.visWidth)
        }
        visRegion={objToInstanceAlign(trackState.visRegion)}
        width={trackState.visWidth}
        forceSvg={configOptions.forceSvg}
        trackModel={trackModel}
        getNumLegend={getNumLegend}
        dataIdx={trackState.dataIdx}
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
    xvaluesData,
    initialLoad,
  }) {
    function getNumLegend(legend: ReactNode) {
      if (updatedLegend) {
        updatedLegend.current = legend;
      }
    }

    let canvasElements = (
      <MethylCTrackComputation
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
    function getNumLegend(legend: ReactNode) {
      if (updatedLegend) {
        updatedLegend.current = legend;
      }
    }

    let canvasElements = (
      <DynseqTrackComponents
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
    function getNumLegend(legend: ReactNode) {
      if (updatedLegend) {
        updatedLegend.current = legend;
      }
    }

    let canvasElements = (
      <RulerComponent
        viewRegion={objToInstanceAlign(trackState.visRegion)}
        width={trackState.visWidth}
        trackModel={trackModel}
        selectedRegion={
          trackState.genomicFetchCoord
            ? objToInstanceAlign(
              trackState.genomicFetchCoord[`${genomeName}`].primaryVisData
                .viewWindowRegion
            )
            : trackState.visRegion
        }
        viewWindow={
          trackState.viewWindow
            ? trackState.viewWindow
            : new OpenInterval(0, trackState.visWidth)
        }
        getNumLegend={getNumLegend}
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
        element = (
          <div
            style={{
              display: "flex",
              position: "relative",
              width: drawData.trackState.visWidth / 3,
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
                display={"block"}
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
              display={"block"}
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
          drawData.configOptions
        )
      );
      const arrows = renderRoughStrand(
        "+",
        0,
        new OpenInterval(0, drawData.trackState.visWidth),
        false
      );
      svgElements.push(arrows);

      const primaryArrows = renderRoughStrand(
        strand,
        80 - 15,
        new OpenInterval(0, drawData.trackState.visWidth),
        true
      );
      svgElements.push(primaryArrows);
      let element;

      if (drawData.configOptions.forceSvg) {
        let curParentStyle: any = drawData.configOptions.forceSvg
          ? {
            position: "relative",

            overflow: "hidden",
            width: drawData.trackState.visWidth / 3,
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
                  display={"block"}
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
              display={"block"}
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
          fontSize: "14px",
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
          <span>
            {Array.isArray(errorInfo)
              ? errorInfo.filter((gene) => typeof gene === "string")[0] ||
              "Something went wrong"
              : typeof errorInfo === "object" && errorInfo["error"]
                ? errorInfo["error"]
                : "Something went wrong"}{" "}
          </span>
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
  const { trackModel, configOptions, genesArr } = drawData;
  const trackType = trackModel.type;

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
    windowWidth: drawData.windowWidth,
    renderTooltip: drawData.renderTooltip,
    svgHeight: drawData.svgHeight,
    getGenePadding: drawData.getGenePadding,
    getHeight: drawData.getHeight,
    xvaluesData: drawData.xvaluesData,
    ...createCommonParams(extraParams),
  });

  // Error handling
  if (drawData.errorInfo) {
    return displayModeComponentMap.error(
      createCommonParams({
        errorInfo: drawData.errorInfo,
        handleRetryFetchTrack: drawData.handleRetryFetchTrack,
      })
    );
  }

  // Special cases with unique parameter patterns
  if (trackType === "ruler") {
    return displayModeComponentMap.ruler(
      createCommonParams({
        genomeName: drawData.genomeName,
        genomeConfig: drawData.genomeConfig,
      })
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
      })
    );
  }

  // Track types with standard full parameters
  const standardFullTracks = ["vcf", "matplot"];
  if (standardFullTracks.includes(trackType)) {
    return displayModeComponentMap[trackType](createFullParams());
  }

  // Special parameter cases
  if (trackType === "modbed") {
    return displayModeComponentMap.modbed(
      createFullParams({
        ROW_HEIGHT: configOptions.rowHeight + 2,
        onHideToolTip: drawData.onHideToolTip,
        onClose: drawData.onClose,
      })
    );
  }

  if (interactionTracks.has(trackType)) {
    return displayModeComponentMap.interaction(createFullParams());
  }

  if (trackType === "dynamichic") {
    return displayModeComponentMap.dynamichic(
      createFullParams({
        configOptions: { ...configOptions, displayMode: "heatmap" },
      })
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
      })
    );
  }

  // Genome-specific tracks
  if (trackType === "methylc" || trackType === "dynseq") {
    return displayModeComponentMap[trackType](
      createFullParams({
        genomeConfig: drawData.genomeConfig,
        basesByPixel: drawData.basesByPixel,
      })
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
      })
    );
  }

  // Fallback (should not reach here in normal operation)
  return null;
}
// MARK: FORMAT
function formatGeneAnnotationData(genesArr: any[]) {
  return genesArr.map((record) => new Gene(record));
}
function formatRepeatMasker(genesArr: any[]) {
  return genesArr.map((record) => {
    const [
      label,
      scoreStr,
      orientation,
      swScore,
      milliDiv,
      milliDel,
      milliIns,
      genoLeft,
      repClass,
      repFamily,
      repStart,
      repEnd,
      repLeft,
    ] = record.rest.split("\t");

    const output: RepeatDASFeature = {
      genoLeft,
      label,
      max: record.end,
      milliDel,
      milliDiv,
      milliIns,
      min: record.start,
      orientation,
      repClass,
      repEnd,
      repFamily,
      repLeft,
      repStart,
      score: Number(scoreStr),
      segment: record.chr,
      swScore,
      type: "bigbed",
      _chromId: record.chromId,
    };

    return new RepeatMaskerFeature(output);
  });
}
function formatRmskv2Masker(genesArr: any[]) {
  const filteredArray: Array<any> = [];
  for (const record of genesArr) {
    filteredArray.push(new Rmskv2Feature(record));
  }
  return filteredArray;
}
function formatRefBedData(genesArr: any[]) {
  return genesArr.map((record) => {
    const refBedRecord: IdbRecord = {
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
    };
    return new Gene(refBedRecord);
  });
}

function formatBedColorData(genesArr: any[]) {
  return genesArr.map((record) =>
    new ColoredFeature(
      "",
      new ChromosomeInterval(record.chr, record.start, record.end),
      "+"
    ).withColor(record[3])
  );
}

function formatBedData(genesArr: any[]) {
  return genesArr.map((record) =>
    new ColoredFeature(
      "",
      new ChromosomeInterval(record.chr, record.start, record.end),
      "+"
    ).withColor(record[3])
  );
}
function formatBamData(genesArr: any[]) {
  // const filteredArray = removeDuplicates(genesArr, "_id");

  return BamAlignment.makeBamAlignments(genesArr);
}

function formatOmeroidrData(genesArr: any[]) {
  return genesArr.map((record) => new ImageRecord(record));
}

function formatBigBedData(genesArr: any[]) {
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
      score
    );
  });
}

function formatSnpData(genesArr: any[]) {
  const formattedData = genesArr.map((record) => new Snp(record));
  return formattedData;
}
function formatCategoricalData(genesArr: any[]) {
  const formattedData = genesArr.map(
    (record) =>
      new Feature(
        record[BedColumnIndex.CATEGORY],
        new ChromosomeInterval(record.chr, record.start, record.end)
      )
  );
  return formattedData;
}
function formatJasper(genesArr: any[]) {
  return genesArr.map((record) => {
    const rest = record.rest.split("\t");
    return new JasparFeature(
      rest[3],
      new ChromosomeInterval(record.chr, record.start, record.end),
      rest[2]
    ).withJaspar(Number.parseInt(rest[1], 10), rest[0]);
  });
}
function formatModBedData(genesArr: any[]) {
  return genesArr.map((record) => {
    return new Fiber(
      record[3],
      new ChromosomeInterval(record.chr, record.start, record.end),
      record[5]
    ).withFiber(parseNumberString(record[4]), record[6], record[7]);
  });
}
function formatBigWigData(genesArr: any[]) {
  //dynseq, boxplot track also
  return genesArr.map((record) => {
    const newChrInt = new ChromosomeInterval(
      record.chr,
      record.start,
      record.end
    );
    return new NumericalFeature("", newChrInt).withValue(record.score);
  });
}
function formatMatplotData(genesArr: any[]) {
  let formattedData: Array<any> = [];

  for (let i = 0; i < genesArr.length; i++) {
    formattedData.push(
      genesArr[i].map((record) => {
        let newChrInt = new ChromosomeInterval(
          record.chr,
          record.start,
          record.end
        );
        return new NumericalFeature("", newChrInt).withValue(record.score);
      })
    );
  }
  return formattedData;
}

function formatMethylcData(genesArr: any[]) {
  return genesArr.map((record) => new MethylCRecord(record));
}

function formatDynamicBed(genesArr: any[]) {
  return genesArr.map((geneArr: any) =>
    geneArr.map(
      (record) =>
        new Feature(
          record[3],
          new ChromosomeInterval(record.chr, record.start, record.end)
        )
    )
  );
}
function formatDynamicLongRange(genesArr: any[]) {
  return genesArr.map((geneArr: any) => {
    let tempLongrangeData: any[] = [];
    geneArr.map((record) => {
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
}

function formatqBedData(genesArr: any[]) {
  return genesArr.map((record) => new QBed(record));
}
function formatDynamic(genesArr: any[]) {
  return genesArr.map((geneArr: any) =>
    geneArr.map((record) =>
      new NumericalFeature(
        "",
        new ChromosomeInterval(record.chr, record.start, record.end)
      ).withValue(record.score)
    )
  );
}

function formatBedgraph(genesArr: any[]) {
  const VALUE_COLUMN_INDEX = 3;

  return genesArr.map((record) => {
    const newChrInt = new ChromosomeInterval(
      record.chr,
      record.start,
      record.end
    );
    const unsafeValue = Number(record[VALUE_COLUMN_INDEX]);
    const value = Number.isFinite(unsafeValue) ? unsafeValue : 0;
    return new NumericalFeature("", newChrInt).withValue(value);
  });
}
function formatdBedGraph(genesArr: any[]) {
  const VALUE_COLUMN_INDEX = 3;
  let formattedData = genesArr.map((record) => {
    const locus = new ChromosomeInterval(record.chr, record.start, record.end);
    let parsedValue;
    try {
      parsedValue = JSON.parse(record[VALUE_COLUMN_INDEX]);
    } catch (e) {
      console.error(e);
      parsedValue = [0];
    }
    return new NumericalArrayFeature("", locus).withValues(parsedValue);
  });
  return formattedData;
}
function formatVcf(genesArr: any[]) {
  return genesArr.map((record) => new Vcf(record));
}
function formatBigInteract(genesArr: any[]) {
  const formattedData: any = [];
  genesArr.map((record) => {
    const regexMatch = record.rest.match(/([\w.]+)\W+(\d+)\W+(\d+)\W+(\d+)/);

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
  return formattedData;
}
function formatLongRange(genesArr: any[]) {
  const formattedData: any = [];
  genesArr.forEach((record) => {
    const regexMatch = record[3].match(/([\w.]+)\W+(\d+)\W+(\d+)\W+(\d+)/);
    // console.log(regexMatch);
    if (regexMatch) {
      const chr = regexMatch[1];
      const start = Number.parseInt(regexMatch[2], 10);
      const end = Number.parseInt(regexMatch[3], 10);
      // const score = Number.parseFloat(regexMatch[4]); // this also convert -2 to 2 as score
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
      console.error(`${record[3]} not formated correctly in longrange track`);
    }
  });
  return formattedData;
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

const formatFunctions: { [key: string]: (genesArr: any[]) => any[] } = {
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
  // Add additional type-function mappings here
};
export function formatDataByType(genesArr: any[], type: string, reverse) {
  // Check if genesArr is falsy
  if (!genesArr) {
    return { error: "No data available" };
  }

  // Check if genesArr has an error property (cast to any to avoid TypeScript error)
  if (typeof genesArr === "object" && (genesArr as any).error) {
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
    return formatter(genesArr);
  } else {
    return genesArr; // Fallback if no formatter is found
  }
}
