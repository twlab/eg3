import OpenInterval from "./OpenInterval";
import { FeatureSegment } from "./FeatureSegment";
import ChromosomeInterval from "./ChromosomeInterval";
import { Feature } from "./Feature";
/**
 * A implicit coordinate system for the entire genome or a gene set view.  It represents everywhere that a user could
 * potentially navigate and view.
 *
 * A context constructs this coordinate system through an ordered list of features.  Features in NavigationContexts must
 * have non-empty, unique names.  In addition to this implicit coordinate system, NavContext methods also support
 * feature coordinates, which are a feature and base number relative to the start of the feature.
 *
 * @author Silas Hsu
 */
declare class NavigationContext {
    _name: string;
    _features: Feature[];
    _sortedFeatureStarts: number[];
    _minCoordinateForFeature: Map<Feature, number>;
    _featuresForChr: {
        [chr: string]: Feature[];
    };
    _totalBases: number;
    /**
     * Makes a special "feature" representing a gap in the genome.  To use, insert such objects into the feature list
     * during NavigationContext construction.
     *
     * @param {number} length - length of the gap in bases
     * @param {string} [name] - custom name of the gap feature
     * @return {Feature} a special "feature" representing a gap in the genome.
     */
    static makeGap(length: number, name?: string): Feature;
    /**
     * @param {Feature} feature - feature to inspect
     * @return {boolean} whether the feature represents a gap in the genome
     */
    static isGapFeature(feature: Feature): boolean;
    /**
     * Makes a new instance.  Features must have non-empty, unique names.  The `isGenome` parameter does not change any
     * of the instance's functionality, but if it is true, it optimizes mapping functions.
     *
     * @param {string} name - name of this context
     * @param {Feature[]} features - list of features
     * @param {boolean} isGenome - whether the context covers the entire genome
     * @throws {Error} if the feature list has a problem
     */
    constructor(name: string, features: Array<any>);
    /**
     * If the input segment is in a reverse strand feature, returns a new segment that is the same size, but moved to
     * the other end of the feature.  In effect, it rotates a feature segment 180 degrees about the feature's center.
     *
     * Otherwise, returns the input unmodified.
     *
     * @example
     * let feature: Feature; // Pretend it has a length of 10
     * const segment = new FeatureSegment(feature, 2, 4);
     * this._flipIfReverseStrand(segment); // Returns new segment [6, 8)
     *
     * @param {FeatureSegment} segment - the feature segment to flip if on the reverse strand
     * @return {FeatureSegment} flipped feature segment, but only if the input was on the reverse strand
     */
    _flipIfReverseStrand(segment: FeatureSegment): FeatureSegment;
    /**
     * @return {string} this navigation context's name, as specified in the constructor
     */
    getName(): string;
    /**
     * Gets the internal feature list.  This list should be treated as read-only; modifying its elements causes
     * undefined behavior.
     *
     * @return {Feature[]} the internal feature list for this context
     */
    getFeatures(): Feature[];
    /**
     * @return {number} the total number of bases in this context, i.e. how many bases are navigable
     */
    getTotalBases(): number;
    /**
     * Given a context coordinate, gets whether the base is navigable.
     *
     * @param {number} base - context coordinate
     * @return {boolean} whether the base is navigable
     */
    getIsValidBase(base: number): boolean;
    /**
     * Gets the lowest context coordinate that the input feature has.  Throws an error if the feature cannot be found.
     *
     * Note that if the feature is on the forward strand, the result will represent the feature's start.  Otherwise, it
     * represents the feature's end.
     *
     * @param {Feature} feature - the feature to find
     * @return {number} the lowest context coordinate of the feature
     * @throws {RangeError} if the feature is not in this context
     */
    getFeatureStart(feature: Feature): number;
    /**
     * Given a context coordinate, gets the feature in which it is located.  Returns a FeatureSegment that has 1 length,
     * representing a single base number relative to the feature's start.
     *
     * @param {number} base - the context coordinate to look up
     * @return {FeatureSegment} corresponding feature coordinate
     * @throws {RangeError} if the base is not in this context
     */
    convertBaseToFeatureCoordinate(base: number): FeatureSegment;
    /**
     * Given a segment of a feature from this navigation context, gets the context coordinates the segment occupies.
     *
     * @param {FeatureSegment} segment - feature segment from this context
     * @return {OpenInterval} context coordinates the feature segment occupies
     */
    convertFeatureSegmentToContextCoordinates(segment: FeatureSegment): OpenInterval;
    /**
     * Converts genome coordinates to an interval of context coordinates.  Since coordinates can map
     * to multiple features, or none at all, this method returns a list of OpenInterval.
     *
     * @param {ChromosomeInterval} chrInterval - genome interval
     * @return {OpenInterval[]} intervals of context coordinates
     */
    convertGenomeIntervalToBases(chrInterval: ChromosomeInterval): OpenInterval[];
    /**
     * Converts a context coordinate to one that ignores gaps in this instance.  Or, put another way, if we removed all
     * gaps in this instance, what would be the context coordinate of `base` be?
     *
     * @example
     * navContext = [10bp feature, 10bp gap, 10bp feature]
     * navContext.toGaplessCoordinate(5); // Returns 5
     * navContext.toGaplessCoordinate(15); // Returns 10
     * navContext.toGaplessCoordinate(25); // Returns 15
     *
     * @param {number} base - the context coordinate to convert
     * @return {number} context coordinate if gaps didn't exist
     */
    toGaplessCoordinate(base: number): number;
    /**
     * Parses an location in this navigation context.  Should be formatted like "$chrName:$startBase-$endBase" OR
     * "$featureName".  We expect 0-indexed intervals.
     *
     * Returns an open interval of context coordinates.  Throws RangeError on parse failure.
     *
     * @param {string} str - the string to parse
     * @return {OpenInterval} the context coordinates represented by the string
     * @throws {RangeError} when parsing an interval outside of the context or something otherwise nonsensical
     */
    parse(str: string): OpenInterval;
    /**
     * Queries features that overlap an open interval of context coordinates.  Returns a list of FeatureSegment.
     *
     * @param {number} queryStart - (inclusive) start of interval, as a context coordinate
     * @param {number} queryEnd - (exclusive) end of interval, as a context coordinate
     * @param {boolean} [includeGaps] - whether to include gaps in the results.  Default: true
     * @return {FeatureSegment[]} list of feature intervals
     */
    getFeaturesInInterval(queryStart: number, queryEnd: number, includeGaps?: boolean): FeatureSegment[];
    /**
     * Queries genomic locations that overlap an open interval of context coordinates.  The results are guaranteed to
     * not overlap each other.
     *
     * @param {number} queryStart - (inclusive) start of interval, as a context coordinate
     * @param {number} queryEnd - (exclusive) end of interval, as a context coordinate
     * @return {ChromosomeInterval[]} list of genomic locations
     */
    getLociInInterval(queryStart: number, queryEnd: number): ChromosomeInterval[];
    /**
     * check if a feature is in current context
     */
    hasFeatureWithName(queryFeature: Feature): boolean;
}
export default NavigationContext;
