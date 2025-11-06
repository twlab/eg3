import { BigWig } from "@gmod/bbi";
import { RemoteFile } from "generic-filehandle2";
import fetch from "isomorphic-fetch";

/**
 * Reads and gets data from bigwig or bigbed files hosted remotely using @gmod/bbi library
 *
 * @author Daofeng Li Chanrung Seng
 */

// Custom fetch function that prevents caching
const fetchWithNoCaching = (input: RequestInfo, opts: any = {}) => {
  // Add timestamp to URL to bust cache
  let url = typeof input === "string" ? input : input.url;

  // Only add cache buster for range requests (the actual data chunks)
  // Skip it for the initial header request to avoid issues
  const isRangeRequest = opts?.headers?.Range || opts?.headers?.range;

  if (isRangeRequest) {
    const separator = url.includes("?") ? "&" : "?";
    url = `${url}${separator}_=${Date.now()}`;
  }

  const noCacheOpts = {
    ...opts,
    cache: "no-store" as RequestCache,
  };

  return fetch(url, noCacheOpts);
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
      filehandle: new RemoteFile(this.url, { fetch: fetchWithNoCaching }),
    });
  }

  /**
   * Detects if the BigWig file uses Ensembl chromosome naming convention
   * @return {Promise<boolean>} True if Ensembl naming (1, 2, 3...), false if UCSC naming (chr1, chr2, chr3...)
   */
  async detectChromosomeNaming(header: any) {
    try {
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
    const header = await bw.getHeader();
    const useEnsemblStyle = await this.detectChromosomeNaming(header);

    const MAX_FEATURES_PER_CHUNK = 10000; // Adjust based on memory constraints
    const MAX_TOTAL_FEATURES = 1000000; // Safety limit to prevent browser crash
    const combinedData: any[] = [];
    let totalFeaturesProcessed = 0;

    // Process loci sequentially to avoid memory spikes
    for (const locus of loci) {
      let chrom = useEnsemblStyle ? locus.chr.replace("chr", "") : locus.chr;

      // Handle mitochondrial chromosome naming variations
      if (chrom === "M" || chrom === "chrM") {
        // Try both M and MT depending on the file's naming convention
        chrom = useEnsemblStyle ? "M" : "chrM";
      }

      try {
        // Check if we've exceeded the safety limit
        if (totalFeaturesProcessed >= MAX_TOTAL_FEATURES) {
          console.warn(
            `Data fetch stopped: exceeded maximum limit of ${MAX_TOTAL_FEATURES} features to prevent browser crash`
          );
          break;
        }

        // Fetch features for this locus
        const features = await bw.getFeatures(chrom, locus.start, locus.end, {
          basesPerSpan: basesPerPixel,
        });

        // Process features in chunks to avoid memory issues
        const numFeatures = features.length;

        if (numFeatures > MAX_FEATURES_PER_CHUNK) {
          // Process in chunks if dataset is large
          for (let i = 0; i < numFeatures; i += MAX_FEATURES_PER_CHUNK) {
            // Check limit before processing each chunk
            if (totalFeaturesProcessed >= MAX_TOTAL_FEATURES) {
              console.warn(
                `Data fetch stopped: exceeded maximum limit during chunk processing`
              );
              features.length = 0;
              break;
            }

            const chunk = features.slice(i, i + MAX_FEATURES_PER_CHUNK);

            // Format chunk
            chunk.forEach((f: any) => {
              f.chr = locus.chr;
              combinedData.push(f);
              totalFeaturesProcessed++;
            });

            // Clear the chunk reference to help GC
            chunk.length = 0;
          }

          // Clear the original features array to free memory
          features.length = 0;
        } else {
          // For smaller datasets, process normally
          features.forEach((f: any) => {
            if (totalFeaturesProcessed < MAX_TOTAL_FEATURES) {
              f.chr = locus.chr;
              combinedData.push(f);
              totalFeaturesProcessed++;
            }
          });

          // Clear features array
          features.length = 0;
        }
      } catch (error) {
        console.error(
          `Error fetching data for ${locus.chr}:${locus.start}-${locus.end}:`,
          error
        );
        // Continue with next locus instead of failing completely
      }

      // Suggest garbage collection after each locus (if available)
      if (global.gc) {
        global.gc();
      }
    }
    console.log(combinedData);
    return combinedData;
  }
}

export default BigSourceWorkerGmod;
