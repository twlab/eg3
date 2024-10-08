import { TrackConfig } from "./TrackConfig";
import LabelConfig from "../config-menu-components.tsx/LabelConfig";
import HeightConfig from "../config-menu-components.tsx/HeightConfig";
// import YscaleConfig from "components/trackContextMenu/YscaleConfig";
import TrackModel from "../../models/TrackModel";
import { BigWigTrackConfig } from "./BigWigTrackConfig";
import {
  DEFAULT_OPTIONS,
  MAX_PIXELS_PER_BASE_NUMERIC,
} from "../../components/GenomeView/DynseqComponents/DynseqTrackComputation";
import { BackgroundColorConfig } from "../config-menu-components.tsx/ColorConfig";

export class DynseqTrackConfig extends TrackConfig {
  private bigWigTrackConfig: BigWigTrackConfig;
  constructor(trackModel: TrackModel) {
    super(trackModel);
    this.bigWigTrackConfig = new BigWigTrackConfig(trackModel);
    this.setDefaultOptions({ ...DEFAULT_OPTIONS, zoomLevel: "auto" });
  }

  getMenuComponents(basesPerPixel: number = 1) {
    if (basesPerPixel <= MAX_PIXELS_PER_BASE_NUMERIC) {
      // YscaleConfig;
      return [LabelConfig, HeightConfig, BackgroundColorConfig];
    } else {
      return this.bigWigTrackConfig.getMenuComponents();
    }
  }
}
