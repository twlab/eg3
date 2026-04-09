
import { BigWig } from "@gmod/bbi";



/**
 * Reads and gets data from bigwig or bigbed files hosted remotely using @gmod/bbi library
 *
 * @author Daofeng Li
 */
class BigSourceWorkerGmod {
  /**
   *
   * @param {string} url - the URL from which to fetch data
   */
  constructor(url) {

    this.url = url;
    this.bw = new BigWig({ url });
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

    const promises = loci.map((locus) => {
      let chrom = options.ensemblStyle ? locus.chr.replace("chr", "") : locus.chr;
      if (chrom === "M") {
        chrom = "MT";
      }

      return this.bw.getFeatures(chrom, locus.start, locus.end);
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
