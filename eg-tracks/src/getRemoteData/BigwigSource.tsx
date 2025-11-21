import { BigWig } from "@gmod/bbi";

import { RemoteFile } from "generic-filehandle2";
import fetch from "isomorphic-fetch";

export class BigwigSource {
  url: any;
  bw: BigWig;
  /**
   *
   * @param {string} url - the URL from which to fetch data
   */
  constructor(url) {
    this.url = url;
    this.bw = new BigWig({
      filehandle: new RemoteFile(url, {
        fetch,
        overrides: {
          cache: "no-store",
        },
      }),
    });
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
    const promises = loci.map((locus) => {
      let chrom = options.ensemblStyle
        ? locus.chr.replace("chr", "")
        : locus.chr;
      if (chrom === "M") {
        chrom = "MT";
      }
      return this.bw.getFeatures(chrom, locus.start, locus.end, options);
    });
    const dataForEachLocus = await Promise.all(promises);

    return dataForEachLocus.flat();
  }
}
