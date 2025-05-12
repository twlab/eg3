import DisplayedRegionModel from "./DisplayedRegionModel";
import OpenInterval from "./OpenInterval";
import { FeatureSegment } from "./FeatureSegment";
/**
 * Utility class for converting between pixels and base numbers.
 *
 * @author Silas Hsu
 */
declare class LinearDrawingModel {
    _viewRegion: DisplayedRegionModel;
    _drawWidth: number;
    _pixelsPerBase: number;
    _basesPerPixel: number;
    /**
     * Makes a new instance.
     *
     * @param {DisplayedRegionModel} viewRegion - the displayed region
     * @param {number} drawWidth - the width of the canvas/svg/etc on which to draw
     */
    constructor(viewRegion: DisplayedRegionModel, drawWidth: number);
    /**
     * @return {number} the drawing width with which this model was created
     */
    getDrawWidth(): number;
    /**
     * Gets the horizontal width in pixels required to represent a number of bases.
     *
     * @param {number} bases - width in number of bases
     * @return {number} width in pixels
     */
    basesToXWidth(bases: number): number;
    /**
     * Gets how many bases represented by a horizontal span of the SVG.
     *
     * @param {number} pixels - width of a horizontal span
     * @return {number} width in number of bases
     */
    xWidthToBases(pixels: number): number;
    /**
     * Given an nav context coordinate, gets the X coordinate that represents that base.
     *
     * @param {number} base - nav context coordinate
     * @return {number} X coordinate that represents the input base
     */
    baseToX(base: number): number;
    /**
     * Given an X coordinate representing a base, gets the nav context coordinate.
     *
     * @param {number} pixel - X coordinate that represents a base
     * @return {number} nav context coordinate
     */
    xToBase(pixel: number): number;
    /**
     * Converts an interval of bases to an interval of X coordinates.
     *
     * @param {OpenInterval} baseInterval - interval of bases to convert
     * @return {OpenInterval} x draw interval
     */
    baseSpanToXSpan(baseInterval: OpenInterval): OpenInterval;
    /**
     * Converts an interval of bases to an interval of X coordinates, but just the center.
     *
     * @param {OpenInterval} baseInterval - interval of bases to convert
     * @return {OpenInterval} x draw interval
     */
    baseSpanToXCenter(baseInterval: OpenInterval): OpenInterval;
    /**
     * Gets the segment coordinates that a pixel coordinate represents.
     *
     * @param {number} pixel - pixel coordinate that represents a base
     * @return {FeatureSegment} segment coordinate that the pixel represents
     */
    xToSegmentCoordinate(pixel: number): FeatureSegment;
}
export default LinearDrawingModel;
