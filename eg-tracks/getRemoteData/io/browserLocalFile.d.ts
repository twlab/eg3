declare class BrowserLocalFile {
    file: any;
    constructor(blob: any);
    read(position: any, length: any): Promise<unknown>;
}
export default BrowserLocalFile;
