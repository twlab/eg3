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

// Standalone helpers so that a plain fetched record (not wrapped in a Feature)
// can be measured and placed without constructing a Feature per record. Each
// accepts either a Feature (locus under `.locus`) or a raw record whose
// top-level fields are the locus (`chr`/`start`/`end`). This lets the numerical
// aggregation path run straight off the raw cache and skip materializing the
// formatted feature array.

/** Resolves the genomic locus of a Feature or a raw record. */
export function getFeatureLocus(featureOrLocus: any): any {
  return featureOrLocus.locus ?? featureOrLocus;
}

/** Length of a Feature's or raw record's locus. */
export function getFeatureLength(featureOrLocus: any): number {
  const locus = getFeatureLocus(featureOrLocus);
  return locus.end - locus.start;
}

/**
 * Numeric value of a Feature (`value`) or a raw record. Raw numerical records
 * carry their value differently by source: bigwig/dynseq use `score`, while
 * bedgraph-style tabix records put it in column `[3]`. Feature instances always
 * have `value` defined (possibly null), so they never fall through to the raw
 * fallbacks.
 */
export function getFeatureValue(featureOrLocus: any): any {
  if (featureOrLocus.value !== undefined) {
    return featureOrLocus.value;
  }
  if (featureOrLocus.score !== undefined) {
    return featureOrLocus.score;
  }
  return featureOrLocus[3] !== undefined
    ? Number(featureOrLocus[3])
    : undefined;
}

/**
 * Name of a Feature (`name`) or a raw record. Feature instances expose `name`
 * directly, so we read it straight off; raw bed-like records keep the name in
 * column `[3]`. Used so annotation tracks can render straight from raw records
 * without building Feature objects.
 */
export function getFeatureName(featureOrRecord: any): string {
  if (featureOrRecord.name !== undefined) {
    return featureOrRecord.name;
  }
  if (typeof featureOrRecord.getName === "function") {
    return featureOrRecord.getName();
  }
  return featureOrRecord[3] !== undefined ? String(featureOrRecord[3]) : "";
}

/**
 * Whether a Feature or raw record is on the reverse strand. Feature instances
 * carry `strand`; raw bed-like records keep the strand in column `[5]`.
 */
export function getFeatureIsReverseStrand(featureOrRecord: any): boolean {
  if (typeof featureOrRecord.getIsReverseStrand === "function") {
    return featureOrRecord.getIsReverseStrand();
  }
  const strand = featureOrRecord.strand ?? featureOrRecord[5];
  return strand === "-";
}

/** Nav-context coordinates for a Feature's or raw record's locus. */
export function computeNavContextCoordinates(
  featureOrLocus: any,
  navContext: NavigationContext,
) {
  return navContext.convertGenomeIntervalToBases(
    getFeatureLocus(featureOrLocus),
  );
}

/**
 * A feature, or annotation, in the genome.
 *
 * @implements {Serializable}
 * @author Chanrung(Chad) Seng, Silas Hsu
 */
export class Feature {
  name: string; // - name of the feature
  score?: any;
  id?: string;
  sequence: any;
  variant?: any;
  value?: any;
  color?: string;
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
    value: any = null,
    color: string | undefined = undefined,
  ) {
    this.name = name === undefined ? locus.toString() : name; // eslint-disable-line eqeqeq
    this.locus = locus;
    this.strand = strand;
    this.value = value;
    this.color = color;
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
      object.strand,
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
    return getFeatureLength(this);
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
    return computeNavContextCoordinates(this, navContext);
  }
}

/**
 * Everything a Feature is, plus a `value` prop.
 *
 * @author Chanrung(Chad) Seng, Silas Hsu
 */
export class NumericalFeature extends Feature {
  declare value: number | undefined;

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
