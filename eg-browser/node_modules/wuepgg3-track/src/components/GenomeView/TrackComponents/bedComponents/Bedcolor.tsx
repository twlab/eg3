import React from "react";
import { TranslatableG } from "../geneAnnotationTrackComponents/TranslatableG";
import { ColoredFeature } from "../../../../models/Feature";
import OpenInterval from "../../../../models/OpenInterval";

interface BedcolorProps {
  feature: any; // Feature to visualize
  xSpan: OpenInterval; // x span the annotation will occupy
  y: number; // Y offset
  height: number;
  isMinimal: boolean; // Whether to just render a plain box
  onClick?: (event: React.MouseEvent, feature: ColoredFeature) => void;
}

const Bedcolor: React.FC<BedcolorProps> = ({
  feature,
  xSpan,
  y,
  height,
  isMinimal,
  onClick = () => {},
}) => {
  const [startX, endX] = xSpan;
  const width = endX - startX;

  if (width <= 0) {
    return null;
  }

  const mainBody = (
    <rect x={startX} y={0} width={width} height={height} fill={feature.color} />
  );

  if (isMinimal) {
    return (
      <TranslatableG y={y} onClick={(event) => onClick(event, feature)}>
        {mainBody}
      </TranslatableG>
    );
  }

  return (
    <TranslatableG y={y} onClick={(event) => onClick(event, feature)}>
      {mainBody}
    </TranslatableG>
  );
};

export default Bedcolor;
