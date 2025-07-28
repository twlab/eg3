import MaxRowsConfig from "../config-menu-components.tsx/MaxRowsConfig";

import RowHeightConfig from "../config-menu-components.tsx/RowHeightConfig";
import { BackgroundColorConfig } from "../config-menu-components.tsx/ColorConfig";
import LabelConfig from "../config-menu-components.tsx/LabelConfig";

import HiddenPixelsConfig from "../config-menu-components.tsx/HiddenPixelsConfig";

export class BedcolorTrackConfig {
  getMenuComponents() {
    return [
      LabelConfig,
      RowHeightConfig,
      MaxRowsConfig,
      HiddenPixelsConfig,
      BackgroundColorConfig,
    ];
  }
}
