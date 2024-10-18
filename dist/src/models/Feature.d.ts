import { default as ChromosomeInterval, IChromosomeInterval } from './ChromosomeInterval';
import { default as NavigationContext } from './NavigationContext';
export type Strand = "+" | "-" | string;
/**
 * The properties of Feature without the methods.
 */
export interface IFeature {
    name: string;
    locus: IChromosomeInterval;
    strand: Strand;
    id?: string;
}
export declare const FORWARD_STRAND_CHAR = "+";
export declare const REVERSE_STRAND_CHAR = "-";
/**
 * A feature, or annotation, in the genome.
 *
 * @implements {Serializable}
 * @author Silas Hsu
 */
export declare class Feature {
    locus: ChromosomeInterval;
    strand: Strand;
    name: string;
    score?: any;
    id?: string;
    sequence: any;
    /**
     * Makes a new instance with specified name and locus.  Empty names are valid.  If given `undefined` or `null`, it
     * defaults to the locus as a string.
     *
     * @param {string} [name] - name of the feature
     * @param {ChromosomeInterval} locus - genomic location of the feature
     * @param {Strand} strand - strand info
     */
    constructor(name: string | undefined, locus: ChromosomeInterval, strand?: Strand);
    serialize(): IFeature;
    static deserialize(object: IFeature): Feature;
    /**
     * @return {string} the name of this feature
     */
    getName(): string;
    /**
     * @return {ChromosomeInterval} the genomic location of this feature
     */
    getLocus(): ChromosomeInterval;
    /**
     * @return {number} the length of this feature's locus
     */
    getLength(): number;
    /**
     * @return {string} raw strand info of this instance
     */
    getStrand(): Strand;
    /**
     * @return {boolean} whether this feature is on the forward strand
     */
    getIsForwardStrand(): boolean;
    /**
     * @return {boolean} whether this feature is on the reverse strand
     */
    getIsReverseStrand(): boolean;
    /**
     * @return {boolean} whether this feature has strand info
     */
    getHasStrand(): boolean;
    /**
     * Shortcut for navContext.convertGenomeIntervalToBases().  Computes nav context coordinates occupied by this
     * instance's locus.
     *
     * @param {NavigationContext} navContext - the navigation context for which to compute coordinates
     * @return {OpenInterval[]} coordinates in the navigation context
     */
    computeNavContextCoordinates(navContext: NavigationContext): import('./OpenInterval').default[];
}
/**
 * Everything a Feature is, plus a `value` prop.
 *
 * @author Silas Hsu
 */
export declare class NumericalFeature extends Feature {
    value: number | undefined;
    /**
     * Sets value and returns this.
     *
     * @param {number} value - value to attach to this instance.
     * @return {this}
     */
    withValue(value: number): this;
}
/**
 * Everything a Feature is, plus a `color` prop.
 *
 * @author Daofeng Li
 */
export declare class ColoredFeature extends Feature {
    color: string | undefined;
    /**
     * Sets value and returns this.
     *
     * @param {number} value - value to attach to this instance.
     * @return {this}
     */
    withColor(color: string): this;
}
/**
 * a JasparFeature.
 *
 * @author Daofeng Li
 */
export declare class JasparFeature extends Feature {
    score: number | undefined;
    matrixId: string | undefined;
    /**
     * Sets jaspar tf name and score and returns this.
     *
     * @param {number} score - jaspar score.
     * @param {string} matrixId - jaspar matrixId.
     * @return {this}
     */
    withJaspar(score: number, matrixId: string): this;
}
/**
 * Everything a Feature is, plus a `values` prop.
 *
 * @author Daofeng Li
 */
export declare class NumericalArrayFeature extends Feature {
    values: number[] | undefined;
    /**
     * Sets values and returns this.
     *
     * @param {number[]} values - value to attach to this instance.
     * @return {this}
     */
    withValues(values: readonly number[]): this;
}
/**
 * the feature for a fiber or molecular, with the on and off relative position from start.
 *
 * @author Daofeng Li
 */
export declare class Fiber extends Feature {
    ons: number[] | undefined;
    offs: number[] | undefined;
    /**
     * Sets values and returns this.
     *
     * @param {number[]} values - value to attach to this instance.
     * @return {this}
     */
    withFiber(score: number | string, onString: string, offString: string): this;
}
export default Feature;
