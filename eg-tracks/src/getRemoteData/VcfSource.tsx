import _ from "lodash";
import { BlobFile, RemoteFile } from "generic-filehandle";
import { TabixIndexedFile } from "@gmod/tabix";
import VCF from "@gmod/vcf";

const ensembl: Array<string> = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "X",
  "Y",
  "M",
];

class VcfSource {
  header: any;
  vcf: TabixIndexedFile;
  parser: any;
  url: any;
  indexUrl: any;
  private chromNamingCache: boolean | null = null;
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

  private async detectChromosomeNaming(): Promise<boolean | null> {
    if (this.chromNamingCache !== null) {
      return this.chromNamingCache;
    }
    try {
      const names = await this.vcf.getReferenceSequenceNames();
      const firstChrom = names[0];
      if (!firstChrom) {
        this.chromNamingCache = false;
        return false;
      }
      this.chromNamingCache = ensembl.includes(firstChrom);
      return this.chromNamingCache;
    } catch (error) {
      console.error(
        "Error detecting chromosome naming. Check URL and file format.",
      );
      return null;
    }
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
    const isEnsembl =
      options?.ensemblStyle ?? (await this.detectChromosomeNaming());
    const promises = region.map((locus) =>
      this._getDataInLocus(locus, isEnsembl),
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

  async _getDataInLocus(locus, isEnsembl) {
    const variants: any = [];
    let chrom = isEnsembl ? locus.chr.replace("chr", "") : locus.chr;
    if (chrom === "M") {
      chrom = "MT";
    }
    //vcf is 1 based
    // -1 compensation happened in Vcf feature constructor
    await this.vcf.getLines(chrom, locus.start + 1, locus.end, (line) => {
      const variant = this.parser.parseLine(line);
      if (isEnsembl) {
        variant.CHROM = locus.chr;
      }
      const samples = variant.SAMPLES;
      const desc = Object.getOwnPropertyDescriptor(variant, "SAMPLES");

      // If it's already enumerable, just push the object.
      if (desc && desc.enumerable) {
        variants.push(variant);
        return;
      }

      // Otherwise try to define an enumerable property; if the property is
      // non-configurable this will throw, so fall back to a shallow copy.
      try {
        if (!desc || desc.configurable) {
          Object.defineProperty(variant, "SAMPLES", {
            value: samples,
            enumerable: true,
            writable: true,
            configurable: true,
          });
          variants.push(variant);
        } else {
          // Non-configurable and non-enumerable: create a shallow copy
          // so we can expose SAMPLES as an own enumerable property.
          variants.push(Object.assign({}, variant, { SAMPLES: samples }));
        }
      } catch (e) {
        // Defensive fallback: shallow copy if defineProperty fails.
        variants.push(Object.assign({}, variant, { SAMPLES: samples }));
      }
    });
    return variants;
  }
}

export default VcfSource;
