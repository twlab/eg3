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
      console.error("Error detecting chromosome naming:", error);
      this.chromNamingCache = false; // Default to UCSC naming
      return false;
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
  getData = async (loci, basesPerPixel, options) => {
    // Create a fresh BigWig instance for each getData call
    // This prevents cache conflicts when multiple App instances exist
    if (this.useEnsemblStyle === null) {
      this.useEnsemblStyle = await this.detectChromosomeNaming();
    }
    const useEnsemblStyle = this.useEnsemblStyle;

    const promises = loci.map((locus) => {
      let chrom = useEnsemblStyle ? locus.chr.replace("chr", "") : locus.chr;

      // Handle mitochondrial chromosome naming variations
      if (chrom === "M" || chrom === "chrM") {
        // Try both M and MT depending on the file's naming convention
        chrom = useEnsemblStyle ? "M" : "chrM";
      }

      return this.bw.getFeatures(chrom, locus.start, locus.end, {
        basesPerSpan: basesPerPixel,
      });
    });

    const dataForEachLocus = await Promise.all(promises);
    loci.forEach((locus, index) => {
      dataForEachLocus[index].forEach((f) => (f.chr = locus.chr));
    });
    const combinedData = dataForEachLocus.flat();

    return combinedData;
  };
}

export default BigSourceWorkerGmod;
