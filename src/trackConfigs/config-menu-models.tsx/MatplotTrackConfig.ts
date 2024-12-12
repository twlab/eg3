import { DEFAULT_OPTIONS } from "../../components/GenomeView/TrackComponents/MatplotTrack";
import { TrackConfig } from "./TrackConfig";
import HeightConfig from "../config-menu-components.tsx/HeightConfig";

import { BackgroundColorConfig } from "../config-menu-components.tsx/ColorConfig";
import LineWidthConfig from "../config-menu-components.tsx/LineWidthConfig";
import TrackModel from "../../models/TrackModel";
import AggregateConfig from "./AggregateConfig";
import YscaleConfig from "../config-menu-components.tsx/YscaleConfig";
import SmoothConfig from "../config-menu-components.tsx/SmoothConfig";

export class MatplotTrackConfig extends TrackConfig {
  constructor(trackModel: TrackModel) {
    super(trackModel);
    this.setDefaultOptions(DEFAULT_OPTIONS);
  }

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
