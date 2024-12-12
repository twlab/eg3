import ArrayAggregateConfig from "../config-menu-components.tsx/ArrayAggregateConfig";
import {
  PrimaryColorConfig,
  BackgroundColorConfig,
} from "../config-menu-components.tsx/ColorConfig";
import HeightConfig from "../config-menu-components.tsx/HeightConfig";
import LabelConfig from "../config-menu-components.tsx/LabelConfig";
import PlayingConfig from "../config-menu-components.tsx/PlayingConfig";
import SpeedConfig from "../config-menu-components.tsx/SpeedConfig";
import UseDynamicColorsConfig from "../config-menu-components.tsx/UseDynamicColorsConfig";
import { TrackConfig } from "./TrackConfig";

const VALUE_COLUMN_INDEX = 3;

export class DynamicBedGraphTrackConfig extends TrackConfig {
  getMenuComponents() {
    const items = [
      LabelConfig,
      PlayingConfig,
      SpeedConfig,
      HeightConfig,
      ArrayAggregateConfig,
      PrimaryColorConfig,
      UseDynamicColorsConfig,
      BackgroundColorConfig,
    ];

    return items;
  }
}
