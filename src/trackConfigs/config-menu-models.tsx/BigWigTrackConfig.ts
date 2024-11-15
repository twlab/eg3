import { TrackConfig } from "./TrackConfig";
import { NumericalTrackConfig } from "./NumericalTrackConfig";
import { DEFAULT_OPTIONS } from "../../components/GenomeView/TrackComponents/commonComponents/numerical/NumericalTrack";
import TrackModel from "../../models/TrackModel";

export class BigWigTrackConfig extends TrackConfig {
  private numericalTrackConfig: NumericalTrackConfig;
  constructor(trackModel: TrackModel) {
    super(trackModel);
    this.numericalTrackConfig = new NumericalTrackConfig(trackModel);
    this.setDefaultOptions(DEFAULT_OPTIONS);
  }

  getMenuComponents() {
    return [...this.numericalTrackConfig.getMenuComponents()];
  }
}
