export interface IGenome {
    id: uuid;
    name: string;
    chromosomes: { name: string; length: number }[];
    cytobands: any;
    defaultRegion: string;
    defaultTracks: any[];
    publicHubList: any[];
    publicHubData: any;
    annotationTracks: any;
    twoBitURL: string;
}

export interface IGenomeHubSource {
    listGenomes(): Promise<IGenome[]>;

    getGenomeById(id: uuid): Promise<IGenome>;

    putGenome(genome: IGenome): Promise<uuid>;
}

type uuid = string;
