import { TabixIndexedFile } from '@gmod/tabix';
import { RemoteFile } from 'generic-filehandle';

//epgg-test.wustl.edu/d/mm10/mm10_cpgIslands.bed.gz
function GetTabixData(url, chr, start, end) {
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
          ? locus.chr.replace('chr', '')
          : locus.chr;
      if (chrom === 'M') {
        chrom = 'MT';
      }

      return getDataForLocus(chrom, locus.start, locus.end);
    });

    const dataForEachLocus = await Promise.all(promises);
    if (options && options.ensemblStyle) {
      loci.forEach((locus, index) => {
        dataForEachLocus[index].forEach((f) => (f.chr = locus.chr));
      });
    }
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
    const fetch = window.fetch.bind(window);
    let tabix = new TabixIndexedFile({
      filehandle: new RemoteFile(url, { fetch }),
      tbiFilehandle: new RemoteFile(url + '.tbi', {
        fetch,
      }),
    });
    // const { chr, start, end } = locus;
    const rawlines: Array<any> = [];
    await tabix.getLines(chr, start, end, (line) => rawlines.push(line));
    let lines;
    if (rawlines.length > 100000) {
      lines = ensureMaxListLength(rawlines, 100000);
    } else {
      lines = rawlines;
    }
    return lines.map(parseLine);
  }

  /**
   * @param {string} line - raw string the bed-like file
   */
  function parseLine(line) {
    const columns = line.split('\t');
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

  async function handle() {
    let data = await getData([{ chr: chr, end: end, start: start }], {
      displayMode: 'full',
      color: 'blue',
      color2: 'red',
      maxRows: 20,
      height: 40,
      hideMinimalItems: false,
      sortItems: false,
      label: '',
    });
    return data;
  }

  return handle();
}

export default GetTabixData;
