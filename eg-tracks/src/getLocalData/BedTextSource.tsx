import _ from "lodash";

import TextSource from "./localTextSource";
import BinIndexer from "../models/BinIndexer";
import BedRecord from "../models/BedRecord";
/**
 * @author Daofeng Li
 * get data from TextSource, index it and return by region querying
 */

class BedTextSource {
  source: TextSource;
  textData: any;
  indexer: any;
  ready: boolean;
  type: string = "";
  constructor(config) {
    this.source = new TextSource(config);
    this.textData = null;
    this.indexer = null;
    this.ready = false;
    this.type = config.type || "";

    this.convertToBedRecord = this.convertToBedRecord.bind(this);
  }

  convertToBedRecord(item) {
    if (this.type !== "longrange") {
      const record = {
        chr: item[0],
        start: Number.parseInt(item[1], 10),
        end: Number.parseInt(item[2], 10),
      };

      for (let i = 3; i < item.length; i++) {
        record[i] = item[i];
      }
      return record;
    } else {
      // console.log(item);
      // Split the first element by tabs/spaces to get the main fields
      const mainFields = item.length === 1 ? item[0].split(/\s+/) : item; // ['chr1', '713605', '715737', 'chr1:720589-722848']

      let record;

      // Check if there's a second element and what format it's in
      if (item.length > 1 && item[1]) {
        // Check if item[1] contains tabs (complex format) or is just a simple value
        if (item[1].includes("\t")) {
          // Format: ['chr1    713605  715737  chr1:720589-722848', '2\t8165 +']
          const additionalFields = item[1].split("\t"); // ['2', '8165 +']
          const scoreAndStrand = additionalFields[1].split(" "); // ['8165', '+']

          record = {
            chr: mainFields[0], // "chr1"
            start: Number.parseInt(mainFields[1], 10), // 713605
            end: Number.parseInt(mainFields[2], 10), // 715737
            3: `${mainFields[3]},${additionalFields[0]}`, // "chr1:720589-722848,2"
            4: scoreAndStrand[0], // "8165" (score)
            5: scoreAndStrand[1], // "+" (strand)
            n: mainFields.length + additionalFields.length, // total field count
          };
        } else {
          // Format: ['chr1    713605  715737  chr1:720589-722848', '2']
          record = {
            chr: mainFields[0], // "chr1"
            start: Number.parseInt(mainFields[1], 10), // 713605
            end: Number.parseInt(mainFields[2], 10), // 715737
            3: `${mainFields[3]},${item[1]}`, // "chr1:720589-722848,2"
            4: item[1], // "2" (score)
            5: "", // No strand info
            n: mainFields.length + 1, // total field count
          };
        }
      } else {
        // Format: chr1    720589  722848  chr1:713605-715737,2
        record = {
          chr: mainFields[0], // "chr1"
          start: Number.parseInt(mainFields[1], 10), // 720589
          end: Number.parseInt(mainFields[2], 10), // 722848
          3: mainFields[3], // "chr1:713605-715737,2" (interaction info with score)
          4: mainFields[3] ? mainFields[3].split(",")[1] || "" : "", // Extract "2" from "chr1:713605-715737,2"
          5: "", // No strand info in this format
          n: mainFields.length, // 4 fields
        };
      }

      return record;
    }
  }

  async initSource() {
    if (!this.textData) {
      this.textData = await this.source.init();
    }
  }

  initIndex() {
    this.indexer = new BinIndexer(this.textData.data, this.convertToBedRecord);
  }

  async init() {
    await this.initSource();
    this.initIndex();
    this.indexer.init();
    this.ready = true;
  }

  async getData(loci) {
    if (!this.ready) {
      await this.init();
    }

    const data = loci.map((locus) =>
      this.indexer.get(locus.chr, locus.start, locus.end)
    );

    return _.flatten(data);
  }
}

export default BedTextSource;
