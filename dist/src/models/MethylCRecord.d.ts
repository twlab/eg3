import { default as Feature } from './Feature';
import { default as BedRecord } from './BedRecord';
interface AggregationByRecordsResult {
    depth: number;
    contextValues: Array<{
        context: string;
        value: number;
    }>;
}
interface AggregationByStrandResult {
    combined: AggregationByRecordsResult;
    forward: AggregationByRecordsResult;
    reverse: AggregationByRecordsResult;
}
/**
 * A data container for a MethylC record.
 *
 * @author Daofeng Li
 */
declare class MethylCRecord extends Feature {
    /**
     * Combines all MethylCRecords that (presumably) are in one pixel.  See schema below the function for return schema.
     * If passed an empty array, returns null.
     *
     * @param {MethylCRecord[]} records
     * @return {AggregationResult}
     */
    static aggregateRecords(records: MethylCRecord[]): AggregationByRecordsResult | null;
    /**
     * Combines all MethylCRecords that (presumably) are in one pixel.  See schema below the function for return schema.
     *
     * @param {MethylCRecord[]} records
     * @return {Object}
     */
    static aggregateByStrand(records: MethylCRecord[]): AggregationByStrandResult;
    context: any;
    value: number;
    depth: number;
    constructor(bedRecord: BedRecord);
}
export default MethylCRecord;
