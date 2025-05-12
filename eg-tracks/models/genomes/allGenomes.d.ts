import { GenomeConfig } from "./GenomeConfig";
/**
 * All available genomes.
 */
export declare const allGenomes: {
    genome: import("../Genome").Genome;
    navContext: import("../NavigationContext").default;
    defaultRegion: import("../OpenInterval").default;
    defaultTracks: import("../TrackModel").TrackModel[];
    twoBitURL: string;
    annotationTracks: any;
}[];
export declare const genomeNameToConfig: {};
interface SpeciesConfig {
    logoUrl: string;
    assemblies: string[];
    color: string;
}
export declare const treeOfLife: {
    [speciesName: string]: SpeciesConfig;
};
/**
 * @param {string} genomeName - name of a genome
 * @return {GenomeConfig} the genome's configuration object, or null if no such genome exists.
 */
export declare function getGenomeConfig(genomeName: string): GenomeConfig | null;
export declare function getSpeciesInfo(genomeName: string): {
    name: string;
    logo: string;
    color: string;
};
export {};
