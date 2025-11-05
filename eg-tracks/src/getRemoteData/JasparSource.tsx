import BigSourceWorkerGmod from "./BigSourceWorkerGmod";
const MAX_BASES_PER_PIXEL = 2; // The higher this number, the more zooming out we support

class JasparSource {
  maxBasesPerPixel: number;
  workerSource: BigSourceWorkerGmod;
  constructor(url) {
    this.maxBasesPerPixel = MAX_BASES_PER_PIXEL;

    this.workerSource = new BigSourceWorkerGmod(url);
  }

  getData(region, basesPerPixel, options) {
    if (basesPerPixel > this.maxBasesPerPixel) {
      return Promise.resolve([]);
    } else {
      return this.workerSource.getData(region, basesPerPixel, options);
    }
  }
}

export default JasparSource;
