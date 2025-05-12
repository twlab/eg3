import { GenomeConfig } from "../models/genomes/GenomeConfig";
import { IGenome } from "../types/genome-hub";
export default class GenomeSerializer {
    static serialize(genomeConfig: GenomeConfig): IGenome;
    static deserialize(object: IGenome): GenomeConfig;
    static validateGenomeObject(object: any): {
        valid: boolean;
        errors: any;
    } | {
        valid: boolean;
        errors?: undefined;
    };
}
