import _ from "lodash";
import { BlobFile, RemoteFile } from "generic-filehandle";
import { TabixIndexedFile } from "@gmod/tabix";
import VCF from "@gmod/vcf";

class VcfSource {
  header: any;
  vcf: TabixIndexedFile;
  parser: any;
  url: any;
  indexUrl: any;
  constructor(url, indexUrl = null) {
    this.url = url;
    this.indexUrl = indexUrl;
    let filehandle, tbiFilehandle;
    if (Array.isArray(url)) {
      filehandle = new BlobFile(url.filter((f) => !f.name.endsWith(".tbi"))[0]);
      tbiFilehandle = new BlobFile(
        url.filter((f) => f.name.endsWith(".tbi"))[0],
      );
    } else {
      filehandle = new RemoteFile(url);
      tbiFilehandle = new RemoteFile(indexUrl ? indexUrl : url + ".tbi");
    }
    this.vcf = new TabixIndexedFile({ filehandle, tbiFilehandle });

    this.header = null;
    this.parser = null;
  }

  /**
   * Fetches data from VCF file for the given regions
   * @param {ChromosomeInterval[]} region - locations for which to fetch data
   * @param {any} options - fetch options including ensemblStyle
   * @return {Promise<any[]>} a Promise for the data
   */
  private async fetchSource(region, options) {
    if (!this.header) {
      this.header = await this.vcf.getHeader();
    }
    if (!this.parser) {
      this.parser = new VCF({ header: this.header });
    }
    const promises = region.map((locus) =>
      this._getDataInLocus(locus, options),
    );
    const dataForEachSegment = await Promise.all(promises);
    const flattened = dataForEachSegment.flat();

    return flattened;
  }

  async getData(region, basesPerPixel, options) {
    try {
      return await this.fetchSource(region, options);
    } catch (error) {
      console.error("Error fetching VCF data, recreating instance:", error);

      // try {
      //   if (typeof window !== "undefined" && "caches" in window) {
      //     const cacheNames = await caches.keys();
      //     await Promise.all(
      //       cacheNames.map((cacheName) => caches.delete(cacheName))
      //     );
      //   }

      //   // recreate the fetch instance and retry once, because it might be a disk cache issue
      //   this.recreateVcfInstance();

      //   return await this.fetchSource(region, options);
      // } catch (error) {
      //   throw error;
      // }
      throw error;
    }
  }

  async _getDataInLocus(locus, options) {
    const variants: any = [];
    let chrom =
      options && options.ensemblStyle
        ? locus.chr.replace("chr", "")
        : locus.chr;
    if (chrom === "M") {
      chrom = "MT";
    }
    //vcf is 1 based
    // -1 compensation happened in Vcf feature constructor
    await this.vcf.getLines(chrom, locus.start + 1, locus.end, (line) => {
      const variant = this.parser.parseLine(line);

      // Set CHROM immediately if ensemblStyle
      if (options && options.ensemblStyle) {
        variant.CHROM = locus.chr;
      }

      variants.push(variant);
    });
    return variants;
  }
}

export default VcfSource;
