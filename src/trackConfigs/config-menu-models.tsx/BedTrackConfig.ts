// import YscaleConfig from "components/trackContextMenu/YscaleConfig";
import { AnnotationDisplayModes } from "./DisplayModes";
import { AnnotationTrackConfig } from "./AnnotationTrackConfig";

import HiddenPixelsConfig from "../config-menu-components.tsx/HiddenPixelsConfig";
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
    //, AlwaysDrawLabelConfig
    const items = [...super.getMenuComponents(), HiddenPixelsConfig];
    // if (this.getOptions().displayMode === AnnotationDisplayModes.DENSITY) {
    //     items.push(YscaleConfig);
    // }
    return items;
  }
}
