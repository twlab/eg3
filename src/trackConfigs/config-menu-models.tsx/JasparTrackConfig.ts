import TrackModel from "@/models/TrackModel";
import { AnnotationTrackConfig } from "./AnnotationTrackConfig";
import { DEFAULT_OPTIONS } from "../../components/GenomeView/TrackComponents/JasparTrack";

import HiddenPixelsConfig from "../config-menu-components.tsx/HiddenPixelsConfig";
import AlwaysDrawLabelConfig from "../config-menu-components.tsx/AlwaysDrawLabelConfig";
import { AnnotationDisplayModes } from "./DisplayModes";
import YscaleConfig from "../config-menu-components.tsx/YscaleConfig";
export class JasparTrackConfig extends AnnotationTrackConfig {
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
