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
  placements?: PlacedFeatureGroup[] | PlacedFeature[];
  placementsForward?: PlacedFeatureGroup[] | PlacedFeature[]; // The draw locations of features that are visible
  placementsReverse?: PlacedFeatureGroup[] | PlacedFeature[]; // The draw locations of features that are visible
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

  /**
   * Check if two placements have adjacent loci
   */

  _assignRows(
    groups: PlacedFeatureGroup[],
    padding: number | PaddingFunc,
    sortItems: SortItemsOptions
  ): number {
    if (sortItems === SortItemsOptions.NONE) {
      groups.sort((a, b) => a.xSpan.start - b.xSpan.start);
    } else if (sortItems === SortItemsOptions.ASC) {
      groups.sort((a, b) => a.feature.score - b.feature.score);
    } else if (sortItems === SortItemsOptions.DESC) {
      groups.sort((a, b) => b.feature.score - a.feature.score);
    }
    const maxXsForRows: number[] = [];
    const isConstPadding = typeof padding === "number";
    for (const group of groups) {
      const horizontalPadding = isConstPadding
        ? (padding as number)
        : (padding as PaddingFunc)(group.feature, group.xSpan);
      const startX = group.xSpan.start - horizontalPadding;
      const endX = group.xSpan.end + horizontalPadding;
      // Find the first row where the interval won't overlap with others in the row
      let row = maxXsForRows.findIndex((maxX) => maxX < startX);
      if (row === -1) {
        // Couldn't find a row -- make a new one
        maxXsForRows.push(endX);
        row = maxXsForRows.length - 1;
      } else {
        maxXsForRows[row] = endX;
      }
      group.row = row;
    }

    return maxXsForRows.length;
  }

  arrange(
    features: Feature[],
    viewRegion: DisplayedRegionModel,
    width: number,
    padding: number | PaddingFunc = 0,
    hiddenPixels: number = 0.5,
    sortItems: SortItemsOptions = SortItemsOptions.NONE,
    viewWindow
  ): FeaturePlacementResult {
    const results: any = FEATURE_PLACER.placeFeatures({
      features,
      viewRegion,
      width,
      mode: PlacementMode.ANNOTATION,
      viewWindow,
      padding,

      hiddenPixels,
    }) as FeaturePlacementResult;

    const numRowsAssigned = this._assignRows(
      results.placementsForward,
      padding,
      sortItems
    );

    return {
      placements: results.placementsForward,
      numRowsAssigned,
      numHidden: results.numHidden,
    };
  }
}

export default FeatureArranger;
