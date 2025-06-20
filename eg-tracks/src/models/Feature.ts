import ChromosomeInterval, { IChromosomeInterval } from "./ChromosomeInterval";
import Gene from "./Gene";
import NavigationContext from "./NavigationContext";

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

export const FORWARD_STRAND_CHAR = "+";
export const REVERSE_STRAND_CHAR = "-";

/**
 * A feature, or annotation, in the genome.
 *
 * @implements {Serializable}
 * @author Silas Hsu
 */
export class Feature {
  name: string; // - name of the feature
  score?: any;
  id?: string;
  sequence: any;
  variant?: any;
  value?: any;
  /**
   * Makes a new instance with specified name and locus.  Empty names are valid.  If given `undefined` or `null`, it
   * defaults to the locus as a string.
   *
   * @param {string} [name] - name of the feature
   * @param {ChromosomeInterval} locus - genomic location of the feature
   * @param {Strand} strand - strand info
   */
  constructor(
    name: string | undefined,
    public locus: ChromosomeInterval,
    public strand: Strand = "",
    value?: any = null
  ) {
    this.name = name === undefined ? locus.toString() : name; // eslint-disable-line eqeqeq
    this.locus = locus;
    this.strand = strand;
    this.value = value;
  }

  serialize(): IFeature {
    return {
      name: this.name,
      locus: this.getLocus().serialize(),
      strand: this.strand,
    };
  }

  static deserialize(object: IFeature) {
    return new Feature(
      object.name,
      ChromosomeInterval.deserialize(object.locus),
      object.strand
    );
  }

  /**
   * @return {string} the name of this feature
   */
  getName(): string {
    return this.name;
  }

  /**
   * @return {ChromosomeInterval} the genomic location of this feature
   */
  getLocus(): ChromosomeInterval {
    return this.locus;
  }

  /**
   * @return {number} the length of this feature's locus
   */
  getLength(): number {
    return this.locus.getLength();
  }

  /**
   * @return {string} raw strand info of this instance
   */
  getStrand(): Strand {
    return this.strand;
  }

  /**
   * @return {boolean} whether this feature is on the forward strand
   */
  getIsForwardStrand(): boolean {
    return this.strand === FORWARD_STRAND_CHAR;
  }

  /**
   * @return {boolean} whether this feature is on the reverse strand
   */
  getIsReverseStrand(): boolean {
    return this.strand === REVERSE_STRAND_CHAR;
  }

  /**
   * @return {boolean} whether this feature has strand info
   */
  getHasStrand(): boolean {
    return this.getIsForwardStrand() || this.getIsReverseStrand();
  }

  /**
   * Shortcut for navContext.convertGenomeIntervalToBases().  Computes nav context coordinates occupied by this
   * instance's locus.
   *
   * @param {NavigationContext} navContext - the navigation context for which to compute coordinates
   * @return {OpenInterval[]} coordinates in the navigation context
   */
  computeNavContextCoordinates(navContext: NavigationContext) {
    return navContext.convertGenomeIntervalToBases(this.getLocus());
  }
}

/**
 * Everything a Feature is, plus a `value` prop.
 *
 * @author Silas Hsu
 */
export class NumericalFeature extends Feature {
  value: number | undefined;

  /**
   * Sets value and returns this.
   *
   * @param {number} value - value to attach to this instance.
   * @return {this}
   */
  withValue(value: number): this {
    this.value = value;
    return this;
  }
}

/**
 * Everything a Feature is, plus a `color` prop.
 *
 * @author Daofeng Li
 */
export class ColoredFeature extends Feature {
  color: string | undefined;

  /**
   * Sets value and returns this.
   *
   * @param {number} value - value to attach to this instance.
   * @return {this}
   */
  withColor(color: string): this {
    this.color = color;
    return this;
  }
}

/**
 * a JasparFeature.
 *
 * @author Daofeng Li
 */
export class JasparFeature extends Feature {
  declare score: number | undefined;
  matrixId: string | undefined;

  /**
   * Sets jaspar tf name and score and returns this.
   *
   * @param {number} score - jaspar score.
   * @param {string} matrixId - jaspar matrixId.
   * @return {this}
   */
  withJaspar(score: number, matrixId: string): this {
    this.score = score;
    this.matrixId = matrixId;
    return this;
  }
}

/**
 * Everything a Feature is, plus a `values` prop.
 *
 * @author Daofeng Li
 */
export class NumericalArrayFeature extends Feature {
  values: number[] | undefined;

  /**
   * Sets values and returns this.
   *
   * @param {number[]} values - value to attach to this instance.
   * @return {this}
   */
  withValues(values: readonly number[]): this {
    this.values = values.slice();
    return this;
  }
}

/**
 * the feature for a fiber or molecular, with the on and off relative position from start.
 *
 * @author Daofeng Li
 */
export class Fiber extends Feature {
  ons: number[] | undefined;
  offs: number[] | undefined;

  /**
   * Sets values and returns this.
   *
   * @param {number[]} values - value to attach to this instance.
   * @return {this}
   */
  withFiber(score: number | string, onString: string, offString: string): this {
    this.ons = onString !== "." ? JSON.parse("[" + onString + "]") : [];
    this.offs = offString !== "." ? JSON.parse("[" + offString + "]") : [];
    this.score = score;
    return this;
  }
}

export default Feature;
