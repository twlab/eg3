import { TrackConfig } from "./TrackConfig";
import { BackgroundColorConfig } from "../config-menu-components.tsx/ColorConfig";
import HeightConfig from "../config-menu-components.tsx/HeightConfig";
import MaxMethylAndDepthFilterConfig from "../config-menu-components.tsx/MaxMethylAndDepthFilterConfig";
import CombineStrandConfig from "../config-menu-components.tsx/CombineStrandConfig";
import MethylColorConfig from "../config-menu-components.tsx/MethylColorConfig";
import ReadDepthColorConfig from "../config-menu-components.tsx/MethylColorConfig";

export class MethylCTrackConfig extends TrackConfig {
  getMenuComponents() {
    return [
      ...super.getMenuComponents(),
      HeightConfig,
      CombineStrandConfig,
      MethylColorConfig,
      MaxMethylAndDepthFilterConfig,
      ReadDepthColorConfig,
      BackgroundColorConfig,
    ];
  }
}
