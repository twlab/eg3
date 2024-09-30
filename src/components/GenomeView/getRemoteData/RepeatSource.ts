const MAX_BASES_PER_PIXEL = 1000;
import _ from "lodash";
import { BigWig } from "@gmod/bbi";
import { RemoteFile } from "generic-filehandle";

import fetch from "isomorphic-fetch";

function getRepeatSource(loci, options, url, basesPerPixel) {
  let maxBasesPerPixel = MAX_BASES_PER_PIXEL;
  let bw = new BigWig({
    filehandle: new RemoteFile(url, { fetch }),
  });
  async function getData(loci, options) {
    if (basesPerPixel > maxBasesPerPixel) {
      return Promise.resolve([]);
    } else {
      const promises = loci.map((locus) => {
        let chrom = options.ensemblStyle
          ? locus.chr.replace("chr", "")
          : locus.chr;
        if (chrom === "M") {
          chrom = "MT";
        }

        return bw.getFeatures(chrom, locus.start, locus.end);
      });
      const dataForEachLocus = await Promise.all(promises);
      loci.forEach((locus, index) => {
        dataForEachLocus[index].forEach((f) => (f.chr = locus.chr));
      });

      return _.flatten(dataForEachLocus);
    }
  }

  function handle() {
    let data = getData(loci, options);

    return data;
  }

  return handle();
}

export default getRepeatSource;
