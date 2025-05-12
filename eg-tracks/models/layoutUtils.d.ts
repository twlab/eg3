/**
 * utilities to deal with layouts
 * @autor Daofeng Li
 */
export declare const global0: {
    tabSetHeaderHeight: number;
    tabSetTabStripHeight: number;
    splitterSize: number;
};
export declare const global25: {
    tabSetHeaderHeight: number;
    tabSetTabStripHeight: number;
    splitterSize: number;
};
export declare const initialLayout: {
    global: {
        tabSetHeaderHeight: number;
        tabSetTabStripHeight: number;
        splitterSize: number;
    };
    layout: {
        type: string;
        children: {
            type: string;
            children: {
                type: string;
                enableClose: boolean;
                name: string;
                component: string;
                id: string;
            }[];
        }[];
    };
};
export declare function addTabSetToLayout(newTabset: any, exisingLayout: any): any;
export declare function deleteTabByIdFromLayout(layout: any, tabId: any): any;
export declare function deleteTabByIdFromModel(model: any, tabId: any): any;
export declare function tabIdExistInLayout(layout: any, tabId: any): boolean;
export declare function ensureLayoutHeader(json: any): any;
