import React from "react";
import OpenInterval from "../../../../models/OpenInterval";
import Gene from "../../../../models/Gene";
import { GeneDisplayOptions } from "./GeneAnnotation";
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
declare const GeneAnnotationScaffold: React.FC<GeneAnnotationScaffoldProps>;
export default GeneAnnotationScaffold;
export declare function getDrawColors(gene: Gene, options?: GeneDisplayOptions): {
    color: string;
    backgroundColor: string;
    italicizeText: boolean;
};
