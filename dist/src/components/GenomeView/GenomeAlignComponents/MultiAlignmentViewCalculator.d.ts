import { SequenceSegment } from '../../../models/AlignmentStringUtils';
import { default as AlignmentRecord } from '../../../models/AlignmentRecord';
import { AlignmentSegment } from '../../../models/AlignmentSegment';
import { NavContextBuilder, Gap } from '../../../models/NavContextBuilder';
import { default as ChromosomeInterval } from '../../../models/ChromosomeInterval';
import { default as OpenInterval } from '../../../models/OpenInterval';
import { default as LinearDrawingModel } from '../../../models/LinearDrawingModel';
import { default as Feature } from '../../../models/Feature';
import { ViewExpansion } from '../../../models/RegionExpander';
import { default as DisplayedRegionModel } from '../../../models/DisplayedRegionModel';
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
    /**
     * PlacedAlignment[] in fine mode; PlacedMergedAlignment in rough mode.
     */
    drawData: PlacedAlignment[] | PlacedMergedAlignment[];
    drawGapText?: GapText[];
    plotStrand?: string;
    primaryGenome: string;
    queryGenome: string;
    basesPerPixel: number;
    navContextBuilder?: NavContextBuilder;
    id: any;
}
export interface MultiAlignment {
    [genome: string]: Alignment;
}
interface RecordsObj {
    query: string;
    records: AlignmentRecord[];
    isBigChain?: boolean;
    id: any;
}
interface RefinedObj {
    newRecordsArray: RecordsObj[];
    allGaps: Gap[];
}
export declare class MultiAlignmentViewCalculator {
    private primaryGenome;
    constructor(primaryGenomeConfig: string);
    multiAlign(visData: ViewExpansion, rawRecords: any): {};
    calculatePrimaryVis(allGaps: Gap[], visData: ViewExpansion): ViewExpansion;
    refineRecordsArray(recordsArray: RecordsObj[], visData: ViewExpansion): RefinedObj;
    alignFine(id: any, query: string, records: AlignmentRecord[], oldVisData: ViewExpansion, visData: ViewExpansion, allGaps: Gap[]): Alignment;
    /**
     * Groups and merges alignment records based on their proximity in the query (secondary) genome.  Then, calculates
     * draw positions for all records.
     *
     * @param {AlignmentRecord[]} alignmentRecords - records to process
     * @param {DisplayedRegionModel} viewRegion - view region of the primary genome
     * @param {number} width - view width of the primary genome
     * @return {PlacedMergedAlignment[]} placed merged alignments
     */
    alignRough(id: any, query: string, alignmentRecords: AlignmentRecord[], visData: ViewExpansion): Alignment;
    /**
     * Calculates context coordinates in the *primary* genome for alignment records.  Returns PlacedAlignments with NO x
     * coordinates set.  Make sure you set them before returning them in any public API!
     *
     * @param records
     * @param visData
     */
    _computeContextLocations(records: AlignmentRecord[], visData: ViewExpansion): PlacedAlignment[];
    /**
     *
     * @param placedAlignment
     * @param minGapLength
     */
    _getPrimaryGenomeGaps(placements: PlacedAlignment[], minGapLength: number): Gap[];
    _placeSequenceSegments(sequence: string, minGapLength: number, startX: number, drawModel: LinearDrawingModel): PlacedSequenceSegment[];
    /**
     *
     * @param placements
     * @param minGapLength
     * @param pixelsPerBase
     */
    _getQueryPieces(placements: PlacedAlignment[]): QueryGenomePiece[];
    _makeQueryGenomeRegion(genomePieces: QueryGenomePiece[], visWidth: number, drawModel: LinearDrawingModel): DisplayedRegionModel;
    _placeInternalLoci(parentLocus: ChromosomeInterval, internalLoci: ChromosomeInterval[], parentXSpan: OpenInterval, drawReverse: boolean, drawModel: LinearDrawingModel): any[];
}
export {};
