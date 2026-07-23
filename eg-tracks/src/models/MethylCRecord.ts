import _ from "lodash";

/**
 * Column indices of a raw MethylC bed-like record (as returned by the tabix
 * fetch / worker), e.g.:
 *   { chr: "chr7", start: 27219040, end: 27219041, 3: "CG", 4: "0.22", 5: "+", 6: "74", n: 7 }
 */
enum MethylRecordColumnIndex {
  CONTEXT = 3,
  VALUE = 4,
  STRAND = 5,
  DEPTH = 6,
}

interface AggregationByRecordsResult {
  depth: number; // mean of depth
  contextValues: Array<{
    context: string;
    value: number; // mean of context value
  }>;
}

interface AggregationByStrandResult {
  combined: AggregationByRecordsResult;
  forward: AggregationByRecordsResult;
  reverse: AggregationByRecordsResult;
}

/** Reads a raw MethylC record's context (column 3), e.g. "CG" | "CHG" | "CHH". */
function getRecordContext(record: any): string {
  return String(record[MethylRecordColumnIndex.CONTEXT]);
}

/** Reads a raw MethylC record's methylation value (column 4), from 0 to 1. */
function getRecordValue(record: any): number {
  return Number.parseFloat(record[MethylRecordColumnIndex.VALUE]);
}

/** Reads a raw MethylC record's read depth (column 6). */
function getRecordDepth(record: any): number {
  return Number.parseInt(record[MethylRecordColumnIndex.DEPTH], 10);
}

/** Whether a raw MethylC record (strand at column 5) is on the forward strand. */
function getRecordIsForwardStrand(record: any): boolean {
  return record[MethylRecordColumnIndex.STRAND] === "+";
}

/**
 * Aggregation utilities for raw MethylC records (plain bed-like objects
 * straight from the fetch/worker, e.g.
 * `{ chr, start, end, 3: "CG", 4: "0.22", 5: "+", 6: "74" }`), so pixels don't
 * need a wrapper instance built per record.
 *
 * @author Daofeng Li
 */
const MethylCRecord = {
  /**
   * Combines all raw MethylC records that (presumably) are in one pixel.  See schema below the function for return schema.
   * If passed an empty array, returns null.
   *
   * @param {any[]} records
   * @return {AggregationByRecordsResult | null}
   */
  aggregateRecords(records: any[]): AggregationByRecordsResult | null {
    if (records.length === 0) {
      return null;
    }
    const depth = _.meanBy(records, getRecordDepth);
    const groupedByContext = _.groupBy(records, getRecordContext);
    const contextValues: Array<any> = [];
    for (const contextName in groupedByContext) {
      const recordsOfThatContext = groupedByContext[contextName];
      contextValues.push({
        context: contextName,
        value: _.meanBy(recordsOfThatContext, getRecordValue),
      });
    }
    return {
      depth,
      contextValues,
    };
  },
  /*
    {
        depth: 5,
        contextValues: [
            {context: "CG", value: 0.3},
            {context: "CHH", value: 0.3},
            {context: "CHG", value: 0.3},
        ]
    }
    */

  /**
   * Combines all raw MethylC records that (presumably) are in one pixel, splitting by strand.
   * See schema below the function for return schema.
   *
   * @param {any[]} records
   * @return {AggregationByStrandResult}
   */
  aggregateByStrand(records: any[]): AggregationByStrandResult {
    const [forwardStrandRecords, reverseStrandRecords] = _.partition(
      records,
      getRecordIsForwardStrand,
    );

    return {
      combined: MethylCRecord.aggregateRecords(records)!,
      forward: MethylCRecord.aggregateRecords(forwardStrandRecords)!,
      reverse: MethylCRecord.aggregateRecords(reverseStrandRecords)!,
    };
    /*
        {
            combined: {},
            forward: {},
            reverse: {}
        }
        */
  },
};

export default MethylCRecord;
