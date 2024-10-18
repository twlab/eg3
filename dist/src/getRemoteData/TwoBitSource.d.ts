import { TwoBitFile } from '@gmod/twobit';
/**
 * Reads and gets data from remotely-hosted .2bit files.
 *
 * @author Daofeng Li
 */
declare class TwoBitSource {
    twobit: TwoBitFile;
    url: any;
    /**
     * Prepares to fetch .2bit data from a URL.
     *
     * @param {string} url - the URL from which to fetch data
     */
    constructor(url: any);
    /**
     * Gets the sequence that covers the region.
     *
     * @param {DisplayedRegionModel} region - region for which to fetch data
     * @return {Promise<SequenceData[]>} - sequence in the region
     */
    getData(region: any): Promise<any[]>;
    /**
     * Gets the sequence for a single chromosome interval.
     *
     * @param {ChromosomeInterval} interval - coordinates
     * @return {Promise<string>} - a Promise for the sequence
     */
    getSequenceInInterval(interval: any): Promise<string | undefined>;
}
export default TwoBitSource;
