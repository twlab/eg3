import { Feature, FeatureCollection, Geometry } from 'geojson';

/**
 * Convert GPX to GeoJSON incrementally, returning
 * a [Generator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators)
 * that yields output feature by feature.
 */
declare function gpxGen(node: Document): Generator<Feature>;
/**
 *
 * Convert a GPX document to GeoJSON. The first argument, `doc`, must be a GPX
 * document as an XML DOM - not as a string. You can get this using jQuery's default
 * `.ajax` function or using a bare XMLHttpRequest with the `.response` property
 * holding an XML DOM.
 *
 * The output is a JavaScript object of GeoJSON data, same as `.kml` outputs, with the
 * addition of a `_gpxType` property on each `LineString` feature that indicates whether
 * the feature was encoded as a route (`rte`) or track (`trk`) in the GPX document.
 */
declare function gpx(node: Document): FeatureCollection;

/**
 * Incrementally convert a TCX document to GeoJSON. The
 * first argument, `doc`, must be a TCX
 * document as an XML DOM - not as a string.
 */
declare function tcxGen(node: Document): Generator<Feature>;
/**
 * Convert a TCX document to GeoJSON. The first argument, `doc`, must be a TCX
 * document as an XML DOM - not as a string.
 */
declare function tcx(node: Document): FeatureCollection;

declare type F = Feature<Geometry | null>;

/**
 * Options to customize KML output.
 *
 * The only option currently
 * is `skipNullGeometry`. Both the KML and GeoJSON formats support
 * the idea of features that don't have geometries: in KML,
 * this is a Placemark without a Point, etc element, and in GeoJSON
 * it's a geometry member with a value of `null`.
 *
 * toGeoJSON, by default, translates null geometries in KML to
 * null geometries in GeoJSON. For systems that use GeoJSON but
 * don't support null geometries, you can specify `skipNullGeometry`
 * to omit these features entirely and only include
 * features that have a geometry defined.
 */
interface KMLOptions {
    skipNullGeometry?: boolean;
}
/**
 * A folder including metadata. Folders
 * may contain other folders or features,
 * or nothing at all.
 */
interface Folder {
    type: "folder";
    /**
     * Standard values:
     *
     * * "name",
     * * "visibility",
     * * "open",
     * * "address",
     * * "description",
     * * "phoneNumber",
     * * "visibility",
     */
    meta: {
        [key: string]: unknown;
    };
    children: Array<Folder | F>;
}
/**
 * A nested folder structure, represented
 * as a tree with folders and features.
 */
interface Root {
    type: "root";
    children: Array<Folder | F>;
}
/**
 * Yield a nested tree with KML folder structure
 *
 * This generates a tree with the given structure:
 *
 * ```js
 * {
 *   "type": "root",
 *   "children": [
 *     {
 *       "type": "folder",
 *       "meta": {
 *         "name": "Test"
 *       },
 *       "children": [
 *          // ...features and folders
 *       ]
 *     }
 *     // ...features
 *   ]
 * }
 * ```
 *
 * ### GroundOverlay
 *
 * GroundOverlay elements are converted into
 * `Feature` objects with `Polygon` geometries,
 * a property like:
 *
 * ```json
 * {
 *   "@geometry-type": "groundoverlay"
 * }
 * ```
 *
 * And the ground overlay's image URL in the `href`
 * property. Ground overlays will need to be displayed
 * with a separate method to other features, depending
 * on which map framework you're using.
 */
declare function kmlWithFolders(node: Document, options?: KMLOptions): Root;
/**
 * Convert KML to GeoJSON incrementally, returning
 * a [Generator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators)
 * that yields output feature by feature.
 */
declare function kmlGen(node: Document, options?: KMLOptions): Generator<F>;
/**
 * Convert a KML document to GeoJSON. The first argument, `doc`, must be a KML
 * document as an XML DOM - not as a string. You can get this using jQuery's default
 * `.ajax` function or using a bare XMLHttpRequest with the `.response` property
 * holding an XML DOM.
 *
 * The output is a JavaScript object of GeoJSON data. You can convert it to a string
 * with [JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)
 * or use it directly in libraries.
 */
declare function kml(node: Document, options?: KMLOptions): FeatureCollection<Geometry | null>;

export { F, Folder, KMLOptions, Root, gpx, gpxGen, kml, kmlGen, kmlWithFolders, tcx, tcxGen };
