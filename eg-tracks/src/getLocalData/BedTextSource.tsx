import _ from "lodash";

import TextSource from "./localTextSource";
import BinIndexer from "../models/BinIndexer";
/**
 * @author Daofeng Li
 * get data from TextSource, index it and return by region querying
 */

class BedTextSource {
  source: TextSource;
  textData: any;
  indexer: any;
  ready: boolean;
  constructor(config) {
    this.source = new TextSource(config);
    this.textData = null;
    this.indexer = null;
    this.ready = false;
  }

  convertToBedRecord(item) {
    const record = {
      chr: item[0],
      start: Number.parseInt(item[1], 10),
      end: Number.parseInt(item[2], 10),
    };

    for (let i = 3; i < item.length; i++) {
      record[i] = item[i];
    }
    return record;
  }

  async initSource() {
    if (!this.textData) {
      this.textData = await this.source.init();
    }
  }

  initIndex() {
    this.indexer = new BinIndexer(this.textData.data, this.convertToBedRecord);
  }

  async init() {
    await this.initSource();
    this.initIndex();
    this.indexer.init();
    this.ready = true;
  }

  async getData(loci) {
    if (!this.ready) {
      await this.init();
    }

    const data = loci.map((locus) =>
      this.indexer.get(locus.chr, locus.start, locus.end)
    );
    return _.flatten(data);
  }
}

export default BedTextSource;
