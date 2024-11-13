import { DEFAULT_OPTIONS } from "../../components/GenomeView/TrackComponents/MatplotTrack";
import { TrackConfig } from "./TrackConfig";
import HeightConfig from "../config-menu-components.tsx/HeightConfig";
// import YscaleConfig from '../trackContextMenu/YscaleConfig';
// import AggregateConfig from '../trackContextMenu/AggregateConfig';
// import SmoothConfig from '../trackContextMenu/SmoothConfig';
import { BackgroundColorConfig } from "../config-menu-components.tsx/ColorConfig";
import LineWidthConfig from "../config-menu-components.tsx/LineWidthConfig";
import TrackModel from "../../models/TrackModel";

export class MatplotTrackConfig extends TrackConfig {
  constructor(trackModel: TrackModel) {
    super(trackModel);
    this.setDefaultOptions(DEFAULT_OPTIONS);
  }

  getMenuComponents() {
    return [
      ...super.getMenuComponents(),
      HeightConfig,
      // YscaleConfig,
      // AggregateConfig,
      LineWidthConfig,
      // SmoothConfig,
      BackgroundColorConfig,
    ];
  }
}
