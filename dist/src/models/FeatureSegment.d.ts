import { default as OpenInterval } from './OpenInterval';
import { default as ChromosomeInterval } from './ChromosomeInterval';
/**
 * A 0-indexed open interval within a Feature.  Or, put another way, attaches an interval to a Feature.
 *
 * @author Silas Hsu
 * @see Feature
 */
export declare class FeatureSegment {
    readonly feature: any;
    readonly relativeStart: number;
    readonly relativeEnd: number;
    /**
     * Makes a new instance, attaching a interval to a Feature.  If start and end are not provided, the interval
     * defaults to the entire length of the feature.  The start and end parameters should express a *0-indexed open
     * interval*.
     *
     * @param {Feature} feature - the interval's feature
     * @param {number} [start] - start base of the interval, relative to the feature's start
     * @param {number} [end] - end base of the interval, relative to the feature's start
     * @throws {RangeError} if end is before start or the interval lies outside the feature
     */
    constructor(feature: any, start?: number, end?: number | undefined);
    get start(): number;
    get end(): number;
    /**
     * @return {OpenInterval} new OpenInterval containing this segment's relative start and end.
     */
    toOpenInterval(): OpenInterval;
    /**
     * @return {string} the attached feature's name
     */
    getName(): string;
    /**
     * @return {number} this interval's length
     */
    getLength(): number;
    /**
     * @return {ChromosomeInterval} the genomic location that this segment covers
     */
    getLocus(): ChromosomeInterval;
    /**
     * Intersects this and another FeatureSegment, and returns the result as a new FeatureSegment.  Returns `null` if
     * the *segments' features are different* or if there is no overlap.
     *
     * @param {FeatureSegment} other - other FeatureSegment to intersect
     * @return {FeatureSegment} intersection of this segment and the other one, or null if none exists
     */
    getOverlap(other: FeatureSegment): FeatureSegment | null;
    /**
     * Intersects this and a genome location, and returns the result as a new FeatureSegment using the same Feature
     * that is attached to this.  Returns null if the genome location does not intersect with this location at all.
     *
     * @param {ChromosomeInterval} chrInterval - input genome location
     * @return {FeatureSegment} intersection of this and the input genomic location
     */
    getGenomeOverlap(chrInterval: ChromosomeInterval): FeatureSegment | null;
}
