
interface TrackConfig {
        type: string
            name: string,
                    label?: string,
            genome?: string,
            url?: string,
            options?: Record<string, any>,
            queryEndpoint?: Record<string, any>,
            details?: Record<string, any>,
}

export const DefaultTrack: {[genomeName: string]: Array<TrackConfig>} = {
    HG38: [
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "geneAnnotation",
            name: "refGene",
            genome: "hg38",
        }),
        ({
            type: "geneAnnotation",
            name: "gencodeV39",
            genome: "hg38",
        }),
        ({
            type: "geneAnnotation",
            name: "MANE_select_1.0",
            label: "MANE selection v1.0",
            genome: "hg38",
        }),
        ({
            type: "repeatmasker",
            name: "RepeatMasker",
            url: "https://vizhub.wustl.edu/public/hg38/rmsk16.bb",
        }),
    ],
    HG19:[
        ({
            type: "ruler",
            name: "Ruler",
        }),
        // ({
        //     type: "bigwig",
        //     name: "test bigwig",
        //     url: "https://vizhub.wustl.edu/hubSample/hg19/GSM429321.bigWig",
        // }),
        ({
            type: "geneAnnotation",
            name: "refGene",
            genome: "hg19",
            options: {
                maxRows: 10,
            },
        }),
        ({
            type: "geneAnnotation",
            name: "gencodeV39",
            genome: "hg19",
            options: {
                maxRows: 10,
            },
        }),
        ({
            type: "repeatmasker",
            name: "RepeatMasker",
            url: "https://vizhub.wustl.edu/public/hg19/rmsk16.bb",
        }),
        // ({
        //     type: "bam",
        //     name: "Test bam",
        //     url: "https://wangftp.wustl.edu/~dli/test/a.bam"
        // }),
        // ({
        //     type: 'bigbed',
        //     name: 'test bigbed',
        //     url: 'https://vizhub.wustl.edu/hubSample/hg19/bigBed1'
        // }),
        // ({
        //     type: "methylc",
        //     name: "Methylation",
        //     url: "https://vizhub.wustl.edu/public/hg19/methylc2/h1.liftedtohg19.gz"
        // }),
        // ({
        //     type: "categorical",
        //     name: "ChromHMM",
        //     url: "https://egg.wustl.edu/d/hg19/E017_15_coreMarks_dense.gz",
        //     options: {
        //         category: {
        //             "1": {name: "Active TSS", color: "#ff0000"},
        //             "2": {name: "Flanking Active TSS", color: "#ff4500"},
        //             "3": {name: "Transcr at gene 5' and 3'", color: "#32cd32"},
        //             "4": {name: "Strong transcription", color: "#008000"},
        //             "5": {name: "Weak transcription", color: "#006400"},
        //             "6": {name: "Genic enhancers", color: "#c2e105"},
        //             "7": {name: "Enhancers", color: "#ffff00"},
        //             "8": {name: "ZNF genes & repeats", color: "#66cdaa"},
        //             "9": {name: "Heterochromatin", color: "#8    a91d0"},
        //             "10": {name: "Bivalent/Poised TSS", color: "#cd5c5c"},
        //             "11": {name: "Flanking Bivalent TSS/Enh", color: "#e9967a"},
        //             "12": {name: "Bivalent Enhancer", color: "#bdb76b"},
        //             "13": {name: "Repressed PolyComb", color: "#808080"},
        //             "14": {name: "Weak Repressed PolyComb", color: "#c0c0c0"},
        //             "15": {name: "Quiescent/Low", color: "#ffffff"}
        //           }
        //     }
        // }),
        // ({
        //     type: "hic",
        //     name: "test hic",
        //     url: "https://epgg-test.wustl.edu/dli/long-range-test/test.hic",
        //     options: {
        //         displayMode: 'arc'
        //     }
        // }),
        // ({
        //     name: 'hg19 to mm10 alignment',
        //     type: "genomealign",
        //     metadata: {
        //         genome: 'mm10'
        //     }
        // }),
        // ({
        //     type: 'geneAnnotation',
        //     name: 'refGene',
        //     genome: 'mm10',
        //     options: {
        //         maxRows: 10
        //     },
        //     metadata: {
        //         genome: 'mm10'
        //     }
        // }),
        // ({
        //     name: 'mm10 bigwig',
        //     type: "bigwig",
        //     url: "https://epgg-test.wustl.edu/d/mm10/ENCFF577HVF.bigWig",
        //     metadata: {
        //         genome: 'mm10'
        //     }
        // }),
        // ({
        //     type: "ruler",
        //     name: "mm10 Ruler",
        //     metadata: {
        //         genome: 'mm10'
        //     }
        // }),
        // ({
        //     type: "bed",
        //     name: "mm10 bed",
        //     url: "https://wangftp.wustl.edu/~rsears/Stuart_Little/ATAC_080818/Bruce4_sub120_extendedto120_DownSample.bed.gz",
        //     metadata: {
        //         genome: "mm10"
        //     }
        // })
    ],
    MM39:[
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "geneAnnotation",
            name: "refGene",
            genome: "mm39",
        }),
        ({
            type: "geneAnnotation",
            name: "gencodeCompVM28",
            genome: "mm39",
        }),
        ({
            type: "repeatmasker",
            name: "RepeatMasker",
            url: "https://vizhub.wustl.edu/public/mm39/rmsk16.bb",
        }),
    ],
    MM10:[
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "geneAnnotation",
            name: "refGene",
            genome: "mm10",
        }),
        // ({
        //     type: "geneAnnotation",
        //     name: "gencodeM19",
        //     genome: "mm10",
        // }),
        ({
            type: "geneAnnotation",
            name: "gencodeCompVM25",
            genome: "mm10",
        }),
        // ({
        //     type: "longrange",
        //     name: "ES-E14 ChIA-PET",
        //     url: "https://egg.wustl.edu/d/mm9/GSE28247_st3c.gz",
        // }),
        // ({
        //     type: "biginteract",
        //     name: "test bigInteract",
        //     url: "https://epgg-test.wustl.edu/dli/long-range-test/interactExample3.inter.bb",
        // }),
        ({
            type: "repeatmasker",
            name: "RepeatMasker",
            url: "https://vizhub.wustl.edu/public/mm10/rmsk16.bb",
        }),
        // ({
        //     type: 'refbed',
        //     name: 'refGene in refbed',
        //     url: 'https://wangftp.wustl.edu/~rsears/FOR_DAOFENG/gencodeM18_load_basic_Gene.bed.gz',
        // }),
        // ({
        //     type: 'cool',
        //     name: 'Cool Track',
        //     url: 'CQMd6V_cRw6iCI_-Unl3PQ'
        // }),
    ],
    MM9:[
        ({
            type: "geneAnnotation",
            name: "refGene",
            genome: "mm9",
        }),
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: 'repeatmasker',
            name: 'RepeatMasker',
            url: 'https://vizhub.wustl.edu/public/mm9/rmsk16.bb',
        }),
    ],
    PANTRO6:[
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "geneAnnotation",
            name: "refGene",
            genome: "panTro6",
        }),
        ({
            type: "repeatmasker",
            name: "RepeatMasker",
            url: "https://vizhub.wustl.edu/public/panTro6/panTro6.bb",
        }),
    ],
    PANTRO5:[
        ({
            type: "geneAnnotation",
            name: "refGene",
            genome: "panTro5",
        }),
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: 'repeatmasker',
            name: 'RepeatMasker',
            url: 'https://vizhub.wustl.edu/public/panTro5/rmsk16.bb'
        }),
    ],
    panTro4: [
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "geneAnnotation",
            name: "refGene",
            label: "refGenes",
            genome: 'panTro4'
        }),
        ({
            type: "geneAnnotation",
            name: "ensGene",
            label: "ensembl genes",
            genome: 'panTro4'
        }),
        ({
            type: 'repeatmasker',
            name: 'RepeatMasker',
            url: 'https://vizhub.wustl.edu/public/panTro4/panTro4_rmsk.bb',
        })
    ],
    BosTau8:[
        ({
            type: "geneAnnotation",
            name: "refGene",
            genome: "bosTau8",
        }),
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: 'repeatmasker',
            name: 'RepeatMasker',
            url: 'https://vizhub.wustl.edu/public/bosTau8/rmsk16.bb',
        }),
    ],
    DAN_RER11: [
        ({
            type: "geneAnnotation",
            name: "refGene",
            genome: "danRer11",
        }),
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: 'repeatmasker',
            name: 'RepeatMasker',
            url: 'https://vizhub.wustl.edu/public/danRer11/rmsk16.bb',
        }),
    ],
    DAN_RER10: [
        ({
            type: "geneAnnotation",
            name: "refGene",
            genome: "danRer10",
        }),
        ({
            type: "geneAnnotation",
            name: "Ensembl_GRCz10_91",
            genome: "danRer10",
            label:"Ensembl release 91",
        }),
        ({
            type: "ruler",
            name: "Ruler",
        }),
    ],
    DAN_RER7: [

        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: 'repeatmasker',
            name: 'RepeatMasker',
            url: 'https://vizhub.wustl.edu/public/danRer7/danRer7.bb',
        })
    ],
    RN6: [
        ({
            type: "geneAnnotation",
            name: "refGene",
            genome: "rn6",
        }),
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: 'repeatmasker',
            name: 'RepeatMasker',
            url: 'https://vizhub.wustl.edu/public/rn6/rmsk16.bb'
        }),
    ],
    rn4: [
        ({
          type: "ruler",
          name: "Ruler"
        }),
        ({
          type: "refbed",
          name: "refGene",
          genome: "rn4",
          url: "https://vizhub.wustl.edu/public/rn4/rn4.refbed.gz"
        }),
        ({
          type: "repeatmasker",
          name: "RepeatMasker",
          url: "https://vizhub.wustl.edu/public/rn4/rn4.bb"
        })
      ] ,
    RheMac8: [
        ({
            type: "geneAnnotation",
            name: "refGene",
            genome: "rheMac8",
        }),
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: 'repeatmasker',
            name: 'RepeatMasker',
            url: 'https://vizhub.wustl.edu/public/rheMac8/rmsk16.bb',
        }),
    ],
    rheMac3: [
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "geneAnnotation",
            name: "refGene",
            genome: "rheMac3",
            label: "refGenes",
        }),
        ({
            type: 'repeatmasker',
            name: 'RepeatMasker',
            url: 'https://vizhub.wustl.edu/public/rheMac3/rheMac3_rmsk.bb',
        })
    ],
    rheMac2: [
        ({
          type: "ruler",
          name: "Ruler"
        }),
        ({
          type: "refbed",
          name: "refGene",
          genome: "rheMac2",
          url: "https://vizhub.wustl.edu/public/rheMac2/rheMac2.refbed.gz"
        }),
        ({
          type: "repeatmasker",
          name: "RepeatMasker",
          url: "https://vizhub.wustl.edu/public/rheMac2/rheMac2.bb"
        })
      ],
    GalGal6:[
        ({
            type: "geneAnnotation",
            name: "refGene",
            genome: "galGal6",
        }),
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: 'repeatmasker',
            name: 'RepeatMasker',
            url: 'https://vizhub.wustl.edu/public/galGal6/rmsk16.bb',
        }),
    ],
    GalGal5:[
        ({
            type: "geneAnnotation",
            name: "refGene",
            genome: "galGal5",
        }),
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "repeatmasker",
            name: "RepeatMasker",
            url: "https://vizhub.wustl.edu/public/galGal5/rmsk16.bb",
        }),
    ],
    DM6:[
        ({
            type: "geneAnnotation",
            name: "refGene",
            genome: "dm6",
        }),
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "repeatmasker",
            name: "RepeatMasker",
            url: "https://vizhub.wustl.edu/public/dm6/rmsk16.bb",
        }),
    ],
    CE11:[
        ({
            type: "geneAnnotation",
            name: "refGene",
            genome: "ce11",
        }),
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: 'repeatmasker',
            name: 'RepeatMasker',
            url: 'https://vizhub.wustl.edu/public/ce11/rmsk16.bb',
        }),
    ],
    APLCAL3:[
        ({
            type: "ruler",
            name: "Ruler"
        }),
        ({
            type: "refbed",
            name: "ncbiGene",
            url: "https://vizhub.wustl.edu/public/aplCal3/AplCal3.sort.refbed.gz"
        }),
        ({
            type: "repeatmasker",
            name: "RepeatMasker",
            url: "https://vizhub.wustl.edu/public/aplCal3/aplCal3.bb"
        })
    ],
    SACCER3:[
        ({
            type: "geneAnnotation",
            name: "sgdGene",
            genome: "sacCer3",
        }),
        ({
            type: "ruler",
            name: "Ruler",
        }),
    ],
    Ebola:[
        ({
            type: "geneAnnotation",
            name: "ncbiGene",
            label: "NCBI genes",
            genome: "Ebola",
        }),
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "bedgraph",
            name: "GC Percentage",
            url: "https://vizhub.wustl.edu/public/virus/ebola_CGpct.bedgraph.sort.gz",
        }),
        ({
            type: "bedgraph",
            name: "Sequence Diversity (Shannon Entropy)",
            url: "https://wangftp.wustl.edu/~cfan/viralBrowser/sme/ebola/diversity/ebola_entropy.bedgraph.sort.gz",
            options: {
                aggregateMethod: "MEAN",
            },
        }),
        ({
            type: "qbed",
            name: "Mutation Alert",
            url: "https://wangftp.wustl.edu/~cfan/viralBrowser/sme/ebola/diversity/ebola_alert.bed.sort.gz",
            options: {
                height: 60,
                color: "darkgreen",
            },
        }),
    ],
    SARS:[
        ({
            type: "geneAnnotation",
            name: "ncbiGene",
            label: "NCBI genes",
            genome: "SARS",
        }),
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "bedgraph",
            name: "GC Percentage",
            url: "https://vizhub.wustl.edu/public/virus/sars_CGpct.bedgraph.sort.gz",
        }),
        ({
            type: "bedgraph",
            name: "Sequence Diversity (Shannon Entropy)",
            url: "https://wangftp.wustl.edu/~cfan/viralBrowser/sme/sars/diversity/sars_entropy.bedgraph.sort.gz",
            options: {
                aggregateMethod: "MEAN",
                height: 50,
            },
        }),
        ({
            type: "qbed",
            name: "Mutation Alert",
            url: "https://wangftp.wustl.edu/~cfan/viralBrowser/sme/sars/diversity/sars_alert.bed.sort.gz",
            options: {
                height: 60,
                color: "darkgreen",
            },
        }),
    ],
    MERS: [
        ({
            type: "geneAnnotation",
            name: "ncbiGene",
            label: "NCBI genes",
            genome: "MERS",
        }),
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "bedgraph",
            name: "GC Percentage",
            url: "https://vizhub.wustl.edu/public/virus/mers_CGpct.bedgraph.sort.gz",
        }),
        ({
            type: "bedgraph",
            name: "Sequence Diversity (Shannon Entropy)",
            url: "https://wangftp.wustl.edu/~cfan/viralBrowser/sme/mers/diversity/mers_entropy.bedgraph.sort.gz",
            options: {
                aggregateMethod: "MEAN",
            },
        }),
        ({
            type: "qbed",
            name: "Mutation Alert",
            url: "https://wangftp.wustl.edu/~cfan/viralBrowser/sme/mers/diversity/mers_alert.bed.sort.gz",
            options: {
                height: 60,
                color: "darkgreen",
            },
        }),
    ],
    nCoV2019: [
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "geneAnnotation",
            name: "ncbiGene",
            label: "NCBI genes",
            genome: "SARS-CoV-2",
        }),
        ({
            type: "categorical",
            name: "S protein annotations",
            url: "https://wangftp.wustl.edu/~cfan/viralBrowser/v2/others/hubs/gmatt/sars-cov-2_Sprot_annot_sorted.bed.gz",
            options: {
                height: 20,
                alwaysDrawLabel: true,
                maxRows: 100,
                hiddenPixels: 0,
                category: {
                    "receptor-binding domain (RBD)": {
                        name: "Binds to the ACE2 receptor (PMID: 32225176)",
                        color: "#FF0000",
                    },
                    "receptor-binding motif (RBM)": {
                        name: "Interacts directly with the ACE2 receptor (PMID: 32225176)",
                        color: "#FFC300",
                    },
                    "S1,S2 cleavage site": {
                        name: "Cleavage at this site generates the S1 and S2 subunits of the S protein (PMID: 32155444, 32532959)",
                        color: "#18872F",
                    },
                    "heptad repeat 1 (HR1)": {
                        name: "Mediates membrane fusion and viral entry into host cell (PMID: 32376627)",
                        color: "#0000FF",
                    },
                    "heptad repeat 2 (HR2)": {
                        name: "Mediates membrane fusion and viral entry into host cell (PMID: 32376627)",
                        color: "#0000FF",
                    },
                },
            },
        }),
        ({
            type: "bedgraph",
            name: "Sequence Diversity (Shannon Entropy)",
            url: "https://wangftp.wustl.edu/~cfan/gisaid/latest/diversity/ncov_entropy.bedgraph.sort.gz",
            options: {
                aggregateMethod: "MAX",
                height: 50,
            },
        }),
        // ({
        //     type: "qbed",
        //     name: "Mutation Alert",
        //     url: "https://wangftp.wustl.edu/~cfan/gisaid/latest/diversity/ncov_alert.bed.sort.gz",
        //     options: {
        //         height: 60,
        //         color: "darkgreen",
        //     },
        // }),
        ({
            name: "Viral RNA expression (nanopore)",
            type: "bigwig",
            url: "https://vizhub.wustl.edu/public/virus/VeroInf24h.bw",
            options: {
                zoomLevel: "0",
            },
        }),
        ({
            type: "bed",
            name: "Putative SARS Immune Epitopes",
            url: "https://wangftp.wustl.edu/~mchoudhary/viralBrowser/IEDB_NC_045512.2_SARS-tblastn-nCoV_3H3V6ZBF01R.bed.gz",
            options: {
                color: "#9013fe",
                displayMode: "density",
                height: 60,
            },
        }),
        ({
            type: "categorical",
            name: "Omicron: B.1.1.529 and BA lineages",
            url: "https://wangftp.wustl.edu/~jflynn/virus_genome_browser/variants_of_concern/Omicron_B.1.1.529_and_BA_lineages.bed.gz",
            options: {
                height: 20,
                alwaysDrawLabel: true,
                maxRows: 100,
                hiddenPixels: 0,
                category: {
                    A67V: { name: "A67V", color: "#F00A0A" },
                    "del69-70": { name: "del69-70", color: "#F00A0A" },
                    T95I: { name: "T95I", color: "#F00A0A" },
                    "del142-144": { name: "del142-144", color: "#F00A0A" },
                    Y145D: { name: "Y145D", color: "#F00A0A" },
                    del211: { name: "del211", color: "#F00A0A" },
                    L212I: { name: "L212I", color: "#F00A0A" },
                    ins214EPE: { name: "ins214EPE", color: "#F00A0A" },
                    G339D: { name: "G339D", color: "#F00A0A" },
                    S371L: { name: "S371L", color: "#F00A0A" },
                    S373P: { name: "S373P", color: "#F00A0A" },
                    K417N: { name: "K417N", color: "#F00A0A" },
                    N440K: { name: "N440K", color: "#F00A0A" },
                    G446S: { name: "G446S", color: "#F00A0A" },
                    S477N: { name: "S477N", color: "#F00A0A" },
                    T478K: { name: "T478K", color: "#F00A0A" },
                    E484A: { name: "E484A", color: "#F00A0A" },
                    Q493R: { name: "Q493R", color: "#F00A0A" },
                    G496S: { name: "G496S", color: "#F00A0A" },
                    Q498R: { name: "Q498R", color: "#F00A0A" },
                    N501Y: { name: "N501Y", color: "#F00A0A" },
                    Y505H: { name: "Y505H", color: "#F00A0A" },
                    T547K: { name: "T547K", color: "#F00A0A" },
                    D614G: { name: "D614G", color: "#F00A0A" },
                    H655Y: { name: "H655Y", color: "#F00A0A" },
                    N679K: { name: "N679K", color: "#F00A0A" },
                    P681H: { name: "P681H", color: "#F00A0A" },
                    N764K: { name: "N764K", color: "#F00A0A" },
                    D796Y: { name: "D796Y", color: "#F00A0A" },
                    N856K: { name: "N856K", color: "#F00A0A" },
                    Q954H: { name: "Q954H", color: "#F00A0A" },
                    N969K: { name: "N969K", color: "#F00A0A" },
                    L981F: { name: "L981F", color: "#F00A0A" },
                },
            },
            details: {
                "data source": "CDC: https://www.cdc.gov/coronavirus/2019-ncov/variants/variant-classifications.html",
                description:
                    "Omicron: B.1.1.529 and BA lineages are classified as a Variant of Concern by the CDC as of Dec 23, 2021. This track displays all associated Spike portein substitutions.",
            },
        }),
        ({
            type: "categorical",
            name: "Transcription regulatory sequences (TRSs)",
            url: "https://wangftp.wustl.edu/~cfan/viralBrowser/v2/others/hubs/gmatt/sars-cov-2_trs_sorted.bed.gz",
            options: {
                height: 15,
                alwaysDrawLabel: true,
                maxRows: 20,
                hiddenPixels: 0,
                category: {
                    "TRS-L": { name: "TRS-L", color: "#000000" },
                    "TRS-B": { name: "TRS-B", color: "#FF0000" },
                },
            },
        }),
        ({
            type: "categorical",
            name: "Protein_domains",
            url: "https://epigenome.wustl.edu/SARS-CoV-2/uniprot//Protein_domains.cat.gz",
            options: {
                height: 20,
                alwaysDrawLabel: true,
                maxRows: 100,
                hiddenPixels: 0,
                category: {
                    "Ubiquitin-like 1": {
                        name: "Ubiquitin-like 1",
                        color: "#F8766D",
                    },
                    DPUP: {
                        name: "DPUP",
                        color: "#F27D52",
                    },
                    "ExoN/MTase coa...": {
                        name: "ExoN/MTase coa...",
                        color: "#EA842F",
                    },
                    "Ubiquitin-like 2": {
                        name: "Ubiquitin-like 2",
                        color: "#E18A00",
                    },
                    "Macro 2": {
                        name: "Macro 2",
                        color: "#D79000",
                    },
                    "CV ZBD": {
                        name: "CV ZBD",
                        color: "#CB9600",
                    },
                    "Nsp15 N-termin...": {
                        name: "Nsp15 N-termin...",
                        color: "#BE9C00",
                    },
                    "+)RNA virus he...": {
                        name: "+)RNA virus he...",
                        color: "#B0A100",
                    },
                    "zinc finger": {
                        name: "zinc finger",
                        color: "#9FA600",
                    },
                    "RdRp Nsp8 cofa...": {
                        name: "RdRp Nsp8 cofa...",
                        color: "#8CAB00",
                    },
                    "CoV 3a-like vi...": {
                        name: "CoV 3a-like vi...",
                        color: "#75AF00",
                    },
                    "AV-Nsp11N/CoV-...": {
                        name: "AV-Nsp11N/CoV-...",
                        color: "#58B300",
                    },
                    "Nidovirus-type...": {
                        name: "Nidovirus-type...",
                        color: "#24B700",
                    },
                    "Nsp9 ssRNA-bin...": {
                        name: "Nsp9 ssRNA-bin...",
                        color: "#00BA38",
                    },
                    "N7-MTase": {
                        name: "N7-MTase",
                        color: "#00BC58",
                    },
                    ExoN: {
                        name: "ExoN",
                        color: "#00BE70",
                    },
                    "SARS ORF8 Ig-like": {
                        name: "SARS ORF8 Ig-like",
                        color: "#00C086",
                    },
                    NendoU: {
                        name: "NendoU",
                        color: "#00C199",
                    },
                    "BetaCoV Nsp1 C...": {
                        name: "BetaCoV Nsp1 C...",
                        color: "#00C1AB",
                    },
                    "BetaCoV S1-NTD": {
                        name: "BetaCoV S1-NTD",
                        color: "#00C0BC",
                    },
                    "RdRp Nsp7 cofa...": {
                        name: "RdRp Nsp7 cofa...",
                        color: "#00BECC",
                    },
                    "Peptidase C30": {
                        name: "Peptidase C30",
                        color: "#00BBDA",
                    },
                    X4e: {
                        name: "X4e",
                        color: "#00B7E7",
                    },
                    "Nsp12 RNA-depe...": {
                        name: "Nsp12 RNA-depe...",
                        color: "#00B2F3",
                    },
                    "CoV N NTD": {
                        name: "CoV N NTD",
                        color: "#00ACFC",
                    },
                    "CoV N CTD": {
                        name: "CoV N CTD",
                        color: "#00A5FF",
                    },
                    "Macro 1": {
                        name: "Macro 1",
                        color: "#619CFF",
                    },
                    "9b": {
                        name: "9b",
                        color: "#8B93FF",
                    },
                    "Macro 3": {
                        name: "Macro 3",
                        color: "#A989FF",
                    },
                    NiRAN: {
                        name: "NiRAN",
                        color: "#C27FFF",
                    },
                    "RdRp catalytic": {
                        name: "RdRp catalytic",
                        color: "#D575FE",
                    },
                    "Nucleic acid-b...": {
                        name: "Nucleic acid-b...",
                        color: "#E56DF5",
                    },
                    "Virion surface": {
                        name: "Virion surface",
                        color: "#F066EA",
                    },
                    "BetaCoV S1-CTD": {
                        name: "BetaCoV S1-CTD",
                        color: "#F962DD",
                    },
                    "Peptidase C16": {
                        name: "Peptidase C16",
                        color: "#FE61CE",
                    },
                    Lumenal: {
                        name: "Lumenal",
                        color: "#FF62BD",
                    },
                    "CoV Nsp1 globular": {
                        name: "CoV Nsp1 globular",
                        color: "#FF65AC",
                    },
                    Intravirion: {
                        name: "Intravirion",
                        color: "#FF6A99",
                    },
                    Nsp4C: {
                        name: "Nsp4C",
                        color: "#FD7084",
                    },
                },
            },
        }),
        // ({
        //     type: "longrange",
        //     name: "TRS-L-dependent recombination",
        //     url: "https://wangftp.wustl.edu/~cfan/viralBrowser/v2/others/hubs/gmatt/TRS-L-dependent_recombinationEvents_sorted.bed.gz",
        //     options: {
        //         yScale: "fixed",
        //         yMax: 7000000,
        //         yMin: 0,
        //         displayMode: "arc",
        //         lineWidth: 3,
        //         height: 205,
        //         greedyTooltip: true,
        //     },
        // }),
        // ({
        //     type: "dbedgraph",
        //     name: "Viral RNA Modifications",
        //     url: "https://wangftp.wustl.edu/~mchoudhary/viralBrowser/studies/kim-2020/Table_S5_frac.dbg.gz",
        //     options: {
        //         dynamicLabels: ["gRNA", "S", "3a", "E", "M", "6", "7a", "7b", "8", "N"],
        //         speed: [3],
        //     },
        //     showOnHubLoad: true,
        // }),
    ],
    hpv16: [
        ({
            type: "geneAnnotation",
            name: "ncbiGene",
            label: "NCBI genes",
            genome: "hpv16",
        }),
        ({
            type: "ruler",
            name: "Ruler",
        }),
    ],
    LEPOCU1: [
        ({
          type: "ruler",
          name: "Ruler"
        }),
        ({
          type: "refbed",
          name: "ensemblGene",
          label: "Ensembl genes",
          url: "https://vizhub.wustl.edu/public/lepOcu1/lepOcu1_Gene.bed.gz"
        }),
        ({
          type: "repeatmasker",
          name: "RepeatMasker",
          url: "https://vizhub.wustl.edu/public/lepOcu1/lepOcu1.bb"
        })
      ],
    gorGor4: [
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: 'repeatmasker',
            name: 'RepeatMasker',
            url: 'https://vizhub.wustl.edu/public/gorGor4/gorGor4.bb',
        })
    ],
    gorGor3: [
    ({
        type: "ruler",
        name: "Ruler",
    }),
    ({
        type: "geneAnnotation",
        name: "ensGene",
        label: "ensembl genes",
        genome: 'gorGor3'
    }),
    ({
        type: 'repeatmasker',
        name: 'RepeatMasker',
        url: 'https://vizhub.wustl.edu/public/gorGor3/gorGor3_rmsk.bb',
    })
],
    nomLeu3: [
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "geneAnnotation",
            name: "ensGene",
            label: "ensembl genes",
            genome: 'nomLeu3'
        }),
        ({
            type: 'repeatmasker',
            name: 'RepeatMasker',
            url: 'https://vizhub.wustl.edu/public/nomLeu3/nomLeu3_rmsk.bb',
        })
    ],
    papAnu2: [
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "geneAnnotation",
            name: "ensGene",
            label: "ensembl genes",
            genome: 'papAnu2'
        }),
        ({
            type: 'repeatmasker',
            name: 'RepeatMasker',
            url: 'https://vizhub.wustl.edu/public/papAnu2/papAnu2_rmsk.bb',
        })
    ],
    oryCun2: [
        ({
          type: "ruler",
          name: "Ruler"
        }),
        ({
          type: "refbed",
          name: "refGene",
          genome: "oryCun2",
          url: "https://vizhub.wustl.edu/public/oryCun2/oryCun2.refbed.gz"
        }),
        ({
          type: "repeatmasker",
          name: "RepeatMasker",
          url: "https://vizhub.wustl.edu/public/oryCun2/oryCun2.bb"
        })
      ],
    canFam3: [
        ({
          type: "ruler",
          name: "Ruler"
        }),
        ({
          type: "refbed",
          name: "refGene",
          genome: "canFam3",
          url: "https://vizhub.wustl.edu/public/canFam3/canFam3.refbed.gz"
        }),
        ({
          type: "repeatmasker",
          name: "RepeatMasker",
          url: "https://vizhub.wustl.edu/public/canFam3/canFam3.bb"
        })
      ],
    canFam2: [
        ({
          type: "ruler",
          name: "Ruler"
        }),
        ({
          type: "refbed",
          name: "refGene",
          genome: "canFam2",
          url: "https://vizhub.wustl.edu/public/canFam2/canFam2.refbed.gz"
        }),
        ({
          type: "repeatmasker",
          name: "RepeatMasker",
          url: "https://vizhub.wustl.edu/public/canFam2/canFam2.bb"
        })
      ],
    monDom5: [
        ({
          type: "ruler",
          name: "Ruler"
        }),
        ({
          type: "refbed",
          name: "refGene",
          genome: "monDom5",
          url: "https://vizhub.wustl.edu/public/monDom5/monDom5.refbed.gz"
        }),
        ({
          type: "repeatmasker",
          name: "RepeatMasker",
          url: "https://vizhub.wustl.edu/public/monDom5/monDom5.bb"
        })
      ],
    calJac3: [
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "geneAnnotation",
            name: "ncbiGene",
            label: "ncbi Genes",
            genome: 'calJac3'
        }),
        ({
            type: "geneAnnotation",
            name: "ensGene",
            label: "ensembl genes",
            genome: 'calJac3'
        }),
        ({
            type: 'repeatmasker',
            name: 'RepeatMasker',
            url: 'https://vizhub.wustl.edu/public/calJac3/calJac3_rmsk.bb',
        })
    ],
    AraTha1: [
        ({
            type: "geneAnnotation",
            name: "gene",
            label: "TAIR10 genes",
            genome: "araTha1",
        }),
        ({
            type: "ruler",
            name: "Ruler",
        }),
    ],
    Pfal3D7: [
        ({
            type: "geneAnnotation",
            name: "PlasmoDBGene",
            genome: "Pfal3D7",
            label: "PlasmoDB 9.0 genes",
            queryEndpoint: { name: "PlasmoDB", endpoint: "https://plasmodb.org/plasmo/app/record/gene/" },
        }),
        ({
            type: "ruler",
            name: "Ruler",
        }),
    ],
    Creinhardtii506: [
        ({
            type: "geneAnnotation",
            name: "PhytozomeGene",
            genome: "Creinhardtii506",
            queryEndpoint: {
                name: "Phytozome",
                endpoint: "https://phytozome.jgi.doe.gov/phytomine/portal.do?class=Protein&externalids=",
            },
        }),
        ({
            type: "ruler",
            name: "Ruler",
        }),
    ],
    TbruceiTREU927: [
        ({
            type: "geneAnnotation",
            name: "gene",
            label: "TriTrypDB genes",
            genome: "TbruceiTREU927",
            queryEndpoint: { name: "TriTrypDB", endpoint: "https://tritrypdb.org/tritrypdb/app/search?q=" },
        }),
        ({
            type: "ruler",
            name: "Ruler",
        }),
    ],
    TbruceiLister427: [
        ({
            type: "geneAnnotation",
            name: "gene",
            label: "TriTrypDB genes",
            genome: "TbruceiLister427",
            queryEndpoint: { name: "TriTrypDB", endpoint: "https://tritrypdb.org/tritrypdb/app/search?q=" },
        }),
        ({
            type: "ruler",
            name: "Ruler",
        }),
    ],
    CHM13v1_1: [
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "geneAnnotation",
            name: "genes",
            label: "genes from CAT and Liftoff",
            genome: "t2t-chm13-v1.1",
            options: {
                maxRows: 10,
            },
        }),
        ({
            type: "rmskv2",
            name: "RepeatMaskerV2",
            url: "https://vizhub.wustl.edu/public/t2t-chm13-v1.1/rmsk.bigBed",
        }),
    ],
    xenTro10: [
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "geneAnnotation",
            name: "refGene",
            genome: "xenTro10",
        }),
        ({
            type: "geneAnnotation",
            name: "ncbiGene",
            label: "ncbi Genes",
            genome: "xenTro10",
        }),
        ({
            type: "repeatmasker",
            name: "RepeatMasker",
            url: "https://vizhub.wustl.edu/public/xenTro10/rmsk16.bb",
        }),
    ],
    b_chiifu_v3: [
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "geneAnnotation",
            name: "gene",
            label: "Brapa genes",
            genome: "b_chiifu_v3",
        }),
    ],
    susScr11: [
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "geneAnnotation",
            name: "refGene",
            label: "RefSeq genes",
            genome: "susScr11",
        }),
        ({
            type: "geneAnnotation",
            name: "ncbiGene",
            label: "NCBI genes",
            genome: "susScr11",
        }),
        ({
            type: "repeatmasker",
            name: "RepeatMasker",
            url: "https://vizhub.wustl.edu/public/susScr11/rmsk16.bb",
        }),
    ],
    susScr3: [
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "geneAnnotation",
            name: "refGene",
            label: "RefSeq genes",
            genome: "susScr3",
        }),
        ({
            type: "geneAnnotation",
            name: "ncbiGene",
            label: "NCBI genes",
            genome: "susScr3",
        }),
        ({
            type: "repeatmasker",
            name: "RepeatMasker",
            url: "https://vizhub.wustl.edu/public/susScr3/rmsk16.bb",
        }),
    ],
    oviAri4: [
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "geneAnnotation",
            name: "refGene",
            label: "RefSeq genes",
            genome: "oviAri4",
        }),
        ({
            type: "geneAnnotation",
            name: "ncbiGene",
            label: "NCBI genes",
            genome: "oviAri4",
        }),
        ({
            type: "repeatmasker",
            name: "RepeatMasker",
            url: "https://vizhub.wustl.edu/public/oviAri4/rmsk16.bb",
        }),
    ],
    calJac4: [
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "geneAnnotation",
            name: "ncbiGene",
            label: "NCBI genes",
            genome: "calJac4",
        }),
        ({
            type: "repeatmasker",
            name: "RepeatMasker",
            url: "https://vizhub.wustl.edu/public/calJac4/rmsk16.bb",
        }),
    ],
    rheMac10: [
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "geneAnnotation",
            name: "refGene",
            label: "RefSeq genes",
            genome: "rheMac10",
        }),
        ({
            type: "geneAnnotation",
            name: "ncbiGene",
            label: "NCBI genes",
            genome: "rheMac10",
        }),
        ({
            type: "repeatmasker",
            name: "RepeatMasker",
            url: "https://vizhub.wustl.edu/public/rheMac10/rmsk16.bb",
        }),
    ],
    RN7: [
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "geneAnnotation",
            name: "refGene",
            label: "RefSeq genes",
            genome: "rn7",
        }),
        ({
            type: "geneAnnotation",
            name: "ncbiGene",
            genome: "rn7",
            label: "NCBI genes",
        }),
        ({
            type: "repeatmasker",
            name: "RepeatMasker",
            url: "https://vizhub.wustl.edu/public/rn7/rmsk16.bb",
        }),
    ],
    CHMV2: [
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "geneAnnotation",
            name: "gencodeV35",
            label: "gencodeV35",
            genome: "t2t-chm13-v2.0",
            options: {
                maxRows: 10,
            },
        }),
        ({
            type: "rmskv2",
            name: "RepeatMaskerV2",
            url: "https://vizhub.wustl.edu/public/t2t-chm13-v2.0/rmsk.bigBed",
        }),
    ],
    GRCg7b: [
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "geneAnnotation",
            name: "gene",
            genome: "GRCg7b",
        }),
    ],
    GRCg7w: [
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "geneAnnotation",
            name: "gene",
            genome: "GRCg7w",
        }),
    ],
    phaw5: [
        ({
            type: "ruler",
            name: "Ruler",
        }),
        ({
            type: "geneAnnotation",
            name: "gene",
            genome: "phaw5",
            options: {
                maxRows: 10,
            },
        }),
    ],

}