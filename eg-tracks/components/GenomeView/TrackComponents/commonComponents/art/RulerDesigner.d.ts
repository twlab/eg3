/**
 * Designs a ruler that displays feature coordinates.  Note that feature coordinates are not necessarily genomic
 * coordinates.
 *
 * @author Silas Hsu
 */
export declare class RulerDesigner {
    _tickSeparationHint: number;
    _elementFactory: RulerElementFactory;
    /**
     * Configures a new instance.  What elements the design() method returns depends on the passed
     * RulerElementFactory.  There is a default RulerElementFactory implementation; see those docs to find out what
     * it returns.
     *
     * @param {number} [tickSeparationHint] - requested X separation of major ticks
     * @param {RulerElementFactory} [rulerElementFactory] - element generator
     */
    constructor(tickSeparationHint?: number, rulerElementFactory?: RulerElementFactory);
    /**
     * @typedef {Object} Ruler~Unit
     * @property {number} size - the number of base pairs in this unit
     * @property {number} digits - the number of digits after the decimal point to display
     * @property {string} name - a string that represents this unit
     */
    /**
     * Gets the unit for the major tick labels, depending on the number of bases between ticks.  Chooses between unit
     * base, kilobase, and megabase.
     *
     * @param {number} log10BasesPerTick - log10() of the number of bases between ticks
     * @return {Ruler~Unit} the unit for tick labels
     */
    _getMajorUnit(log10BasesPerTick: any): {
        size: number;
        digits: number;
        name: string;
    };
    /**
     * Designs the ruler.  Returns an array of anything, depending on the RulerElementFactory configured when this
     * object was created.
     *
     * @param {DisplayedRegionModel} viewRegion - the region to visualize
     * @param {number} width - X width of the ruler
     * @return {any[]} ruler design
     */
    design(viewRegion: any, width: any): any[];
}
/**
 * A generator of elements for a Ruler design.  Allows customization of RulerDesigners.  The default implementation
 * returns React elements that are valid <svg> elements.
 *
 * @author Silas Hsu
 */
export declare class RulerElementFactory {
    color: string;
    majorTickHeight: number;
    fontSize: number;
    /**
     * Configures a new instance that returns React elements that are valid <svg> elements.
     *
     * @param {string} color - color of the elements
     * @param {number} majorTickHeight - height of major ticks.  Minor ticks will be half this height.
     */
    constructor(color?: string, majorTickHeight?: number, fontSize?: number);
    /**
     * Creates a element that represents a line that spans the entire width of the ruler.
     *
     * @param {number} width - width of the ruler
     * @return {JSX.Element}
     */
    mainLine(width: any): import("react/jsx-runtime").JSX.Element;
    /**
     * Creates a element that represents a major tick of the ruler.
     *
     * @param {number} x - x coordinate of the tick
     * @return {JSX.Element}
     */
    majorTick(x: any): import("react/jsx-runtime").JSX.Element;
    /**
     * Creates a element that labels a major tick of the ruler.
     *
     * @param {number} x - x coordinate of the tick
     * @param {string} text - label for the tick
     * @return {JSX.Element}
     */
    majorTickText(x: any, text: any): import("react/jsx-runtime").JSX.Element;
    /**
     * Creates a element that represents minor tick of the ruler.
     *
     * @param {number} x - x coordinate of the tick
     * @return {JSX.Element}
     */
    minorTick(x: any): import("react/jsx-runtime").JSX.Element;
    /**
     * Creates a element that labels a minor tick of the ruler.
     *
     * @param {number} x - x coordinate of the tick
     * @param {string} text - label for the tick
     * @return {JSX.Element}
     */
    minorTickText(x: any, text: any): null;
}
export default RulerDesigner;
