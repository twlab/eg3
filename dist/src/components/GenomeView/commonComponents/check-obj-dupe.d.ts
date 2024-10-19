export declare function removeDuplicates(arr: Array<any>, idKey: string): any[];
interface DataObject {
    start: number;
    end: number;
    [key: string]: any;
}
export declare function removeDuplicatesWithoutId(arr: DataObject[]): DataObject[];
export {};
