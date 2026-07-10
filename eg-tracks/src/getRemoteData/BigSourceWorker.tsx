import { BigWigZoomLevels } from "../trackConfigs/config-menu-models.tsx/DisplayModes";
import { makeBwg } from "./vendor/bbi-js/main/bigwig";
import { URLFetchable } from "./vendor/bbi-js/utils/bin";
import { chromAlias } from "./fetchFunctions";

const CORS_PROXY = "https://epigenome.wustl.edu/cors";

function proxiedUrl(url: string): string {
  return `${CORS_PROXY}/${url.replace(/^https?:\/\//, "")}`;
}

/**
 * Reads and gets data from bigwig or bigbed files hosted remotely.  Gets DASFeature records, which vary in schema
 * depending on the file.
 *
 * @license MIT
 */
class BigSourceWorker {
  url: any;
  bigWigPromise: Promise<unknown>;
  private usingProxy: boolean = false;
  private chromNamingCache: boolean | null = null;

  /**
   * Prepares to fetch bigwig or bigbed data from a URL.
   *
   * @param {string} url - the URL from which to fetch data
   */
  constructor(url) {
    this.url = url;
    this.bigWigPromise = this.loadBigWig(url);
  }

  private async loadBigWig(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      makeBwg(new URLFetchable(url), (bigWigObj: any, error: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(bigWigObj);
        }
      });
    });
  }

  private switchToProxy() {
    this.usingProxy = true;
    this.chromNamingCache = null;
    this.bigWigPromise = this.loadBigWig(proxiedUrl(this.url));
  }

  async detectChromosomeNaming(): Promise<boolean | null> {
    if (this.chromNamingCache !== null) {
      return this.chromNamingCache;
    }
    try {
      const bigWigObj = await this.bigWigPromise;
      const firstChrom = Object.keys(bigWigObj.chromsToIDs || {})[0];
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
  async getData(loci: any, basesPerPixel: any, options: any): Promise<any[]> {
    const isEnsembl =
      options.ensemblStyle ?? (await this.detectChromosomeNaming());

    const fetchForLoci = async () => {
      const bigWigObj = await this.bigWigPromise;
      const zoomLevel =
        options.zoomLevel === undefined ||
        options.zoomLevel === BigWigZoomLevels.AUTO
          ? this._getMatchingZoomLevel(bigWigObj, basesPerPixel)
          : Number.parseInt(options.zoomLevel);

      return loci.map((locus: any) => {
        let chrom = isEnsembl ? locus.chr.replace("chr", "") : locus.chr;
        if (chrom === "M") chrom = "MT";
        return this._getDataForChromosome(
          { ...locus, chr: chrom },
          bigWigObj,
          zoomLevel,
        );
      });
    };

    let dataForEachLocus: any[][];
    try {
      dataForEachLocus = await Promise.all(await fetchForLoci());
    } catch (error) {
      if (!this.usingProxy) {
        this.switchToProxy();
        dataForEachLocus = await Promise.all(await fetchForLoci());
      } else {
        throw error;
      }
    }

    const combinedData = dataForEachLocus.flat();
    for (let dasFeature of combinedData) {
      dasFeature.min -= 1; // Compensate for 0 due to 1-indexing from bbi-js.
    }
    // if (isEnsembl) {
    //   loci.forEach((locus: any, index: number) => {
    //     dataForEachLocus[index].forEach((f: any) => (f.chr = locus.chr));
    //   });
    // }
    return combinedData;
  }

  /**
   * BigWig files contain zoom levels, where data across many bases is aggregated into bins.  This selects an
   * appropriate zoom index from the BigWig file given the number of bases per pixel at which the data will be
   * visualized.  This function may also return -1, which indicates base pair resolution (no aggregation) is
   * appropriate.
   *
   * @param {BigWig} bigWigObj - BigWig object provided by bbi-js
   * @param {number} [basesPerPixel] - bases per pixel to use to calculate an appropriate zoom level
   * @return {number} a zoom level index inside the BigWig file, or -1 if base pair resolution is appropriate.
   */
  _getMatchingZoomLevel(bigWigObj: any, basesPerPixel: number): number {
    if (!basesPerPixel) {
      return -1;
    }
    if (bigWigObj.zoomLevels.length === 1) {
      // just one zoom level
      return 0;
    }
    // Sort zoom levels from largest to smallest
    let sortedZoomLevels = bigWigObj.zoomLevels
      .slice()
      .sort((levelA: any, levelB: any) => levelB.reduction - levelA.reduction);
    let desiredZoom = sortedZoomLevels.find(
      (zoomLevel: any) => zoomLevel.reduction < basesPerPixel,
    );
    return bigWigObj.zoomLevels.findIndex(
      (zoomLevel: any) => zoomLevel === desiredZoom,
    );
  }

  /**
   * Gets BigWig features stored in a single chromosome interval.
   *
   * @param {ChromosomeInterval} interval - coordinates
   * @param {BigWig} bigWigObj - BigWig object provided by bbi-js
   * @param {number} zoomLevel - a zoom level index inside the BigWig file.  If -1, gets data at base pair resolution.
   * @return {Promise<DASFeature[]>} - a Promise for the data, an array of DASFeature provided by bbi-js
   */
  _getDataForChromosome(
    interval: any,
    bigWigObj: any,
    zoomLevel: number,
  ): Promise<any[]> {
    // Compensate by adding +1 to start in 1-indexing.
    const start = interval.start + 1;
    const end = interval.end;
    return new Promise((resolve, reject) => {
      try {
        if (zoomLevel === -1) {
          bigWigObj.readWigData(interval.chr, start, end, resolve);
        } else {
          bigWigObj
            .getZoomedView(zoomLevel)
            .readWigData(interval.chr, start, end, resolve);
        }
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default BigSourceWorker;
