import { TrackConfig } from "./TrackConfig";
import { DEFAULT_OPTIONS } from "../../components/GenomeView/commonComponents/numerical/NumericalTrack";
import { NumericalDisplayModeConfig } from "../config-menu-components.tsx/DisplayModeConfig";
import {
  PrimaryColorConfig,
  SecondaryColorConfig,
  BackgroundColorConfig,
} from "../config-menu-components.tsx/ColorConfig";
import HeightConfig from "../config-menu-components.tsx/HeightConfig";
// import YscaleConfig from "../trackContextMenu/YscaleConfig";
import TrackModel from "../../models/TrackModel";
// import AggregateConfig from "../trackContextMenu/AggregateConfig";
// import SmoothConfig from "../trackContextMenu/SmoothConfig";
// import EnsemblStyleConfig from "components/trackContextMenu/EnsemblStyleConfig";

export class NumericalTrackConfig extends TrackConfig {
  constructor(trackModel: TrackModel) {
    super(trackModel);
    this.setDefaultOptions(DEFAULT_OPTIONS);
  }

  getMenuComponents() {
    return [
      ...super.getMenuComponents(),
      NumericalDisplayModeConfig,
      HeightConfig,
      // YscaleConfig,
      // AggregateConfig,
      // SmoothConfig,
      PrimaryColorConfig,
      SecondaryColorConfig,
      BackgroundColorConfig,
      // EnsemblStyleConfig,
    ];
  }
}
