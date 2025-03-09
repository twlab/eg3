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

    async listCustomGenomes(): Promise<IGenome[]> {
        return this.localGenomeRepository.listGenomes();
    }

    async getGenomeById(id: string): Promise<IGenome> {
        if (this.genomeCache.has(id)) {
            return this.genomeCache.get(id)!;
        }

        const genome = await this.localGenomeRepository.getGenomeById(id);

        this.genomeCache.set(id, genome);

        return genome;
    }

    isGenomeCached(id: string): boolean {
        return this.genomeCache.has(id);
    }

    getGenomeFromCache(id: string): IGenome | undefined {
        return this.genomeCache.get(id);
    }

    async putGenome(genome: IGenome): Promise<void> {
        this.localGenomeRepository.putGenome(genome);
        this.genomeCache.set(genome.id, genome);
    }
}
