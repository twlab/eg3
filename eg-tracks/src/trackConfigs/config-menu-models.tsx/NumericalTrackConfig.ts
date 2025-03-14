import { TrackConfig } from "./TrackConfig";
import { DEFAULT_OPTIONS } from "../../components/GenomeView/TrackComponents/commonComponents/numerical/NumericalTrack";
import { NumericalDisplayModeConfig } from "../config-menu-components.tsx/DisplayModeConfig";
import {
  PrimaryColorConfig,
  SecondaryColorConfig,
  BackgroundColorConfig,
} from "../config-menu-components.tsx/ColorConfig";
import HeightConfig from "../config-menu-components.tsx/HeightConfig";
import YscaleConfig from "../config-menu-components.tsx/YscaleConfig";

import AggregateConfig from "./AggregateConfig";
import SmoothConfig from "../config-menu-components.tsx/SmoothConfig";
import EnsemblStyleConfig from "../config-menu-components.tsx/EnsemblStyleConfig";

export class NumericalTrackConfig extends TrackConfig {
  getMenuComponents() {
    return [
      ...super.getMenuComponents(),
      NumericalDisplayModeConfig,
      HeightConfig,
      YscaleConfig,
      AggregateConfig,
      SmoothConfig,
      PrimaryColorConfig,
      SecondaryColorConfig,
      BackgroundColorConfig,
      EnsemblStyleConfig,
    ];
  }
}
