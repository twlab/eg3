import { TrackConfig } from "./TrackConfig";

import { BackgroundColorConfig } from "../config-menu-components.tsx/ColorConfig";
import HeightConfig from "../config-menu-components.tsx/HeightConfig";
// import MaxMethylAndDepthFilterConfig from "../trackContextMenu/MaxMethylAndDepthFilterConfig";
// import CombineStrandConfig from "../trackContextMenu/CombineStrandConfig";
// import { MethylColorConfig, ReadDepthColorConfig } from "../trackContextMenu/MethylColorConfig";

export class MethylCTrackConfig extends TrackConfig {
  getMenuComponents() {
    return [
      ...super.getMenuComponents(),
      HeightConfig,
      // CombineStrandConfig,
      // MethylColorConfig,
      // MaxMethylAndDepthFilterConfig,
      // ReadDepthColorConfig,
      BackgroundColorConfig,
    ];
  }
}
