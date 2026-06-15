import AlwaysDrawLabelConfig from "../config-menu-components.tsx/AlwaysDrawLabelConfig";
import {
  BackgroundColorConfig,
  PrimaryColorConfig,
  SecondaryColorConfig,
} from "../config-menu-components.tsx/ColorConfig";
import { AnnotationDisplayModeConfig } from "../config-menu-components.tsx/DisplayModeConfig";
import HeightConfig from "../config-menu-components.tsx/HeightConfig";
import YscaleConfig from "../config-menu-components.tsx/YscaleConfig";
import { AnnotationTrackConfig } from "./AnnotationTrackConfig";
import { AnnotationDisplayModes } from "./DisplayModes";
import { TrackConfig } from "./TrackConfig";

/*
Example record from the data source
DASFeature {
    label: "NR_037940",
    max: 27219880,
    min: 27202057,
    orientation: "-",
    score: 35336,
    segment: "chr7",
    type: "bigbed",
    _chromId: 19
}
*/

export class BigBedTrackColorConfig extends TrackConfig {
  getMenuComponents() {
    const items = [
      ...super.getMenuComponents(),
      AnnotationDisplayModeConfig,
      HeightConfig,
      BackgroundColorConfig,
      HeightConfig,
    ];
    if (this.getOptions().displayMode === AnnotationDisplayModes.DENSITY) {
      items.push(YscaleConfig);
    }
    return items;
  }
}
