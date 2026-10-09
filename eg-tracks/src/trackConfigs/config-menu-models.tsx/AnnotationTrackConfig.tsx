import { TrackConfig } from "./TrackConfig";
import { ANNOTATION_DEFAULT_OPTIONS as DEFAULT_OPTIONS } from "./defaultOptions";

export { DEFAULT_OPTIONS };
import { AnnotationDisplayModeConfig } from "../config-menu-components.tsx/DisplayModeConfig";
import {
  PrimaryColorConfig,
  SecondaryColorConfig,
  BackgroundColorConfig,
} from "../config-menu-components.tsx/ColorConfig";
import HeightConfig from "../config-menu-components.tsx/HeightConfig";
import MaxRowsConfig from "../config-menu-components.tsx/MaxRowsConfig";

import { AnnotationDisplayModes } from "./DisplayModes";
import TrackModel from "../../models/TrackModel";

export class AnnotationTrackConfig extends TrackConfig {
  constructor(trackModel: TrackModel) {
    super(trackModel);

    this.setDefaultOptions(DEFAULT_OPTIONS);
  }

  getMenuComponents() {
    const items = [...super.getMenuComponents(), AnnotationDisplayModeConfig];

    if (
      this.getOptions().displayMode === AnnotationDisplayModes.DENSITY ||
      this.getOptions().displayMode === "auto"
    ) {
      items.push(HeightConfig);
    } else {
      // Assume FULL display mode
      items.push(MaxRowsConfig);
    }

    items.push(PrimaryColorConfig, SecondaryColorConfig, BackgroundColorConfig);
    return items;
  }
}
