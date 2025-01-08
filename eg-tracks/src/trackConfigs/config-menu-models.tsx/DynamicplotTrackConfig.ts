import {
  PrimaryColorConfig,
  BackgroundColorConfig,
} from "../config-menu-components.tsx/ColorConfig";
import HeightConfig from "../config-menu-components.tsx/HeightConfig";
import PlayingConfig from "../config-menu-components.tsx/PlayingConfig";
import SmoothConfig from "../config-menu-components.tsx/SmoothConfig";
import SpeedConfig from "../config-menu-components.tsx/SpeedConfig";
import UseDynamicColorsConfig from "../config-menu-components.tsx/UseDynamicColorsConfig";
import YscaleConfig from "../config-menu-components.tsx/YscaleConfig";
import AggregateConfig from "./AggregateConfig";

import { TrackConfig } from "./TrackConfig";

export class DynamicplotTrackConfig extends TrackConfig {
  getMenuComponents() {
    return [
      ...super.getMenuComponents(),
      HeightConfig,
      PlayingConfig,
      SpeedConfig,
      YscaleConfig,
      AggregateConfig,
      SmoothConfig,
      PrimaryColorConfig,
      UseDynamicColorsConfig,
      BackgroundColorConfig,
    ];
  }
}
