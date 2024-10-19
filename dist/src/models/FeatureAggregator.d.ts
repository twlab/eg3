import { Feature } from './Feature';
import { default as DisplayedRegionModel } from './DisplayedRegionModel';
/**
 * Available aggregators.  Note: SUM, MEAN, MIN, and MAX requires each record to have a `value` prop.
 */
export declare const AggregatorTypes: {
    MEAN: string;
    SUM: string;
    COUNT: string;
    MIN: string;
    MAX: string;
    IMAGECOUNT: string;
};
export declare const ArrayAggregatorTypes: {
    MEAN: string;
};
/**
 * calculate mean value of each array elements and save to a new array
 * [
 *  [1,2,3],
 *  [4,5,6]
 * ]
 * to
 * [2.5, 3.5, 4.5]
 * missing number is any position is filled with 0 in original array
 *
 * @param records array of value objest, data stored in values property
 * @param dataKeyName default to `values`
 */
export declare function calMeanOfArrays(records: any[], dataKeyName: string): number[];
export declare const DefaultAggregators: {
    types: {
        MEAN: string;
        SUM: string;
        COUNT: string;
        MIN: string;
        MAX: string;
        IMAGECOUNT: string;
    };
    fromId(id: string): any;
};
export declare const DefaultArrayAggregators: {
    types: {
        MEAN: string;
    };
    fromId(id: string): any;
};
/**
 * Aggregator of features.  Includes methods to construct x-to-data maps.
 *
 * @author Silas Hsu
 */
export declare class FeatureAggregator {
    /**
     * Constructs a mapping from x coordinate to all Features overlapping that location.  The mapping will be limited
     * to the range [0, width).
     *
     * @param {Feature[]} features - features to use
     * @param {DisplayedRegionModel} viewRegion - used to compute drawing coordinates
     * @param {number} width - width of the visualization
     * @return {Feature[][]} mapping from x coordinate to all Features overlapping that location
     */
    makeXMap(features: Feature[], viewRegion: DisplayedRegionModel, width: number, useCenter?: boolean): any;
    makeXWindowMap(features: Feature[], viewRegion: DisplayedRegionModel, width: number, useCenter: boolean | undefined, windowSize: number): {
        [x: number]: Feature[];
    };
}
