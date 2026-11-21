import { TrackConfig } from "./TrackConfig";
import TrackModel from "../../models/TrackModel";
import { HammockDisplayModes } from "../../models/Hammock";
import { DEFAULT_OPTIONS as defaultAnnotationOptions } from "./AnnotationTrackConfig";
import SelectConfig from "../config-menu-components.tsx/SelectConfig";
import NumberConfig from "../config-menu-components.tsx/NumberConfig";
import {
  PrimaryColorConfig,
  SecondaryColorConfig,
  BackgroundColorConfig,
} from "../config-menu-components.tsx/ColorConfig";
import HeightConfig from "../config-menu-components.tsx/HeightConfig";
import MaxRowsConfig from "../config-menu-components.tsx/MaxRowsConfig";
import HiddenPixelsConfig from "../config-menu-components.tsx/HiddenPixelsConfig";
import YscaleConfig from "../config-menu-components.tsx/YscaleConfig";
import AlwaysDrawLabelConfig from "../config-menu-components.tsx/AlwaysDrawLabelConfig";

export const DEFAULT_OPTIONS = {
  ...defaultAnnotationOptions,
  displayMode: HammockDisplayModes.BARPLOT,
  height: 40, // for barplot and density display modes
  scoreIndex: 0, // which entry of each item's `scorelst` the barplot draws
  scoreNames: [], // optional names of the `scorelst` entries, for the tooltip
};

function HammockDisplayModeConfig(props: any) {
  return (
    <SelectConfig
      {...props}
      optionName="displayMode"
      label="Display mode:"
      choices={HammockDisplayModes}
    />
  );
}

function HammockScoreIndexConfig(props: any) {
  return (
    <NumberConfig
      {...props}
      optionName="scoreIndex"
      label="Score to plot (index):"
      minValue={0}
      step={1}
      defaultValue={0}
    />
  );
}

/**
 * Config for the hammock track: a bed-like annotation track whose items carry
 * a list of scores. Besides the regular annotation modes it has a `barplot`
 * mode that draws every item as a bar whose height is its score.
 */
export class HammockTrackConfig extends TrackConfig {
  constructor(trackModel: TrackModel) {
    super(trackModel);
    this.setDefaultOptions(DEFAULT_OPTIONS);
  }

  getMenuComponents() {
    const { displayMode } = this.getOptions();
    const items: any[] = [
      ...super.getMenuComponents(),
      HammockDisplayModeConfig,
    ];

    if (displayMode === HammockDisplayModes.FULL) {
      items.push(MaxRowsConfig);
    } else {
      items.push(HeightConfig);
    }
    items.push(PrimaryColorConfig, SecondaryColorConfig, BackgroundColorConfig);

    if (displayMode === HammockDisplayModes.BARPLOT) {
      items.push(HammockScoreIndexConfig, YscaleConfig);
    } else if (displayMode === HammockDisplayModes.DENSITY) {
      items.push(YscaleConfig);
    } else {
      items.push(HiddenPixelsConfig, AlwaysDrawLabelConfig);
    }
    return items;
  }
}
