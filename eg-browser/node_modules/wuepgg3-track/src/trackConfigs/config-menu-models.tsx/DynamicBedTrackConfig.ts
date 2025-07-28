import {
  PrimaryColorConfig,
  SecondaryColorConfig,
  BackgroundColorConfig,
} from "../config-menu-components.tsx/ColorConfig";
import HiddenPixelsConfig from "../config-menu-components.tsx/HiddenPixelsConfig";
import LabelConfig from "../config-menu-components.tsx/LabelConfig";
import MaxRowsConfig from "../config-menu-components.tsx/MaxRowsConfig";
import PlayingConfig from "../config-menu-components.tsx/PlayingConfig";
import RowHeightConfig from "../config-menu-components.tsx/RowHeightConfig";
import SpeedConfig from "../config-menu-components.tsx/SpeedConfig";
import UseDynamicColorsConfig from "../config-menu-components.tsx/UseDynamicColorsConfig";
import { TrackConfig } from "./TrackConfig";

export class DynamicBedTrackConfig extends TrackConfig {
  getMenuComponents() {
    return [
      LabelConfig,
      PlayingConfig,
      SpeedConfig,
      PrimaryColorConfig,
      SecondaryColorConfig,
      BackgroundColorConfig,
      UseDynamicColorsConfig,
      RowHeightConfig,
      MaxRowsConfig,
      HiddenPixelsConfig,
    ];
  }
}
