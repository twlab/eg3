import { SequenceSegment } from '../models/AlignmentStringUtils';
import { default as AlignmentRecord } from '../models/AlignmentRecord';
import { AlignmentSegment } from '../models/AlignmentSegment';
import { NavContextBuilder } from '../models/NavContextBuilder';
import { default as OpenInterval } from '../models/OpenInterval';
import { default as Feature } from '../models/Feature';
import { ViewExpansion } from '../models/RegionExpander';
import { default as DisplayedRegionModel } from '../models/DisplayedRegionModel';
export interface PlacedAlignment {
    record: AlignmentRecord;
    visiblePart: AlignmentSegment;
    contextSpan: OpenInterval;
    targetXSpan: OpenInterval;
    queryXSpan: OpenInterval | null;
    targetSegments?: PlacedSequenceSegment[];
    querySegments?: PlacedSequenceSegment[];
}
export interface PlacedSequenceSegment extends SequenceSegment {
    xSpan: OpenInterval;
}
interface QueryGenomePiece {
    queryFeature: Feature;
    queryXSpan: OpenInterval;
}
export interface PlacedMergedAlignment extends QueryGenomePiece {
    segments: PlacedAlignment[];
    targetXSpan: OpenInterval;
}
export interface GapText {
    targetGapText: string;
    targetXSpan: OpenInterval;
    targetTextXSpan: OpenInterval;
    queryGapText: string;
    queryXSpan: OpenInterval;
    queryTextXSpan: OpenInterval;
    shiftTarget: boolean;
    shiftQuery: boolean;
}
export interface Alignment {
    isFineMode: boolean;
    primaryVisData: ViewExpansion;
    queryRegion: DisplayedRegionModel;
    drawData: PlacedAlignment[] | PlacedMergedAlignment[];
    drawGapText?: GapText[];
    plotStrand?: string;
    primaryGenome: string;
    queryGenome: string;
    basesPerPixel: number;
    navContextBuilder?: NavContextBuilder;
}
export interface MultiAlignment {
    [genome: string]: Alignment;
}
export {};
