import { TrackConfig } from "./TrackConfig";
import { BackgroundColorConfig } from "../config-menu-components.tsx/ColorConfig";
// import { CategoryColorConfig } from "../trackContextMenu/CategoryColorConfig";
import HiddenPixelsConfig from "../config-menu-components.tsx/HiddenPixelsConfig";
import MaxRowsConfig from "../config-menu-components.tsx/MaxRowsConfig";

import CategoryColorConfig from "../config-menu-components.tsx/CategoryColorConfig";
import RowHeightConfig from "../config-menu-components.tsx/RowHeightConfig";
import { CATEGORICAL_DEFAULT_OPTIONS as DEFAULT_OPTIONS } from "./defaultOptions";

export { DEFAULT_OPTIONS };

enum BedColumnIndex {
  CATEGORY = 3,
}

export class CategoricalTrackConfig extends TrackConfig {
  getMenuComponents() {
    return [
      ...super.getMenuComponents(),
      RowHeightConfig,
      CategoryColorConfig,
      BackgroundColorConfig,
      MaxRowsConfig,
      HiddenPixelsConfig,
    ];
  }
}
