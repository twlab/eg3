import Feature from "./Feature";
import ChromosomeInterval from "./ChromosomeInterval";
import Genome from "./Genome";
type FlankingStrategyType = 0 | 1 | 2;
/**
 * A FlankingStrategy without the methods.
 */
export interface IFlankingStrategy {
    type: FlankingStrategyType;
    upstream: number;
    downstream: number;
}
/**
 * An algorithm that modifies feature coordinates.
 *
 * @implements {Serializable}
 * @author Silas Hsu
 */
declare class FlankingStrategy {
    type: FlankingStrategyType;
    upstream: number;
    downstream: number;
    static SURROUND_ALL: FlankingStrategyType;
    static SURROUND_START: FlankingStrategyType;
    static SURROUND_END: FlankingStrategyType;
    /**
     * Makes a new instance.  Does not do any sanity checks; nonsense parameters will cause `makeFlankedFeature` to
     * return null.
     *
     * @param {FlankingStrategyType} [type] - type of strategy; see static variables for a selection
     * @param {number} [upstream] - number of bases upstream to expand input features
     * @param {number} [downstream] - number of bases downstream to expand input features
     */
    constructor(type?: FlankingStrategyType, upstream?: number, downstream?: number);
    /**
     * @return {this}
     */
    serialize(): this;
    /**
     * @param {IFlankingStrategy} object
     * @return {IFlankingStrategy}
     */
    static deserialize(object: IFlankingStrategy): FlankingStrategy;
    /**
     * Shallowly clones this, sets a prop to a value, and returns the result.
     *
     * @param {string} prop - the prop to set
     * @param {any} value - the value to set
     * @return {FlankingStrategy} cloned and modified version of this
     */
    cloneAndSetProp(prop: string, value: any): FlankingStrategy;
    /**
     * Makes a new Feature with a locus that flanks some part of the input Feature, depending on strategy type.  The
     * genome parameter ensures that the modified locus stays within the genome.  If the input Feature is not in the
     * genome at all, returns null.
     *
     * @param {Feature} feature - feature whose coordinates to use
     * @param {Genome} genome - the genome in which this feature is located
     * @return {Feature} new Feature whose locus is based off the input Feature
     */
    makeFlankedFeature(feature: Feature, genome: Genome): Feature | null;
    /**
     * From the input genomic location, makes a new location flanking some part of it depending on this strategy type.
     * Does no checks to ensure the output is within the genome.
     *
     * @param {ChromosomeInterval} locus - location to flank
     * @param {boolean} isForwardStrand - strand of the input; affects what is upstream and downstream
     * @return {ChromosomeInterval} flanked location
     */
    _makeFlankedCoordinates(locus: ChromosomeInterval, isForwardStrand: boolean): ChromosomeInterval;
}
export default FlankingStrategy;
