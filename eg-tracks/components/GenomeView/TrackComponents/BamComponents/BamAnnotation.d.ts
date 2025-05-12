import React from "react";
import { PlacedSegment, PlacedFeature } from "../../../../models/getXSpan/FeaturePlacer";
import { BamRecord } from "../../../../models/BamRecord";
export interface BamAnnotationOptions {
    color?: string;
    color2?: string;
    mismatchColor?: string;
    deletionColor?: string;
    insertionColor?: string;
}
interface BamAnnotationProps {
    placedRecord: PlacedFeature;
    options: BamAnnotationOptions;
    y?: number;
    onClick(event: React.MouseEvent, record: BamRecord): void;
}
/**
 * Draws a single BAM annotation.
 *
 * @author Silas Hsu
 */
export declare class BamAnnotation extends React.Component<BamAnnotationProps, {}> {
    static HEIGHT: number;
    static defaultProps: {
        options: {};
    };
    constructor(props: BamAnnotationProps);
    /**
     * Renders a segment representing an aligned portion of a BAM read.
     *
     * @param {PlacedSegment} placedSegment - the segment to render, and placement info
     * @return {JSX.Element[]} the elements to render
     */
    renderRead(placedSegment: PlacedSegment): import("react/jsx-runtime").JSX.Element[] | null;
    /**
     * Renders a segment representing a skipped portion of a BAM read.
     *
     * @param {PlacedSegment} placedSegment - the segment to render, and placement info
     * @return {JSX.Element} the element to render
     */
    renderSkip(placedSegment: PlacedSegment): import("react/jsx-runtime").JSX.Element | null;
    handleClick(event: React.MouseEvent): void;
    render(): import("react/jsx-runtime").JSX.Element;
}
export {};
