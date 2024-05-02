import { BigWig } from "@gmod/bbi";
import { RemoteFile } from "generic-filehandle";

/**
 * Reads and gets data from bigwig or bigbed files hosted remotely using @gmod/bbi library
 *
 * @author Daofeng Li
 * @author Chanrung Seng
 */
function GetBigData(url, chr, start, end) {
  async function getData(loci, options) {
    const fetch = window.fetch.bind(window);
    const promises = loci.map((locus) => {
      let chrom = options.ensemblStyle
        ? locus.chr.replace("chr", "")
        : locus.chr;
      if (chrom === "M") {
        chrom = "MT";
      }

      let bw = new BigWig({
        filehandle: new RemoteFile(url, { fetch }),
      });

      return bw.getFeatures(chrom, locus.start, locus.end);
    });
    const dataForEachLocus = await Promise.all(promises);
    loci.forEach((locus, index) => {
      dataForEachLocus[index].forEach((f) => (f.chr = locus.chr));
    });
    return dataForEachLocus;
  }

  async function handle() {
    let data = await getData([{ chr: chr, end: end, start: start }], {
      displayMode: "full",
      color: "blue",
      color2: "red",
      maxRows: 20,
      height: 40,
      hideMinimalItems: false,
      sortItems: false,
      label: "",
    });

    return data;
  }

  return handle();
}

export default GetBigData;
