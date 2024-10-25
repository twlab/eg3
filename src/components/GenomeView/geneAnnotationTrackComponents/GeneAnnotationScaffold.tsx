import React, { Children } from "react";
import OpenInterval from "../../../models/OpenInterval";
import Gene from "../../../models/Gene";
import GeneAnnotation, {
  DEFAULT_OPTIONS,
  GeneDisplayOptions,
} from "./GeneAnnotation";
import { TranslatableG } from "./TranslatableG";
import BackgroundedText from "./BackgroundedText";

interface GeneAnnotationScaffoldProps {
  gene: Gene;
  xSpan: OpenInterval;
  viewWindow?: OpenInterval;
  y?: number;
  isMinimal?: boolean;
  options?: {
    color?: string;
    backgroundColor?: string;
    italicizeText?: boolean;
    hideMinimalItems?: boolean;
  };
  children: React.ReactNode;
  onClick(event: React.MouseEvent, gene: Gene): void;
}

const HEIGHT = 9;

const GeneAnnotationScaffold: React.FC<GeneAnnotationScaffoldProps> = ({
  gene,
  xSpan,
  viewWindow,
  y,
  isMinimal,
  options,
  children,
  onClick,
}) => {
  const [xStart, xEnd] = xSpan;
  const { color, backgroundColor, italicizeText } = getDrawColors(
    gene,
    options
  );

  const coveringRect = (
    <rect
      // Box that covers the whole annotation to increase the click area
      x={xStart}
      y={0}
      width={xSpan.getLength()}
      height={HEIGHT}
      fill={isMinimal ? color : backgroundColor}
      opacity={isMinimal ? 1 : 0}
    />
  );

  if (isMinimal) {
    // Just render a box if minimal.
    if (options?.hideMinimalItems) {
      return <div></div>;
    }
    return <TranslatableG y={y}>{coveringRect}</TranslatableG>;
  }

  const centerY = HEIGHT / 2;
  const centerLine = (
    <line
      x1={xStart}
      y1={centerY}
      x2={xEnd}
      y2={centerY}
      stroke={color}
      strokeWidth={1}
      strokeDasharray={4}
    />
  );

  let labelX, textAnchor;
  let labelHasBackground = false;

  const estimatedLabelWidth = gene.getName().length * HEIGHT;
  const isBlockedLeft = xStart - estimatedLabelWidth < viewWindow!.start;
  const isBlockedRight = xEnd + estimatedLabelWidth > viewWindow!.end;

  if (!isBlockedLeft) {
    // Yay, we can put it on the left!
    labelX = xStart - 4;
    textAnchor = "end";
  } else if (!isBlockedRight) {
    // Yay, we can put it on the right!
    labelX = xEnd + 4;
    textAnchor = "start";
  } else if (!isBlockedLeft && !isBlockedRight) {
    labelX = viewWindow!.start + 4;
    textAnchor = "start";
    labelHasBackground = true;
  }

  const label = (
    <BackgroundedText
      x={labelX}
      y={0}
      height={9}
      fill={color}
      dy="0.65em"
      textAnchor={textAnchor}
      backgroundColor={backgroundColor}
      backgroundOpacity={labelHasBackground ? 0.65 : 0}
      italicizeText={italicizeText}
    >
      {gene.getName()}
    </BackgroundedText>
  );

  return (
    <TranslatableG y={y} onClick={(event) => onClick(event, gene)}>
      {coveringRect}
      {centerLine}
      {children}
      {label}
    </TranslatableG>
  );
};

export default GeneAnnotationScaffold;

export function getDrawColors(gene: Gene, options: GeneDisplayOptions = {}) {
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
