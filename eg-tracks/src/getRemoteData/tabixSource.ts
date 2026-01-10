import _ from "lodash";
import { TabixIndexedFile } from "@gmod/tabix";
import { RemoteFile } from "generic-filehandle";

import { ensureMaxListLength } from "../models/util";
// import ChromosomeInterval from "../../model/interval/ChromosomeInterval";

const ensembl: Array<string> = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "X",
  "Y",
  "M",
];

/**
 * A DataSource that gets BedRecords from remote bed files.  Designed to run in webworker context.  Only indexed bed
 * files supported.
 *
 * @author Daofeng Li based on Silas's version
 */
class TabixSource {
  url: any;
  indexUrl?: any;
  dataLimit: number;
  tabix: TabixIndexedFile;
  private chromNamingCache: boolean | null = null;
  useEnsemblStyle: null | boolean;
  /**
   * Prepares to fetch data from a bed file located at the input url.  Assumes the index is located at the same url,
   * plus a file extension of ".tbi".  This method will request and store the tabix index from this url immediately.
   *
   * @param {string} url - the url of the bed-like file to fetch.
   */
  constructor(url, indexUrl = null, dataLimit = 100000) {
    this.url = url;
    this.indexUrl = indexUrl ? indexUrl : url + ".tbi";
    this.dataLimit = dataLimit;
    this.tabix = new TabixIndexedFile({
      filehandle: new RemoteFile(url),
      tbiFilehandle: new RemoteFile(this.indexUrl),
    });
    this.useEnsemblStyle = null;
  }

  /**
   * Recreates the Tabix instance to clear any cached data
   */
  private recreateTabixInstance() {
    this.tabix = new TabixIndexedFile({
      filehandle: new RemoteFile(this.url),
      tbiFilehandle: new RemoteFile(this.indexUrl),
    });
  }

  /**
   * Detects if the Tabix file uses Ensembl
   * @return {Promise<boolean>} True if Ensembl naming (1, 2, 3...), false if UCSC naming (chr1, chr2, chr3...)
   */
  async detectChromosomeNaming() {
    try {
      const referenceSequenceNames =
        await this.tabix.getReferenceSequenceNames();

      const firstChrom = referenceSequenceNames[0];

      if (!firstChrom) {
        this.chromNamingCache = false; // Default to UCSC naming if no chromosomes found
        return false;
      }

      // Check if the first chromosome name is in the Ensembl array
      this.chromNamingCache = ensembl.includes(firstChrom);
      return this.chromNamingCache;
    } catch (error) {
      console.error(
        "Error detecting chromosome naming. Check URL and file format."
      );
      throw error;
    }
  }

  /**
   * Fetches data from Tabix file for the given loci
   * @param {ChromosomeInterval[]} loci - locations for which to fetch data
   * @param {any} options - fetch options including ensemblStyle
   * @return {Promise<BedRecord[]>} a Promise for the data
   */
  private async fetchSource(loci, options) {
    const promises = loci.map((locus) => {
      // graph container uses this source directly w/o initial track, so options is null
      let chrom = this.useEnsemblStyle
        ? locus.chr.replace("chr", "")
        : locus.chr;
      if (chrom === "M") {
        chrom = "MT";
      }
      return this.getDataForLocus(chrom, locus.start, locus.end);
    });
    const dataForEachLocus = await Promise.all(promises);

    loci.forEach((locus, index) => {
      dataForEachLocus[index].forEach((f) => (f.chr = locus.chr));
    });

    return _.flatten(dataForEachLocus);
  }

  /**
   * Gets data for a list of chromosome intervals.
   *
   * @param {ChromosomeInterval[]} loci - locations for which to fetch data
   * @return {Promise<BedRecord[]>} Promise for the data
   */
  getData = async (loci, basesPerPixel, options) => {
    if (this.useEnsemblStyle === null) {
      this.useEnsemblStyle = await this.detectChromosomeNaming();
    }

    try {
      return await this.fetchSource(loci, options);
    } catch (error) {
      throw error;
      // try {
      //   if (typeof window !== "undefined" && "caches" in window) {
      //     const cacheNames = await caches.keys();
      //     await Promise.all(
      //       cacheNames.map((cacheName) => caches.delete(cacheName))
      //     );
      //   }
      //   // recreate the fetch instance and retry once, because it might be a disk cache issue
      //   this.recreateTabixInstance();
      //   return await this.fetchSource(loci, options);
      // } catch (error) {
      //   throw error;
      // }
    }
  };

  /**
   * Gets data for a single chromosome interval.
   *
   * @param {string} chr - genome coordinates
   * @param {number} start - genome coordinates
   * @param {stnumberring} end - genome coordinates
   * @return {Promise<BedRecord[]>} Promise for the data
   */
  getDataForLocus = async (chr, start, end) => {
    // const { chr, start, end } = locus;
    const rawlines: Array<any> = [];
    await this.tabix.getLines(chr, start, end, (line) => rawlines.push(line));
    let lines;
    if (rawlines.length > this.dataLimit) {
      lines = ensureMaxListLength(rawlines, this.dataLimit);
    } else {
      lines = rawlines;
    }
    return lines.map(this._parseLine);
  };

  /**
   * @param {string} line - raw string the bed-like file
   */
  _parseLine = (line) => {
    const columns = line.split("\t");
    if (columns.length < 3) {
      return;
    }
    let feature = {
      chr: columns[0],
      start: Number.parseInt(columns[1], 10),
      end: Number.parseInt(columns[2], 10),
      n: columns.length, // number of columns in initial data row
    };
    for (let i = 3; i < columns.length; i++) {
      // Copy the rest of the columns to the feature
      feature[i] = columns[i];
    }
    return feature;
  };
}

export default TabixSource;
