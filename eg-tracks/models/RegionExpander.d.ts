import OpenInterval from "./OpenInterval";
import DisplayedRegionModel from "./DisplayedRegionModel";
/**
 * Data describing an expanded view region.
 */
export interface ViewExpansion {
    /**
     * Total width, in pixels, of the expanded view
     */
    visWidth: number;
    /**
     * Expanded region
     */
    visRegion: DisplayedRegionModel;
    /**
     * The X range of pixels that would display the unexpanded region
     */
    viewWindow: OpenInterval;
    /**
     * Unexpanded region; the region displayed in the viewWindow
     */
    viewWindowRegion: DisplayedRegionModel;
}
/**
 * Utility class that does calculations related to expanding view regions for the purposes of scrolling.
 *
 * @author Silas Hsu
 */
export declare class RegionExpander {
    multipleOnEachSide: number;
    static DEFAULT_EXPANSION: number;
    /**
     * @return a RegionExpander which does not do any expansion at all.
     */
    static makeIdentityExpander(): RegionExpander;
    zoomRatio: number;
    /**
     * @param {number} multipleOnEachSide - magnitude of expansion on each side, as a multiple of region width.
     */
    constructor(multipleOnEachSide?: number);
    /**
     * Calculates an expansion of a view region from the input pixel width and region model.  Returns both the expanded
     * region and how many pixels on each side of the orignal view to allocate to display additional data.  Handles
     * cases such expanding near the edge of the genome, so that views will always remain inside the genome.
     *
     * @param {DisplayedRegionModel} region - the region that the unexpanded view will show
     * @param {number} visWidth - the width, in pixels, of the view to expand
     * @return {ViewExpansion} - data representing aspects of an expanded region
     */
    calculateExpansion(region: DisplayedRegionModel, visWidth: number): ViewExpansion;
}
