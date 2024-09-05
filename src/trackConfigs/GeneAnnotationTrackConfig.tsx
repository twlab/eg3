import HideMinimalItemsConfig from "./HideMinimalItemsConfig";
import { AnnotationTrackConfig } from "./AnnotationTrackConfig";

import Gene from "../models/Gene";
import TrackModel from "../models/TrackModel";
import HiddenPixelsConfig from "./HiddenPixelsConfig";
import ItalicizeTextConfig from "./ItalicizeTextConfig";

export class GeneAnnotationTrackConfig extends AnnotationTrackConfig {
  constructor(trackModel: TrackModel) {
    super(trackModel);
  }

  formatData(data: any[]) {
    return data.map((record) => new Gene(record));
  }

  getMenuComponents() {
    return [
      ...super.getMenuComponents(),
      ItalicizeTextConfig,
      HiddenPixelsConfig,
      HideMinimalItemsConfig,
    ];
  }
}
