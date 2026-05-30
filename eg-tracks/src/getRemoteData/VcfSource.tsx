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
    let filehandle, tbiFilehandle;
    if (Array.isArray(url)) {
      filehandle = new BlobFile(url.filter((f) => !f.name.endsWith(".tbi"))[0]);
      tbiFilehandle = new BlobFile(
        url.filter((f) => f.name.endsWith(".tbi"))[0],
      );
    } else {
      filehandle = new RemoteFile(url);
      tbiFilehandle = new RemoteFile(indexUrl ? indexUrl : url + ".tbi");
    }
    this.vcf = new TabixIndexedFile({ filehandle, tbiFilehandle });

    this.header = null;
    this.parser = null;
  }

  private async detectChromosomeNaming(): Promise<boolean | null> {
    if (this.chromNamingCache !== null) {
      return this.chromNamingCache;
    }
    try {
      const names = await this.vcf.getReferenceSequenceNames();
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
      if (!this.usingProxy) {
        this.switchToProxy();
        return this.detectChromosomeNaming();
      }
      console.error(
        "Error detecting chromosome naming. Check URL and file format.",
      );
      return null;
    }
  }

  private switchToProxy() {
    if (Array.isArray(this.url)) return;
    this.usingProxy = true;
    this.chromNamingCache = null;
    this.header = null;
    this.parser = null;
    this.vcf = new TabixIndexedFile({
      filehandle: new RemoteFile(proxiedUrl(this.url)),
      tbiFilehandle: new RemoteFile(
        proxiedUrl(this.indexUrl ?? this.url + ".tbi"),
      ),
    });
  }

  /**
   * Fetches data from VCF file for the given regions
   * @param {ChromosomeInterval[]} region - locations for which to fetch data
   * @param {any} options - fetch options including ensemblStyle
   * @return {Promise<any[]>} a Promise for the data
   */
  private async fetchSource(region, options) {
    if (!this.header) {
      this.header = await this.vcf.getHeader();
    }
    if (!this.parser) {
      this.parser = new VCF({ header: this.header });
    }
    const isEnsembl =
      options?.ensemblStyle ?? (await this.detectChromosomeNaming());
    const promises = region.map((locus) =>
      this._getDataInLocus(locus, isEnsembl),
    );
    const dataForEachSegment = await Promise.all(promises);
    const flattened = dataForEachSegment.flat();

    return flattened;
  }

  async getData(region, basesPerPixel, options) {
    try {
      return await this.fetchSource(region, options);
    } catch (error) {
      if (!this.usingProxy) {
        this.switchToProxy();
        return await this.fetchSource(region, options);
      }
      console.error("Error fetching VCF data:", error);
      throw error;
    }
  }

  async _getDataInLocus(locus, options) {
    const variants = [];
    let chrom = this.chromNamingCache
      ? locus.chr.replace("chr", "")
      : locus.chr;
    if (chrom === "M") {
      chrom = "MT";
    }
    //vcf is 1 based
    // -1 compensation happened in Vcf feature constructor
    await this.vcf.getLines(chrom, locus.start + 1, locus.end, (line) =>
      variants.push(this.parser.parseLine(line)),
    );
    if (options.ensemblStyle || this.chromNamingCache) {
      for (let variant of variants) {
        variant.CHROM = locus.chr;
      }
    }

    return variants;
  }
}

export default VcfSource;
