import { BigWig } from "@gmod/bbi";
import { RemoteFile } from "generic-filehandle2";
import fetch from "isomorphic-fetch";

/**
 * Reads and gets data from bigwig or bigbed files hosted remotely using @gmod/bbi library
 *
 * @author Daofeng Li Chanrung Seng
 */

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

export function resolveUriLocation(location) {
  return location.baseUri
    ? { ...location, uri: new URL(location.uri, location.baseUri).href }
    : location;
}
class BigSourceWorkerGmod {
  url: any;
  /**
   *
   * @param {string} url - the URL from which to fetch data
   */
  constructor(url) {
    this.url = url;
    // Don't store the instance - create fresh ones in getData to avoid cache
  }

  /**
   * Creates a new BigWig instance (no caching between requests)
   */
  private createBigWig() {
    return new BigWig({
      filehandle: new RemoteFile(this.url, { fetch }),
    });
  }

  /**
   * Detects if the BigWig file uses Ensembl chromosome naming convention
   * @return {Promise<boolean>} True if Ensembl naming (1, 2, 3...), false if UCSC naming (chr1, chr2, chr3...)
   */
  async detectChromosomeNaming() {
    try {
      const bw = this.createBigWig();
      const header = await bw.getHeader();

      // Get just the first chromosome name directly
      const firstChrom = Object.keys(header.refsByName || {})[0];

      if (!firstChrom) {
        return false; // Default to UCSC naming if no chromosomes found
      }

      // Check if the first chromosome name is in the Ensembl array
      return ensembl.includes(firstChrom);
    } catch (error) {
      console.error("Error detecting chromosome naming:", error);
      return false; // Default to UCSC naming
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
    // Create a fresh instance for each request (avoids cache)
    const bw = this.createBigWig();
    const useEnsemblStyle = await this.detectChromosomeNaming();

    const promises = loci.map((locus) => {
      let chrom = useEnsemblStyle ? locus.chr.replace("chr", "") : locus.chr;

      // Handle mitochondrial chromosome naming variations
      if (chrom === "M" || chrom === "chrM") {
        // Try both M and MT depending on the file's naming convention
        chrom = useEnsemblStyle ? "M" : "chrM";
      }

      return bw.getFeatures(chrom, locus.start, locus.end, {
        basesPerSpan: basesPerPixel,
      });
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
