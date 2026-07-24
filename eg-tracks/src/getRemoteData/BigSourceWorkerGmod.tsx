import { BigWig } from "@gmod/bbi";
import { RemoteFile } from "generic-filehandle2";
import { chromAlias } from "./fetchFunctions";

const CORS_PROXY = "https://epigenome.wustl.edu/cors";

function proxiedUrl(url: string): string {
  return `${CORS_PROXY}/${url.replace(/^https?:\/\//, "")}`;
}

// Build a bbi reader with an explicit HTTP cache mode. bbi reads bigwig/bigbed
// files with byte-range requests; `cache` controls how those interact with the
// browser's disk cache (see the tiered fallback in `runWithFallback`).
function makeBigWig(url: string, cache: RequestCache = "default"): BigWig {
  return new BigWig({
    filehandle: new RemoteFile(url, { overrides: { cache } }),
  });
}

/**
 * Reads and gets data from bigwig or bigbed files hosted remotely using @gmod/bbi library
 *
 * @author Daofeng Li
 */
class BigSourceWorkerGmod {
  url: string;
  bw: BigWig;
  private usingProxy: boolean = false;
  private chromNamingCache: boolean | null = null;

  /**
   *
   * @param {string} url - the URL from which to fetch data
   */
  constructor(url) {
    this.url = url;
    // Default cache mode: reuse the browser's HTTP cache to avoid refetching.
    this.bw = makeBigWig(url);
    this.chromNamingCache = null;
  }

  /**
   * Runs a read against the preferred (cached) reader, and only escalates on
   * failure. This keeps normal reads cached while degrading gracefully:
   *
   *   1. Preferred reader — HTTP cache on (or the proxy, if we've committed to
   *      it). Fast and reuses cached bytes.
   *   2. Same-origin `reload` — bypasses the disk cache for this read only.
   *      This cheaply recovers from Chromium's intermittent
   *      `net::ERR_CACHE_OPERATION_NOT_SUPPORTED` on range requests without
   *      leaving our origin, and does NOT stick — the next read is cached again.
   *   3. CORS proxy (last resort) — for genuine CORS/network failures. Because
   *      that's a persistent property of the URL, we commit to it for
   *      subsequent reads so we don't re-fail tiers 1 and 2 every time.
   */
  private async runWithFallback<T>(run: (bw: BigWig) => Promise<T>): Promise<T> {
    // Tier 1: preferred reader (cached, or proxied if already committed).
    try {
      return await run(this.bw);
    } catch (error) {
      if (this.usingProxy) throw error; // already at the last resort
    }

    // Tier 2: same origin, cache bypassed — transient, not persisted, so the
    // next read goes back to using the cache.
    try {
      return await run(makeBigWig(this.url, "reload"));
    } catch (error) {
      // fall through to the proxy
    }

    // Tier 3: commit to the CORS proxy for this and future reads.
    this.usingProxy = true;
    this.chromNamingCache = null;
    this.bw = makeBigWig(proxiedUrl(this.url));
    return await run(this.bw);
  }

  async detectChromosomeNaming(): Promise<boolean | null> {
    if (this.chromNamingCache !== null) {
      return this.chromNamingCache;
    }
    try {
      const naming = await this.runWithFallback(async (bw) => {
        const header = await bw.getHeader();
        const firstChrom = Object.keys(header.refsByName || {})[0];
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
      return null;
    }
  }

  /**
   * Gets BigWig or BigBed features inside the requested locations.
   *
   * @param {ChromosomeInterval[]} loci - locations for which to fetch data
   * @param {number} [basesPerPixel] - used to determine fetch resolution
   * @return {Promise<DASFeature[]>} a Promise for the data
   * @override
   */
  async getData(loci, basesPerPixel, options) {
    const isEnsembl =
      options.ensemblStyle ?? (await this.detectChromosomeNaming());

    const dataForEachLocus = await this.runWithFallback((bw) =>
      Promise.all(
        loci.map((locus) => {
          let chrom = isEnsembl ? locus.chr.replace("chr", "") : locus.chr;
          if (chrom === "M") {
            chrom = "MT";
          }
          return bw.getFeatures(chrom, locus.start, locus.end);
        }),
      ),
    );

    // Return one group per locus carrying the locus chr once, instead of
    // stamping chr onto every feature. The chr is reattached when formatting.
    return loci.map((locus, index) => ({
      chr: locus.chr,
      data: dataForEachLocus[index],
    }));
  }
}

export default BigSourceWorkerGmod;
