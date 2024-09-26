import HeightConfig from "../config-menu-components.tsx/HeightConfig";
import { TrackConfig } from "./TrackConfig";
import { BackgroundColorConfig } from "../config-menu-components.tsx/ColorConfig";
// import { CategoryColorConfig } from "../trackContextMenu/CategoryColorConfig";
import HiddenPixelsConfig from "../config-menu-components.tsx/HiddenPixelsConfig";
import MaxRowsConfig from "../config-menu-components.tsx/MaxRowsConfig";
import TrackModel from "../../models/TrackModel";
import { DEFAULT_OPTIONS } from "../../components/GenomeView/CategoricalComponents/CategoricalTrack";

enum BedColumnIndex {
  CATEGORY = 3,
}

export class CategoricalTrackConfig extends TrackConfig {
  constructor(trackModel: TrackModel) {
    super(trackModel);
    this.setDefaultOptions(DEFAULT_OPTIONS);
  }

  getMenuComponents() {
    return [
      ...super.getMenuComponents(),
      HeightConfig,
      // CategoryColorConfig,
      BackgroundColorConfig,
      MaxRowsConfig,
      HiddenPixelsConfig,
    ];
  }
}
