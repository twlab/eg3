import { BamFile } from "@gmod/bam";
import { BlobFile } from "generic-filehandle";

const CORS_PROXY = "https://epigenome.wustl.edu/cors";

function proxiedUrl(url: string): string {
  return `${CORS_PROXY}/${url.replace(/^https?:\/\//, "")}`;
}

/**
 * Daofeng switched to use @gmod/bam instead
 */

class BamSource {
  bam: any;
  header: any;
  private url: any;
  private usingProxy: boolean = false;

  constructor(param) {
    this.url = param;
    this.bam = null;
    this.usingProxy = false;
    if (typeof param === "string") {
      this.bam = new BamFile({
        bamUrl: param,
        baiUrl: param + ".bai",
      });
    } else {
      const baiFilehandle = new BlobFile(
        param.filter((f) => f.name.endsWith(".bai"))[0],
      );
      const bamFilehandle = new BlobFile(
        param.filter((f) => !f.name.endsWith(".bai"))[0],
      );
      this.bam = new BamFile({
        bamFilehandle,
        baiFilehandle,
      });
    }
    this.header = null;
  }

  private switchToProxy() {
    if (typeof this.url !== "string") return;
    this.usingProxy = true;
    this.header = null;
    this.bam = new BamFile({
      bamUrl: proxiedUrl(this.url),
      baiUrl: proxiedUrl(this.url + ".bai"),
    });
  }

  async getData(locusArr, basesPerPixel, options = {}) {
    const fetchData = async () => {
      if (!this.header) {
        this.header = await this.bam.getHeader();
      }
      const promises = locusArr.map((locus) =>
        this.bam.getRecordsForRange(locus.chr, locus.start, locus.end),
      );
      const dataForEachSegment = await Promise.all(promises);

      // Return one group per locus carrying the locus chr once, instead of
      // stamping chr onto every record. The chr is reattached when formatting.
      return locusArr.map((locus, index) => ({
        chr: locus.chr,
        data: dataForEachSegment[index].map((r: any) =>
          Object.assign(r, {
            ref: this.bam.indexToChr[r.get("seq_id")].refName,
          }),
        ),
      }));
    };

    try {
      return await fetchData();
    } catch (error) {
      if (!this.usingProxy) {
        this.switchToProxy();
        return await fetchData();
      }
      throw error;
    }
  }
}

export default BamSource;
