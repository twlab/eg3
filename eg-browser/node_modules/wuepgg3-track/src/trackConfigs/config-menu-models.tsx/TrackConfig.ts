import LabelConfig from "../config-menu-components.tsx/LabelConfig";
import { TrackModel, TrackOptions } from "../../models/TrackModel";

export class TrackConfig {
  isImageTrack() {
    throw new Error("Method not implemented.");
  }
  isBigwigTrack() {
    throw new Error("Method not implemented.");
  }
  public defaultOptions: TrackOptions;

  constructor(public trackModel: TrackModel) {
    this.trackModel = trackModel;
    this.defaultOptions = {};
  }

  isHicTrack(): boolean {
    return this.trackModel.type === "hic";
  }

  getOptions(): TrackOptions {
    return Object.assign({}, this.defaultOptions, this.trackModel.options);
  }
  setDefaultOptions(defaults: TrackOptions): TrackOptions {
    return Object.assign(this.defaultOptions, defaults);
  }
  getMenuComponents(): any {
    return [LabelConfig];
  }
}
