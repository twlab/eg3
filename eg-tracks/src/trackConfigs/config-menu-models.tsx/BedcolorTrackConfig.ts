import MaxRowsConfig from "../config-menu-components.tsx/MaxRowsConfig";

import RowHeightConfig from "../config-menu-components.tsx/RowHeightConfig";
import { BackgroundColorConfig } from "../config-menu-components.tsx/ColorConfig";
import LabelConfig from "../config-menu-components.tsx/LabelConfig";

import HiddenPixelsConfig from "../config-menu-components.tsx/HiddenPixelsConfig";
import { TrackConfig } from "./TrackConfig";
import TrackModel from "../../models/TrackModel";

export const DEFAULT_OPTIONS = {
  rowHeight: 40,
  hiddenPixels: 0,
};

export class BedcolorTrackConfig extends TrackConfig {
  constructor(trackModel: TrackModel) {
    super(trackModel);
    this.setDefaultOptions(DEFAULT_OPTIONS);
  }

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
