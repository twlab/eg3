import ChromosomeInterval from "./ChromosomeInterval";
import DisplayedRegionModel from "./DisplayedRegionModel";
import Feature from "./Feature";
import NavigationContext from "./NavigationContext";

/**
 * Rebuilds a DisplayedRegionModel from its plain-object form, as it arrives
 * after a trip through a worker or structuredClone, which keep the fields
 * but drop the class.
 *
 * Kept on its own rather than in TrackManager so the track drawing code can
 * use it without importing the whole browser.
 */
export function objToInstanceAlign(alignment: { [key: string]: any }) {
  if (!alignment) {
    return;
  }
  let visRegionFeatures: Feature[] = [];

  for (let feature of alignment._navContext._features) {
    let newChr = new ChromosomeInterval(
      feature.locus.chr,
      feature.locus.start,
      feature.locus.end,
    );
    visRegionFeatures.push(
      new Feature(feature.name, newChr, feature.strand, feature.value),
    );
  }

  let visRegionNavContext = new NavigationContext(
    alignment._navContext._name,
    visRegionFeatures,
  );

  let visRegion = new DisplayedRegionModel(
    visRegionNavContext,
    alignment._startBase,
    alignment._endBase,
  );
  return visRegion;
}
