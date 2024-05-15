import _ from 'lodash';

/**
 * Records returned by BedSource and its worker.  Each prop is a column in the bed file.
 *
 * @author Silas Hsu
 */
interface BedRecord {
  chr: string;
  start: number;
  end: number;
  [column: number]: string; // The rest of the columns in the bed file, starting from [3]
  n?: number; // number of columns in initial data row
}
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

/**
 * A data container for a MethylC record.
 *
 * @author Daofeng Li
 */
class MethylCRecord {
  /**
   * Combines all MethylCRecords that (presumably) are in one pixel.  See schema below the function for return schema.
   * If passed an empty array, returns null.
   *
   * @param {MethylCRecord[]} records
   * @return {AggregationResult}
   */
  static aggregateRecords(records: Array<any>): AggregationByRecordsResult {
    if (records.length === 0) {
      return { depth: 0, contextValues: [] };
    }
    // const depth = _.meanBy(records, 'depth');
    // for (let i = 0; i < records.length; i++) {
    //   console.log(records[i]['6']);
    // }
    const depth =
      records.reduce((sum, record) => {
        const value = parseFloat(record['6']); // Convert the value to a number
        return isNaN(value) ? sum : sum + value;
      }, 0) / records.length;

    const groupedByContext: Record<string, Array<{}>> = records.reduce(
      (result, record) => {
        const context = record['3'] || 'default'; // Default context if 'context' property is missing
        result[context] = result[context] || [];
        result[context].push(record);
        return result;
      },
      {}
    );

    const contextValues: Array<any> = [];
    for (const contextName in groupedByContext) {
      const recordsOfThatContext: Array<any> = groupedByContext[contextName];
      contextValues.push({
        context: contextName,
        value:
          recordsOfThatContext.reduce((sum, record) => {
            const value = parseFloat(record['4']); // Convert the value to a number
            return isNaN(value) ? sum : sum + value;
          }, 0) / recordsOfThatContext.length,
      });
    }
    return {
      depth,
      contextValues,
    };
  }
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
   * Combines all MethylCRecords that (presumably) are in one pixel.  See schema below the function for return schema.
   *
   * @param {MethylCRecord[]} records
   * @return {Object}
   */
  static aggregateByStrand(
    records: MethylCRecord[]
  ): AggregationByStrandResult {
    let forwardStrandRecords = records.filter((record) => record['5'] === '+');
    let reverseStrandRecords = records.filter((record) => record['5'] !== '+');
    return {
      combined: MethylCRecord.aggregateRecords(records),
      forward: MethylCRecord.aggregateRecords(forwardStrandRecords),
      reverse: MethylCRecord.aggregateRecords(reverseStrandRecords),
    };
    /*
        {
            combined: {},
            forward: {},
            reverse: {}
        }
        */
  }

  /*
    Input， strings like following
    chrX	2709724	2709725	CHH	0.111	-	9
    chrX	2709728	2709729	CG	0.875	+	8
    chrX	2709767	2709768	CHG	0.059	-	17
    /**
     * Constructs a new MethylCRecord, given a string from tabix
     *
     */

  constructor(bedRecord: BedRecord) {
    const locus = {
      chr: bedRecord.chr,
      start: bedRecord.start,
      end: bedRecord.end,
    };
  }
}

export default MethylCRecord;
