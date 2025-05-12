import { NormalizationMode } from "./HicDataModes";
/**
 * Data source that fetches data from .hic files.
 *
 * @author Silas Hsu
 */
export declare class HicSource {
    currentBinSize: number;
    normOptions: any;
    metadata: any;
    straw: any;
    /**
     * Makes a new instance specialized in serving data from one URL
     *
     * @param {string} url - the URL to fetch data from
     */
    constructor(url: any);
    /**
     * Loading normalization data is an expensive operation that takes a long time.  In order for `getData()` to return
     * normalized data, one must first call this method and wait for the returned promise to resolve.  The promise is
     * cached, so there is no issue in calling this method multiple times.
     *
     * @return {Promise<void>} a promise that resolves when normalization data is finished loading
     */
    /**
     * Returns the largest bin size such at least MIN_BINS_PER_REGION fit in a region of the provided length.  If no such
     * bin size exists, because the input was too small or invalid, returns the smallest bin size.
     *
     * @param {DisplayedRegionModel} region - the region
     * @returns {number} the index of the recommended bin size for the region
     */
    getAutoBinSize(region: any, options: any): any;
    /**
     * Gets the bin size to use during data fetch
     *
     * @param {TrackOptions} options - HiC track options
     * @param {DisplayedRegionModel} region - region to fetch, to be used in case of auto bin size
     * @return {number} bin size to use during data fetch
     */
    getBinSize(options: any, region: any): any;
    /**
     * FIXME this doesn't do well in region set view.  Errors abound from Juicebox.
     *
     * @param {ChromosomeInterval} queryLocus1
     * @param {ChromosomeInterval} queryLocus2
     * @param {number} binSize
     * @param {NormalizationMode} normalization
     * @return {GenomeInteraction[]}
     */
    getInteractionsBetweenLoci(queryLocus1: any, queryLocus2: any, binSize: any, normalization: NormalizationMode | undefined, region: any): Promise<any[]>;
    /**
     * Gets HiC data in the view region.  Note that only a triangular portion of the contact matrix is returned.
     *
     * @param {DisplayedRegionModel} region - region for which to fetch data
     * @param {number} basesPerPixel - bases per pixel.  Higher = more zoomed out
     * @param {Object} options - rendering options
     * @return {Promise<GenomeInteraction[]>} a Promise for the data
     */
    getData(region: any, basesPerPixel: any, options: any): Promise<any>;
    /**
     * Gets current HiC file meta information being used.
     *
     * @param {DisplayedRegionModel} region - region for which to fetch data
     * @param {number} basesPerPixel - bases per pixel.  Higher = more zoomed out
     * @param {Object} options - rendering options
     * @return {} a meta object
     */
    getCurrentMeta(region: any, basesPerPixel: any, options: any): {
        resolution: number;
        normalization: any;
    };
    getFileInfo: () => {
        resolutions: any;
        normOptions: any;
    };
    /**
     * Gets the genome-wide interaction map from the HiC file.
     *
     * @param {NavigationContext} genome - genome metadata
     * @return {Promise<GenomeInteraction[]>} a Promise for the data
     */
    getDataAll(genome: any): Promise<any[]>;
}
