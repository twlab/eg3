import AlwaysDrawLabelConfig from "../config-menu-components.tsx/AlwaysDrawLabelConfig";
import HiddenPixelsConfig from "../config-menu-components.tsx/HiddenPixelsConfig";
import YscaleConfig from "../config-menu-components.tsx/YscaleConfig";
import { AnnotationTrackConfig } from "./AnnotationTrackConfig";

import { AnnotationDisplayModes } from "./DisplayModes";

export class SnpTrackConfig extends AnnotationTrackConfig {
  getMenuComponents() {
    const items = [
      ...super.getMenuComponents(),
      HiddenPixelsConfig,
      AlwaysDrawLabelConfig,
    ];
    if (this.getOptions().displayMode === AnnotationDisplayModes.DENSITY) {
      items.push(YscaleConfig);
    }
    return items;
  }
}
