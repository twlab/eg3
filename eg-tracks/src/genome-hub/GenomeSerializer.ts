import Chromosome from "../models/Chromosome";
import DisplayedRegionModel from "../models/DisplayedRegionModel";
import Genome from "../models/Genome";
import { GenomeConfig } from "../models/genomes/GenomeConfig";
import TrackModel from "../models/TrackModel";
import { IGenome } from "../types/genome-hub";
import { validateGenomeData } from "./genome-schema";

export default class GenomeSerializer {
    static serialize(genomeConfig: GenomeConfig): IGenome {
        const defaultRegion = new DisplayedRegionModel(genomeConfig.navContext, ...genomeConfig.defaultRegion).currentRegionAsString();

        const serialized: IGenome = {
            name: genomeConfig.genome.getName(),
            id: genomeConfig.genome.getName(),
            chromosomes: genomeConfig.genome["_chromosomes"].map((chr: Chromosome) => ({
                name: chr.getName(),
                length: chr.getLength(),
            })),
            cytobands: genomeConfig.cytobands ?? {},
            defaultRegion,
            defaultTracks: genomeConfig.defaultTracks.map((track) => track.serialize()),
            publicHubList: genomeConfig.publicHubList,
            publicHubData: genomeConfig.publicHubData,
            annotationTracks: genomeConfig.annotationTracks,
            twoBitURL: genomeConfig.twoBitURL || "",
        };

        return serialized;
    }

    static deserialize(object: IGenome): GenomeConfig {
        const chromosomes = object.chromosomes.map(
            (chr) => new Chromosome(chr.name, chr.length)
        );

        const genome = new Genome(object.name, chromosomes);
        const navContext = genome.makeNavContext();
        const defaultRegion = navContext.parse(object.defaultRegion ? object.defaultRegion : "chr1:0-10000");
        const defaultTracks = object.defaultTracks?.map((track) =>
            TrackModel.deserialize(track)
        );

        return {
            genome,
            navContext,
            cytobands: object.cytobands ? object.cytobands : {},
            defaultRegion,
            defaultTracks: defaultTracks ?? [],
            publicHubList: object.publicHubList ?? [],
            publicHubData: object.publicHubData,
            annotationTracks: object.annotationTracks,
            twoBitURL: object.twoBitURL,
        };
    }

    static validateGenomeObject(object: any) {
        return validateGenomeData(object);
    }
}
