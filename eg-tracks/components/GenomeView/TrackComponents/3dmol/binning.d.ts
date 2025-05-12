/**
 * implementing UCSC like binning schema in JS
 * check http://genomewiki.ucsc.edu/index.php/Bin_indexing_system
 * modified from tabix C code
 * @author: Daofeng Li
 */
/**
 *convert region to bin
 *
 * @export
 * @param {*} beg
 * @param {*} end
 * @returns
 */
export declare function reg2bin(beg: any, end: any): number;
/**
 *convert region to bins
 *
 * @export
 * @param {*} beg
 * @param {*} end
 * @returns
 */
export declare function reg2bins(beg: any, end: any): never[] | undefined;
/**
 * find atoms based on give region, since there are different haplotyps, so return an array instead, just return the first one in each hap
 *
 * @param {*} keeper
 * @param {*} chr
 * @param {*} start
 * @param {*} end
 */
export declare function findAtomsWithRegion(keeper: any, chr: any, start: any, end: any, resolution: any, displayedModelKeys: any): never[];
export declare function getBigwigValueForAtom(keepers: any, atom: any, resolution: any): any;
export declare function getCompartmentNameForAtom(keepers: any, atom: any, resolution: any, usePromoter?: boolean): any;
export declare function atomInFilterRegions(atom: any, filterRegions: any): boolean;
