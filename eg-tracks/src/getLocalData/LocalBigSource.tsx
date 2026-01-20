import _ from "lodash";
import { BigWigZoomLevels } from "../trackConfigs/config-menu-models.tsx/DisplayModes";
import { makeBwg } from "../getRemoteData/vendor/bbi-js/main/bigwig";
import { BlobFetchable } from "../getRemoteData/vendor/bbi-js/utils/bin";

/**
 * Reads and gets data from bigwig or bigbed files in local.  Gets DASFeature records, which vary in schema
 * depending on the file.
 *
 * @author Silas Hsu and Daofeng Li
 */
class LocalBigSource {
  file: any;
  bigWigPromise: Promise<any>;
  /**
   * Prepares to fetch bigwig or bigbed data a file blob.
   *
   * @param {blob} file - file blob object
   */
  constructor(file) {
    this.file = file;
    this.bigWigPromise = this.loadBigWig(file);
  }

  // Function to handle the dynamic loading of the BigWig data
  private async loadBigWig(file: any): Promise<any> {
    try {
      return new Promise((resolve, reject) => {
        makeBwg(new BlobFetchable(file), (bigWigObj: any, error: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(bigWigObj);
          }
        });
      });
    } catch (error) {
      console.error("Failed to dynamically load the BigWig module:", error);
      return Promise.reject(error);
    }
  }

  /**
   * Gets BigWig or BigBed features inside the requested locations.
   *
   * @param {DisplayedRegionModel} region - region for which to fetch data
   * @param {number} [basesPerPixel] - used to determine fetch resolution
   * @return {Promise<DASFeature[]>} a Promise for the data
   * @override
   */
  async getData(loci, basesPerPixel) {
    const bigWigObj = await this.bigWigPromise;
    const zoomLevel = this._getMatchingZoomLevel(bigWigObj, basesPerPixel);

    let promises = loci.map((locus) =>
      this._getDataForChromosome(locus, bigWigObj, zoomLevel)
    );
    const dataForEachLocus = await Promise.all(promises);
    const combinedData = _.flatten(dataForEachLocus);
    for (let dasFeature of combinedData) {
      dasFeature.min -= 1; // bbi-js returns 1-indexed features; -1 to compensate.
    }
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
  _getMatchingZoomLevel(bigWigObj, basesPerPixel) {
    if (!basesPerPixel) {
      return -1;
    }
    // Sort zoom levels from largest to smallest
    let sortedZoomLevels = bigWigObj.zoomLevels
      .slice()
      .sort((levelA, levelB) => levelB.reduction - levelA.reduction);
    let desiredZoom = sortedZoomLevels.find(
      (zoomLevel) => zoomLevel.reduction < basesPerPixel
    );
    return bigWigObj.zoomLevels.findIndex(
      (zoomLevel) => zoomLevel === desiredZoom
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
  _getDataForChromosome(interval, bigWigObj, zoomLevel) {
    // bbi-js assumes coordinates are 1-indexed, while our coordinates are 0-indexed.  +1 to compensate.
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

export default LocalBigSource;
