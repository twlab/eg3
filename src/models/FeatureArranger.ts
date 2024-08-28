import _ from "lodash";
import DisplayedRegionModel from "./DisplayedRegionModel";
import { Feature } from "./Feature";
import { FeaturePlacer, PlacedFeature } from "./getXSpan/FeaturePlacer";
import LinearDrawingModel from "./LinearDrawingModel";
import OpenInterval from "./OpenInterval";
import { SortItemsOptions } from "./SortItemsOptions";
import Gene from "./Gene";

export interface PlacedFeatureGroup {
  feature: Feature;
  row: number;
  xSpan: OpenInterval;
  placedFeatures: PlacedFeature[];
}

export type PaddingFunc = (feature: Feature, xSpan: OpenInterval) => number;

/**
 * Return value from FeatureArranger::arrange()
 */
interface FeatureArrangementResult {
  placements: PlacedFeatureGroup[]; // The draw locations of features that are visible
  numRowsAssigned: number; // Number of rows required to view all features
  numHidden: number; // Number of features omitted from featureArrangement
}

const FEATURE_PLACER = new FeaturePlacer();

export class FeatureArranger {
  /**
   * Assigns rows to each placed feature, mutating the objects.  Returns the number of rows assigned.
   *
   * @param {PlacedFeature[]} groups - placed features to modify
   * @param {number | PaddingFunc} padding - getter of padding.  See the arrange() method for more info.
   * @return {number} the number of rows assigned
   */
  _assignRows(
    groups: PlacedFeatureGroup[],
    padding: number | PaddingFunc,
    sortItems: SortItemsOptions,
    trackSide?: string,
    prevRegionOverflow?: { [key: string]: any }
  ): number {
    // if (sortItems === SortItemsOptions.NONE) {
    //   groups.sort((a, b) => a.xSpan.start - b.xSpan.start);
    // } else if (sortItems === SortItemsOptions.ASC) {
    //   groups.sort((a, b) => a.feature.score - b.feature.score);
    // } else if (sortItems === SortItemsOptions.DESC) {
    //   groups.sort((a, b) => b.feature.score - a.feature.score);
    // }
    const maxXsForRows: number[] = [];
    const isConstPadding = typeof padding === "number";

    if (prevRegionOverflow !== undefined) {
      let maxXsForRowsLen = maxXsForRows.length - 1;

      for (const key in prevRegionOverflow) {
        for (const group of groups) {
          if (key === group.feature.id!) {
            let row;
            const horizontalPadding = isConstPadding
              ? (padding as number)
              : (padding as PaddingFunc)(group.feature, group.xSpan);
            const startX = group.xSpan.start - horizontalPadding;
            const endX = group.xSpan.end + horizontalPadding;
            if (prevRegionOverflow[key].row > maxXsForRowsLen) {
              while (prevRegionOverflow[key].row > maxXsForRowsLen) {
                maxXsForRowsLen++;
                if (maxXsForRowsLen === prevRegionOverflow[key].row) {
                  maxXsForRows.push(trackSide === "right" ? endX : startX);
                  row = prevRegionOverflow[key].row;
                } else {
                  maxXsForRows.push(Number.NEGATIVE_INFINITY);
                }
              }
            } else {
              row = prevRegionOverflow[key].row;
              maxXsForRows[row] = trackSide === "right" ? endX : startX;
            }
            group.row = row;
            break;
          }
        }
      }
    }
    console.log(maxXsForRows, groups);
    for (const group of groups) {
      if (
        prevRegionOverflow === undefined ||
        !(group.feature.id! in prevRegionOverflow)
      ) {
        const horizontalPadding = isConstPadding
          ? (padding as number)
          : (padding as PaddingFunc)(group.feature, group.xSpan);
        const startX = group.xSpan.start - horizontalPadding;
        const endX = group.xSpan.end + horizontalPadding;
        // Find the first row where the interval won't overlap with others in the row

        let row = maxXsForRows.findIndex((maxX) =>
          trackSide === "right" ? maxX < startX : maxX > endX
        );

        if (row === -1) {
          // Couldn't find a row -- make a new one
          maxXsForRows.push(trackSide === "right" ? endX : startX);
          row = maxXsForRows.length - 1;
        } else {
          maxXsForRows[row] = trackSide === "right" ? endX : startX;
        }
        group.row = row;
      }
    }
    console.log(groups);
    return maxXsForRows.length;
  }

  _combineAdjacent(placements: PlacedFeature[]): PlacedFeatureGroup[] {
    placements.sort((a, b) => a.xSpan.start - b.xSpan.start);

    const groups: PlacedFeatureGroup[] = [];
    let i = 0;
    while (i < placements.length) {
      let j = i + 1;
      while (j < placements.length && lociAreAdjacent(j - 1, j)) {
        j++;
      }

      const placementsInGroup = placements.slice(i, j);
      const firstPlacement = _.first(placementsInGroup);
      const lastPlacement = _.last(placementsInGroup);
      groups.push({
        feature: firstPlacement!.feature,
        row: -1,
        xSpan: new OpenInterval(
          firstPlacement!.xSpan.start,
          lastPlacement!.xSpan.end
        ),
        placedFeatures: placementsInGroup,
      });
      i = j;
    }

    return groups;

    function lociAreAdjacent(a: number, b: number) {
      const locusA = placements[a].visiblePart.getLocus();
      const locusB = placements[b].visiblePart.getLocus();
      return locusA.end === locusB.start || locusA.start === locusB.end;
    }
  }

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
   * @return {FeatureArrangementResult} suggested draw location info
   */
  arrange(
    features: Feature[],
    viewRegion: DisplayedRegionModel,
    width: number,
    padding: number | PaddingFunc = 0,
    hiddenPixels: number = 0.5,
    sortItems: SortItemsOptions = SortItemsOptions.NONE,
    trackSide?: string,
    prevRegionOverflow?: { [key: string]: any }
  ): FeatureArrangementResult {
    const drawModel = new LinearDrawingModel(viewRegion, width);
    const visibleFeatures = features.filter(
      (feature) => drawModel.basesToXWidth(feature.getLength()) >= hiddenPixels
    );

    const results: PlacedFeatureGroup[] = [];
    for (const feature of visibleFeatures) {
      const placements = FEATURE_PLACER.placeFeatures(
        [feature],
        viewRegion,
        width
      );

      results.push(...this._combineAdjacent(placements));
    }
    console.log(results);
    const numRowsAssigned = this._assignRows(
      results,
      padding,
      sortItems,
      trackSide,
      prevRegionOverflow
    );
    return {
      placements: results,
      numRowsAssigned,
      numHidden: features.length - visibleFeatures.length,
    };
  }
}

export default FeatureArranger;
