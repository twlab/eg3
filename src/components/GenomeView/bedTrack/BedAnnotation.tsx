import React from "react";
import { TranslatableG } from "../geneAnnotationTrack/TranslatableG";
import AnnotationArrows from "../commonComponents/annotation/AnnotationArrows";
import BackgroundedText from "../geneAnnotationTrack/BackgroundedText";
import Feature from "../../../models/Feature";
import OpenInterval from "../../../models/OpenInterval";
import { getContrastingColor } from "../../../models/util";
const HEIGHT = 9;

interface BedAnnotationProps {
  feature: Feature;
  xSpan: OpenInterval;
  y?: number;
  color?: string;
  reverseStrandColor?: string;
  isMinimal?: boolean;
  isInvertArrowDirection?: boolean;
  onClick?: (
    event: React.MouseEvent<SVGGElement, MouseEvent>,
    feature: Feature
  ) => void;
  alwaysDrawLabel?: boolean;
  hiddenPixels?: number;
  opacity?: number;
}

class BedAnnotation extends React.Component<BedAnnotationProps> {
  static HEIGHT = HEIGHT;

  static defaultProps = {
    color: "blue",
    reverseStrandColor: "red",
    isInvertArrowDirection: false,
    opacity: 1,
    onClick: (
      event: React.MouseEvent<SVGGElement, MouseEvent>,
      feature: Feature
    ) => undefined,
  };

  render() {
    const {
      feature,
      xSpan,
      y = 0,
      color = "blue",
      reverseStrandColor = "red",
      isMinimal = false,
      isInvertArrowDirection = false,
      onClick = (
        event: React.MouseEvent<SVGGElement, MouseEvent>,
        feature: Feature
      ) => undefined,
      alwaysDrawLabel = false,
      hiddenPixels = 0,
      opacity = 1,
    } = this.props;

    const colorToUse = feature.getIsReverseStrand()
      ? reverseStrandColor
      : color;
    const contrastColor = getContrastingColor(colorToUse);
    const [startX, endX] = xSpan;
    const width2 = endX - startX;
    const width = alwaysDrawLabel ? Math.max(3, width2) : width2;

    if (width < hiddenPixels) {
      return null;
    }

    const mainBody = (
      <rect
        x={startX}
        y={0}
        width={width}
        height={HEIGHT}
        fill={colorToUse}
        opacity={opacity}
      />
    );

    if (isMinimal) {
      return (
        <TranslatableG y={y} onClick={(event) => onClick(event, feature)}>
          {mainBody}
        </TranslatableG>
      );
    }

    let arrows: any = null;
    if (feature.getHasStrand()) {
      arrows = (
        <AnnotationArrows
          startX={startX}
          endX={endX}
          height={HEIGHT}
          isToRight={feature.getIsReverseStrand() === isInvertArrowDirection}
          color={contrastColor}
          opacity={opacity}
        />
      );
    }

    let label: any = null;
    const estimatedLabelWidth = feature.getName().length * HEIGHT;
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
          {feature.getName()}
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
          {feature.getName()}
        </BackgroundedText>
      );
    }

    return (
      <TranslatableG y={y} onClick={(event) => onClick(event, feature)}>
        {mainBody}
        {arrows}
        {label}
      </TranslatableG>
    );
  }
}

export default BedAnnotation;
