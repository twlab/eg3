import { Feature } from "@gmod/bbi";
import AlignmentRecord from "../../../../models/AlignmentRecord";
import { AlignmentSegment } from "../../../../models/AlignmentSegment";
import { SequenceSegment } from "../../../../models/AlignmentStringUtils";
import OpenInterval from "../../../../models/OpenInterval";
export declare const DEFAULT_OPTIONS: {
    height: number;
    primaryColor: string;
    queryColor: string;
};
interface QueryGenomePiece {
    queryFeature: Feature;
    queryXSpan: OpenInterval;
}
export interface PlacedMergedAlignment extends QueryGenomePiece {
    segments: PlacedAlignment[];
    targetXSpan: OpenInterval;
}
export interface PlacedSequenceSegment extends SequenceSegment {
    xSpan: OpenInterval;
}
export interface PlacedAlignment {
    record: AlignmentRecord;
    visiblePart: AlignmentSegment;
    contextSpan: OpenInterval;
    targetXSpan: OpenInterval;
    queryXSpan: OpenInterval | null;
    targetSegments?: PlacedSequenceSegment[];
    querySegments?: PlacedSequenceSegment[];
}
export declare function renderGapText(gap: {
    [key: string]: any;
}, i: number, options: {
    [key: string]: any;
}): import("react/jsx-runtime").JSX.Element;
export declare function renderFineAlignment(placement: any, i: number, options: {
    [key: string]: any;
}): import("react/jsx-runtime").JSX.Element;
export declare function renderRoughStrand(strand: string, topY: number, viewWindow: {
    [key: string]: any;
}, isPrimary: boolean): import("react/jsx-runtime").JSX.Element;
export declare function renderRoughAlignment(placement: {
    [key: string]: any;
}, plotReverse: boolean, roughHeight: number, targetGenome: any, queryGenome: any): import("react/jsx-runtime").JSX.Element;
export {};
