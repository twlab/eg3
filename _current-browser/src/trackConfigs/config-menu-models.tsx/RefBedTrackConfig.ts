import { AnnotationTrackConfig } from "./AnnotationTrackConfig";

/*
Example record from the data source
DASFeature {
    label: "NR_037940",
    max: 27219880,
    min: 27202057,
    orientation: "-",
    score: 35336,
    segment: "chr7",
    type: "bigbed",
    _chromId: 19
}
*/

export class RefBedTrackConfig extends AnnotationTrackConfig {
  getMenuComponents() {
    //, AlwaysDrawLabelConfig
    const items = [...super.getMenuComponents()];
    // if (this.getOptions().displayMode === AnnotationDisplayModes.DENSITY) {
    //     items.push(YscaleConfig);
    // }
    return items;
  }
}
