/**
 * Something with props `start` and `end` which represent a 0-indexed open interval
 */
export interface IOpenInterval {
    start: number;
    end: number;
}
/**
 * A 0-indexed open interval.  Intervals are iterable, so code can take advantage of the spread operator:
 *     `myFunction(...interval)` is equivalent to `myFunction(interval.start, interval.end)`
 *
 * @implements {Serializable}
 * @author Silas Hsu
 */
export default class OpenInterval implements IOpenInterval {
    readonly start: number;
    readonly end: number;
    /**
     * Makes a new instance.  The input should represent a 0-indexed open interval.
     *
     * @param {number} start - start of the interval, inclusive
     * @param {number} end - end of the interval, exclusive
     * @throws {RangeError} if the end is less than the start
     */
    constructor(start: number, end: number);
    /**
     * @returns {IOpenInterval}
     */
    serialize(): IOpenInterval;
    /**
     * Creates an OpenInterval from an object.
     *
     * @param {IOpenInterval} object - object to use
     * @return {OpenInterval} OpenInterval created from the object
     */
    static deserialize(object: IOpenInterval): OpenInterval;
    /**
     * Enables the spread operator for OpenIntervals.
     */
    [Symbol.iterator](): Generator<number, void, unknown>;
    /**
     * Intersects this and another OpenInterval, and returns the result in as a new OpenInterval.  Returns null if there
     * is no intersection at all.
     *
     * @param {OpenInterval} other - other OpenInterval to intersect
     * @return {OpenInterval} intersection of this and the other interval
     */
    getOverlap(other: OpenInterval): OpenInterval | null;
    /**
     * @return {number} the length of this interval
     */
    getLength(): number;
    /**
     * @return {string} human-readable representation of this instance
     */
    toString(): string;
}
