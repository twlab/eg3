import TextSource from "./localTextSource";
import BinIndexer from "../models/BinIndexer";
import BedRecord from "../models/BedRecord";
import { chromAlias } from "../getRemoteData/fetchFunctions";
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
  private chromNamingCache: boolean | null = null;
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

  async detectChromosomeNaming(): Promise<boolean | null> {
    if (this.chromNamingCache !== null) {
      return this.chromNamingCache;
    }
    try {
      if (!this.ready) {
        await this.init();
      }
      const firstItem = this.textData?.data?.[0];
      const firstChrom = firstItem?.[0];
      if (!firstChrom) {
        this.chromNamingCache = false;
        return false;
      }
      this.chromNamingCache =
        !chromAlias[firstChrom] &&
        Object.values(chromAlias).some((aliases) => aliases.has(firstChrom));
      return this.chromNamingCache;
    } catch (error) {
      console.error("Error detecting chromosome naming. Check file format.");
      return null;
    }
  }

  async getData(loci, options: any = {}) {
    if (!this.ready) {
      await this.init();
    }
    const isEnsembl =
      options.ensemblStyle ?? (await this.detectChromosomeNaming());

    // Return one group per locus carrying the locus chr once, instead of
    // stamping chr onto every record. The chr is reattached when formatting.
    return loci.map((locus) => {
      const chrom = isEnsembl ? locus.chr.replace("chr", "") : locus.chr;
      return {
        chr: locus.chr,
        data: this.indexer.get(chrom, locus.start, locus.end),
      };
    });
  }
}

export default BedTextSource;
