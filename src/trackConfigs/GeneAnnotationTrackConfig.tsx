import HideMinimalItemsConfig from "./HideMinimalItemsConfig";
import { AnnotationTrackConfig } from "./AnnotationTrackConfig";

import HiddenPixelsConfig from "./HiddenPixelsConfig";
import ItalicizeTextConfig from "./ItalicizeTextConfig";

export class GeneAnnotationTrackConfig extends AnnotationTrackConfig {
  getMenuComponents() {
    return [
      ...super.getMenuComponents(),
      ItalicizeTextConfig,
      HiddenPixelsConfig,
      HideMinimalItemsConfig,
    ];
  }
}
