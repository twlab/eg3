import { BigWig } from "@gmod/bbi";
import { RemoteFile } from "generic-filehandle2";

/**
 * Reads and gets data from bigwig or bigbed files hosted remotely using @gmod/bbi library
 *
 * @author Daofeng Li Chanrung Seng
 */

// Create a custom fetch wrapper that prevents cache conflicts
const createFetchWithNoCache = () => {
  return (input: RequestInfo | URL, options: any = {}) => {
    return fetch(input, {
      ...options,
      cache: "no-store", // Prevent cache conflicts between multiple App instances
    });
  };
};

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

class BigSourceWorkerGmod {
  url: any;
  private chromNamingCache: boolean | null = null;
  bw: BigWig;
  useEnsemblStyle: null | boolean;

  /**
   *
   * @param {string} url - the URL from which to fetch data
   */
  constructor(url) {
    this.url = url;
    this.bw = new BigWig({
      filehandle: new RemoteFile(this.url),
    });
    this.useEnsemblStyle = null;
  }

  /**
   * Recreates the BigWig instance to clear any cached data
   */
  private recreateBigWigInstance() {
    this.bw = new BigWig({
      filehandle: new RemoteFile(this.url, { fetch: createFetchWithNoCache() }),
    });
    this.chromNamingCache = null;
    this.useEnsemblStyle = null;
  }

  /**
   * Detects if the BigWig file uses Ensembl
   * @return {Promise<boolean>} True if Ensembl naming (1, 2, 3...), false if UCSC naming (chr1, chr2, chr3...)
   */
  async detectChromosomeNaming() {
    try {
      const header = await this.bw.getHeader();

      const firstChrom = Object.keys(header.refsByName || {})[0];

      if (!firstChrom) {
        this.chromNamingCache = false; // Default to UCSC naming if no chromosomes found
        return false;
      }

      // Check if the first chromosome name is in the Ensembl array
      this.chromNamingCache = ensembl.includes(firstChrom);
      return this.chromNamingCache;
    } catch (error) {
      console.error(
        "Error detecting chromosome naming. Check URL and file format."
      );
      throw error;
    }
  }

  /**
   * Fetches features from BigWig/BigBed file for the given loci
   * @param {ChromosomeInterval[]} loci - locations for which to fetch data
   * @return {Promise<DASFeature[]>} a Promise for the data
   */
  private async fetchSource(loci) {
    const promises = loci.map(async (locus) => {
      let chrom = this.useEnsemblStyle
        ? locus.chr.replace("chr", "")
        : locus.chr;

      if (chrom === "M" || chrom === "chrM") {
        chrom = this.useEnsemblStyle ? "M" : "chrM";
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

  /**
   * Gets BigWig or BigBed features inside the requested locations.
   *
   * @param {ChromosomeInterval[]} loci - locations for which to fetch data
   * @param {number} [basesPerPixel] - used to determine fetch resolution
   * @return {Promise<DASFeature[]>} a Promise for the data
   * @override
   */
  getData = async (loci, basesPerPixel, options) => {
    if (this.useEnsemblStyle === null) {
      this.useEnsemblStyle = await this.detectChromosomeNaming();
    }

    try {
      return await this.fetchSource(loci);
    } catch (error) {
      try {
        if (typeof window !== "undefined" && "caches" in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map((cacheName) => caches.delete(cacheName))
          );
        }

        // recreate the fetch instance and retry once, because it might a disk cache issue
        this.recreateBigWigInstance();

        if (this.useEnsemblStyle === null) {
          this.useEnsemblStyle = await this.detectChromosomeNaming();
        }

        return await this.fetchSource(loci);
      } catch (error) {
        throw error;
      }
    }
  };
}

export default BigSourceWorkerGmod;
