// import YscaleConfig from "components/trackContextMenu/YscaleConfig";
import { AnnotationDisplayModes } from "./DisplayModes";
import { AnnotationTrackConfig } from "./AnnotationTrackConfig";

import HiddenPixelsConfig from "../config-menu-components.tsx/HiddenPixelsConfig";
import YscaleConfig from "../config-menu-components.tsx/YscaleConfig";
import Feature from "../../../models/Feature";
import AlwaysDrawLabelConfig from "../config-menu-components.tsx/AlwaysDrawLabelConfig";
// import AlwaysDrawLabelConfig from "components/trackContextMenu/AlwaysDrawLabelConfig";

enum BedColumnIndex {
  NAME = 3,
  SCORE = 4,
  STRAND = 5,
}

export class BedTrackConfig extends AnnotationTrackConfig {
  /**
   * Converts BedRecords to Features.
   *
   * @param {BedRecord[]} data - bed records to convert
   * @return {Feature[]} bed records in the form of Feature
   */

  getMenuComponents() {
    const items = [
      ...super.getMenuComponents(),
      HiddenPixelsConfig,
      AlwaysDrawLabelConfig,
    ];
    if (this.getOptions().displayMode === AnnotationDisplayModes.DENSITY) {
      items.push(YscaleConfig);
    }
    return items;
  }
}
