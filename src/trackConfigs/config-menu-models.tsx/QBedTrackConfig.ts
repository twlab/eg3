import { DownsamplingChoices } from "@/models/DownsamplingChoices";
import TrackModel from "@/models/TrackModel";
import {
  PrimaryColorConfig,
  SecondaryColorConfig,
  BackgroundColorConfig,
} from "../config-menu-components.tsx/ColorConfig";
import HeightConfig from "../config-menu-components.tsx/HeightConfig";
import YscaleConfig from "../config-menu-components.tsx/YscaleConfig";

import { TrackConfig } from "./TrackConfig";
import LogScaleConfig from "../config-menu-components.tsx/LogScaleConfig";
import HorizontalLineValueConfig from "../config-menu-components.tsx/HorizontalLineValueConfig";
import MarkerSizeConfig from "../config-menu-components.tsx/MarkerSizeConfig";
import OpacitySliderConfig from "../config-menu-components.tsx/OpacitySilderConfig";
import ShowHorizontalLineConfig from "../config-menu-components.tsx/ShowHorizontalLineConfig";

export class QBedTrackConfig extends TrackConfig {
  getMenuComponents() {
    const items = [
      ...super.getMenuComponents(),
      HeightConfig,
      YscaleConfig,
      LogScaleConfig,
      DownsamplingChoices,
      OpacitySliderConfig,
      MarkerSizeConfig,
      PrimaryColorConfig,
      SecondaryColorConfig,
      BackgroundColorConfig,
      ShowHorizontalLineConfig,
    ];
    if (this.getOptions().showHorizontalLine) {
      items.push(HorizontalLineValueConfig);
    }
    return items;
  }
}
