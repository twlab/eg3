import { TabixIndexedFile } from "@gmod/tabix";
import { BlobFile } from "generic-filehandle";
import { chromAlias } from "../getRemoteData/fetchFunctions";

import { ensureMaxListLength } from "../models/util";
// import ChromosomeInterval from "../../model/interval/ChromosomeInterval";

/**
 * A DataSource that gets BedRecords from remote bed files.  Designed to run in webworker context.  Only indexed bed
 * files supported.
 *
 * @author Daofeng Li based on Silas's version
 */
class LocalTabixSource {
  trackModel: any;
  blob: any;
  indexBlob?: any;
  dataLimit: number;
  tabix: TabixIndexedFile;
  private chromNamingCache: boolean | null = null;
  /**
   * Prepares to fetch data from a bed file located at the input url.  Assumes the index is located at the same url,
   * plus a file extension of ".tbi".  This method will request and store the tabix index from this url immediately.
   *
   * @param {string} url - the url of the bed-like file to fetch.
   */

  constructor(trackModel, dataLimit = 100000) {
    if (trackModel.files[0].name.length > trackModel.files[1].name.length) {
      this.blob = trackModel.files[1];
      this.indexBlob = trackModel.files[0];
    } else {
      this.blob = trackModel.files[0];
      this.indexBlob = trackModel.files[1];
    }

    this.dataLimit = dataLimit;
    this.tabix = new TabixIndexedFile({
      filehandle: new BlobFile(this.blob),
      tbiFilehandle: new BlobFile(this.indexBlob),
    });
  }

  async detectChromosomeNaming(): Promise<boolean | null> {
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
      this.chromNamingCache =
        !chromAlias[firstChrom] &&
        Object.values(chromAlias).some((aliases) => aliases.has(firstChrom));
      return this.chromNamingCache;
    } catch (error) {
      console.error("Error detecting chromosome naming. Check file format.");
      return null;
    }
  }

  /**
   * Gets data for a list of chromosome intervals.
   *
   * @param {ChromosomeInterval[]} loci - locations for which to fetch data
   * @return {Promise<BedRecord[]>} Promise for the data
   */
  getData = async (loci, options) => {
    try {
      const isEnsembl =
        options?.ensemblStyle ?? (await this.detectChromosomeNaming());

      const promises = loci.map((locus) => {
        // graph container uses this source directly w/o initial track, so options is null
        let chrom = isEnsembl ? locus.chr.replace("chr", "") : locus.chr;
        if (chrom === "M") chrom = "MT";
        return this.getDataForLocus(chrom, locus.start, locus.end);
      });

      const dataForEachLocus = await Promise.all(promises);

      // Return one group per locus carrying the locus chr once, instead of
      // stamping chr onto every feature. The chr is reattached when formatting.
      return loci.map((locus, index) => ({
        chr: locus.chr,
        data: dataForEachLocus[index],
      }));
    } catch (error) {
      return {
        error: true,
        message: `Failed to fetch data: ${error.message}`,
      };
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

export default LocalTabixSource;
