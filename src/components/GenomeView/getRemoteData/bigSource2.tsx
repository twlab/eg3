import _ from "lodash";
import { BigWig } from "@gmod/bbi";
import { RemoteFile } from "generic-filehandle";

import fetch from "isomorphic-fetch";

function getBigData(loci, options, url) {
  let bw = new BigWig({
    filehandle: new RemoteFile(url, { fetch }),
  });
  async function getData(loci, options) {
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

  function handle() {
    let data = getData(loci, options);

    return data;
  }

  return handle();
}

export default getBigData;
