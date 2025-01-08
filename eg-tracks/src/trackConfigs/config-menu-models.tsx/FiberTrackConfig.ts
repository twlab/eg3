import TrackModel from "@/models/TrackModel";
import {
  PrimaryColorConfig,
  SecondaryColorConfig,
} from "../config-menu-components.tsx/ColorConfig";
import { FiberDisplayModeConfig } from "../config-menu-components.tsx/DisplayModeConfig";
import HeightConfig from "../config-menu-components.tsx/HeightConfig";
import HiddenPixelsConfig from "../config-menu-components.tsx/HiddenPixelsConfig";
import HideMinimalItemsConfig from "../config-menu-components.tsx/HideMinimalItemsConfig";
import MaxRowsConfig from "../config-menu-components.tsx/MaxRowsConfig";
import YscaleConfig from "../config-menu-components.tsx/YscaleConfig";
import { DEFAULT_OPTIONS } from "./AnnotationTrackConfig";
import { TrackConfig } from "./TrackConfig";
import RowHeightConfig from "../config-menu-components.tsx/RowHeightConfig";
import PixelsPaddingConfig from "../config-menu-components.tsx/PixelsPaddingConfig";
import SortItemsConfig from "../config-menu-components.tsx/SortItemsConfig";

export class FiberTrackConfig extends TrackConfig {
  getMenuComponents() {
    const items = [
      ...super.getMenuComponents(),
      FiberDisplayModeConfig,
      RowHeightConfig,
      PrimaryColorConfig,
      SecondaryColorConfig,
      MaxRowsConfig,
      HiddenPixelsConfig,
      HeightConfig,
      YscaleConfig,
      SortItemsConfig,
      HideMinimalItemsConfig,
      PixelsPaddingConfig,
    ];
    return items;
  }
}
