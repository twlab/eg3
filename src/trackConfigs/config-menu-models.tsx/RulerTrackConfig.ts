import { TrackConfig } from "./TrackConfig";

export class RulerTrackConfig extends TrackConfig {
  getMenuComponents() {
    return [...super.getMenuComponents()];
  }
}
