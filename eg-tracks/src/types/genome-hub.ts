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

export interface IListGenomeResult {
    name: string;
    genomeId: uuid;
}

type uuid = string;
