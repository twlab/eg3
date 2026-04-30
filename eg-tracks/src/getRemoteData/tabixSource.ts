import _ from "lodash";
import { TabixIndexedFile } from "@gmod/tabix";
import { RemoteFile } from "generic-filehandle";

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

import { ensureMaxListLength } from "../models/util";
// import ChromosomeInterval from "../../model/interval/ChromosomeInterval";

/**
 * A DataSource that gets BedRecords from remote bed files.  Designed to run in webworker context.  Only indexed bed
 * files supported.
 *
 * @author Daofeng Li based on Silas's version
 */
class TabixSource {
  /**
   * Prepares to fetch data from a bed file located at the input url.  Assumes the index is located at the same url,
   * plus a file extension of ".tbi".  This method will request and store the tabix index from this url immediately.
   *
   * @param {string} url - the url of the bed-like file to fetch.
   */
  constructor(url, indexUrl, dataLimit = 100000) {
    this.url = url;
    this.indexUrl = indexUrl ? indexUrl : url + ".tbi";
    this.dataLimit = dataLimit;
    this.chromNamingCache = null;
    this.tabix = new TabixIndexedFile({
      filehandle: new RemoteFile(url),
      tbiFilehandle: new RemoteFile(this.indexUrl),
    });
  }

  async detectChromosomeNaming() {
    if (this.chromNamingCache !== null) {
      return this.chromNamingCache;
    }
    try {
      const names = await this.tabix.getReferenceSequenceNames();
      const firstChrom = names[0];
      if (!firstChrom) {
        this.chromNamingCache = false;
        return false;
      }
      this.chromNamingCache = ensembl.includes(firstChrom);
      return this.chromNamingCache;
    } catch (error) {
      console.error(
        "Error detecting chromosome naming. Check URL and file format.",
      );
      return null;
    }
  }

  /**
   * Gets data for a list of chromosome intervals.
   *
   * @param {ChromosomeInterval[]} loci - locations for which to fetch data
   * @return {Promise<BedRecord[]>} Promise for the data
   */
  getData = async (loci, basesPerPixel, options) => {
    const isEnsembl =
      options?.ensemblStyle ?? (await this.detectChromosomeNaming());
    const promises = loci.map((locus) => {
      let chrom = isEnsembl ? locus.chr.replace("chr", "") : locus.chr;
      if (chrom === "M") {
        chrom = "MT";
      }
      return this.getDataForLocus(chrom, locus.start, locus.end);
    });
    const dataForEachLocus = await Promise.all(promises);
    if (isEnsembl) {
      loci.forEach((locus, index) => {
        dataForEachLocus[index].forEach((f) => (f.chr = locus.chr));
      });
    }
    return _.flatten(dataForEachLocus);
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
    const rawlines = [];
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
