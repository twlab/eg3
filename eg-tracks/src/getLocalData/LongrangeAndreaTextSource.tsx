import BedTextSource from "./BedTextSource";
import BinIndexer from "@eg/core/src/eg-lib/models/BinIndexer";

// Type definition for BED record
interface BedRecord {
  chr: string;
  start: number;
  end: number;
}

class LongrangeAndreaTextSource extends BedTextSource {
  convertToBedRecord(item: any): BedRecord {
    // Note: Ensure the base expects this type
    //"chr20:49368733-49369493<->chr20:50528173-50533850"	FALSE	FALSE	1161898.5	309	79.7857303792859

    const list = item[0].split(/\W+/);
    //> Array ["chr20", "49368733", "49369493", "chr20", "50528173", "50533850"]
    const record: BedRecord = {
      chr: list[0],
      start: Number.parseInt(list[1], 10),
      end: Number.parseInt(list[2], 10),
    };

    // Create the second record as the same type and handle as needed
    // This part might need adjustments depending on your exact requirements
    const record2: BedRecord = {
      chr: list[3],
      start: Number.parseInt(list[4], 10),
      end: Number.parseInt(list[5], 10),
    };

    // Add additional data as needed
    (record as any)[3] = `${list[3]}:${list[4]}-${list[5]},${item[5]}`;
    (record2 as any)[3] = `${list[0]}:${list[1]}-${list[2]},${item[5]}`;

    // Depending on how the data is later consumed, we need to return a single record
    return record; // Adjust to return a single record as needed

    // If it must return a list, consider returning only one element based on certain logic
    // return [record, record2]; // Correct logic would be needed here
  }

  initIndex() {
    this.indexer = new BinIndexer(
      this.textData.data,
      this.convertToBedRecord.bind(this), // Ensure correct context
      1
    );
  }
}

export default LongrangeAndreaTextSource;
