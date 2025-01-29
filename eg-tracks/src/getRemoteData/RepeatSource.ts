const MAX_BASES_PER_PIXEL = 1000;
import BigSourceWorkerGmod from "./BigSourceWorkerGmod";

class RepeatSource {
  maxBasesPerPixel: any;
  workerSource: BigSourceWorkerGmod;
  constructor(url) {
    this.maxBasesPerPixel = MAX_BASES_PER_PIXEL;
    this.workerSource = new BigSourceWorkerGmod(url);
  }

  getData(region, basesPerPixel, options) {
    if (basesPerPixel > this.maxBasesPerPixel) {
      return Promise.resolve([]);
    } else {
      return this.workerSource.getData(region, options);
    }
  }
}

export default RepeatSource;
