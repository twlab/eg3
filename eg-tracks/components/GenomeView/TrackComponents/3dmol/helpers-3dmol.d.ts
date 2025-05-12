export declare const CYTOBAND_COLORS_SIMPLE: {
    gneg: string;
    gpos: string;
    gpos25: string;
    gpos50: string;
    gpos75: string;
    gpos100: string;
    gvar: string;
    stalk: string;
    gpos33: string;
    gpos66: string;
    acen: string;
};
export declare const g3dParser: (data: any, clickCallback?: any) => {};
export declare const chromColors: {
    chr1: number;
    chr2: number;
    chr3: number;
    chr4: number;
    chr5: number;
    chr6: number;
    chr7: number;
    chr8: number;
    chr9: number;
    chr10: number;
    chr11: number;
    chr12: number;
    chr13: number;
    chr14: number;
    chr15: number;
    chr16: number;
    chr17: number;
    chr18: number;
    chr19: number;
    chr20: number;
    chr21: number;
    chr22: number;
    chr23: number;
    chrX: number;
    chrY: number;
    chrM: number;
};
/**
 * binary search from https://stackoverflow.com/questions/4431259/formal-way-of-getting-closest-values-in-array-in-javascript-given-a-value-and-a/4431347
 *
 * @param {*} a: data array
 * @param {*} x: number to be search
 */
export declare const getClosestValueIndex: (a: any, x: any) => any[];
/**
 *
 * @param {*} color as number
 * from https://bytes.com/topic/javascript/insights/636088-function-convert-decimal-color-number-into-html-hex-color-string
 */
export declare function decimalColorToHTMLcolor(number: any): string;
export declare function rgb_to_hex(red: any, green: any, blue: any): string;
/**
 *
 * @param {*} colorstr
 *
 * > parse('#ff0000')
{ space: 'rgb', values: [ 255, 0, 0 ], alpha: 1 }
> parse('rgb(255, 247, 0)')
{ space: 'rgb', values: [ 255, 247, 0 ], alpha: 1 }
>

 */
export declare const colorAsNumber: (colorstr: any) => number;
