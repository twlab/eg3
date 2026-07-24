import { inflate } from "pako";
import { decode } from "@msgpack/msgpack";
import BrowserLocalFile from "./io/browserLocalFile";
import RemoteFile from "./io/remoteFile";

const HEADER_SIZE = 64000;

class G3dFile {
  config: any;
  meta: any;
  file: any;
  url: any;
  remote: boolean | undefined;
  headerReady: any;
  constructor(config) {
    this.config = config;
    this.meta = null;

    if (config.blob) {
      this.file = new BrowserLocalFile(config.blob);
    } else {
      this.url = config.url;
      if (this.url.startsWith("http://") || this.url.startsWith("https://")) {
        this.remote = true;
        const remoteFile = new RemoteFile(config);
        this.file = remoteFile;
      } else {
        throw Error("Arguments must include blob, or url");
      }
    }
  }

  async initHeader() {
    if (this.headerReady) {
      return;
    } else {
      await this.readHeader();
      this.headerReady = true;
    }
  }

  async getMetaData() {
    await this.initHeader();
    return this.meta;
  }

  async readHeader() {
    const response = await this.file.read(0, HEADER_SIZE);

    if (!response) {
      return undefined;
    }

    const buffer = new Uint8Array(response);
    const size = this.getPackSize(buffer);
    const newBuffer = buffer.slice(0, size);
    const header: any = decode(newBuffer);

    const magic = header.magic;
    const genome = header.genome;
    const version = header.version;
    const resolutions = header.resolutions;
    const name = header.name;
    const offsets = header.offsets;

    // Meta data for the g3d file
    this.meta = {
      magic,
      genome,
      version,
      resolutions,
      name,
      offsets,
    };
  }

  getPackSize(buffer) {
    let i = buffer.length;
    for (; i--; i >= 0) {
      if (buffer[i] !== 0x00) {
        return i + 1;
      }
    }
    return i;
  }

  async readData(resolution = 200000, haplotype = "", chrom = "") {
    await this.initHeader();
    const resdata = this.meta.offsets[resolution];
    if (!resdata) {
      return null;
    }

    // Two on-disk offsets schemas exist:
    //  - Flat (newer files): offsets[resolution] = { offset, size } — a single
    //    block that already decodes to g3dParser's { hap: { chrom: {...} } }.
    //  - Nested (version 1 files): offsets[resolution] = { chrom: { offset, size } }
    //    — one block per chromosome, each decoding to a bin map of atom records.
    // Detect by whether the entry itself carries a numeric offset/size.
    const isFlat =
      typeof resdata.offset === "number" && typeof resdata.size === "number";

    if (isFlat) {
      const response = await this.file.read(resdata.offset, resdata.size);
      const buffer = new Uint8Array(response);
      return decode(inflate(buffer));
    }

    // Nested (v1): read each chromosome's block, then reshape into the flat
    // { hap: { chrom: { start, x, y, z } } } structure g3dParser consumes.
    const chroms = chrom ? [chrom] : Object.keys(resdata);
    const blocks = await Promise.all(
      chroms.map(async (c) => {
        const entry = resdata[c];
        if (!entry || typeof entry.offset !== "number") {
          return null;
        }
        const response = await this.file.read(entry.offset, entry.size);
        const buffer = new Uint8Array(response);
        return decode(inflate(buffer));
      }),
    );
    return this.reshapeV1Blocks(blocks, haplotype);
  }

  /**
   * Reshape version-1 g3d blocks into g3dParser's expected structure.
   * Each block is a bin map { binKey: [ [chrom, start, end, x, y, z, hap], ... ] }.
   * Output: { hap: { chrom: { start: number[], x: number[], y: number[], z: number[] } } }
   * with each chromosome's atoms sorted by genomic start so the polymer chain
   * connects in order.
   */
  reshapeV1Blocks(blocks: any[], haplotype = "") {
    const data: any = {};
    for (const decoded of blocks) {
      if (!decoded) {
        continue;
      }
      for (const binKey of Object.keys(decoded)) {
        for (const rec of decoded[binKey]) {
          const recChrom = rec[0];
          const start = rec[1];
          const x = rec[3];
          const y = rec[4];
          const z = rec[5];
          const hap = rec[6];
          if (haplotype && hap !== haplotype) {
            continue;
          }
          if (!data[hap]) {
            data[hap] = {};
          }
          if (!data[hap][recChrom]) {
            data[hap][recChrom] = { start: [], x: [], y: [], z: [] };
          }
          data[hap][recChrom].start.push(start);
          data[hap][recChrom].x.push(x);
          data[hap][recChrom].y.push(y);
          data[hap][recChrom].z.push(z);
        }
      }
    }
    for (const hap of Object.keys(data)) {
      for (const c of Object.keys(data[hap])) {
        const d = data[hap][c];
        const order = d.start
          .map((_: number, i: number) => i)
          .sort((a: number, b: number) => d.start[a] - d.start[b]);
        data[hap][c] = {
          start: order.map((i: number) => d.start[i]),
          x: order.map((i: number) => d.x[i]),
          y: order.map((i: number) => d.y[i]),
          z: order.map((i: number) => d.z[i]),
        };
      }
    }
    return data;
  }
}

export default G3dFile;
