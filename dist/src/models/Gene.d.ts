import { default as Feature } from './Feature';
import { default as OpenInterval } from './OpenInterval';
import { FeatureSegment } from './FeatureSegment';
export interface IdbRecord {
    id: string;
    name?: string;
    chrom: string;
    strand: string;
    txStart: number;
    txEnd: number;
    cdsStart: number;
    cdsEnd: number;
    exonStarts: string;
    exonEnds: string;
    transcriptionClass?: string;
    description?: string;
    collection?: string;
}
/**
 * A data container for gene annotations.
 *
 * @author Daofeng Li and Silas Hsu
 */
declare class Gene extends Feature {
    dbRecord: any;
    id: string;
    description?: string;
    transcriptionClass?: string;
    collection?: string;
    _translated: OpenInterval[] | null;
    _utrs: OpenInterval[] | null;
    /**
       * Constructs a new Gene, given an entry from MongoDB.  The other parameters calculate nav context coordinates.
      @example
      {
      }
       * @param {dbRecord} record - dbRecord object to use
       * @param {trackModel} trackModel for gene search information
       */
    constructor(dbRecord: IdbRecord);
    get translated(): OpenInterval[] | null;
    get utrs(): OpenInterval[] | null;
    /**
     * Parses `this.dbRecord` and sets `this._translated` and `this._utrs`.
     */
    _parseDetails(): void;
    /**
     * @return {object} exons as lists of FeatureSegment
     */
    getExonsAsFeatureSegments(): {
        translated: FeatureSegment[];
        utrs: FeatureSegment[];
    };
}
export default Gene;
