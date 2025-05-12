import Feature from "../../../../models/Feature";
/**
 * A data container for a vcf object.
 *
 * @author Daofeng Li
 */
export interface Variant {
    ALT: string[];
    REF: string;
    CHROM: string;
    POS: number;
    FILTER: any;
    ID: any;
    INFO: any;
    QUAL: number;
    SAMPLES: any;
}
declare class Vcf extends Feature {
    variant: Variant;
    constructor(variant: any);
}
export default Vcf;
