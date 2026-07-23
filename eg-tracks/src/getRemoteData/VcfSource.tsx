import _ from "lodash";
import { BlobFile, RemoteFile } from "generic-filehandle";
import { TabixIndexedFile } from "@gmod/tabix";
import VCF from "@gmod/vcf";
import { chromAlias } from "./fetchFunctions";

const CORS_PROXY = "https://epigenome.wustl.edu/cors";

function proxiedUrl(url: string): string {
  return `${CORS_PROXY}/${url.replace(/^https?:\/\//, "")}`;
}

class VcfSource {
  header: any;
  vcf: TabixIndexedFile;
  parser: any;
  url: any;
  indexUrl: any;
  private chromNamingCache: boolean | null = null;
  private usingProxy: boolean = false;
  constructor(url, indexUrl = null) {
    this.url = url;
    this.indexUrl = indexUrl;
    if (Array.isArray(url)) {
      // Local blob files: read straight from memory, no HTTP cache/proxy.
      this.vcf = new TabixIndexedFile({
        filehandle: new BlobFile(
          url.filter((f) => !f.name.endsWith(".tbi"))[0],
        ),
        tbiFilehandle: new BlobFile(
          url.filter((f) => f.name.endsWith(".tbi"))[0],
        ),
      });
    } else {
      // Default cache mode: reuse the browser's HTTP cache to avoid refetching.
      this.vcf = this.makeVcf();
    }

    this.header = null;
    this.parser = null;
  }

  // Build a remote tabix reader with an explicit HTTP cache mode, optionally
  // through the CORS proxy. Only valid for remote (string url) sources.
  private makeVcf(
    useProxy = false,
    cache: RequestCache = "default",
  ): TabixIndexedFile {
    const dataUrl = useProxy ? proxiedUrl(this.url) : this.url;
    const idx = this.indexUrl ?? this.url + ".tbi";
    const idxUrl = useProxy ? proxiedUrl(idx) : idx;
    return new TabixIndexedFile({
      filehandle: new RemoteFile(dataUrl, { overrides: { cache } }),
      tbiFilehandle: new RemoteFile(idxUrl, { overrides: { cache } }),
    });
  }

  /**
   * Runs a read against the preferred (cached) reader, escalating only on
   * failure: cached -> same-origin cache-bypass (recovers from Chromium's
   * intermittent net::ERR_CACHE_OPERATION_NOT_SUPPORTED without leaving our
   * origin, and does not stick) -> CORS proxy (committed). Local blob sources
   * skip all of this. See BigSourceWorkerGmod for details.
   */
  private async runWithFallback<T>(
    run: (vcf: TabixIndexedFile) => Promise<T>,
  ): Promise<T> {
    if (Array.isArray(this.url)) {
      return run(this.vcf);
    }

    // Tier 1: preferred reader (cached, or proxied if already committed).
    try {
      return await run(this.vcf);
    } catch (error) {
      if (this.usingProxy) throw error;
    }

    // Tier 2: same origin, cache bypassed — transient, not persisted.
    try {
      return await run(this.makeVcf(false, "reload"));
    } catch (error) {
      // fall through to the proxy
    }

    // Tier 3: commit to the CORS proxy for this and future reads.
    this.usingProxy = true;
    this.chromNamingCache = null;
    this.header = null;
    this.parser = null;
    this.vcf = this.makeVcf(true);
    return await run(this.vcf);
  }

  // Load (and cache, for the primary reader) the VCF header + parser.
  private async ensureHeaderParser(vcf: TabixIndexedFile) {
    if (vcf === this.vcf && this.parser) {
      return this.parser;
    }
    const header = await vcf.getHeader();
    const parser = new VCF({ header });
    if (vcf === this.vcf) {
      this.header = header;
      this.parser = parser;
    }
    return parser;
  }

  private async detectChromosomeNaming(
    vcf: TabixIndexedFile,
  ): Promise<boolean> {
    if (this.chromNamingCache !== null) {
      return this.chromNamingCache;
    }
    const names = await vcf.getReferenceSequenceNames();
    const firstChrom = names[0];
    if (!firstChrom) {
      this.chromNamingCache = false;
      return false;
    }
    this.chromNamingCache =
      !chromAlias[firstChrom] &&
      Object.values(chromAlias).some((aliases) => aliases.has(firstChrom));
    return this.chromNamingCache;
  }

  /**
   * Fetches data from VCF file for the given regions
   * @param {ChromosomeInterval[]} region - locations for which to fetch data
   * @param {any} options - fetch options including ensemblStyle
   * @return {Promise<any[]>} a Promise for the data
   */
  private async fetchSource(vcf: TabixIndexedFile, region, options) {
    const parser = await this.ensureHeaderParser(vcf);
    const isEnsembl =
      options?.ensemblStyle ?? (await this.detectChromosomeNaming(vcf));
    const promises = region.map((locus) =>
      this._getDataInLocus(vcf, parser, locus, isEnsembl),
    );
    const dataForEachSegment = await Promise.all(promises);

    // Return one group per locus carrying the locus chr once, instead of
    // stamping CHROM onto every variant. The chr is reattached when formatting.
    return region.map((locus, index) => ({
      chr: locus.chr,
      data: dataForEachSegment[index],
    }));
  }

  async getData(region, basesPerPixel, options) {
    try {
      return await this.runWithFallback((vcf) =>
        this.fetchSource(vcf, region, options),
      );
    } catch (error) {
      console.error("Error fetching VCF data:", error);
      throw error;
    }
  }

  async _getDataInLocus(vcf: TabixIndexedFile, parser, locus, isEnsembl) {
    const variants = [];
    let chrom = isEnsembl ? locus.chr.replace("chr", "") : locus.chr;
    if (chrom === "M") {
      chrom = "MT";
    }
    //vcf is 1 based
    // -1 compensation happened in Vcf feature constructor
    await vcf.getLines(chrom, locus.start + 1, locus.end, (line) =>
      variants.push(parser.parseLine(line)),
    );
    // CHROM is stamped from the locus group when formatting (see
    // normalizeLocusGroupedData), so it always matches the browser's naming.

    return variants;
  }
}

export default VcfSource;
