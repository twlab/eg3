import React from "react";
import _ from "lodash";
import { v4 as uuidv4 } from "uuid";
import AnnotationArrows from "../commonComponents/annotation/AnnotationArrows";
import Gene from "../../../models/Gene";
import {
  FeaturePlacer,
  PlacedFeature,
  PlacedSegment,
} from "../../../models/getXSpan/FeaturePlacer";

const FEATURE_PLACER = new FeaturePlacer();
const HEIGHT = 9;
const UTR_HEIGHT = 5;
export const DEFAULT_OPTIONS = {
  color: "blue",
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
  hideMinimalItems: false,
};

export interface GeneDisplayOptions {
  color?: string;
  backgroundColor?: string;
  categoryColors?: { [category: string]: string };
}

interface GeneAnnotationProps {
  placedGene: PlacedFeature; // Gene and its placement
  options?: GeneDisplayOptions;
  y?: number;
}

const GeneAnnotation: React.FC<GeneAnnotationProps> = (props: any) => {
  function _renderCenteredRects(
    placedSegments: PlacedSegment[],
    height: number,
    color: string,
    opacity: number = 1
  ) {
    return placedSegments.map((placedSegment) => {
      const x = placedSegment.xSpan.start;
      const width = Math.max(placedSegment.xSpan.getLength(), 3); // min 3 px for exon
      return (
        <rect
          key={x + uuidv4()}
          x={x}
          y={(HEIGHT - height) / 2}
          width={width}
          height={height}
          fill={color}
          opacity={opacity}
        />
      );
    });
  }
  function getDrawColors(gene: Gene, options: GeneDisplayOptions = {}) {
    const mergedOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    return {
      color:
        mergedOptions.categoryColors[gene.transcriptionClass!] ||
        mergedOptions.color,
      backgroundColor: mergedOptions.backgroundColor,
      italicizeText: mergedOptions.italicizeText,
    };
  }

  const placedGene = props.placedGene;
  const gene = placedGene.feature as Gene;
  const [xStart, xEnd] = placedGene.xSpan;
  const { color, backgroundColor } = getDrawColors(gene, props.options);

  const centerY = HEIGHT / 2;
  const centerLine = (
    <line
      x1={xStart}
      y1={centerY}
      x2={xEnd}
      y2={centerY}
      stroke={color}
      strokeWidth={2}
    />
  );

  const { translated, utrs } = gene.getExonsAsFeatureSegments();
  const placedTranslated = FEATURE_PLACER.placeFeatureSegments(
    placedGene,
    translated
  );
  const placedUtrs = FEATURE_PLACER.placeFeatureSegments(placedGene, utrs);
  const exonRects = _renderCenteredRects(placedTranslated, HEIGHT, color);

  const isToRight = gene.getIsReverseStrand() === placedGene.isReverse;
  const intronArrows = (
    <AnnotationArrows
      startX={xStart}
      endX={xEnd}
      height={HEIGHT}
      isToRight={isToRight}
      color={color}
    />
  );
  let _exonClipId = _.uniqueId("GeneAnnotation");
  const exonClip = <clipPath id={_exonClipId}>{exonRects}</clipPath>;
  const exonArrows = (
    <AnnotationArrows
      startX={xStart}
      endX={xEnd}
      height={HEIGHT}
      isToRight={isToRight}
      color={backgroundColor}
      clipId={_exonClipId}
    />
  );

  const utrArrowCover = _renderCenteredRects(
    placedUtrs,
    HEIGHT,
    backgroundColor,
    0
  );

  const utrRects = _renderCenteredRects(placedUtrs, UTR_HEIGHT, color);

  return (
    <React.Fragment>
      {centerLine}
      {exonRects}
      {exonClip}
      {intronArrows}
      {exonArrows}
      {utrArrowCover}
      {utrRects}
    </React.Fragment>
  );
};

export default GeneAnnotation;
