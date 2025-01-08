import { TrackConfig } from "./TrackConfig";
import HeightConfig from "../config-menu-components.tsx/HeightConfig";

import { BackgroundColorConfig } from "../config-menu-components.tsx/ColorConfig";
import LineWidthConfig from "../config-menu-components.tsx/LineWidthConfig";

import AggregateConfig from "./AggregateConfig";
import YscaleConfig from "../config-menu-components.tsx/YscaleConfig";
import SmoothConfig from "../config-menu-components.tsx/SmoothConfig";

export class MatplotTrackConfig extends TrackConfig {
  getMenuComponents() {
    return [
      ...super.getMenuComponents(),
      HeightConfig,
      YscaleConfig,
      AggregateConfig,
      LineWidthConfig,
      SmoothConfig,
      BackgroundColorConfig,
    ];
  }
}
