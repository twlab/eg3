import { TrackConfig } from "./TrackConfig";

import { DEFAULT_OPTIONS } from "../components/GenomeView/RefGeneTrack";

import { AnnotationDisplayModeConfig } from "../components/GenomeView/commonComponents/track-context-menu/DisplayModeConfig";
import {
  PrimaryColorConfig,
  SecondaryColorConfig,
  BackgroundColorConfig,
} from "./ColorConfig";
import HeightConfig from "./HeightConfig";
import MaxRowsConfig from "./MaxRowsConfig";

import { AnnotationDisplayModes } from "../components/GenomeView/commonComponents/track-context-menu/DisplayModes";
import TrackModel from "../models/TrackModel";

export class AnnotationTrackConfig extends TrackConfig {
  constructor(trackModel: TrackModel) {
    super(trackModel);
    this.setDefaultOptions(DEFAULT_OPTIONS.full);
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
