import {
  PrimaryColorConfig,
  SecondaryColorConfig,
  BackgroundColorConfig,
} from "../config-menu-components.tsx/ColorConfig";
import { DynamicInteractionDisplayModeConfig } from "../config-menu-components.tsx/DisplayModeConfig";
import HeightConfig from "../config-menu-components.tsx/HeightConfig";
import {
  HicNormalizationConfig,
  BinSizeConfig,
} from "../config-menu-components.tsx/HicDataConfig";
import LabelConfig from "../config-menu-components.tsx/LabelConfig";
import LineWidthConfig from "../config-menu-components.tsx/LineWidthConfig";
import PlayingConfig from "../config-menu-components.tsx/PlayingConfig";
import ScoreConfig from "../config-menu-components.tsx/ScoreConfig";
import SpeedConfig from "../config-menu-components.tsx/SpeedConfig";
import UseDynamicColorsConfig from "../config-menu-components.tsx/UseDynamicColorsConfig";
import { DynamicInteractionDisplayMode } from "./DisplayModes";
import { TrackConfig } from "./TrackConfig";

export class DynamicHicTrackConfig extends TrackConfig {
  getMenuComponents() {
    const items = [
      LabelConfig,
      DynamicInteractionDisplayModeConfig,
      PlayingConfig,
      SpeedConfig,
      HicNormalizationConfig,
      HeightConfig,
      ScoreConfig,
      BinSizeConfig,
      PrimaryColorConfig,
      SecondaryColorConfig,
      UseDynamicColorsConfig,
      BackgroundColorConfig,
    ];
    if (
      this.getOptions().displayMode !== DynamicInteractionDisplayMode.HEATMAP
    ) {
      items.splice(2, 0, LineWidthConfig);
    }

    return items;
  }
}
