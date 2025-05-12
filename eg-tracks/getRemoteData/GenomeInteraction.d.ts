export declare class GenomeInteraction {
    locus1: {
        [key: string]: any;
    };
    locus2: {
        [key: string]: any;
    };
    score: number;
    name: string;
    color: string;
    id: string;
    bpLocus1?: any;
    bpLocus2?: any;
    constructor(locus1: {
        [key: string]: any;
    }, locus2: {
        [key: string]: any;
    }, score?: number, name?: string, color?: string, id?: string, bpLocus1?: any, bpLocus2?: any);
    getDistance(): number;
}
