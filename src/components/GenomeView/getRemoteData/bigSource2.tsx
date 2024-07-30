import { BigWig } from "@gmod/bbi";
import { RemoteFile } from "generic-filehandle";
import _ from "lodash";
/**
 * Reads and gets data from bigwig or bigbed files hosted remotely using @gmod/bbi library
 *
 * @author Daofeng Li
 * @author Chanrung Seng
 */
function GetBigData(loci, options, url) {
  const fetch = window.fetch.bind(window);
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

export default GetBigData;
