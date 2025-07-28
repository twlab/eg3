import HideMinimalItemsConfig from "../config-menu-components.tsx/HideMinimalItemsConfig";
import { AnnotationTrackConfig } from "./AnnotationTrackConfig";

import HiddenPixelsConfig from "../config-menu-components.tsx/HiddenPixelsConfig";
import ItalicizeTextConfig from "../config-menu-components.tsx/ItalicizeTextConfig";

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
