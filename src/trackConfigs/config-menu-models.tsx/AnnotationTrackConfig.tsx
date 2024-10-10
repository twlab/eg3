import { TrackConfig } from "./TrackConfig";

export const DEFAULT_OPTIONS = {
  displayMode: AnnotationDisplayModes.FULL,
  color: "blue",
  color2: "red",
  maxRows: 20,
  height: 40, // For density display mode
  hideMinimalItems: false,
  sortItems: false,
};
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
    console.log(trackModel);
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
