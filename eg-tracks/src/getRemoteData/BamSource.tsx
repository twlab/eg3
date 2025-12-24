import { BamFile } from "@gmod/bam";
import { BlobFile } from "generic-filehandle";

/**
 * Daofeng switched to use @gmod/bam instead
 */

class BamSource {
  bam: any;
  header: any;
  constructor(param) {
    this.bam = null;
    // this.bamPromise = new Promise((resolve, reject) => {
    //     bam.makeBam(new bin.URLFetchable(url), new bin.URLFetchable(url + ".bai"), null, (reader, error) => {
    //         if (error) {
    //             reject(error);
    //         } else {
    //             resolve(reader);
    //         }
    //     });
    // });
    if (typeof param === "string") {
      this.bam = new BamFile({
        bamUrl: param,
        baiUrl: param + ".bai",
      });
    } else {
      const baiFilehandle = new BlobFile(
        param.filter((f) => f.name.endsWith(".bai"))[0]
      );
      const bamFilehandle = new BlobFile(
        param.filter((f) => !f.name.endsWith(".bai"))[0]
      );
      this.bam = new BamFile({
        bamFilehandle,
        baiFilehandle,
      });
    }
    // console.log(this.bam);
    this.header = null;
  }

  async getData(locusArr, basesPerPixel, options = {}) {
    // const bamObj = await this.bamPromise;
    // let promises = region.getGenomeIntervals().map(locus => this._getDataInLocus(locus, bamObj));
    if (!this.header) {
      this.header = await this.bam.getHeader();
    }

    const promises = locusArr.map((locus) =>
      this.bam.getRecordsForRange(locus.chr, locus.start, locus.end)
    );

    const dataForEachSegment = await Promise.all(promises);

    const flattened = dataForEachSegment.flat(1);
    const alignments = flattened.map((r) =>
      Object.assign(r, { ref: this.bam.indexToChr[r.get("seq_id")].refName })
    );

    return alignments;
  }
}

export default BamSource;
