/**
 * Daofeng switched to use @gmod/bam instead
 */
declare class BamSource {
    bam: any;
    header: any;
    constructor(param: any);
    getData(locusArr: any, basesPerPixel: any, options?: {}): Promise<any>;
}
export default BamSource;
