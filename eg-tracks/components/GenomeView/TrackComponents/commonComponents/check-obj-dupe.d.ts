export declare function removeDuplicates(arr: Array<any>, idKey: any, idKey2?: any): any[];
interface DataObject {
    start: number;
    end: number;
    [key: string]: any;
}
export declare function removeDuplicatesWithoutId(arr: DataObject[]): DataObject[];
export {};
