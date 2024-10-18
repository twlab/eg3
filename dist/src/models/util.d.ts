import { default as ChromosomeInterval } from './ChromosomeInterval';
interface Coordinate {
    x: number;
    y: number;
}
/**
 * Button consts found in MouseEvents.  See https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
 */
export declare enum MouseButton {
    LEFT = 0,
    MIDDLE = 1,
    RIGHT = 2
}
/**
 * Gets the x and y coordinates of a mouse event *relative to the top left corner of an element*.  By default, the
 * element is the event's `currentTarget`, the element to which the event listener has been attached.
 *
 * For example, if the top left corner of the element is at screen coordinates (10, 10) and the event's screen
 * coordinates are (11, 12), then this function will return `{x: 1, y: 2}`.
 *
 * @param {React.MouseEvent} event - the event for which to get relative coordinates
 * @param {Element} [relativeTo] - calculate coordinates relative to this element.  Default is event.currentTarget.
 * @return {Coordinate} object with props x and y that contain the relative coordinates
 */
export declare function getRelativeCoordinates(event: React.MouseEvent, relativeTo?: Element): Coordinate;
/**
 * Given coordinates relative to the top left corner of an element, gets the page coordinates.
 *
 * @param {Element} relativeTo - element to use as reference point
 * @param {number} relativeX - x coordinates inside an element
 * @param {number} relativeY - y coordinates inside an element
 * @return {Coordinate} the page coordinates
 */
export declare function getPageCoordinates(relativeTo: Element, relativeX: number, relativeY: number): Coordinate;
/**
 * Gets a color that contrasts well with the input color.  Useful for determining font color for a given background
 * color.  If parsing fails for the input color, returns black.
 *
 * Credit goes to https://stackoverflow.com/questions/1855884/determine-font-color-based-on-background-color
 *
 * @param {string} color - color for which to find a contrasting color
 * @return {string} a color that contrasts well with the input color
 */
export declare function getContrastingColor(color: string): string;
/**
 * Returns a copy of the input list, ensuring its length is below `limit`.  If the list is too long, selects
 * equally-spaced elements from the original list.  Note that if the input is sorted, the output will be sorted as well.
 *
 * @param {T[]} list - list for which to ensure a max length
 * @param {number} limit - maximum length of the result list
 * @return {T[]} copy of list with max length ensured
 */
export declare function ensureMaxListLength<T>(list: T[], limit: number): T[];
/**
 * @param {number} bases - number of bases
 * @return {string} human-readable string representing that number of bases
 */
export declare function niceBpCount(bases: number, useMinus?: boolean): string;
export declare function niceCount(bases: number): string;
export declare function ceil(value: number, precision: number): number;
export declare function readFileAsText(file: Blob): Promise<unknown>;
export declare function readFileAsBuffer(file: Blob): Promise<unknown>;
/**
 * find closest number in a number array (sorted or un-sorted)
 */
export declare function findClosestNumber(arr: number[], num: number): number;
export declare const HELP_LINKS: {
    datahub: string;
    numerical: string;
    tracks: string;
    localhub: string;
    trackOptions: string;
    textTrack: string;
    publish: string;
    threed: string;
};
/**
 * calculate pearson correlation
 * from https://stackoverflow.com/questions/15886527/javascript-library-for-pearson-and-or-spearman-correlations#
 */
export declare const pcorr: (x: number[], y: number[]) => number;
/**
 *
 * @param current {string} current genome
 * @param tracks {trackModel[]} list of tracks
 */
export declare function getSecondaryGenomes(current: string, tracks: any[]): string[];
export declare function variableIsObject(obj: any): boolean;
export declare function colorString2number(color: string): number;
export declare function repeatArray(arr: any[], count: number): any[];
export declare function sameLoci(locus1: ChromosomeInterval, locus2: ChromosomeInterval): boolean;
export declare function arraysEqual(a: any[], b: any[]): boolean;
export declare const getSymbolRegions: (genomeName: string, symbol: string) => Promise<any>;
export declare const safeParseJsonString: (str: string) => any;
export declare const parseNumberString: (str: string) => string | number;
export {};
