import LabelConfig from "../config-menu-components.tsx/LabelConfig";

import { InteractionDisplayMode } from "./DisplayModes";
import { TrackConfig } from "./TrackConfig";

import { DEFAULT_OPTIONS } from "../../components/GenomeView/TrackComponents/InteractionComponents/InteractionTrackComponent";
import {
  PrimaryColorConfig,
  SecondaryColorConfig,
  BackgroundColorConfig,
} from "../config-menu-components.tsx/ColorConfig";
import { InteractionDisplayModeConfig } from "../config-menu-components.tsx/DisplayModeConfig";

import HeightConfig from "../config-menu-components.tsx/HeightConfig";
import LineWidthConfig from "../config-menu-components.tsx/LineWidthConfig";
import BothAnchorsInViewConfig from "../config-menu-components.tsx/BothAnchorsInViewConfig";
import MaxValueFilterConfig from "../config-menu-components.tsx/MaxValueFilterConfig";
import MinValueFilterConfig from "../config-menu-components.tsx/MinValueFilterConfig";
import ScoreConfig from "../config-menu-components.tsx/ScoreConfig";
import FetchViewWindowConfig from "../config-menu-components.tsx/FetchViewWindowConfig";
import ClampHeightConfig from "../config-menu-components.tsx/ClampHeightConfig";

export class LongRangeTrackConfig extends TrackConfig {
  constructor(props: any) {
    super(props);
    this.setDefaultOptions(DEFAULT_OPTIONS);
  }

  getMenuComponents() {
    const items = [
      LabelConfig,
      InteractionDisplayModeConfig,
      HeightConfig,
      ScoreConfig,
      PrimaryColorConfig,
      SecondaryColorConfig,
      BackgroundColorConfig,
      MaxValueFilterConfig,
      MinValueFilterConfig,
      FetchViewWindowConfig,
      BothAnchorsInViewConfig,
    ];
    if (this.getOptions().displayMode === InteractionDisplayMode.ARC) {
      items.splice(1, 0, LineWidthConfig);
    }
    if (
      this.getOptions().displayMode === InteractionDisplayMode.HEATMAP ||
      this.getOptions().displayMode === InteractionDisplayMode.ARC
    ) {
      items.push(ClampHeightConfig);
    }
    return items;
  }
}
