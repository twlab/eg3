import React from "react";
import Snp from "../../../../models/Snp";
import OpenInterval from "../../../../models/OpenInterval";
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
    onClick(event: React.MouseEvent, gene: Snp): void;
}
declare const SnpAnnotation: React.FC<SnpAnnotationProps>;
export default SnpAnnotation;
