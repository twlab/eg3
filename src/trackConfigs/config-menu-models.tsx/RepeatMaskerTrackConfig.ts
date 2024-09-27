import { TrackConfig } from "./TrackConfig";

import { DEFAULT_OPTIONS } from "../../components/GenomeView/RepeatMaskerTrack";

import { BackgroundColorConfig } from "../config-menu-components.tsx/ColorConfig";
import { AnnotationDisplayModeConfig } from "../config-menu-components.tsx/DisplayModeConfig";
import HeightConfig from "../config-menu-components.tsx/HeightConfig";

import TrackModel from "../../models/TrackModel";
import HiddenPixelsConfig from "../config-menu-components.tsx/HiddenPixelsConfig";

export class RepeatMaskerTrackConfig extends TrackConfig {
  constructor(trackModel: TrackModel) {
    super(trackModel);
    this.setDefaultOptions(DEFAULT_OPTIONS);
  }

  getMenuComponents() {
    return [
      ...super.getMenuComponents(),
      AnnotationDisplayModeConfig,
      HeightConfig,
      BackgroundColorConfig,
      HiddenPixelsConfig,
    ];
  }
}
