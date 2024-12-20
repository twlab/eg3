import { AnnotationDisplayModes } from "./DisplayModes";
import { AnnotationDisplayModeConfig } from "../config-menu-components.tsx/DisplayModeConfig";
import { BackgroundColorConfig } from "../config-menu-components.tsx/ColorConfig";

import { DEFAULT_OPTIONS } from "@/components/GenomeView/TrackComponents/OmeroTrack";
import TrackModel from "@/models/TrackModel";

import { TrackConfig } from "./TrackConfig";
import LabelConfig from "../config-menu-components.tsx/LabelConfig";
import OmeroImageHeightConfig from "../config-menu-components.tsx/OmeroImageHeightConfig";
import HeightConfig from "../config-menu-components.tsx/HeightConfig";

export class OmeroTrackConfig extends TrackConfig {
  constructor(trackModel: TrackModel) {
    super(trackModel);
    this.setDefaultOptions(DEFAULT_OPTIONS);
  }

  getMenuComponents() {
    const items = [LabelConfig, AnnotationDisplayModeConfig];
    if (this.getOptions().displayMode === AnnotationDisplayModes.DENSITY) {
      items.push(HeightConfig);
    } else {
      // Assume FULL display mode
      items.push(OmeroImageHeightConfig);
    }
    items.push(BackgroundColorConfig);
    return items;
  }
}
