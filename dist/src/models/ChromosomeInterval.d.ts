import { default as OpenInterval } from './OpenInterval';
/**
 * The plain-object version of ChromosomeInterval, without any methods.
 */
export interface IChromosomeInterval {
    chr: string;
    start: number;
    end: number;
}
/**
 * Return result from ChromsomeInterval.mergeAdvanced().
 *
 * @template T - an object that can be converted into a ChromosomeInterval
 */
interface MergedLocus<T> {
    locus: ChromosomeInterval;
    sources: T[];
}
/**
 * Basically an OpenInterval with a chromosome's name.  Expresses genomic coordinates.
 *
 * @implements {Serializable}
 * @author Silas Hsu
 */
declare class ChromosomeInterval extends OpenInterval implements IChromosomeInterval {
    chr: string;
    start: number;
    end: number;
    /**
     * Parses a string representing a ChromosomeInterval, such as those produced by the toString() method.  Throws an
     * error if parsing fails.
     *
     * @param {string} str - interval to parse
     * @return {ChromosomeInterval} parsed instance
     * @throws {RangeError} if parsing fails
     */
    static parse(str: string): ChromosomeInterval;
    /**
     * Merges chromosome intervals based on proximity and chromosome name.  Does not mutate any inputs.
     *
     * This function accepts a list of objects of arbitrary type, as long a ChromosomeInterval can be extracted through
     * the `iteratee` callback.  The `mergeDistance` parameter expresses a distance in bases at which two loci are close
     * enough to warrant merging.
     *
     * @param {T[]} objects - objects from which ChromosomeIntervals can be extracted
     * @param {number} mergeDistance - distance in bases at which two intervals are close enough to merge
     * @param {(object: T) => ChromosomeInterval} iteratee - callback that accepts an object and returns a locus
     * @return {object[]}
     */
    static mergeAdvanced<T>(objects: T[], mergeDistance: number, iteratee: (object: T) => ChromosomeInterval): Array<MergedLocus<T>>;
    /**
     * Merges chromosome intervals based on proximity, by default 2000 bp.  Does not mutate any inputs.
     *
     * @param {ChromosomeInterval[]} intervals - interval list to inspect for overlaps
     * @param {number} [mergeDistance] - distance in bases at which two intervals are close enough to merge
     * @return {ChromosomeInterval[]} - version of input list with intervals merged
     */
    static mergeOverlaps(intervals: ChromosomeInterval[], mergeDistance?: number): ChromosomeInterval[];
    /**
     * Makes a new instance.  The input interval should be a 0-indexed open one.
     *
     * @param {string} chr - name of the chromosome
     * @param {number} start - start of the interval, inclusive
     * @param {number} end - end of the interval, exclusive
     */
    constructor(chr: string, start: number, end: number);
    serialize(): IChromosomeInterval;
    static deserialize(object: IChromosomeInterval): ChromosomeInterval;
    /**
     * Enables the spread operator for ChromosomeIntervals.
     */
    [Symbol.iterator](): Generator<number, void, unknown>;
    /**
     * @return {number} the length of this interval in base pairs
     */
    getLength(): number;
    /**
     * Intersects this and another ChromosomeInterval, and returns the result in as a new ChromosomeInterval.  Returns
     * null if there is no intersection at all.
     *
     * @param {ChromosomeInterval} other - other ChromosomeInterval to intersect
     * @return {ChromosomeInterval} intersection of this and the other interval, or null if none exists
     */
    getOverlap(other: ChromosomeInterval): ChromosomeInterval | null;
    /**
     * Checks if the current interval is within the larger interval
     * @param other larger interval
     * @returns true if within
     */
    /**
     * @return {string} human-readable representation of this interval
     */
    toString(): string;
    /**
     * @return {OpenInterval} an OpenInterval version of this instance.
     */
    toOpenInterval(): OpenInterval;
    /**
     * Interprets this and another interval as a multi-chromosome interval, with this being the start and the other
     * being the end.  Returns a human-readable representation of that interpretation.
     *
     * @param {ChromosomeInterval} other - the "end" of the multi-chromosome interval
     * @return {string} a human-readable representation of a multi-chromosome interval
     */
    toStringWithOther(other: ChromosomeInterval): string;
}
export default ChromosomeInterval;
