import { BigWig } from "@gmod/bbi";
export declare class BigwigSource {
    url: any;
    bw: BigWig;
    constructor(url: any);
    getData(chrom: any, start: any, end: any, opts: any): Promise<any>;
}
