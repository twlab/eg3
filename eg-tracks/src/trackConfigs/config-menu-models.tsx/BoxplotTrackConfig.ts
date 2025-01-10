import TrackModel from "@eg/core/src/eg-lib/models/TrackModel";
import {
  BoxColorConfig,
  LineColorConfig,
  BackgroundColorConfig,
} from "../config-menu-components.tsx/ColorConfig";
import HeightConfig from "../config-menu-components.tsx/HeightConfig";
import LabelConfig from "../config-menu-components.tsx/LabelConfig";
import { DEFAULT_OPTIONS } from "./AnnotationTrackConfig";
import { BedGraphTrackConfig } from "./BedGraphTrackConfig";
import { BigWigTrackConfig } from "./BigWigTrackConfig";
import { TrackConfig } from "./TrackConfig";
import WindowSizeConfig from "../config-menu-components.tsx/WindowSizeConfig";

export class BoxplotTrackConfig extends TrackConfig {
  private trackConfig: TrackConfig;
  constructor(trackModel: TrackModel) {
    super(trackModel);
    let options;
    if (trackModel.url.endsWith(".gz")) {
      this.trackConfig = new BedGraphTrackConfig(trackModel);
      options = { ...DEFAULT_OPTIONS };
    } else {
      this.trackConfig = new BigWigTrackConfig(trackModel);
      options = { ...DEFAULT_OPTIONS, zoomLevel: "auto" };
    }
    this.setDefaultOptions(options);
  }

  getMenuComponents() {
    return [
      LabelConfig,
      WindowSizeConfig,
      HeightConfig,
      BoxColorConfig,
      LineColorConfig,
      BackgroundColorConfig,
    ];
  }
}
