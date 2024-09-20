import { TrackConfig } from "./TrackConfig";

import {
  BackgroundColorConfig,
  primaryGenomeColorConfig,
  queryGenomeColorConfig,
} from "../config-menu-components.tsx/ColorConfig";
import HeightConfig from "../config-menu-components.tsx/HeightConfig";

export class GenomeAlignTrackConfig extends TrackConfig {
  getMenuComponents() {
    return [
      ...super.getMenuComponents(),
      HeightConfig,
      primaryGenomeColorConfig,
      queryGenomeColorConfig,
      BackgroundColorConfig,
    ];
  }
}
