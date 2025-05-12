import React from "react";
import { PlacedFeature } from "../../../../models/getXSpan/FeaturePlacer";
export declare const DEFAULT_OPTIONS: {
    color: string;
    backgroundColor: string;
    categoryColors: {
        coding: string;
        protein_coding: string;
        nonCoding: string;
        pseudogene: string;
        pseudo: string;
        problem: string;
        polyA: string;
        other: string;
    };
    hiddenPixels: number;
    italicizeText: boolean;
    hideMinimalItems: boolean;
};
export interface GeneDisplayOptions {
    color?: string;
    backgroundColor?: string;
    categoryColors?: {
        [category: string]: string;
    };
}
interface GeneAnnotationProps {
    placedGene: PlacedFeature;
    options?: GeneDisplayOptions;
    y?: number;
}
declare const GeneAnnotation: React.FC<GeneAnnotationProps>;
export default GeneAnnotation;
