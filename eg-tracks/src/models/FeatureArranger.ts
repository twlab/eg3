import _ from "lodash";
import DisplayedRegionModel from "./DisplayedRegionModel";
import { Feature } from "./Feature";
import {
  FeaturePlacer,
  PlacedFeature,
  PlacementMode,
  PaddingFunc,
  PlaceFeaturesOptions,
} from "./getXSpan/FeaturePlacer";
import OpenInterval from "./OpenInterval";
import { SortItemsOptions } from "./SortItemsOptions";

export interface PlacedFeatureGroup {
  feature: Feature;
  xSpan: OpenInterval;
  placedFeatures: PlacedFeature[];
  row: number;
}

/**
 * Return value from FeatureArranger::arrange()
 */
export interface FeaturePlacementResult {
  placements: PlacedFeatureGroup[] | PlacedFeature[]; // The draw locations of features that are visible
  numRowsAssigned?: number; // Number of rows required to view all features
  numHidden?: number; // Number of features omitted from featureArrangement
}

const FEATURE_PLACER = new FeaturePlacer();

export class FeatureArranger {
  /**
   * Calculates draw locations for an array of features, as well rows indices to minimize overlaps.  This method skips
   * features too small to draw; the number skipped shall be in the return result.
   *
   * The optional `padding` parameter configures horizontal padding for intervals:
   * * If `padding` is a number, all intervals will have that constant padding.
   * * If `padding` is a function, it should take a feature and return the desired horizontal padding.
   *
   * @param {Feature[]} features - features to draw
   * @param {DisplayedRegionModel} viewRegion - used to compute drawing coordinates
   * @param {number} width - width of the visualization
   * @param {number | PaddingFunc} [padding] - horizontal padding for intervals.  Default 0.
   * @param {number} [hiddenPixels] - hide an item when its length less than this value.  Default 0.5
   * @return {FeaturePlacementResult} suggested draw location info
   */
  arrange(
    features: Feature[],
    viewRegion: DisplayedRegionModel,
    width: number,
    padding: number | PaddingFunc = 0,
    hiddenPixels: number = 0.5,
    sortItems: SortItemsOptions = SortItemsOptions.NONE,
    viewWindow
  ): FeaturePlacementResult {
    // Place features in ANNOTATION mode - combines adjacent features and assigns rows in one pass
    return FEATURE_PLACER.placeFeatures({
      features,
      viewRegion,
      width,
      mode: PlacementMode.ANNOTATION,
      viewWindow,
      padding,
      hiddenPixels,
    }) as FeaturePlacementResult;
  }
}

export default FeatureArranger;
