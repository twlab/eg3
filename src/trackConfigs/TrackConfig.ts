import LabelConfig from "./LabelConfig";
import { TrackModel, TrackOptions } from "../models/TrackModel";

export class TrackConfig {
  public defaultOptions: TrackOptions;

  constructor(public trackModel: TrackModel) {
    this.trackModel = trackModel;
    this.defaultOptions = {};
  }
  getOptions(): TrackOptions {
    return Object.assign({}, this.defaultOptions, this.trackModel.options);
  }
  setDefaultOptions(defaults: TrackOptions): TrackOptions {
    return Object.assign(this.defaultOptions, defaults);
  }
  getMenuComponents(basesPerPixel?: number) {
    return [LabelConfig];
  }
}
