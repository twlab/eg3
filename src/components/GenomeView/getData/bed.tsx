import { useEffect, useState } from "react";
import makeBamIndex from "../../../vendor/igv/BamIndex";

import unbgzf from "../../../vendor/igv/bgzf";
import Zlib from "../../../vendor/zlib_and_gzip";
const MAX_GZIP_BLOCK_SIZE = 1 << 16;
const DATA_FILTER_LIMIT_LENGTH = 300000;
//epgg-test.wustl.edu/d/mm10/mm10_cpgIslands.bed.gz
function GetBedData() {
  const [index, setIndex] = useState<any>();
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
  async function fetchGenomeData(url: any, range?: any) {
    // TO - IF STRAND OVERFLOW THEN NEED TO SET TO MAX WIDTH OR 0 to NOT AFFECT THE LOGIC.

    let rawData = await fetch(`${url}`, {
      method: "GET",
      headers: {
        range: `bytes=${94007}-${159543}`,
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    const buffer = await rawData.arrayBuffer();
    let decompressor = await new Zlib.Gunzip(new Uint8Array(buffer!)); // eslint-disable-line no-restricted-globals
    let decompressed = await decompressor.decompress();
    return makeBamIndex(decompressed.buffer, true);
  }

  function parseAndFilterFeatures(buffer, chromosome, start, end) {
    const text = new TextDecoder("utf-8").decode(buffer);
    let lines;
    if (end - start > DATA_FILTER_LIMIT_LENGTH) {
      lines = ensureMaxListLength(text.split("\n"), 100000);
    } else {
      lines = text.split("\n");
    }
    let features: Array<any> = [];
    for (let line of lines) {
      const columns = line.split("\t");
      if (columns.length < 3) {
        continue;
      }
      if (columns[0] !== chromosome) {
        continue;
      }

      let feature = {
        chr: columns[0],
        start: Number.parseInt(columns[1], 10),
        end: Number.parseInt(columns[2], 10),
        n: columns.length, // number of columns in initial data row
      };

      if (feature.start > end) {
        // This is correct as long as the features are sorted by start
        break;
      }
      if (feature.end >= start && feature.start <= end) {
        for (let i = 3; i < columns.length; i++) {
          // Copy the rest of the columns to the feature
          feature[i] = columns[i];
        }
        features.push(feature);
      }
    }

    return features;
  }

  useEffect(() => {
    async function getData() {
      let data = await fetchGenomeData(
        "https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands.bed.gz.tbi"
      );
      console.log(data);
    }
    getData();
  }, []);

  useEffect(() => {
    async function getData() {
      console.log(index);
      console.log("it trigger");
    }
    getData();
  }, [index]);

  return <div>testing</div>;
}

export default GetBedData;
