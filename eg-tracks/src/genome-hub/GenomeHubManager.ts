import { IGenome, IGenomeHubSource } from "../types/genome-hub";
import LocalGenomeRepository from "./LocalGenomeRepository";

export default class GenomeHubManager {
    private localGenomeRepository: IGenomeHubSource;

    private genomeCache: Map<string, IGenome> = new Map();

    private static instance: GenomeHubManager | null = null;

    private constructor() {
        this.localGenomeRepository = new LocalGenomeRepository();
    }

    static getInstance(): GenomeHubManager {
        if (!this.instance) {
            this.instance = new GenomeHubManager();
        }
        return this.instance;
    }

    listDefaultGenomes(): IGenome[] {
        return [];
    }

    async listCustomGenomes(): Promise<IGenome[]> {
        return this.localGenomeRepository.listGenomes();
    }

    async getGenomeById(id: string): Promise<IGenome> {
        return this.localGenomeRepository.getGenomeById(id);
    }

    async putGenome(genome: IGenome): Promise<void> {
        this.localGenomeRepository.putGenome(genome);
    }
}
