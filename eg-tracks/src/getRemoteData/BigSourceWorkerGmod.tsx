import _ from "lodash";
import { BigWig } from "@gmod/bbi";
import { RemoteFile } from "generic-filehandle2";
import fetch from "isomorphic-fetch";

/**
 * Reads and gets data from bigwig or bigbed files hosted remotely using @gmod/bbi library
 *
 * @author Daofeng Li
 */
const chromosome: Array<string> = [
  "chr1", "chr2", "chr3", "chr4", "chr5", "chr6", "chr7", "chr8", "chr9", "chr10",
  "chr11", "chr12", "chr13", "chr14", "chr15", "chr16", "chr17", "chr18", "chr19", "chr20",
  "chr21", "chr22", "chrX", "chrY", "chrM"
];

const ensembl: Array<string> = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
  "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
  "21", "22", "X", "Y", "M"
];

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
   * Detects if the BigWig file uses Ensembl chromosome naming convention
   * @return {Promise<boolean>} True if Ensembl naming (1, 2, 3...), false if UCSC naming (chr1, chr2, chr3...)
   */
  async detectChromosomeNaming() {
    try {
      const header = await this.bw.getHeader();
      const availableChromosomes = Object.keys(header.refsByName || {});

      // Check if the file uses Ensembl naming (1, 2, 3...) or UCSC naming (chr1, chr2, chr3...)
      const hasEnsemblStyle = availableChromosomes.some(chr => /^[0-9XYM]+$/.test(chr));
      const hasUCSCStyle = availableChromosomes.some(chr => chr.startsWith('chr'));

      let isEnsembl = false;
      if (hasEnsemblStyle && !hasUCSCStyle) {
        isEnsembl = true;
      } else if (!hasEnsemblStyle && hasUCSCStyle) {
        isEnsembl = false;
      } else if (hasEnsemblStyle && hasUCSCStyle) {
        // Mixed naming - prefer whichever has more chromosomes
        const ensemblCount = availableChromosomes.filter(chr => /^[0-9XYM]+$/.test(chr)).length;
        const ucscCount = availableChromosomes.filter(chr => chr.startsWith('chr')).length;
        isEnsembl = ensemblCount > ucscCount;
      }

      return isEnsembl;
    } catch (error) {
      console.error("Error detecting chromosome naming:", error);
      return false; // Default to UCSC naming
    }
  }

  /**
   * Reads and logs the first feature from the BigWig file for debugging
   * @return {Promise<void>}
   */
  async readFirstLine() {
    try {
      // Get header information and detect chromosome naming
      const header = await this.bw.getHeader();
      const isEnsembl = await this.detectChromosomeNaming();

      console.log("BigWig Header chromosomes:", Object.keys(header.refsByName || {}).slice(0, 10));
      console.log(`Using ${isEnsembl ? 'Ensembl' : 'UCSC'} chromosome naming`);

      // Use appropriate chromosome list based on detected naming
      const testChroms = isEnsembl
        ? ["1", "2", "X", "Y", "M"]
        : ["chr1", "chr2", "chrX", "chrY", "chrM"];

      for (const chrom of testChroms) {
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
    // Auto-detect chromosome naming if not specified in options
    let useEnsemblStyle = options?.ensemblStyle;

    if (useEnsemblStyle === undefined) {
      useEnsemblStyle = await this.detectChromosomeNaming();
      console.log(`Auto-detected chromosome naming: ${useEnsemblStyle ? 'Ensembl' : 'UCSC'}`);
    }

    const promises = loci.map((locus) => {
      let chrom = useEnsemblStyle
        ? locus.chr.replace("chr", "")
        : locus.chr;

      // Handle mitochondrial chromosome naming variations
      if (chrom === "M" || chrom === "chrM") {
        // Try both M and MT depending on the file's naming convention
        chrom = useEnsemblStyle ? "M" : "chrM";
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
