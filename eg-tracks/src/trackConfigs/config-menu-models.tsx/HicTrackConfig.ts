import { ScaleChoices } from "../../models/ScaleChoices";
import LabelConfig from "../config-menu-components.tsx/LabelConfig";
import { TrackConfig } from "./TrackConfig";

import {
  PrimaryColorConfig,
  SecondaryColorConfig,
  BackgroundColorConfig,
} from "../config-menu-components.tsx/ColorConfig";
import { InteractionDisplayModeConfig } from "../config-menu-components.tsx/DisplayModeConfig";
// import ScoreConfig from "../trackContextMenu/ScoreConfig";
// import ScalePercentileConfig from "../trackContextMenu/ScalePercentileConfig";
// import FetchViewWindowConfig from "components/trackContextMenu/FetchViewWindowConfig";
import LineWidthConfig from "../config-menu-components.tsx/LineWidthConfig";
// import MaxValueFilterConfig from "components/trackContextMenu/MaxValueFilterConfig";
// import MinValueFilterConfig from "components/trackContextMenu/MinValueFilterConfig";
// import BothAnchorsInViewConfig from "components/trackContextMenu/BothAnchorsInViewConfig";
// import ClampHeightConfig from "components/trackContextMenu/ClampHeightConfig";
import {
  BinSizeConfig,
  HicNormalizationConfig,
} from "../config-menu-components.tsx/HicDataConfig";
import HeightConfig from "../config-menu-components.tsx/HeightConfig";

import { InteractionDisplayMode } from "./DisplayModes";
import TrackModel from "../../models/TrackModel";
import { DEFAULT_OPTIONS } from "../../components/GenomeView/TrackComponents/InteractionComponents/InteractionTrackComponent";
import { BinSize, NormalizationMode } from "../../getRemoteData/HicDataModes";
import ScoreConfig from "../config-menu-components.tsx/ScoreConfig";
import MaxValueFilterConfig from "../config-menu-components.tsx/MaxValueFilterConfig";
import MinValueFilterConfig from "../config-menu-components.tsx/MinValueFilterConfig";
import BothAnchorsInViewConfig from "../config-menu-components.tsx/BothAnchorsInViewConfig";
import FetchViewWindowConfig from "../config-menu-components.tsx/FetchViewWindowConfig";
import ScalePercentileConfig from "../config-menu-components.tsx/ScalePercentileConfig";
import ClampHeightConfig from "../config-menu-components.tsx/ClampHeightConfig";

export class HicTrackConfig extends TrackConfig {
  constructor(trackModel: TrackModel) {
    super(trackModel);
    this.setDefaultOptions({
      ...DEFAULT_OPTIONS,
      binSize: BinSize.AUTO,
      normalization: NormalizationMode.NONE,
    });
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
    if (this.getOptions().scoreScale === ScaleChoices.AUTO) {
      items.splice(4, 0, ScalePercentileConfig);
    }
    if (this.getOptions().displayMode !== InteractionDisplayMode.HEATMAP) {
      items.splice(1, 0, LineWidthConfig);
    }
    if (this.getOptions().displayMode === InteractionDisplayMode.HEATMAP) {
      items.splice(1, 0, BinSizeConfig);
      items.splice(1, 0, HicNormalizationConfig);
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
