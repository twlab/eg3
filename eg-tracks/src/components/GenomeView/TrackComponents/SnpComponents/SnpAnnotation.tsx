import React from "react";
import { TranslatableG } from "../geneAnnotationTrackComponents/TranslatableG";
import AnnotationArrows from "../commonComponents/annotation/AnnotationArrows";
import BackgroundedText from "../geneAnnotationTrackComponents/BackgroundedText";
import Snp from "@eg/core/src/eg-lib/models/Snp";
import OpenInterval from "@eg/core/src/eg-lib/models/OpenInterval";
import { getContrastingColor } from "@eg/core/src/eg-lib/models/util";

const HEIGHT = 9;

interface SnpAnnotationProps {
  snp: Snp;
  xSpan: OpenInterval;
  y: number;
  color?: string;
  reverseStrandColor?: string;
  isMinimal?: boolean;
  isInvertArrowDirection?: boolean;
  alwaysDrawLabel?: boolean;
  hiddenPixels?: number;
  onClick?: (event: React.MouseEvent<SVGElement, MouseEvent>, snp: Snp) => void;
}

const SnpAnnotation: React.FC<SnpAnnotationProps> = ({
  snp,
  xSpan,
  y,
  color = "green",
  reverseStrandColor = "pink",
  isMinimal = false,
  isInvertArrowDirection = false,
  alwaysDrawLabel = false,
  hiddenPixels = 0,
  onClick = (event, snp) => undefined,
}) => {
  const colorToUse = snp.getIsReverseStrand() ? reverseStrandColor : color;
  const contrastColor = getContrastingColor(colorToUse);
  const [startX, endX] = xSpan;
  const width2 = endX - startX;
  const width = alwaysDrawLabel ? Math.max(3, width2) : width2;

  if (width <= hiddenPixels) {
    return null;
  }

  const mainBody = (
    <rect x={startX} y={0} width={width} height={HEIGHT} fill={colorToUse} />
  );

  if (isMinimal) {
    return (
      <TranslatableG y={y} onClick={(event) => onClick(event, snp)}>
        {mainBody}
      </TranslatableG>
    );
  }

  let arrows;
  if (snp.getHasStrand()) {
    arrows = (
      <AnnotationArrows
        startX={startX}
        endX={endX}
        height={HEIGHT}
        isToRight={snp.getIsReverseStrand() === isInvertArrowDirection}
        color={contrastColor}
      />
    );
  }

  let label;
  const estimatedLabelWidth = snp.getName().length * HEIGHT;
  if (estimatedLabelWidth < 0.5 * width) {
    const centerX = startX + 0.5 * width;
    label = (
      <BackgroundedText
        x={centerX}
        y={0}
        height={HEIGHT - 1}
        fill={contrastColor}
        dominantBaseline="hanging"
        textAnchor="middle"
        backgroundColor={colorToUse}
        backgroundOpacity={1}
      >
        {snp.getName()}
      </BackgroundedText>
    );
  } else if (alwaysDrawLabel) {
    label = (
      <BackgroundedText
        x={endX + 4} // 4px space between rect and text label
        y={0}
        height={HEIGHT - 1}
        fill={colorToUse}
        dominantBaseline="hanging"
        textAnchor="start"
      >
        {snp.getName()}
      </BackgroundedText>
    );
  }

  return (
    <TranslatableG y={y} onClick={(event) => onClick(event, snp)}>
      {mainBody}
      {arrows}
      {label}
    </TranslatableG>
  );
};

export default SnpAnnotation;
