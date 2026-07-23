import { SequenceData } from "../models/SequenceData";
import { TwoBitFile } from "@gmod/twobit";
import { RemoteFile } from "generic-filehandle";

const CORS_PROXY = "https://epigenome.wustl.edu/cors";

function proxiedUrl(url: string): string {
  return `${CORS_PROXY}/${url.replace(/^https?:\/\//, "")}`;
}

/**
 * Reads and gets data from remotely-hosted .2bit files.
 *
 * @author Daofeng Li
 */
class TwoBitSource {
  twobit: TwoBitFile;
  url: any;
  private usingProxy: boolean = false;

  /**
   * Prepares to fetch .2bit data from a URL.
   *
   * @param {string} url - the URL from which to fetch data
   */
  constructor(url) {
    this.url = url;
    // Default cache mode: reuse the browser's HTTP cache to avoid refetching.
    this.twobit = this.makeTwoBit();
  }

  // Build a reader with an explicit HTTP cache mode, optionally through the
  // CORS proxy. Range requests are how .2bit seeks, so `cache` controls how
  // they interact with the browser's disk cache (see `runWithFallback`).
  private makeTwoBit(
    useProxy = false,
    cache: RequestCache = "default",
  ): TwoBitFile {
    const url = useProxy ? proxiedUrl(this.url) : this.url;
    return new TwoBitFile({
      filehandle: new RemoteFile(url, { overrides: { cache } }),
    });
  }

  /**
   * Runs a read against the preferred (cached) reader, escalating only on
   * failure: cached -> same-origin cache-bypass (recovers from Chromium's
   * intermittent net::ERR_CACHE_OPERATION_NOT_SUPPORTED without leaving our
   * origin, and does not stick) -> CORS proxy (committed). See
   * BigSourceWorkerGmod for details.
   */
  private async runWithFallback<T>(
    run: (twobit: TwoBitFile) => Promise<T>,
  ): Promise<T> {
    // Tier 1: preferred reader (cached, or proxied if already committed).
    try {
      return await run(this.twobit);
    } catch (error) {
      if (this.usingProxy) throw error;
    }

    // Tier 2: same origin, cache bypassed — transient, not persisted.
    try {
      return await run(this.makeTwoBit(false, "reload"));
    } catch (error) {
      // fall through to the proxy
    }

    // Tier 3: commit to the CORS proxy for this and future reads.
    this.usingProxy = true;
    this.twobit = this.makeTwoBit(true);
    return await run(this.twobit);
  }

  /**
   * Gets the sequence that covers the region.
   *
   * @param {DisplayedRegionModel} region - region for which to fetch data
   * @return {Promise<SequenceData[]>} - sequence in the region
   */
  async getData(region) {
    return this.runWithFallback((twobit) =>
      Promise.all(
        region.getGenomeIntervals().map(async (locus) => {
          const sequence = await this.getSequenceInInterval(twobit, locus);
          return new SequenceData(locus, sequence!);
        }),
      ),
    );
  }

  /**
   * Gets the sequence for a single chromosome interval.
   *
   * @param {TwoBitFile} twobit - the reader to fetch from
   * @param {ChromosomeInterval} interval - coordinates
   * @return {Promise<string>} - a Promise for the sequence
   */
  async getSequenceInInterval(twobit, interval) {
    const seq = await twobit.getSequence(
      interval.chr,
      interval.start,
      interval.end,
    );
    return seq;
  }
}

export default TwoBitSource;

// previous version
// import twoBit from '../vendor/bbi-js/main/twoBit';
// import bin from '../vendor/bbi-js/utils/bin';

// /**
//  * Reads and gets data from remotely-hosted .2bit files.
//  *
//  * @author Daofeng Li
//  */
// class TwoBitSource extends DataSource {
//     /**
//      * Prepares to fetch .2bit data from a URL.
//      *
//      * @param {string} url - the URL from which to fetch data
//      */
//     constructor(url) {
//         super();
//         this.url = url;
//         this.twoBitPromise = new Promise((resolve, reject) => {
//             twoBit.makeTwoBit(new bin.URLFetchable(url), (twoBitObj, error) => {
//                 if (error) {
//                     reject(error);
//                 }
//                 resolve(twoBitObj);
//             });
//         });
//     }

//     /**
//      * Gets the sequence that covers the region.
//      *
//      * @param {DisplayedRegionModel} region - region for which to fetch data
//      * @return {Promise<SequenceData[]>} - sequence in the region
//      */
//     async getData(region) {
//         const promises = region.getGenomeIntervals().map(async locus => {
//             const sequence = await this.getSequenceInInterval(locus);
//             return new SequenceData(locus, sequence);
//         });
//         return Promise.all(promises);
//     }

//     /**
//      * Gets the sequence for a single chromosome interval.
//      *
//      * @param {ChromosomeInterval} interval - coordinates
//      * @return {Promise<string>} - a Promise for the sequence
//      */
//     async getSequenceInInterval(interval) {
//         const twoBitObj = await this.twoBitPromise;
//         return new Promise((resolve, reject) => {
//             // bbi-js assumes coordinates are 1-indexed, while our coordinates are 0-indexed.  +1 to compensate.
//             twoBitObj.fetch(interval.chr, interval.start + 1, interval.end, (data, error) => {
//                 if (error) {
//                     reject(error);
//                 } else {
//                     resolve(data);
//                 }
//             });
//         });
//     }

// }
