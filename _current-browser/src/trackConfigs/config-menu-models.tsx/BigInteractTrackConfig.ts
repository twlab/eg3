import { InteractionDisplayMode } from "./DisplayModes";
import { TrackConfig } from "./TrackConfig";
import { DEFAULT_OPTIONS } from "../../components/GenomeView/TrackComponents/InteractionComponents/InteractionTrackComponent";

import { InteractionDisplayModeConfig } from "../config-menu-components.tsx/DisplayModeConfig";
import {
  PrimaryColorConfig,
  SecondaryColorConfig,
  BackgroundColorConfig,
} from "../config-menu-components.tsx/ColorConfig";
// import ScoreConfig from '../trackContextMenu/ScoreConfig';
import HeightConfig from "../config-menu-components.tsx/HeightConfig";
import LineWidthConfig from "../config-menu-components.tsx/LineWidthConfig";
import ScoreConfig from "../config-menu-components.tsx/ScoreConfig";
/*
Example record from the data source
DASFeature {
    color: "0"
    exp: "."
    label: "."
    max: 63705638
    min: 63702628
    region1Chrom: "chr17"
    region1End: "58880897"
    region1Name: "."
    region1Start: "58878552"
    region1Strand: "."
    region2Chrom: "chr3"
    region2End: "63705638"
    region2Name: "."
    region2Start: "63702628"
    region2Strand: "."
    score: 584
    segment: "chr3"
    type: "bigbed"
    value: "10"
    _chromId: 0
}
*/

export class BigInteractTrackConfig extends TrackConfig {
  constructor(props: any) {
    super(props);
    this.setDefaultOptions(DEFAULT_OPTIONS);
  }

  /**
   * Converts DASFeatures to Feature.
   *
   * @param {DASFeature[]} data - DASFeatures to convert
   * @return {Feature[]} Features made from the input
   */

  getMenuComponents() {
    const items = [
      InteractionDisplayModeConfig,
      HeightConfig,
      ScoreConfig,
      PrimaryColorConfig,
      SecondaryColorConfig,
      BackgroundColorConfig,
    ];
    if (this.getOptions().displayMode === InteractionDisplayMode.ARC) {
      items.splice(1, 0, LineWidthConfig);
    }
    return items;
  }
}
