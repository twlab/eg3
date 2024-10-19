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
    constructor(locus1: {
        [key: string]: any;
    }, locus2: {
        [key: string]: any;
    }, score?: number, name?: string, color?: string);
    getDistance(): number;
}
