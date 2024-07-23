//src/Worker/worker.ts

import _ from "lodash";

self.onmessage = (event) => {
  console.log(event.data);
  function ensureMaxListLength(list, limit) {
    if (list.length <= limit) {
      return list;
    }

    const selectedItems: Array<any> = [];
    for (let i = 0; i < limit; i++) {
      const fractionIterated = i / limit;
      const selectedIndex = Math.ceil(fractionIterated * list.length);
      selectedItems.push(list[selectedIndex]);
    }
    return selectedItems;
  }

  /**
   * Prepares to fetch data from a bed file located at the input url.  Assumes the index is located at the same url,
   * plus a file extension of ".tbi".  This method will request and store the tabix index from this url immediately.
   *
   * @param {string} url - the url of the bed-like file to fetch.
   */

  /**
   * Gets data for a list of chromosome intervals.
   *
   * @param {ChromosomeInterval[]} loci - locations for which to fetch data
   * @return {Promise<BedRecord[]>} Promise for the data
   */
  async function getData(loci) {
    // let promises = loci.map(getDataForLocus);
    let options = event.data.options;
    const dataForEachLocus = getDataForLocus(event.data.rawData);
    if (options && options.ensemblStyle) {
      loci.forEach((locus, index) => {
        dataForEachLocus[index].forEach((f) => (f.chr = locus.chr));
      });
    }
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
  function getDataForLocus(rawlines) {
    // const { chr, start, end } = locus;

    let lines;
    if (rawlines.length > 100000) {
      lines = ensureMaxListLength(rawlines, 100000);
    } else {
      lines = rawlines;
    }
    console.log(lines);
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
  console.log(getData(event.data.loci));
  postMessage("drawDataArr");
};
