import { FeatureSegment } from './FeatureSegment';
import { AlignmentRecord } from './AlignmentRecord';
import { default as OpenInterval } from './OpenInterval';
import { default as ChromosomeInterval } from './ChromosomeInterval';
/**
 * A segment of an alignment record.  Has methods that get parts of the attached record's sequences and loci.
 *
 * @author Silas Hsu
 */
export declare class AlignmentSegment extends FeatureSegment {
    readonly feature: AlignmentRecord;
    /**
     * The substring indices in the record's sequence data that this segment covers.
     */
    readonly sequenceInterval: OpenInterval;
    /**
     * Creates an AlignmentSegment from a FeatureSegment whose attached feature is an AlignmentRecord.  Works almost
     * like a cast from FeatureSegment to AlignmentSegment.
     *
     * @param {FeatureSegment} segment - a FeatureSegment whose attached feature must be an AlignmentRecord
     * @return {AlignmentSegment} a new AlignmentSegment from the data in the input
     */
    static fromFeatureSegment(segment: FeatureSegment): AlignmentSegment;
    /**
     * Constructs a new instance.
     *
     * @see {FeatureSegment}
     */
    constructor(record: AlignmentRecord, start?: number, end?: number);
    /**
     * @return {string} the part of the primary genome sequence that this segment covers
     */
    getTargetSequence(): string;
    /**
     * Gets the approximate location in the query/secondary genome that this segment covers.
     *
     * @return {ChromosomeInterval} the approximate locus in the query/secondary genome represented by this segment.
     */
    getQueryLocus(): ChromosomeInterval;
    /**
     * Gets the location in the query/secondary genome that this segment covers.  Unlike `getQueryLocus`, this method
     * uses sequence data, so it will be more accurate, but also somewhat slower.
     *
     * @return {ChromosomeInterval} the locus in the query/secondary genome represented by this segment.
     */
    getQueryLocusFine(): ChromosomeInterval;
    /**
     * @return {string} the part of the query/secondary genome sequence that this segment covers
     */
    getQuerySequence(): string;
}
