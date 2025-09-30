import _ from "lodash";
import { BigWig } from "@gmod/bbi";
import { RemoteFile } from "generic-filehandle2";
import fetch from "isomorphic-fetch";

/**
 * Reads and gets data from bigwig or bigbed files hosted remotely using @gmod/bbi library
 *
 * @author Daofeng Li
 */

export function resolveUriLocation(location) {
  return location.baseUri
    ? { ...location, uri: new URL(location.uri, location.baseUri).href }
    : location;
}
class BigSourceWorkerGmod {
  url: any;
  bw: BigWig;
  /**
   *
   * @param {string} url - the URL from which to fetch data
   */
  constructor(url) {
    this.url = url;
    this.bw = new BigWig({
      filehandle: new RemoteFile(url, { fetch }),
    });
  }

  /**
   * Reads and logs the first feature from the BigWig file for debugging
   * @return {Promise<void>}
   */
  async readFirstLine() {
    try {
      // Get header information
      const header = await this.bw.getHeader();
      console.log("BigWig Header:", header);

      // Try to get the first feature from common chromosomes
      const commonChroms = ["chr1", "1", "chr2", "2", "chrX", "X"];

      for (const chrom of commonChroms) {
        try {
          // Try to get features from the first part of this chromosome
          const features = await this.bw.getFeatures(chrom, 0, 1000000); // First 1MB
          if (features && features.length > 0) {
            console.log(`First feature found on ${chrom}:`, features[0]);
            console.log("Feature details:", {
              chromosome: chrom,
              start: features[0].start,
              end: features[0].end,
              score: features[0].score || "N/A",
              uniqueId: features[0].uniqueId || "N/A",
            });
            return; // Exit after finding first feature
          }
        } catch (chromError) {
          // This chromosome might not exist, continue to next
          continue;
        }
      }

      console.log("No features found in the first 1MB of common chromosomes");
    } catch (error) {
      console.error("Error reading first line from BigWig:", error);
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
  async getData(loci, options) {
    // Uncomment the line below if you want to debug the first feature on every getData call
    await this.readFirstLine();

    const promises = loci.map((locus) => {
      let chrom = options.ensemblStyle
        ? locus.chr.replace("chr", "")
        : locus.chr;
      if (chrom === "M") {
        chrom = "MT";
      }

      return this.bw.getFeatures(chrom, locus.start, locus.end);
    });
    const dataForEachLocus = await Promise.all(promises);
    loci.forEach((locus, index) => {
      dataForEachLocus[index].forEach((f) => (f.chr = locus.chr));
    });
    const combinedData = _.flatten(dataForEachLocus);
    return combinedData;
  }
}

export default BigSourceWorkerGmod;
