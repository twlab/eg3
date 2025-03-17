export interface IGenome {
  id: uuid;
  name: string;
  group?: string;
  chromosomes: { name: string; length: number }[];
  cytobands: any;
  defaultRegion?: any;
  defaultTracks?: any[];
  publicHubList?: any[];
  publicHubData?: any;
  annotationTracks?: any;
  twoBitURL?: string;
}

export interface IGenomeHubSource {
  listGenomes(): Promise<IGenome[]>;

  getGenomeById(id: uuid): Promise<IGenome>;

  putGenome(genome: IGenome): Promise<uuid>;

  deleteAllGenomes(): Promise<void>;
}

type uuid = string;
