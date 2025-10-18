const MAX_BASES_PER_PIXEL = 1000; // The higher this number, the more zooming out we support
import BigSourceWorker from "./BigSourceWorker"

class RepeatSource {
  maxBasesPerPixel: any;
  workerSource: BigSourceWorker;
  constructor(url) {
    this.maxBasesPerPixel = MAX_BASES_PER_PIXEL;
    this.workerSource = new BigSourceWorker(url);
  }

  getData(region, basesPerPixel, options) {
    if (basesPerPixel > this.maxBasesPerPixel) {
      return Promise.resolve([]);
    } else {
      console.log("HUHUHu")
      return this.workerSource.getData(region, basesPerPixel, options);
    }
  }
}

export default RepeatSource;
