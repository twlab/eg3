import { default as OpenInterval } from './OpenInterval';
import { default as NavigationContext } from './NavigationContext';
import { FeatureSegment } from './FeatureSegment';
import { default as ChromosomeInterval } from './ChromosomeInterval';
/**
 * Model that stores the view window/region in a larger navigation context (e.g. a genome).  Internally stores the
 * region as an open interval of nav context coordinates (@see {@link NavigationContext}).
 *
 * @author Silas Hsu
 */
declare class DisplayedRegionModel {
    _navContext: NavigationContext;
    _startBase: number | undefined;
    _endBase: number | undefined;
    /**
     * Makes a new instance with specified navigation context, and optionally, initial view region.  If not specified,
     * the view region will be the entire navigation context.
     *
     * @param {NavigationContext} navContext - the context in which navigation will take place
     * @param {number} [start] - initial start of the view region
     * @param {number} [end] - initial end of the view region
     */
    constructor(navContext: NavigationContext, start?: number, end?: number);
    /**
     * Makes copy of this object such that no methods on the copy will modify the original.
     *
     * @return {DisplayedRegionModel} a copy of this object
     */
    clone(): DisplayedRegionModel;
    /**
     * @return {NavigationContext} the navigation context with which this object was created
     */
    getNavigationContext(): NavigationContext;
    /**
     * @return {number} the current width of the view, in base pairs
     */
    getWidth(): number;
    /**
     * Gets a copy of the internally stored 0-indexed open interval that represents this displayed region.
     *
     * @return {OpenInterval} copy of the internally stored region
     */
    getContextCoordinates(): OpenInterval;
    /**
     * Gets the features that overlap this view region in the navigation context.
     *
     * @param {boolean} [includeGaps] - whether to include gaps in the results.  Default: true
     * @return {FeatureSegment[]} list of feature intervals that overlap this view region
     */
    getFeatureSegments(includeGaps?: boolean): FeatureSegment[];
    /**
     * Gets the genomic locations that overlap this view region.  The results are guaranteed to not overlap each other.
     *
     * @return {ChromosomeInterval[]} list of genomic locations that overlap this view region.
     */
    getGenomeIntervals(): ChromosomeInterval[];
    /**
     * Safely sets the internal display interval, ensuring that it stays within the navigation context and makes sense.
     * `start` and `end` should express a 0-indexed open interval of base numbers, [start, end).  This method will try
     * to preserve the input length as much as possible.
     *
     * Errors if given a nonsensical interval, but does not error for intervals outside the navigation context.
     *
     * Returns this.
     *
     * @param {number} start - the (inclusive) start of the region interval as a base pair number
     * @param {number} end - the (exclusive) end of the region interval as a base pair number
     * @return {this}
     * @throws {RangeError} if end is less than start, or the inputs are undefined/infinite
     */
    setRegion(start: number, end: number): this;
    /**
     * Pans the current region by a constant number of bases, also ensuring view boundaries stay within the genome.
     * Negative numbers pull regions on the left into view (=pan right); positive numbers pull regions on the right into
     * view (=pan left).
     *
     * Returns `this`.
     *
     * @param {number} numBases - number of base pairs to pan
     * @return {this}
     */
    pan(numBases: number): this;
    /**
     * pan same width to left, pan left not same as drag left, coords get smaller
     * @return {this}
     */
    panLeft(): this;
    /**
     * pan same width to right
     * @return {this}
     */
    panRight(): this;
    /**
     * Multiplies the size of the current region by a factor, also ensuring view boundaries stay within the genome.
     * Factors less than 1 zoom in (region gets shorter); factors greater than 1 zoom out (region gets longer).
     * Additionally, one can specify the focal point of the zoom as the number of region widths from the left edge.  By
     * default this is 0.5, which is the center of the region.
     *
     * Note that due to rounding, zoom() is approximate; a zoom(2) followed by a zoom(0.5) may still change the region
     * boundaries by a base or two.
     *
     * Returns `this`.
     *
     * @param {number} factor - number by which to multiply this region's width
     * @param {number} [focalPoint] - (optional) measured as number of region widths from the left edge.  Default: 0.5
     * @return {this}
     */
    zoom(factor: number, focalPoint?: number): this;
}
export default DisplayedRegionModel;
