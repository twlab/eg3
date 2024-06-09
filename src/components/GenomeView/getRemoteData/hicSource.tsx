// import Straw from 'hic-straw/src/straw';
// import HicStraw from "hic-straw/dist/hic-straw";
// import HicStraw from "hic-straw/dist/hic-straw.esm.js";

// import DataSource from './DataSource';
// import ChromosomeInterval from '../model/interval/ChromosomeInterval';
import { NormalizationMode } from './HicDataModes';
import { GenomeInteraction } from './GenomeInteraction';

/**
 * First, some monkey patching for juicebox.js
 */
/**
 * The original method matches chromosome names exactly.  This function does a fuzzier search.
 *
 * @param {string} name - the chromosome name to find
 * @return {number} the index of the chromosome in the file, or `undefined` if not found.
 */
// window.hic.Dataset.prototype.getChrIndexFromName = function(name) {
//     if (!name) {
//         return;
//     }
//     let found = this.chromosomes.findIndex(chromosome => chromosome.name === name);
//     if (found !== -1) {
//         return found.index;
//     }

//     let modifiedName = name.replace("chrM", "MT");
//     modifiedName = modifiedName.replace("chr", "");
//     found = this.chromosomes.findIndex(chromosome => chromosome.name.toUpperCase() === modifiedName.toUpperCase());
//     return found !== -1 ? found : undefined;
// }

const MIN_BINS_PER_REGION = 50;

/**
 * Data source that fetches data from .hic files.
 *
 * @author Silas Hsu
 */
function GetHicData(straw, base, options, start, end) {
  /**
   * Makes a new instance specialized in serving data from one URL
   *
   * @param {string} url - the URL to fetch data from
   */
  // constructor(url) {
  //   let config;
  //   if (typeof url === 'string') {
  //     config = { url };
  //     // if(url.includes('4dnucleome')) {
  //     //     config = {url, headers: {Authorization : process.env.REACT_APP_4DN_KEY}}
  //     // }
  //   } else {
  //     config = { blob: url };
  //   }
  //   // console.log(config)
  //   this.straw = new HicStraw(config);
  //   // this.datasetPromise = this.straw.reader.loadDataset({});
  //   // this.metadataPromise = null;
  //   // this.normVectorsPromise = null;
  //   this.metadata = null;
  //   this.normOptions = null;
  //   this.currentBinSize = 0;
  // }

  /**
   * Loading normalization data is an expensive operation that takes a long time.  In order for `getData()` to return
   * normalized data, one must first call this method and wait for the returned promise to resolve.  The promise is
   * cached, so there is no issue in calling this method multiple times.
   *
   * @return {Promise<void>} a promise that resolves when normalization data is finished loading
   */
  // fetchNormalizationData() {
  //     if (!this.normVectorsPromise) {
  //         this.normVectorsPromise = this.straw.hicFile.readNormExpectedValuesAndNormVectorIndex();
  //     }
  //     return this.normVectorsPromise;
  // }

  /**
   * Returns the largest bin size such at least MIN_BINS_PER_REGION fit in a region of the provided length.  If no such
   * bin size exists, because the input was too small or invalid, returns the smallest bin size.
   *
   * @param {DisplayedRegionModel} region - the region
   * @returns {number} the index of the recommended bin size for the region
   */
  // function getAutoBinSize(region) {
  //   const SORTED_BIN_SIZES = this.metadata.resolutions;
  //   const regionLength = region.getWidth();
  //   for (const binSize of SORTED_BIN_SIZES) {
  //     // SORTED_BIN_SIZES must be sorted from largest to smallest!
  //     if (MIN_BINS_PER_REGION * binSize < regionLength) {
  //       return binSize;
  //     }
  //   }
  //   return SORTED_BIN_SIZES[SORTED_BIN_SIZES.length - 1];
  // }
  function findClosestNumber(arr: number[], num: number) {
    if (arr.includes(num)) {
      return num;
    }
    return arr.reduce((prev, curr) => {
      return Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev;
    });
  }
  /**
   * Gets the bin size to use during data fetch
   *
   * @param {TrackOptions} options - HiC track options
   * @param {DisplayedRegionModel} region - region to fetch, to be used in case of auto bin size
   * @return {number} bin size to use during data fetch
   */
  // function getBinSize(options, region) {
  //   const numberBinSize = Number(options.binSize) || 0;
  //   return numberBinSize <= 0
  //     ? this.getAutoBinSize(region)
  //     : this.findClosestNumber(this.metadata.resolutions, numberBinSize);
  // }

  /**
   * FIXME this doesn't do well in region set view.  Errors abound from Juicebox.
   *
   * @param {ChromosomeInterval} queryLocus1
   * @param {ChromosomeInterval} queryLocus2
   * @param {number} binSize
   * @param {NormalizationMode} normalization
   * @return {GenomeInteraction[]}
   */
  async function getInteractionsBetweenLoci(
    queryLocus1,
    queryLocus2,
    binSize,
    normalization = NormalizationMode.NONE
  ) {
    // if (normalization !== NormalizationMode.NONE) {
    //     await this.fetchNormalizationData();
    // }
    // console.log(this.normOptions)
    // console.log(normalization, queryLocus1, queryLocus2, "BP", binSize)
    const records = await straw.getContactRecords(
      normalization,
      queryLocus1,
      queryLocus2,
      'BP',
      binSize
    );
    // console.log(records)
    const interactions: Array<any> = [];
    for (const record of records) {
      const recordLocus1 = {
        chr: queryLocus1.chr,
        start: record.bin1 * binSize,
        end: (record.bin1 + 1) * binSize,
      };
      const recordLocus2 = {
        chr: queryLocus2.chr,
        start: record.bin2 * binSize,
        end: (record.bin2 + 1) * binSize,
      };
      interactions.push(
        new GenomeInteraction(recordLocus1, recordLocus2, record.counts)
      );
    }
    return interactions;
  }

  /**
   * Gets HiC data in the view region.  Note that only a triangular portion of the contact matrix is returned.
   *
   * @param {DisplayedRegionModel} region - region for which to fetch data
   * @param {number} basesPerPixel - bases per pixel.  Higher = more zoomed out
   * @param {Object} options - rendering options
   * @return {Promise<GenomeInteraction[]>} a Promise for the data
   */
  async function getData() {
    // const binSize =getBinSize(options, region);
    // let currentBinSize = binSize;
    // const promises: Array<any> = [];
    let normalization = NormalizationMode.NONE;
    // NEED TO BE INCLUSIVE TO INTERACTIONS THAT DONT SHOW UP WHEN THEIR START ISNT IN RANGE OF REGION
    // SO WE NEED TO MAKE START 0 TO MAKE SURE WE GET EVERY INTERACTION
    // BIN SIDE IS THE OVERALL SIZE OF THE INTERACTION. WHEN ITS 10000 WE ARE TRYING TO RQUERY EVERY BEAM WITH A DISTANCE OF 10000 IN THE CHROMOSOME
    // to be inclusive of bins to the left size of track we need to subtract start by binsize + binsize/2
    const dataForEachSegment = await getInteractionsBetweenLoci(
      { start: start - 20000, end: end, chr: 'chr7' },
      { start: start - 20000, end: end, chr: 'chr7' },
      10000,
      options.normalization
    );
    // const dataForEachSegment = await Promise.all(promises);
    // return _.flatMap(dataForEachSegment);
    // return ensureMaxListLength(_.flatMap(dataForEachSegment), 5000);

    return dataForEachSegment;
  }

  /**
   * Gets current HiC file meta information being used.
   *
   * @param {DisplayedRegionModel} region - region for which to fetch data
   * @param {number} basesPerPixel - bases per pixel.  Higher = more zoomed out
   * @param {Object} options - rendering options
   * @return {} a meta object
   */
  // function getCurrentMeta(region, basesPerPixel, options) {
  //   return {
  //     resolution: this.currentBinSize,
  //     normalization: options.normalization,
  //   };
  // }

  // function getFileInfo = () => {
  //   return {
  //     resolutions: this.metadata.resolutions,
  //     normOptions: this.normOptions,
  //   };
  // };

  /**
   * Gets the genome-wide interaction map from the HiC file.
   *
   * @param {NavigationContext} genome - genome metadata
   * @return {Promise<GenomeInteraction[]>} a Promise for the data
   */
  // async function getDataAll(genome) {
  //   if (!this.metadata) {
  //     this.metadata = await this.straw.getMetaData();
  //   }
  //   const binSize = this.straw.hicFile.wholeGenomeChromosome.size * 2;
  //   const allRecords = await this.straw.getContactRecords(
  //     NormalizationMode.NONE,
  //     { chr: 'ALL' },
  //     { chr: 'ALL' },
  //     'BP'
  //   );
  //   const interactions = [];
  //   for (const record of allRecords) {
  //     const locus1 = binToLocus(record.bin1);
  //     const locus2 = binToLocus(record.bin2);
  //     if (locus1 && locus2) {
  //       interactions.push(new GenomeInteraction(locus1, locus2, record.counts));
  //     }
  //   }
  //   return interactions;

  //   function binToLocus(bin) {
  //     const absStart = bin * binSize;
  //     const absEnd = (bin + 1) * binSize;
  //     return genome.getLociInInterval(absStart, absEnd)[0];
  //   }
  // }

  function handle() {
    let data = getData();

    return data;
  }

  return handle();
}

export default GetHicData;
