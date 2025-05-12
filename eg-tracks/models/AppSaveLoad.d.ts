import RegionSet from "./RegionSet";
import DisplayedRegionModel from "./DisplayedRegionModel";
/**
 * Converter of app state to plain objects and JSON.  In other words, app state serializer.
 *
 * @author Silas Hsu
 * @see {AppState}
 */
export declare class AppStateSaver {
    /**
     * @param {Object} appState - app state tree
     * @return {string} - JSON representing app state
     */
    /**
     * @param {Object} appState - app state tree
     * @return {Object} plain object representing app state
     */
    toObject(appState: any): object;
}
/**
 * Converter of JSON and plain objects to app state.  In other words, app state deserializer.
 *
 * @author Silas Hsu
 * @see {AppState}
 */
export declare class AppStateLoader {
    /**
     * @param {string} blob - JSON representing app state
     * @return {Object} app state tree parsed from JSON
     */
    fromJSON(blob: string): {
        genomeName: any;
        viewRegion: DisplayedRegionModel | null;
        tracks: any;
        metadataTerms: any;
        regionSets: any;
        regionSetView: any;
        trackLegendWidth: any;
        bundleId: any;
        isShowingNavigator: any;
        isShowingVR: any;
        layout: any;
        highlights: any;
        darkTheme: any;
    };
    /**
     * @param {AppState} object - plain object representing app state
     * @return {Object} app state tree inferred from the object
     * @throws {Error} on deserialization errors
     */
    fromObject(object: any): {
        genomeName: any;
        viewRegion: DisplayedRegionModel | null;
        tracks: any;
        metadataTerms: any;
        regionSets: any;
        regionSetView: any;
        trackLegendWidth: any;
        bundleId: any;
        isShowingNavigator: any;
        isShowingVR: any;
        layout: any;
        highlights: any;
        darkTheme: any;
    };
    /**
     * Infers the DisplayedRegionModel from the plain object representing app state.  Takes a already-deserialized
     * RegionSet as an optional parameter, because if the app was in region set view when it was saved, we will want to
     * restore that, not the genome view.
     *
     * @param {Object} object - plain object representing app state
     * @param {RegionSet} [regionSetView] - (optional) already-deserialized RegionSet from the object
     * @return {DisplayedRegionModel} - inferred view region
     */
    _restoreViewRegion(object: any, regionSetView: RegionSet): DisplayedRegionModel | null;
}
