import { Feature } from './Feature';
import { default as ChromosomeInterval } from './ChromosomeInterval';
export declare class SequenceData extends Feature {
    sequence: string;
    constructor(locus: ChromosomeInterval, sequence: string);
}
