import _ from "lodash";
import { TabixIndexedFile } from "@gmod/tabix";
import { RemoteFile } from "generic-filehandle";
import fetch from "isomorphic-fetch";

// import ChromosomeInterval from "../../model/interval/ChromosomeInterval";

/**
 * A DataSource that gets BedRecords from remote bed files.  Designed to run in webworker context.  Only indexed bed
 * files supported.
 *
 * @author Daofeng Li based on Silas's version
 */

self.onmessage = async (event: MessageEvent) => {
  let dataLimit = 100000;
  let url = event.data.records[0].url;

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
    // if (options && options.ensemblStyle) {
    //   loci.forEach((locus, index) => {
    //     dataForEachLocus[index].forEach((f) => (f.chr = locus.chr));
    //   });
    // }
    return _.flatten(dataForEachLocus);
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
    if (rawlines.length > dataLimit) {
      lines = ensureMaxListLength(rawlines, dataLimit);
    } else {
      lines = rawlines;
    }

    return lines.map(_parseLine);
  }

  /**
   * @param {string} line - raw string the bed-like file
   */
  function _parseLine(line) {
    const columns = line.split("\t");
    if (columns.length < 3) {
      return;
    }
    let feature = {
      chr: columns[0],
      start: Number.parseInt(columns[1], 10),
      end: Number.parseInt(columns[2], 10),
      n: columns.length, // number of columns in initial data row
    };
    for (let i = 3; i < columns.length; i++) {
      // Copy the rest of the columns to the feature
      feature[i] = columns[i];
    }
    return feature;
  }
  let result = await getData(event.data.records, {
    height: 40,
    isCombineStrands: false,
    colorsForContext: {
      CG: {
        color: "rgb(100,139,216)",
        background: "#d9d9d9",
      },
      CHG: {
        color: "rgb(255,148,77)",
        background: "#ffe0cc",
      },
      CHH: {
        color: "rgb(255,0,255)",
        background: "#ffe5ff",
      },
    },
    depthColor: "#525252",
    depthFilter: 0,
    maxMethyl: 1,
    label: "",
  });

  postMessage(result);
};
