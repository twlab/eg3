import { TrackConfig } from "./TrackConfig";

import LabelConfig from "../config-menu-components.tsx/LabelConfig";
import MaxRowsConfig from "../config-menu-components.tsx/MaxRowsConfig";
import {
  highValueColorConfig,
  lowValueColorConfig,
  BackgroundColorConfig,
} from "../config-menu-components.tsx/ColorConfig";

import RowHeightConfig from "../config-menu-components.tsx/RowHeightConfig";
import AlwaysDrawLabelConfig from "../config-menu-components.tsx/AlwaysDrawLabelConfig";
import {
  VcfColorScaleKeyConfig,
  VcfDisplayModeConfig,
} from "../config-menu-components.tsx/DisplayModeConfig";
import EnsemblStyleConfig from "../config-menu-components.tsx/EnsemblStyleConfig";

export class VcfTrackConfig extends TrackConfig {
  // initDataSource() {
  //     if (this.trackModel.files.length > 0) {
  //         return new VcfSource(this.trackModel.files);
  //     } else {
  //         return new VcfSource(this.trackModel.url, this.trackModel.indexUrl);
  //     }
  // }

  // /**
  //  * Converts variant to Vcf Features.
  //  *
  //  * @param {VcfRecord[]} data - vcf records as variant to convert
  //  * @return {Feature[]} vcf records in the form of Feature
  //  */
  // formatData(data: any[]) {
  //     return data.map((record) => new Vcf(record));
  // }

  // shouldFetchBecauseOptionChange(oldOptions: TrackOptions, newOptions: TrackOptions): boolean {
  //     return oldOptions.ensemblStyle !== newOptions.ensemblStyle;
  // }

  getMenuComponents() {
    return [
      LabelConfig,
      VcfDisplayModeConfig,
      VcfColorScaleKeyConfig,
      EnsemblStyleConfig,
      highValueColorConfig,
      lowValueColorConfig,
      BackgroundColorConfig,
      RowHeightConfig,
      MaxRowsConfig,
      AlwaysDrawLabelConfig,
    ];
  }
}
