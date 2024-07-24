import { TabixIndexedFile } from "@gmod/tabix";
import { RemoteFile } from "generic-filehandle";

const worker = new Worker(new URL("./fetchWorker.ts", import.meta.url), {
  type: "module",
});

//epgg-test.wustl.edu/d/mm10/mm10_cpgIslands.bed.gz
//This will get bed data .gz and add a .tbi if there url with tbi it will fail
//to Do: make a check if url has .tbi
function GetTabixData(url, chr, start, end) {
  const fetch = window.fetch.bind(window);
  let tabix = new TabixIndexedFile({
    filehandle: new RemoteFile(url, { fetch }),
    tbiFilehandle: new RemoteFile(url + ".tbi", {
      fetch,
    }),
  });
  function ensureMaxListLength<T>(list: T[], limit: number): T[] {
    if (list.length <= limit) {
      return list;
    }

    const selectedItems: T[] = [];
    for (let i = 0; i < limit; i++) {
      const fractionIterated = i / limit;
      const selectedIndex = Math.ceil(fractionIterated * list.length);
      selectedItems.push(list[selectedIndex]);
    }
    return selectedItems;
  }

  async function getData(loci, options) {
    // let promises = loci.map(this.getDataForLocus);
    const promises = loci.map((locus) => {
      // graph container uses this source directly w/o initial track, so options is null
      let chrom =
        options && options.ensemblStyle
          ? locus.chr.replace("chr", "")
          : locus.chr;
      if (chrom === "M") {
        chrom = "MT";
      }

      return getDataForLocus(chrom, locus.start, locus.end);
    });

    const dataForEachLocus = await Promise.all(promises);
    return dataForEachLocus;
  }

  /**
   * Gets data for a single chromosome interval.
   *
   * @param {string} chr - genome coordinates
   * @param {number} start - genome coordinates
   * @param {stnumberring} end - genome coordinates
   * @return {Promise<BedRecord[]>} Promise for the data
   */
  async function getDataForLocus(chr, start, end) {
    // const { chr, start, end } = locus;
    const rawlines: Array<any> = [];
    await tabix.getLines(chr, start, end, (line) => rawlines.push(line));
    let lines;
    if (rawlines.length > 100000) {
      lines = ensureMaxListLength(rawlines, 100000);
    } else {
      lines = rawlines;
    }

    return lines;
  }

  /**
   * @param {string} line - raw string the bed-like file
   */

  function handle() {
    let data = getData([{ chr: chr, end: end, start: start }], {
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

export default GetTabixData;
