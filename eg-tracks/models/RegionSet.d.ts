import Feature, { IFeature } from "./Feature";
import NavigationContext from "./NavigationContext";
import FlankingStrategy, { IFlankingStrategy } from "./FlankingStrategy";
import Genome from "./Genome";
/**
 * A RegionSet without methods.
 */
export interface IRegionSet {
    name: string;
    features: IFeature[];
    genomeName: string;
    flankingStrategy: IFlankingStrategy;
    id?: any;
    genome?: any;
}
/**
 * A set of features that undergoes some configuration before being exported to a navigation context.
 *
 * @implements {Serializable}
 * @author Silas Hsu
 */
declare class RegionSet {
    name: string;
    features: Feature[];
    genome: Genome;
    flankingStrategy: FlankingStrategy;
    genomeName: string;
    id: any;
    static MIN_REGION_LENGTH: number;
    /**
     * Makes a new instance.  The flankingStrategy parameter is used to modify all features before constructing a
     * NavigationContext.
     *
     * @param {string} [name] - name of this region set
     * @param {Feature[]} [features] - list of features in this set
     * @param {Genome} genome - genome to which the features belong
     * @param {FlankingStrategy} flankingStrategy - feature modifier
     */
    constructor(name: string, features: Feature[], genome: Genome, flankingStrategy: FlankingStrategy, genomeName?: string, id?: any);
    serialize(): IRegionSet;
    static deserialize(object: IRegionSet): RegionSet;
    /**
     * Shallowly clones this, sets a prop to a value, and returns the result.
     *
     * @param {string} propName - the prop to set
     * @param {any} value - the value to set
     * @return {RegionSet} cloned and modified version of this
     */
    cloneAndSet(propName: string, value: any): RegionSet;
    /**
     * Clones this, and then adds a new feature to this set.  Features must have a valid name, and be in the genome;
     * otherwise, an error will result.
     *
     * @param {Feature} feature - the feature to add
     * @return {RegionSet} cloned and modified version of this
     * @throws {RangeError} if the input feature is invalid in some way
     */
    cloneAndAddFeature(feature: Feature): RegionSet;
    /**
     * Clones this, and then deletes a feature from this set.
     *
     * @param {number} index - index of the feature to delete
     * @return {RegionSet} cloned and modified version of this
     */
    cloneAndDeleteFeature(index: number): RegionSet;
    /**
     * Clones this, and then put all features on + strand.
     *
     * @return {RegionSet} cloned and modified version of this
     */
    cloneAndAllPlusStrand(): RegionSet;
    /**
     * Uses the associated FlankingStrategy to return a list of features originating from the features in this set.
     *
     * @return {Feature[]} list of flanked features
     */
    makeFlankedFeatures(): (Feature | null)[];
    /**
     * Equivalent to calling {@link makeFlankedFeatures()} and then making a navigation context out of them.
     *
     * @return {NavigationContext} - navigation context from flanked features
     */
    makeNavContext(): NavigationContext;
}
export default RegionSet;
