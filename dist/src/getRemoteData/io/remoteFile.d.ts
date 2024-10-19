declare class RemoteFile {
    config: any;
    url: any;
    constructor(args: any);
    read(position: any, length: any): Promise<any>;
}
export default RemoteFile;
