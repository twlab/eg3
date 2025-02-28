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
    const { offset, size } = resdata;
    const response = await this.file.read(offset, size);
    const buffer = new Uint8Array(response);
    const unzipped = inflate(buffer);
    const data = decode(unzipped);
    return data;
  }
}

export default G3dFile;
