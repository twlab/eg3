import { GenomeConfig } from './GenomeConfig';
/**
 * All available genomes.
 */
export declare const allGenomes: ({
    genome: import('../Genome').Genome;
    navContext: import('../NavigationContext').default;
    cytobands: {};
    defaultRegion: import('../OpenInterval').default;
    defaultTracks: import('../TrackModel').TrackModel[];
    twoBitURL: string;
    annotationTracks: {
        Ruler: {
            type: string;
            label: string;
            name: string;
        }[];
        Genes: {
            name: string;
            label: string;
            filetype: string;
        }[];
    };
} | {
    genome: import('../Genome').Genome;
    navContext: import('../NavigationContext').default;
    cytobands: {};
    defaultRegion: import('../OpenInterval').default;
    defaultTracks: import('../TrackModel').TrackModel[];
    twoBitURL: string;
    annotationTracks: {
        Ruler: {
            type: string;
            label: string;
            name: string;
        }[];
        Genes: {
            type: string;
            name: string;
            url: string;
        }[];
        RepeatMasker: {
            "All Repeats": {
                name: string;
                label: string;
                filetype: string;
                url: string;
                height: number;
            }[];
        };
    };
} | {
    genome: import('../Genome').Genome;
    navContext: import('../NavigationContext').default;
    defaultRegion: import('../OpenInterval').default;
    defaultTracks: import('../TrackModel').TrackModel[];
    twoBitURL: string;
    annotationTracks: {
        Ruler: {
            type: string;
            label: string;
            name: string;
        }[];
        Genes: {
            name: string;
            label: string;
            filetype: string;
            url: string;
        }[];
        RepeatMasker: {
            "All Repeats": {
                name: string;
                label: string;
                filetype: string;
                url: string;
                height: number;
            }[];
        };
    };
} | {
    genome: import('../Genome').Genome;
    navContext: import('../NavigationContext').default;
    cytobands: {
        chr1: {
            chrom: string;
            chromStart: number;
            chromEnd: number;
            name: string;
            gieStain: string;
        }[];
        chr2: {
            chrom: string;
            chromStart: number;
            chromEnd: number;
            name: string;
            gieStain: string;
        }[];
        chr3: {
            chrom: string;
            chromStart: number;
            chromEnd: number;
            name: string;
            gieStain: string;
        }[];
        chr4: {
            chrom: string;
            chromStart: number;
            chromEnd: number;
            name: string;
            gieStain: string;
        }[];
        chr5: {
            chrom: string;
            chromStart: number;
            chromEnd: number;
            name: string;
            gieStain: string;
        }[];
        chr6: {
            chrom: string;
            chromStart: number;
            chromEnd: number;
            name: string;
            gieStain: string;
        }[];
        chr7: {
            chrom: string;
            chromStart: number;
            chromEnd: number;
            name: string;
            gieStain: string;
        }[];
        chr8: {
            chrom: string;
            chromStart: number;
            chromEnd: number;
            name: string;
            gieStain: string;
        }[];
        chrM: {
            chrom: string;
            chromStart: number;
            chromEnd: number;
            name: string;
            gieStain: string;
        }[];
        chrUn: {
            chrom: string;
            chromStart: number;
            chromEnd: number;
            name: string;
            gieStain: string;
        }[];
        chrX: {
            chrom: string;
            chromStart: number;
            chromEnd: number;
            name: string;
            gieStain: string;
        }[];
    };
    defaultRegion: import('../OpenInterval').default;
    defaultTracks: import('../TrackModel').TrackModel[];
    twoBitURL: string;
    annotationTracks: {
        Ruler: {
            type: string;
            label: string;
            name: string;
        }[];
        RepeatMasker: {
            "All Repeats": {
                name: string;
                label: string;
                filetype: string;
                url: string;
                height: number;
            }[];
        };
    };
})[];
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
export declare function getGenomeConfig(genomeName: string): GenomeConfig;
export declare function getSpeciesInfo(genomeName: string): {
    name: string;
    logo: string;
    color: string;
};
export {};
