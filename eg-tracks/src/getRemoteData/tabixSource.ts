import { TabixIndexedFile } from "@gmod/tabix";
import { RemoteFile } from "generic-filehandle";
import { chromAlias } from "./fetchFunctions";

import { ensureMaxListLength } from "../models/util";
// import ChromosomeInterval from "../../model/interval/ChromosomeInterval";

const CORS_PROXY = "https://epigenome.wustl.edu/cors";

function proxiedUrl(url: string): string {
  return `${CORS_PROXY}/${url.replace(/^https?:\/\//, "")}`;
}

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
    this.usingProxy = false;
    // Default cache mode: reuse the browser's HTTP cache to avoid refetching.
    this.tabix = this.makeTabix();
  }

  // Build a tabix reader with an explicit HTTP cache mode, optionally through
  // the CORS proxy. Range requests are how tabix seeks, so `cache` controls how
  // they interact with the browser's disk cache (see `runWithFallback`).
  makeTabix(useProxy = false, cache = "default") {
    const dataUrl = useProxy ? proxiedUrl(this.url) : this.url;
    const idxUrl = useProxy ? proxiedUrl(this.indexUrl) : this.indexUrl;
    return new TabixIndexedFile({
      filehandle: new RemoteFile(dataUrl, { overrides: { cache } }),
      tbiFilehandle: new RemoteFile(idxUrl, { overrides: { cache } }),
    });
  }

  /**
   * Runs a read against the preferred (cached) reader, escalating only on
   * failure: cached -> same-origin cache-bypass (recovers from Chromium's
   * intermittent net::ERR_CACHE_OPERATION_NOT_SUPPORTED without leaving our
   * origin, and does not stick) -> CORS proxy (committed, since CORS is a
   * persistent property of the URL). See BigSourceWorkerGmod for details.
   */
  async runWithFallback(run) {
    // Tier 1: preferred reader (cached, or proxied if already committed).
    try {
      return await run(this.tabix);
    } catch (error) {
      if (this.usingProxy) throw error;
    }

    // Tier 2: same origin, cache bypassed — transient, not persisted.
    try {
      return await run(this.makeTabix(false, "reload"));
    } catch (error) {
      // fall through to the proxy
    }

    // Tier 3: commit to the CORS proxy for this and future reads.
    this.usingProxy = true;
    this.chromNamingCache = null;
    this.tabix = this.makeTabix(true);
    return await run(this.tabix);
  }

  async detectChromosomeNaming() {
    if (this.chromNamingCache !== null) {
      return this.chromNamingCache;
    }
    try {
      const naming = await this.runWithFallback(async (tabix) => {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Timeout fetching tabix index")),
            10000,
          ),
        );
        const names = await Promise.race([
          tabix.getReferenceSequenceNames(),
          timeout,
        ]);
        const firstChrom = names[0];
        if (!firstChrom) {
          return false;
        }
        return (
          !chromAlias[firstChrom] &&
          Object.values(chromAlias).some((aliases) => aliases.has(firstChrom))
        );
      });
      this.chromNamingCache = naming;
      return naming;
    } catch (error) {
      console.error(
        "Error detecting chromosome naming. Check URL and file format.",
      );
      throw new Error(
        "Error detecting chromosome naming. Check URL and file format. ",
      );
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

    const dataForEachLocus = await this.runWithFallback((tabix) =>
      Promise.all(
        loci.map((locus) => {
          let chrom = isEnsembl ? locus.chr.replace("chr", "") : locus.chr;
          if (chrom === "M") chrom = "MT";
          return this.getDataForLocus(tabix, chrom, locus.start, locus.end);
        }),
      ),
    );

    // Return one group per locus carrying the locus chr once, instead of
    // stamping chr onto every feature. The chr is reattached when formatting.
    return loci.map((locus, index) => ({
      chr: locus.chr,
      data: dataForEachLocus[index],
    }));
  };

  /**
   * Gets data for a single chromosome interval.
   *
   * @param {TabixIndexedFile} tabix - the reader to fetch from
   * @param {string} chr - genome coordinates
   * @param {number} start - genome coordinates
   * @param {stnumberring} end - genome coordinates
   * @return {Promise<BedRecord[]>} Promise for the data
   */
  getDataForLocus = async (tabix, chr, start, end) => {
    // const { chr, start, end } = locus;
    const rawlines = [];
    await tabix.getLines(chr, start, end, (line) => rawlines.push(line));
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
