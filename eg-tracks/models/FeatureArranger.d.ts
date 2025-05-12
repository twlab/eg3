import DisplayedRegionModel from "./DisplayedRegionModel";
import { Feature } from "./Feature";
import { PlacedFeature } from "./getXSpan/FeaturePlacer";
import OpenInterval from "./OpenInterval";
import { SortItemsOptions } from "./SortItemsOptions";
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
    placements: PlacedFeatureGroup[];
    numRowsAssigned: number;
    numHidden: number;
}
export declare class FeatureArranger {
    /**
     * Assigns rows to each placed feature, mutating the objects.  Returns the number of rows assigned.
     *
     * @param {PlacedFeature[]} groups - placed features to modify
     * @param {number | PaddingFunc} padding - getter of padding.  See the arrange() method for more info.
     * @return {number} the number of rows assigned
     */
    _assignRows(groups: PlacedFeatureGroup[] | any, padding: number | PaddingFunc, sortItems: SortItemsOptions): number;
    _combineAdjacent(placements: PlacedFeature[]): PlacedFeatureGroup[];
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
    arrange(features: Feature[], viewRegion: DisplayedRegionModel, width: number, padding?: number | PaddingFunc, hiddenPixels?: number, sortItems?: SortItemsOptions): FeatureArrangementResult;
}
export default FeatureArranger;
