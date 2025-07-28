import { TrackConfig } from "./TrackConfig";

import { BackgroundColorConfig } from "../config-menu-components.tsx/ColorConfig";
import { AnnotationDisplayModeConfig } from "../config-menu-components.tsx/DisplayModeConfig";
import HeightConfig from "../config-menu-components.tsx/HeightConfig";

import HiddenPixelsConfig from "../config-menu-components.tsx/HiddenPixelsConfig";

export class RepeatMaskerTrackConfig extends TrackConfig {
  getMenuComponents() {
    return [
      ...super.getMenuComponents(),
      AnnotationDisplayModeConfig,
      HeightConfig,
      BackgroundColorConfig,
      HiddenPixelsConfig,
    ];
  }
}
