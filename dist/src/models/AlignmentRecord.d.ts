import { default as Feature } from './Feature';
import { default as ChromosomeInterval } from './ChromosomeInterval';
/**
 * A data container for a GenomeAlign record.
 *
 * @author Daofeng Li
 */
export declare class AlignmentRecord extends Feature {
    /**
     * Constructs a new AlignmentRecord, given a record from genomealignment source
     *
     */
    queryLocus: ChromosomeInterval;
    targetSeq: string;
    querySeq: string;
    queryStrand: string;
    constructor(record: any);
    getIsReverseStrandQuery(): boolean;
}
export default AlignmentRecord;
