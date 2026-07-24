import { BamFile } from "@gmod/bam";
import { BlobFile, RemoteFile } from "generic-filehandle";

const CORS_PROXY = "https://epigenome.wustl.edu/cors";

function proxiedUrl(url: string): string {
  return `${CORS_PROXY}/${url.replace(/^https?:\/\//, "")}`;
}

/**
 * Daofeng switched to use @gmod/bam instead
 */

class BamSource {
  bam: any;
  header: any;
  private url: any;
  private usingProxy: boolean = false;

  constructor(param) {
    this.url = param;
    this.bam = null;
    this.usingProxy = false;
    if (typeof param === "string") {
      // Default cache mode: reuse the browser's HTTP cache to avoid refetching.
      this.bam = this.makeBam();
    } else {
      // Local blob files: read straight from memory, no HTTP cache/proxy.
      const baiFilehandle = new BlobFile(
        param.filter((f) => f.name.endsWith(".bai"))[0],
      );
      const bamFilehandle = new BlobFile(
        param.filter((f) => !f.name.endsWith(".bai"))[0],
      );
      this.bam = new BamFile({
        bamFilehandle,
        baiFilehandle,
      });
    }
    this.header = null;
  }

  // Build a remote bam reader with an explicit HTTP cache mode, optionally
  // through the CORS proxy. Only valid for remote (string url) sources.
  private makeBam(useProxy = false, cache: RequestCache = "default"): BamFile {
    const bamUrl = useProxy ? proxiedUrl(this.url) : this.url;
    const baiUrl = useProxy
      ? proxiedUrl(this.url + ".bai")
      : this.url + ".bai";
    return new BamFile({
      bamFilehandle: new RemoteFile(bamUrl, { overrides: { cache } }),
      baiFilehandle: new RemoteFile(baiUrl, { overrides: { cache } }),
    });
  }

  /**
   * Runs a read against the preferred (cached) reader, escalating only on
   * failure: cached -> same-origin cache-bypass (recovers from Chromium's
   * intermittent net::ERR_CACHE_OPERATION_NOT_SUPPORTED without leaving our
   * origin, and does not stick) -> CORS proxy (committed). Local blob sources
   * skip all of this. See BigSourceWorkerGmod for details.
   */
  private async runWithFallback<T>(run: (bam: any) => Promise<T>): Promise<T> {
    if (typeof this.url !== "string") {
      return run(this.bam);
    }

    // Tier 1: preferred reader (cached, or proxied if already committed).
    try {
      return await run(this.bam);
    } catch (error) {
      if (this.usingProxy) throw error;
    }

    // Tier 2: same origin, cache bypassed — transient, not persisted.
    try {
      return await run(this.makeBam(false, "reload"));
    } catch (error) {
      // fall through to the proxy
    }

    // Tier 3: commit to the CORS proxy for this and future reads.
    this.usingProxy = true;
    this.header = null;
    this.bam = this.makeBam(true);
    return await run(this.bam);
  }

  async getData(locusArr, basesPerPixel, options = {}) {
    return this.runWithFallback(async (bam) => {
      // @gmod/bam memoizes the parsed header internally, so this is cheap after
      // the first call and also populates `indexToChr`.
      await bam.getHeader();
      const promises = locusArr.map((locus) =>
        bam.getRecordsForRange(locus.chr, locus.start, locus.end),
      );
      const dataForEachSegment = await Promise.all(promises);

      // Return one group per locus carrying the locus chr once, instead of
      // stamping chr onto every record. The chr is reattached when formatting.
      return locusArr.map((locus, index) => ({
        chr: locus.chr,
        data: dataForEachSegment[index].map((r: any) =>
          Object.assign(r, {
            ref: bam.indexToChr[r.get("seq_id")].refName,
          }),
        ),
      }));
    });
  }
}

export default BamSource;
