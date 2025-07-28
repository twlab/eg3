import HeightConfig from "../config-menu-components.tsx/HeightConfig";
import { TrackConfig } from "./TrackConfig";
import { BackgroundColorConfig } from "../config-menu-components.tsx/ColorConfig";
// import { CategoryColorConfig } from "../trackContextMenu/CategoryColorConfig";
import HiddenPixelsConfig from "../config-menu-components.tsx/HiddenPixelsConfig";
import MaxRowsConfig from "../config-menu-components.tsx/MaxRowsConfig";

import CategoryColorConfig from "../config-menu-components.tsx/CategoryColorConfig";
export const DEFAULT_OPTIONS = {
  height: 20,
  color: "blue",
  maxRows: 1,
  hiddenPixels: 0.5,
  alwaysDrawLabel: false,
  category: {},
};

enum BedColumnIndex {
  CATEGORY = 3,
}

export class CategoricalTrackConfig extends TrackConfig {
  getMenuComponents() {
    return [
      ...super.getMenuComponents(),
      HeightConfig,
      CategoryColorConfig,
      BackgroundColorConfig,
      MaxRowsConfig,
      HiddenPixelsConfig,
    ];
  }
}
