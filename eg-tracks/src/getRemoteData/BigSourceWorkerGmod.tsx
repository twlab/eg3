import { BigWig } from "@gmod/bbi";
import { chromAlias } from "./fetchFunctions";

const CORS_PROXY = "https://epigenome.wustl.edu/cors";

function proxiedUrl(url: string): string {
  return `${CORS_PROXY}/${url.replace(/^https?:\/\//, "")}`;
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
    this.bw = new BigWig({ url });
    this.chromNamingCache = null;
  }

  private switchToProxy() {
    this.usingProxy = true;
    this.chromNamingCache = null;
    this.bw = new BigWig({ url: proxiedUrl(this.url) });
  }

  async detectChromosomeNaming(): Promise<boolean | null> {
    if (this.chromNamingCache !== null) {
      return this.chromNamingCache;
    }
    try {
      const header = await this.bw.getHeader();
      const firstChrom = Object.keys(header.refsByName || {})[0];
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

    const fetchForLoci = () =>
      loci.map((locus) => {
        let chrom = isEnsembl ? locus.chr.replace("chr", "") : locus.chr;
        if (chrom === "M") {
          chrom = "MT";
        }
        return this.bw.getFeatures(chrom, locus.start, locus.end);
      });

    let dataForEachLocus: any[][];
    try {
      dataForEachLocus = await Promise.all(fetchForLoci());
    } catch (error) {
      if (!this.usingProxy) {
        this.switchToProxy();
        dataForEachLocus = await Promise.all(fetchForLoci());
      } else {
        throw error;
      }
    }

    loci.forEach((locus, index) => {
      dataForEachLocus[index].forEach((f) => (f.chr = locus.chr));
    });

    return dataForEachLocus.flat();
  }
}

export default BigSourceWorkerGmod;
