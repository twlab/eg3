import Feature from "./Feature";
/**
 * A data container for snp.
 *
 * @author Daofeng Li and Silas Hsu
 */
declare class Snp extends Feature {
    id: string;
    alleles?: string[];
    consequence_type?: string;
    clinical_significance?: string[];
    /**
       * Constructs a new Snp, given an entry from ensembl API. .
      @example
      {
          alleles: ["G", "C"]
          assembly_name: "GRCh37"
          clinical_significance: []
          consequence_type: "intron_variant"
          end: 140124755
          feature_type: "variation"
          id: "rs1051810366"
          seq_region_name: "7"
          source: "dbSNP"
          start: 140124755
          strand: 1
  
      }
       * @param {record} record - record object to use
       * @param {trackModel} trackModel for gene search information
       */
    constructor(record: any);
}
export default Snp;
