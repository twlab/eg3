declare class G3dFile {
    config: any;
    meta: any;
    file: any;
    url: any;
    remote: boolean | undefined;
    headerReady: any;
    constructor(config: any);
    initHeader(): Promise<void>;
    getMetaData(): Promise<any>;
    readHeader(): Promise<undefined>;
    getPackSize(buffer: any): any;
    readData(resolution?: number, haplotype?: string, chrom?: string): Promise<unknown>;
}
export default G3dFile;
