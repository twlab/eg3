
import { BigWig } from "@gmod/bbi";

const ensembl: Array<string> = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
  "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
  "21", "22", "X", "Y", "M",
];

/**
 * Reads and gets data from bigwig or bigbed files hosted remotely using @gmod/bbi library
 *
 * @author Daofeng Li
 */
class BigSourceWorkerGmod {
  url: string;
  bw: BigWig;
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
      this.chromNamingCache = ensembl.includes(firstChrom);
      return this.chromNamingCache;
    } catch (error) {
      console.error("Error detecting chromosome naming. Check URL and file format.");
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
    const isEnsembl = options.ensemblStyle ?? (await this.detectChromosomeNaming());

    const promises = loci.map((locus) => {
      let chrom = isEnsembl ? locus.chr.replace("chr", "") : locus.chr;
      if (chrom === "M") {
        chrom = "MT";
      }

      return this.bw.getFeatures(chrom, locus.start, locus.end);
    });
    const dataForEachLocus = await Promise.all(promises);
    loci.forEach((locus, index) => {
      dataForEachLocus[index].forEach((f) => (f.chr = locus.chr));
    });
    const combinedData = dataForEachLocus.flat();

    return combinedData;
  }
}

export default BigSourceWorkerGmod;
