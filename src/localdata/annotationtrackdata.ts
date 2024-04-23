
interface AnnotationTracks{
    Ruler: Array<Record<string, string>>,
    Genes?: Array<Record<string, string | Record<string, string | Record<string, string>>>>,
    RepeatMasker?: {[key: string]: Array<Record<string, string | number>>},
    "Transcription Factor"?: Array<Record<string, string>>,
    Conservation?: Array<Record<string, string | number | Record<string, string>>>,
    "Genome Annotation"?:Array<Record<string, string | number | {[key: string]: Record<string, string > | string | number |Record<string, Record<string, string >> }|Record<string, string>>>
    "Genome Comparison"?: Array<Record<string, string | number | Record<string, string> >>,
    Mappability?: Array<Record<string, string | number | Record<string, string | number> >>,
    Variation?: Array<Record<string, string>>,
    Assembly?: Array<Record<string, string>>,
    Diversity?:  Array<Record<string, string | Record<string, string | number> >>,
    Proteins?: Array<Record<string, string | number | {[key: string]: Record<string, string > | string | number | boolean| Record<string, Record<string, string >> }|Record<string, string>>>
}


export const AnnotationTrackData: {[genomeName: string]: AnnotationTracks} = {
    HG38: { "Ruler": [
        {
            "type": "ruler",
            "label": "Ruler",
            "name": "Ruler"
        }
    ],
    "Genes": [
        {
            "name": "refGene",
            "label": "RefSeq genes",
            "filetype": "geneAnnotation"
        },
        {
            "name": "MANE_select_1.0",
            "label": "MANE selection v1.0",
            "filetype": "geneAnnotation"
        },
        {
            "name": "gencodeV39",
            "label": "GENCODE V39 genes",
            "options": {
                "categoryColors": {
                    "coding": "rgb(0,60,179)",
                    "nonCoding": "rgb(0,128,0)",
                    "pseudogene": "rgb(230,0,172)",
                    "problem": "rgb(255,0,0)",
                    "polyA": "rgb(0,0,51)"
                }
            },
            "filetype": "geneAnnotation"
        }
    ],
    "Transcription Factor": [
        {
            "name": "JASPAR Transcription Factors 2022",
            "type": "jaspar",
            "url": "https://hgdownload.soe.ucsc.edu/gbdb/hg38/jaspar/JASPAR2022.bb"
        }
    ],
    "Variation": [
        {
            "name": "SNVs from Ensembl",
            "label": "SNVs from Ensembl",
            "type": "snp"
        }
    ],
    "RepeatMasker": {
        "All Repeats": [
            {
                "name": "rmsk_all",
                "label": "RepeatMasker",
                "filetype": "repeatmasker",
                "url": "https://vizhub.wustl.edu/public/hg38/rmsk16.bb",
                "height": 30
            }
        ]
    },
    "Conservation": [
        {
            "name": "vertebratephastCons100way",
            "label": "Vertebrate PhastCons 100-way",
            "filetype": "bigwig",
            "url": "https://vizhub.wustl.edu/public/hg38/conservation/hg38.phastCons100way.bw",
            "height": 50,
            "options": { "color": "#006385" }
        },
        {
            "name": "vertebratephyloP100way",
            "label": "Vertebrate PhyloP 100-way",
            "filetype": "bigwig",
            "url": "https://vizhub.wustl.edu/public/hg38/conservation/hg38.phyloP100way.bw",
            "height": 50,
            "options": { "color": "#006385", "color2": "#852100" }
        },
        {
            "name": "mammalianphastCons30way",
            "label": "Mammalian PhastCons 30-way",
            "filetype": "bigwig",
            "url": "https://vizhub.wustl.edu/public/hg38/conservation/hg38.phastCons30way.bw",
            "height": 50,
            "options": { "color": "#006385" }
        },
        {
            "name": "mammalianphyloP30way",
            "label": "Mammalian PhyloP 30-way",
            "filetype": "bigwig",
            "url": "https://vizhub.wustl.edu/public/hg38/conservation/hg38.phyloP30way.bw",
            "height": 50,
            "options": { "color": "#006385", "color2": "#852100" }
        }
    ],
    "Genome Annotation": [
        {
            "name": "blacklist",
            "label": "hg38 Encode Blacklist",
            "filetype": "bed",
            "url": "https://epgg-test.wustl.edu/d/hg38/hg38.blacklist.bed.gz",
            "height": 21,
            "options": {
                "color": "#000000"
            },
            "details": {
                "source": "mod/mouse/humanENCODE Blacklists",
                "download url": "http://mitra.stanford.edu/kundaje/akundaje/release/blacklists/hg38-human/hg38.blacklist.bed.gz"
            }
        },
        {
            "type": "categorical",
            "name": "CpG Context",
            "url": "https://epgg-test.wustl.edu/d/hg38/hg38_cpgIslands_Shores_Shelves.bed.gz",
            "height": 30,
            "options": {
                "label": "CpG Context",
                "category": {
                    "Island": { "name": "Island", "color": "#05B678" },
                    "Shore": { "name": "Shore", "color": "#F5DC69" },
                    "Shelf": { "name": "Shelf", "color": "#07C6EC" }
                },
                "backgroundColor": "#071CEC"
            }
        },
        {
            "type": "categorical",
            "name": "CpG Context (unmasked)",
            "url": "https://epgg-test.wustl.edu/d/hg38/hg38_cpgIslands_unmasked_Shores_Shelves.bed.gz",
            "height": 30,
            "options": {
                "label": "CpG Context (unmasked)",
                "category": {
                    "Island": { "name": "Island", "color": "#05B678" },
                    "Shore": { "name": "Shore", "color": "#F5DC69" },
                    "Shelf": { "name": "Shelf", "color": "#07C6EC" }
                },
                "backgroundColor": "#071CEC"
            }
        },
        {
            "type": "categorical",
            "name": "CpG Islands",
            "url": "https://epgg-test.wustl.edu/d/hg38/hg38_cpgIslands_category.bed.gz",
            "height": 30,
            "options": {
                "label": "CpG Context",
                "category": {
                    "CGI": { "name": "CGI", "color": "#FE8801" }
                }
            }
        },
        {
            "type": "categorical",
            "name": "CpG Islands (unmasked)",
            "url": "https://epgg-test.wustl.edu/d/hg38/hg38_cpgIslands_unmasked_category.bed.gz",
            "height": 30,
            "options": {
                "label": "CpG Context (unmasked)",
                "category": {
                    "CGI": { "name": "CGI", "color": "#FE8801" }
                }
            }
        },
        {
            "name": "gc5Base",
            "label": "GC percent",
            "filetype": "bigwig",
            "url": "https://egg.wustl.edu/d/hg38/gc5Base.bigWig",
            "height": 30,
            "options": {
                "color": "#4785C2",
                "color2": "#4747C2",
                "yScale": "fixed",
                "yMin": 0,
                "yMax": 100
            }
        }
    ],
    "Genome Comparison": [
        {
            "name": "hg38tomm10",
            "label": "Query mouse mm10 to hg38 blastz",
            "querygenome": "mm10",
            "filetype": "genomealign",
            "url": "https://vizhub.wustl.edu/public/hg38/weaver/hg38_mm10_axt.gz"
        },
        {
            "name": "hg38tot2t-chm13v2",
            "label": "hg38 - chm13v2.0 minimap2",
            "querygenome": "t2t-chm13-v2.0",
            "filetype": "genomealign",
            "url": "https://vizhub.wustl.edu/public/hg38/weaver/chm13v2.hg38.align.gz"
        },
        {
            "name": "hg38tot2t-chm13v1.1",
            "label": "hg38 - chm13v1.1 minimap2",
            "querygenome": "t2t-chm13-v1.1",
            "filetype": "genomealign",
            "url": "https://vizhub.wustl.edu/public/hg38/weaver/querychm13tohg38.align.gz"
        },
        {
            "name": "hg38topantro5",
            "label": "query Chimpanzee panTro5 to hg38 blastz",
            "querygenome": "panTro5",
            "filetype": "genomealign",
            "url": "https://vizhub.wustl.edu/public/hg38/weaver/hg38_panTro5_axt.gz",
            "details": {
                "source": "UCSC Genome Browser",
                "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/hg38/vsPanTro5/"
            }
        },
        {
            "name": "hg38topanTro6",
            "label": "Query chimpanzee panTro6 to hg38 blastz",
            "querygenome": "panTro6",
            "filetype": "genomealign",
            "url": "https://vizhub.wustl.edu/public/hg38/weaver/hg38TopanTro6.gz",
            "details": {
                "source": "UCSC Genome Browser",
                "download url": "http://hgdownload.soe.ucsc.edu/goldenPath/hg38/vsPanTro6/"
            }
        },
        {
            "name": "hg38torheMac3",
            "label": "Query rhesus Macaque rheMac3 to hg38 blastz",
            "querygenome": "rheMac3",
            "filetype": "genomealign",
            "url": "https://vizhub.wustl.edu/public/hg38/weaver/hg38_rheMac3_axt.gz"
        },
        {
            "name": "hg38torheMac8",
            "label": "Query rhesus rheMac8 to hg38 blastz",
            "querygenome": "rheMac8",
            "filetype": "genomealign",
            "url": "https://vizhub.wustl.edu/public/hg38/weaver/hg38-rheMac8.gz",
            "details": {
                "source": "UCSC Genome Browser",
                "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/hg38/vsRheMac8/"
            }
        },
        {
            "name": "hg38torheMac10",
            "label": "Query rhesus Macaque rheMac10 to hg38 blastz",
            "querygenome": "rheMac10",
            "filetype": "genomealign",
            "url": "https://vizhub.wustl.edu/public/hg38/weaver/hg38-rheMac10.gz"
        },
        {
            "name": "hg38topapAnu2",
            "label": "Query baboon papAnu2 to hg38 blastz",
            "querygenome": "papAnu2",
            "filetype": "genomealign",
            "url": "https://vizhub.wustl.edu/public/hg38/weaver/hg38.papAnu2.net.gz",
            "details": {
                "source": "UCSC Genome Browser",
                "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/hg38/vsPapAnu2/"
            }
        },
        {
            "name": "hg38tobosTau8",
            "label": "Query cow bosTau8 to hg38 blastz",
            "querygenome": "bosTau8",
            "filetype": "genomealign",
            "url": "https://vizhub.wustl.edu/public/hg38/weaver/hg38-bosTau8.gz",
            "details": {
                "source": "UCSC Genome Browser",
                "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/hg38/vsBosTau8/"
            }
        },
        {
            "name": "hg38tocalJac3",
            "label": "Query marmoset calJac3 to hg38 blastz",
            "querygenome": "calJac3",
            "filetype": "genomealign",
            "url": "https://vizhub.wustl.edu/public/hg38/weaver/hg38-calJac3.gz",
            "details": {
                "source": "UCSC Genome Browser",
                "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/hg38/vsCalJac3/"
            }
        },
        {
            "name": "hg38tocalJac4",
            "label": "Query marmoset calJac4 to hg38 blastz",
            "querygenome": "calJac4",
            "filetype": "genomealign",
            "url": "https://vizhub.wustl.edu/public/hg38/weaver/hg38-calJac4.gz",
            "details": {
                "source": "UCSC Genome Browser",
                "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/hg38/vsCalJac4/"
            }
        },
        {
            "name": "hg38togalGal6",
            "label": "Query chicken galGal6 to hg38 blastz",
            "querygenome": "galGal6",
            "filetype": "genomealign",
            "url": "https://vizhub.wustl.edu/public/hg38/weaver/hg38-galGal6.gz",
            "details": {
                "source": "UCSC Genome Browser",
                "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/hg38/vsGalGal6/"
            }
        },
        {
            "name": "hg38togorGor4",
            "label": "Query gorilla gorGor4 to hg38 blastz",
            "querygenome": "gorGor4",
            "filetype": "genomealign",
            "url": "https://vizhub.wustl.edu/public/hg38/weaver/hg38-gorGor4.gz",
            "details": {
                "source": "UCSC Genome Browser",
                "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/hg38/vsGorGor4/"
            }
        },
        {
            "name": "hg38tomm39",
            "label": "Query mouse mm39 to hg38 blastz",
            "querygenome": "mm39",
            "filetype": "genomealign",
            "url": "https://vizhub.wustl.edu/public/hg38/weaver/hg38-mm39.gz",
            "details": {
                "source": "UCSC Genome Browser",
                "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/hg38/vsMm39/"
            }
        },
        {
            "name": "hg38topanTro4",
            "label": "Query chimp panTro4 to hg38 blastz",
            "querygenome": "panTro4",
            "filetype": "genomealign",
            "url": "https://vizhub.wustl.edu/public/hg38/weaver/hg38-panTro4.gz",
            "details": {
                "source": "UCSC Genome Browser",
                "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/hg38/vsPanTro4/"
            }
        },
        {
            "name": "hg38torn6",
            "label": "Query rat rn6 to hg38 blastz",
            "querygenome": "rn6",
            "filetype": "genomealign",
            "url": "https://vizhub.wustl.edu/public/hg38/weaver/hg38.rn6.gz",
            "details": {
                "source": "UCSC Genome Browser",
                "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/hg38/vsRn6/"
            }
        },
        {
            "name": "hg38tosusScr3",
            "label": "Query pig susScr3 to hg38 blastz",
            "querygenome": "susScr3",
            "filetype": "genomealign",
            "url": "https://vizhub.wustl.edu/public/hg38/weaver/hg38-susScr3.gz",
            "details": {
                "source": "UCSC Genome Browser",
                "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/hg38/vsSusScr3/"
            }
        }
    ],
    "Mappability": [
        {
            "name": "24mer Mapability",
            "label": "24mer alignability",
            "filetype": "bigwig",
            "url": "https://epgg-test.wustl.edu/d/hg38/hg38.mappability.24.bigwig",
            "height": 30,
            "options": {
                "yScale": "fixed",
                "yMin": 0,
                "yMax": 1
            },
            "details": {
                "datafiletype": "Mapability",
                "size": "24mer",
                "software": "GEM",
                "runby": "X.Zhuo"
            }
        },
        {
            "name": "36mer Mapability",
            "label": "36mer alignability",
            "filetype": "bigwig",
            "url": "https://epgg-test.wustl.edu/d/hg38/hg38.mappability.36.bigwig",
            "height": 30,
            "options": {
                "yScale": "fixed",
                "yMin": 0,
                "yMax": 1
            },
            "details": {
                "datafiletype": "Mapability",
                "size": "36mer",
                "software": "GEM",
                "runby": "X.Zhuo"
            }
        },
        {
            "name": "50mer Mapability",
            "label": "50mer alignability",
            "filetype": "bigwig",
            "url": "https://epgg-test.wustl.edu/d/hg38/hg38.mappability.50.bigwig",
            "height": 30,
            "options": {
                "yScale": "fixed",
                "yMin": 0,
                "yMax": 1
            },
            "details": {
                "datafiletype": "Mapability",
                "size": "50mer",
                "software": "GEM",
                "runby": "X.Zhuo"
            }
        },
        {
            "name": "75mer Mapability",
            "label": "75mer alignability",
            "filetype": "bigwig",
            "url": "https://epgg-test.wustl.edu/d/hg38/hg38.mappability.75.bigwig",
            "height": 30,
            "options": {
                "yScale": "fixed",
                "yMin": 0,
                "yMax": 1
            },
            "details": {
                "datafiletype": "Mapability",
                "size": "75mer",
                "software": "GEM",
                "runby": "X.Zhuo"
            }
        },
        {
            "name": "100mer Mapability",
            "label": "100mer alignability",
            "filetype": "bigwig",
            "url": "https://epgg-test.wustl.edu/d/hg38/hg38.mappability.100.bigwig",
            "height": 30,
            "options": {
                "yScale": "fixed",
                "yMin": 0,
                "yMax": 1
            },
            "details": {
                "datafiletype": "Mapability",
                "size": "100mer",
                "software": "GEM",
                "runby": "X.Zhuo"
            }
        }
    ]
    },
    HG19: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "refGene",
                "label": "RefSeq genes",
                "filetype": "geneAnnotation"
            },
            {
                "name": "gencodeV39",
                "label": "GENCODE V39 genes",
                "options": {
                    "categoryColors": {
                        "coding": "rgb(0,60,179)",
                        "nonCoding": "rgb(0,128,0)",
                        "pseudogene": "rgb(230,0,172)",
                        "problem": "rgb(255,0,0)",
                        "polyA": "rgb(0,0,51)"
                    }
                },
                "filetype": "geneAnnotation"
            },
            {
                "name": "gencodeV19",
                "label": "GENCODE V19 genes",
                "url": "https://vizhub.wustl.edu/public/hg19/gencodeV19.refBed.gz",
                "options": {
                    "categoryColors": {
                        "coding": "rgb(0,60,179)",
                        "nonCoding": "rgb(0,128,0)",
                        "pseudogene": "rgb(230,0,172)",
                        "problem": "rgb(255,0,0)",
                        "polyA": "rgb(0,0,51)"
                    }
                },
                "filetype": "refbed"
            }
        ],
        "Transcription Factor": [
            {
                "name": "JASPAR Transcription Factors 2022",
                "type": "jaspar",
                "url": "https://hgdownload.soe.ucsc.edu/gbdb/hg19/jaspar/JASPAR2022.bb"
            }
        ],
        "Variation": [
            {
                "name": "SNVs from Ensembl",
                "label": "SNVs from Ensembl",
                "type": "snp"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/hg19/rmsk16.bb",
                    "height": 40
                }
            ]
        },
        "Conservation": [
            {
                "name": "vertebratephastCons46way",
                "label": "Vertebrate PhastCons 46-way",
                "filetype": "bedgraph",
                "url": "https://egg.wustl.edu/d/hg19/vertebratephastCons46way.gz",
                "height": 50,
                "options": { "color": "#006385" }
            },
            {
                "name": "primatephastCons46way",
                "label": "Primate PhastCons 46-way",
                "filetype": "bedgraph",
                "url": "https://egg.wustl.edu/d/hg19/primatephastCons46way.gz",
                "height": 50,
                "options": { "color": "#006385" }
            },
            {
                "name": "placentalphastCons46way",
                "label": "Placental PhastCons 46-way",
                "filetype": "bedgraph",
                "url": "https://egg.wustl.edu/d/hg19/placentalphastCons46way.gz",
                "height": 50,
                "options": { "color": "#006385" }
            },
            {
                "name": "vertebratephyloP46way",
                "label": "Vertebrate PhyloP 46-way",
                "filetype": "bedgraph",
                "url": "https://egg.wustl.edu/d/hg19/vertebratephyloP46way.gz",
                "height": 50,
                "options": { "color": "#006385", "color2": "#852100" }
            },
            {
                "name": "primatephyloP46way",
                "label": "Primate PhyloP 46-way",
                "filetype": "bedgraph",
                "url": "https://egg.wustl.edu/d/hg19/primatephyloP46way.gz",
                "height": 50,
                "options": { "color": "#006385", "color2": "#852100" }
            },
            {
                "name": "placentalphyloP46way",
                "label": "Placental PhyloP 46-way",
                "filetype": "bedgraph",
                "url": "https://egg.wustl.edu/d/hg19/placentalphyloP46way.gz",
                "height": 50,
                "options": { "color": "#006385", "color2": "#852100" }
            }
        ],
        "Genome Annotation": [
            {
                "name": "blacklist",
                "label": "hg19 Encode Blacklist",
                "filetype": "bed",
                "url": "https://epgg-test.wustl.edu/d/hg19/hg19.blacklist.bed.gz",
                "height": 21,
                "options": {
                    "color": "#000000"
                },
                "details": {
                    "source": "mod/mouse/humanENCODE Blacklists",
                    "download url": "http://mitra.stanford.edu/kundaje/akundaje/release/blacklists/hg19-human/wgEncodeHg19ConsensusSignalArtifactRegions.bed.gz"
                }
            },
            {
                "type": "categorical",
                "name": "CpG Context",
                "url": "https://epgg-test.wustl.edu/d/hg19/hg19_cpgIslands_Shores_Shelves.bed.gz",
                "height": 30,
                "options": {
                    "label": "CpG Context",
                    "category": {
                        "Island": { "name": "Island", "color": "#05B678" },
                        "Shore": { "name": "Shore", "color": "#F5DC69" },
                        "Shelf": { "name": "Shelf", "color": "#07C6EC" }
                    },
                    "backgroundColor": "#071CEC"
                }
            },
            {
                "type": "categorical",
                "name": "CpG Context (unmasked)",
                "url": "https://epgg-test.wustl.edu/d/hg19/hg19_cpgIslands_unmasked_Shores_Shelves.bed.gz",
                "height": 30,
                "options": {
                    "label": "CpG Context (unmasked)",
                    "category": {
                        "Island": { "name": "Island", "color": "#05B678" },
                        "Shore": { "name": "Shore", "color": "#F5DC69" },
                        "Shelf": { "name": "Shelf", "color": "#07C6EC" }
                    },
                    "backgroundColor": "#071CEC"
                }
            },
            {
                "type": "categorical",
                "name": "CpG Islands",
                "url": "https://epgg-test.wustl.edu/d/hg19/hg19_cpgIslands_category.bed.gz",
                "height": 30,
                "options": {
                    "label": "CpG Context",
                    "category": {
                        "CGI": { "name": "CGI", "color": "#FE8801" }
                    }
                }
            },
            {
                "type": "categorical",
                "name": "CpG Islands (unmasked)",
                "url": "https://epgg-test.wustl.edu/d/hg19/hg19_cpgIslands_unmasked_category.bed.gz",
                "height": 30,
                "options": {
                    "label": "CpG Context (unmasked)",
                    "category": {
                        "CGI": { "name": "CGI", "color": "#FE8801" }
                    }
                }
            },
            {
                "name": "CpGs",
                "label": "CpGs",
                "filetype": "bed",
                "url": "https://egg.wustl.edu/d/hg19/CpGsites.gz",
                "height": 21,
                "options": {
                    "color": "#cc00cc"
                }
            },
            {
                "name": "gc5Base",
                "label": "GC percent",
                "filetype": "bigwig",
                "url": "https://egg.wustl.edu/d/hg19/gc5Base.bigWig",
                "height": 30,
                "options": {
                    "color": "#4785C2",
                    "color2": "#4747C2",
                    "yScale": "fixed",
                    "yMin": 0,
                    "yMax": 100
                }
            }
        ],
        "Genome Comparison": [
            {
                "name": "hg19tomm9",
                "label": "Query mouse mm9 to hg19 blastz",
                "querygenome": "mm9",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/hg19/weaver/hg19_mm9_axt.gz"
            },
            {
                "name": "hg19tomm10",
                "label": "Query mouse mm10 to hg19 blastz",
                "querygenome": "mm10",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/hg19/weaver/hg19_mm10_axt.gz"
            },
            {
                "name": "hg19torn4",
                "label": "Query rat rn4 to hg19 blastz",
                "querygenome": "rn4",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/hg19/weaver/hg19_rn4_axt.gz"
            },
            {
                "name": "hg19torheMac3",
                "label": "Query rhesus macaque rheMac3 to hg19 blastz",
                "querygenome": "rheMac3",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/hg19/weaver/hg19_rheMac3_axt.gz"
            },
            {
                "name": "hg19todanRer7",
                "label": "Query zebrafish danRer7 to hg19 blastz",
                "querygenome": "danRer7",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/hg19/weaver/hg19_danRer7_axt.gz"
            },
            {
                "name": "hg19tocalJac3",
                "label": "Query marmoset calJac3 to hg19 blastz",
                "querygenome": "calJac3",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/hg19/weaver/hg19-calJac3.gz",
                "details": {
                    "source": "UCSC Genome Browser",
                    "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/hg19/vsCalJac3/axtNet/"
                }
            },
            {
                "name": "hg19todanRer10",
                "label": "Query zebrafish danRer10 to hg19 blastz",
                "querygenome": "danRer10",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/hg19/weaver/hg19-danRer10.gz",
                "details": {
                    "source": "UCSC Genome Browser",
                    "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/hg19/vsDanRer10/axtNet/"
                }
            },
            {
                "name": "hg19togorGor3",
                "label": "Query gorilla gorgor3 to hg19 blastz",
                "querygenome": "gorGor3",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/hg19/weaver/hg19-gorGor3.gz",
                "details": {
                    "source": "UCSC Genome Browser",
                    "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/hg19/vsGorGor3/axtNet/"
                }
            },
            {
                "name": "hg19topanTro4",
                "label": "Query chimp panTro4 to hg19 blastz",
                "querygenome": "panTro4",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/hg19/weaver/hg19-panTro4.gz",
                "details": {
                    "source": "UCSC Genome Browser",
                    "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/hg19/vsPanTro4/axtNet/"
                }
            },
            {
                "name": "hg19topanTro5",
                "label": "Query chimp panTro5 to hg19 blastz",
                "querygenome": "panTro5",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/hg19/weaver/hg19-panTro5.gz",
                "details": {
                    "source": "UCSC Genome Browser",
                    "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/hg19/vsPanTro5/axtNet/"
                }
            },
            {
                "name": "hg19topanTro6",
                "label": "Query chimp panTro6 to hg19 blastz",
                "querygenome": "panTro6",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/hg19/weaver/hg19-panTro6.gz",
                "details": {
                    "source": "UCSC Genome Browser",
                    "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/hg19/vsPanTro6/"
                }
            },
            {
                "name": "hg19topapAnu2",
                "label": "Query baboon papAnu2 to hg19 blastz",
                "querygenome": "papAnu2",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/hg19/weaver/hg19-papAnu2.gz",
                "details": {
                    "source": "UCSC Genome Browser",
                    "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/hg19/vsPapAnu2/axtNet/"
                }
            },
            {
                "name": "hg19torn6",
                "label": "Query rat rn6 to hg19 blastz",
                "querygenome": "rn6",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/hg19/weaver/hg19-rn6.gz",
                "details": {
                    "source": "UCSC Genome Browser",
                    "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/hg19/vsRn6/axtNet/"
                }
            }
        ],
        "Mappability": [
            {
                "name": "wgEncodeCrgMapabilityAlign100mer",
                "label": "100mer alignability ENCODE/CRG(Guigo)",
                "filetype": "bigwig",
                "url": "https://egg.wustl.edu/d/hg19/wgEncodeCrgMapabilityAlign100mer.bigWig",
                "height": 30,
                "options": {
                    "yScale": "fixed",
                    "yMin": 0,
                    "yMax": 1
                },
                "details": {
                    "datafiletype": "Mapability",
                    "subId": 4945,
                    "size": "100mer",
                    "uniqueness": "no more than 2 mismatches",
                    "software": "GEM",
                    "download": "https://hgdownload.cse.ucsc.edu/goldenPath/hg19/encodeDCC/wgEncodeMapability/"
                }
            },
            {
                "name": "wgEncodeCrgMapabilityAlign75mer",
                "label": "75mer alignability ENCODE/CRG(Guigo)",
                "filetype": "bigwig",
                "url": "https://egg.wustl.edu/d/hg19/wgEncodeCrgMapabilityAlign75mer.bigWig",
                "height": 30,
                "options": {
                    "yScale": "fixed",
                    "yMin": 0,
                    "yMax": 1
                },
                "details": {
                    "datafiletype": "Mapability",
                    "subId": 4945,
                    "size": "75mer",
                    "uniqueness": "no more than 2 mismatches",
                    "software": "GEM",
                    "download": "https://hgdownload.cse.ucsc.edu/goldenPath/hg19/encodeDCC/wgEncodeMapability/"
                }
            },
            {
                "name": "wgEncodeCrgMapabilityAlign50mer",
                "label": "50mer alignability ENCODE/CRG(Guigo)",
                "filetype": "bigwig",
                "url": "https://egg.wustl.edu/d/hg19/wgEncodeCrgMapabilityAlign50mer.bigWig",
                "height": 50,
                "options": {
                    "yScale": "fixed",
                    "yMin": 0,
                    "yMax": 1
                },
                "details": {
                    "datafiletype": "Mapability",
                    "subId": 4945,
                    "size": "50mer",
                    "uniqueness": "no more than 2 mismatches",
                    "software": "GEM",
                    "download": "https://hgdownload.cse.ucsc.edu/goldenPath/hg19/encodeDCC/wgEncodeMapability/"
                }
            },
            {
                "name": "wgEncodeCrgMapabilityAlign40mer",
                "label": "40mer alignability ENCODE/CRG(Guigo)",
                "filetype": "bigwig",
                "url": "https://egg.wustl.edu/d/hg19/wgEncodeCrgMapabilityAlign40mer.bigWig",
                "height": 30,
                "options": {
                    "yScale": "fixed",
                    "yMin": 0,
                    "yMax": 1
                },
                "details": {
                    "datafiletype": "Mapability",
                    "subId": 4945,
                    "size": "40mer",
                    "uniqueness": "no more than 2 mismatches",
                    "software": "GEM",
                    "download": "https://hgdownload.cse.ucsc.edu/goldenPath/hg19/encodeDCC/wgEncodeMapability/"
                }
            },
            {
                "name": "wgEncodeCrgMapabilityAlign36mer",
                "label": "36mer alignability ENCODE/CRG(Guigo)",
                "filetype": "bigwig",
                "url": "https://egg.wustl.edu/d/hg19/wgEncodeCrgMapabilityAlign36mer.bigWig",
                "height": 30,
                "options": {
                    "yScale": "fixed",
                    "yMin": 0,
                    "yMax": 1
                },
                "details": {
                    "datafiletype": "Mapability",
                    "subId": 4945,
                    "size": "36mer",
                    "uniqueness": "no more than 2 mismatches",
                    "software": "GEM",
                    "download": "https://hgdownload.cse.ucsc.edu/goldenPath/hg19/encodeDCC/wgEncodeMapability/"
                }
            },
            {
                "name": "wgEncodeCrgMapabilityAlign24mer",
                "label": "24mer alignability ENCODE/CRG(Guigo)",
                "filetype": "bigwig",
                "url": "https://egg.wustl.edu/d/hg19/wgEncodeCrgMapabilityAlign24mer.bigWig",
                "height": 30,
                "options": {
                    "yScale": "fixed",
                    "yMin": 0,
                    "yMax": 1
                },
                "details": {
                    "datafiletype": "Mapability",
                    "subId": 4945,
                    "size": "24mer",
                    "uniqueness": "no more than 2 mismatches",
                    "software": "GEM",
                    "download": "https://hgdownload.cse.ucsc.edu/goldenPath/hg19/encodeDCC/wgEncodeMapability/"
                }
            }
        ]
    },
    MM39: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "refGene",
                "label": "RefSeq genes",
                "filetype": "geneAnnotation"
            },
            {
                "name": "gencodeCompVM28",
                "label": "Gencode Comp VM28 genes",
                "filetype": "geneAnnotation"
            }
        ],
        "Transcription Factor": [
            {
                "name": "JASPAR Transcription Factors 2022",
                "type": "jaspar",
                "url": "https://hgdownload.soe.ucsc.edu/gbdb/mm39/jaspar/JASPAR2022.bb"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/mm10/rmsk16.bb",
                    "height": 30
                }
            ]
        }
        

    },
    MM10: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "refGene",
                "label": "RefSeq genes",
                "filetype": "geneAnnotation"
            },
            {
                "name": "gencodeCompVM25",
                "label": "GENCODE M25 genes",
                "options": {
                    "categoryColors": {
                        "coding": "rgb(0,60,179)",
                        "nonCoding": "rgb(0,128,0)",
                        "pseudogene": "rgb(230,0,172)",
                        "problem": "rgb(255,0,0)",
                        "polyA": "rgb(0,0,51)"
                    }
                },
                "filetype": "geneAnnotation"
            },
            {
                "name": "gencodeM19Basic",
                "label": "GENCODE M19 basic genes",
                "options": {
                    "categoryColors": {
                        "coding": "rgb(0,60,179)",
                        "nonCoding": "rgb(0,128,0)",
                        "pseudogene": "rgb(230,0,172)",
                        "problem": "rgb(255,0,0)",
                        "polyA": "rgb(0,0,51)"
                    }
                },
                "filetype": "geneAnnotation"
            }
        ],
        "Transcription Factor": [
            {
                "name": "JASPAR Transcription Factors 2022",
                "type": "jaspar",
                "url": "https://hgdownload.soe.ucsc.edu/gbdb/mm10/jaspar/JASPAR2022.bb"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/mm10/rmsk16.bb",
                    "height": 30
                }
            ]
        },
        "Conservation": [
            {
                "name": "VertebratephastCons60way",
                "label": "Vertebrate PhastCons 60-way",
                "filetype": "bigwig",
                "url": "https://egg.wustl.edu/d/mm10/phastCons.bigWig",
                "height": 30,
                "options": { "color": "#006385" }
            },
            {
                "name": "EuarchontoGliresphastCons60way",
                "label": "EuarchontoGlires PhastCons 60-way",
                "filetype": "bigwig",
                "url": "https://egg.wustl.edu/d/mm10/phastCons60wayEuarchontoGlire.bigWig",
                "height": 30,
                "options": { "color": "#006385" }
            },
            {
                "name": "GliresphastCons60way",
                "label": "Glires PhastCons 60-way",
                "filetype": "bigwig",
                "url": "https://egg.wustl.edu/d/mm10/phastCons60wayGlire.bigWig",
                "height": 30,
                "options": { "color": "#006385" }
            },
            {
                "name": "PlacentalsphastCons60way",
                "label": "Placental PhastCons 60-way",
                "filetype": "bigwig",
                "url": "https://egg.wustl.edu/d/mm10/phastCons60wayPlacental.bigWig",
                "height": 30,
                "options": { "color": "#006385" }
            },
            {
                "name": "VertebratephyloP60way",
                "label": "Vertebrate PhyloP 60-way",
                "filetype": "bigwig",
                "url": "https://egg.wustl.edu/d/mm10/phyloP60way.bigWig",
                "height": 30,
                "options": { "color": "#006385", "color2": "#852100" }
            },
            {
                "name": "EuarchontoGliresphyloP60way",
                "label": "EuarchontoGlires PhyloP 60-way",
                "filetype": "bigwig",
                "url": "https://egg.wustl.edu/d/mm10/phyloP60wayEuarchontoglire.bigWig",
                "height": 30,
                "options": { "color": "#006385", "color2": "#852100" }
            },
            {
                "name": "GliresphyloP60way",
                "label": "Glires PhyloP 60-way",
                "filetype": "bigwig",
                "url": "https://egg.wustl.edu/d/mm10/phastCons60wayGlire.bigWig",
                "height": 30,
                "options": { "color": "#006385", "color2": "#852100" }
            },
            {
                "name": "PlacentalephyloP60way",
                "label": "Placental PhyloP 60-way",
                "filetype": "bigwig",
                "url": "https://egg.wustl.edu/d/mm10/phyloP60wayPlacental.bigWigg",
                "height": 30,
                "options": { "color": "#006385", "color2": "#852100" }
            }
        ],
        "Genome Annotation": [
            {
                "name": "blacklist",
                "label": "mm10 Encode Blacklist",
                "filetype": "bed",
                "url": "https://epgg-test.wustl.edu/d/mm10/mm10.blacklist.bed.gz",
                "height": 21,
                "options": {
                    "color": "#000000"
                },
                "details": {
                    "source": "mod/mouse/humanENCODE Blacklists",
                    "download url": "http://mitra.stanford.edu/kundaje/akundaje/release/blacklists/mm10-mouse/mm10.blacklist.bed.gz"
                }
            },
            {
                "type": "categorical",
                "name": "CpG Context",
                "url": "https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands_Shores_Shelves.bed.gz",
                "height": 30,
                "options": {
                    "label": "CpG Context",
                    "category": {
                        "Island": { "name": "Island", "color": "#05B678" },
                        "Shore": { "name": "Shore", "color": "#F5DC69" },
                        "Shelf": { "name": "Shelf", "color": "#07C6EC" }
                    },
                    "backgroundColor": "#071CEC"
                }
            },
            {
                "type": "categorical",
                "name": "CpG Context (unmasked)",
                "url": "https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands_unmasked_Shores_Shelves.bed.gz",
                "height": 30,
                "options": {
                    "label": "CpG Context (unmasked)",
                    "category": {
                        "Island": { "name": "Island", "color": "#05B678" },
                        "Shore": { "name": "Shore", "color": "#F5DC69" },
                        "Shelf": { "name": "Shelf", "color": "#07C6EC" }
                    },
                    "backgroundColor": "#071CEC"
                }
            },
            {
                "type": "categorical",
                "name": "CpG Islands",
                "url": "https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands_category.bed.gz",
                "height": 30,
                "options": {
                    "label": "CpG Context",
                    "category": {
                        "CGI": { "name": "CGI", "color": "#FE8801" }
                    }
                }
            },
            {
                "type": "categorical",
                "name": "CpG Islands (unmasked)",
                "url": "https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands_unmasked_category.bed.gz",
                "height": 30,
                "options": {
                    "label": "CpG Context (unmasked)",
                    "category": {
                        "CGI": { "name": "CGI", "color": "#FE8801" }
                    }
                }
            },
            {
                "name": "CpGs",
                "label": "CpGs",
                "filetype": "bed",
                "url": "https://epgg-test.wustl.edu/d/mm10/CpG.bed.gz",
                "height": 21,
                "options": {
                    "color": "#cc00cc"
                }
            },
            {
                "name": "gc5Base",
                "label": "GC percent",
                "filetype": "bigwig",
                "url": "https://egg.wustl.edu/d/mm10/gc5Base.bigWig",
                "height": 30,
                "options": {
                    "color": "#4785C2",
                    "color2": "#4747C2",
                    "yScale": "fixed",
                    "yMin": 0,
                    "yMax": 100
                }
            }
        ],
        "Genome Comparison": [
            {
                "name": "mm10todanRer7",
                "label": "Query zebrafish danRer7 to mm10 blastz",
                "querygenome": "danRer7",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/mm10/weaver/mm10_danRer7_axt.gz"
            },
            {
                "name": "mm10tohg19",
                "label": "Query human hg19 to mm10 blastz",
                "querygenome": "hg19",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/mm10/weaver/mm10_hg19_axt.gz"
            },
            {
                "name": "mm10tohg38",
                "label": "Query human hg38 to mm10 blastz",
                "querygenome": "hg38",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/mm10/weaver/mm10_hg38_axt.gz"
            },
            {
                "name": "mm10torheMac3",
                "label": "Query rhesus macaque rheMac3 to mm10 blastz",
                "querygenome": "rheMac3",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/mm10/weaver/mm10_rheMac3_axt.gz"
            },
            {
                "name": "mm10torn6",
                "label": "Query rat rn6 to mm10 blastz",
                "querygenome": "rn6",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/mm10/weaver/mm10.rn6.gz"
            },
            {
                "name": "mm10tobosTau8",
                "label": "Query cow bosTau8 to mm10 blastz",
                "querygenome": "bosTau8",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/mm10/weaver/mm10-bosTau8.gz",
                "details": {
                    "source": "UCSC Genome Browser",
                    "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/mm10/vsBosTau8/axtNet/"
                }
            },
            {
                "name": "mm10tocalJac3",
                "label": "Query marmoset calJac3 to mm10 blastz",
                "querygenome": "calJac3",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/mm10/weaver/mm10-calJac3.gz",
                "details": {
                    "source": "UCSC Genome Browser",
                    "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/mm10/vsCalJac3/axtNet/"
                }
            },
            {
                "name": "mm10todanRer10",
                "label": "Query zebrafish danRer10 to mm10 blastz",
                "querygenome": "danRer10",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/mm10/weaver/mm10-danRer10.gz",
                "details": {
                    "source": "UCSC Genome Browser",
                    "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/mm10/vsDanRer10/axtNet/"
                }
            },
            {
                "name": "mm10todanRer11",
                "label": "Query zebrafish danRer11 to mm10 blastz",
                "querygenome": "danRer11",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/mm10/weaver/mm10-danRer11.gz",
                "details": {
                    "source": "UCSC Genome Browser",
                    "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/mm10/vsDanRer11/axtNet/"
                }
            },
            {
                "name": "mm10togalGal5",
                "label": "Query chicken galGal5 to mm10 blastz",
                "querygenome": "galGal5",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/mm10/weaver/mm10-galGal5.gz",
                "details": {
                    "source": "UCSC Genome Browser",
                    "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/mm10/vsGalGal5/axtNet/"
                }
            },
            {
                "name": "mm10togalGal6",
                "label": "Query chicken galGal6 to mm10 blastz",
                "querygenome": "galGal6",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/mm10/weaver/mm10-galGal6.gz",
                "details": {
                    "source": "UCSC Genome Browser",
                    "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/mm10/vsGalGal6/axtNet/"
                }
            },
            {
                "name": "mm10togorGor3",
                "label": "Query gorilla gorGor3 to mm10 blastz",
                "querygenome": "gorGor3",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/mm10/weaver/mm10-gorGor3.gz",
                "details": {
                    "source": "UCSC Genome Browser",
                    "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/mm10/vsGorGor3/axtNet/"
                }
            },
            {
                "name": "mm10topanTro4",
                "label": "Query chimp panTro4 to mm10 blastz",
                "querygenome": "panTro4",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/mm10/weaver/mm10-panTro4.gz",
                "details": {
                    "source": "UCSC Genome Browser",
                    "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/mm10/vsPanTro4/axtNet/"
                }
            },
            {
                "name": "mm10topanTro5",
                "label": "Query chimp panTro5 to mm10 blastz",
                "querygenome": "panTro5",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/mm10/weaver/mm10-panTro5.gz",
                "details": {
                    "source": "UCSC Genome Browser",
                    "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/mm10/vsPanTro5/axtNet/"
                }
            },
            {
                "name": "mm10topanTro6",
                "label": "Query chimp panTro6 to mm10 blastz",
                "querygenome": "panTro6",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/mm10/weaver/mm10-panTro6.gz",
                "details": {
                    "source": "UCSC Genome Browser",
                    "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/mm10/vsPanTro6/axtNet/"
                }
            },
            {
                "name": "mm10torheMac8",
                "label": "Query rhesus rheMac8 to mm10 blastz",
                "querygenome": "rheMac8",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/mm10/weaver/mm10-rheMac8.gz",
                "details": {
                    "source": "UCSC Genome Browser",
                    "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/mm10/vsRheMac8/axtNet/"
                }
            }
        ],
        "Mappability": [
            {
                "name": "24mer Mapability",
                "label": "24mer alignability",
                "filetype": "bigwig",
                "url": "https://epgg-test.wustl.edu/d/mm10/mm10.mappability.24.bw",
                "height": 30,
                "options": {
                    "yScale": "fixed",
                    "yMin": 0,
                    "yMax": 1,
                    "color": "#09B4BC"
                },
                "details": {
                    "datafiletype": "Mapability",
                    "size": "24mer",
                    "software": "GEM",
                    "runby": "R.Sears"
                }
            },
            {
                "name": "36mer Mapability",
                "label": "36mer alignability",
                "filetype": "bigwig",
                "url": "https://epgg-test.wustl.edu/d/mm10/mm10.mappability.36.bw",
                "height": 30,
                "options": {
                    "yScale": "fixed",
                    "yMin": 0,
                    "yMax": 1,
                    "color": "#09B4BC"
                },
                "details": {
                    "datafiletype": "Mapability",
                    "size": "36mer",
                    "software": "GEM",
                    "runby": "R.Sears"
                }
            },
            {
                "name": "50mer Mapability",
                "label": "50mer alignability",
                "filetype": "bigwig",
                "url": "https://epgg-test.wustl.edu/d/mm10/mm10.mappability.50.bw",
                "height": 30,
                "options": {
                    "yScale": "fixed",
                    "yMin": 0,
                    "yMax": 1,
                    "color": "#09B4BC"
                },
                "details": {
                    "datafiletype": "Mapability",
                    "size": "50mer",
                    "software": "GEM",
                    "runby": "R.Sears"
                }
            },
            {
                "name": "75mer Mapability",
                "label": "75mer alignability",
                "filetype": "bigwig",
                "url": "https://epgg-test.wustl.edu/d/mm10/mm10.mappability.75.bw",
                "height": 30,
                "options": {
                    "yScale": "fixed",
                    "yMin": 0,
                    "yMax": 1,
                    "color": "#09B4BC"
                },
                "details": {
                    "datafiletype": "Mapability",
                    "size": "75mer",
                    "software": "GEM",
                    "runby": "R.Sears"
                }
            },
            {
                "name": "100mer Mapability",
                "label": "100mer alignability",
                "filetype": "bigwig",
                "url": "https://epgg-test.wustl.edu/d/mm10/mm10.mappability.100.bw",
                "height": 30,
                "options": {
                    "yScale": "fixed",
                    "yMin": 0,
                    "yMax": 1,
                    "color": "#09B4BC"
                },
                "details": {
                    "datafiletype": "Mapability",
                    "size": "100mer",
                    "software": "GEM",
                    "runby": "R.Sears"
                }
            },
            {
                "name": "150mer Mapability",
                "label": "150mer alignability",
                "filetype": "bigwig",
                "url": "https://epgg-test.wustl.edu/d/mm10/mm10.mappability.150.bw",
                "height": 30,
                "options": {
                    "yScale": "fixed",
                    "yMin": 0,
                    "yMax": 1,
                    "color": "#09B4BC"
                },
                "details": {
                    "datafiletype": "Mapability",
                    "size": "150mer",
                    "software": "GEM",
                    "runby": "R.Sears"
                }
            }
        ]
    }
    ,
    MM9: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "refGene",
                "label": "RefSeq genes",
                "filetype": "geneAnnotation"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/mm9/rmsk16.bb",
                    "height": 30
                }
            ]
        },
        
        
        "Genome Comparison": [
            {
                "name": "mm9tohg19",
                "label": "Query human hg19 to mm9 blastz",
                "querygenome": "hg19",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/mm9/weaver/mm9_hg19_axt.gz"
            },
            {
                "name": "mm9tocalJac3",
                "label": "Query marmoset calJac3 to mm9 blastz",
                "querygenome": "calJac3",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/mm9/weaver/mm9-calJac3.gz",
                "details": {
                    "source": "UCSC Genome Browser",
                    "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/mm9/vsCalJac3/axtNet/"
                }
            }
        ]
    }
    ,
    PANTRO6: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "refGene",
                "label": "RefSeq genes",
                "filetype": "geneAnnotation"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/panTro6/panTro6.bb",
                    "height": 30
                }
            ]
        }
    }
    ,
    PANTRO5: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "refGene",
                "label": "RefSeq genes",
                "filetype": "geneAnnotation"
            }
         ],
         "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/panTro5/rmsk16.bb",
                    "height": 30
                }
            ]
        },
        "Genome Comparison": [
            {
                "name": "panTro5tohg38",
                "label": "Query human hg38 to panTro5 blastz",
                "querygenome": "hg38",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/panTro5/weaver/panTro5_hg38_axt.gz",
                "details": {
                    "source": "UCSC Genome Browser",
                    "download url": "https://hgdownload.soe.ucsc.edu/goldenPath/panTro5/vsHg38/"
                }
            }
        ]
    },
    panTro4: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "refGene",
                "label": "RefSeq genes",
                "filetype": "geneAnnotation"
            },
            {
                "name": "ensGene",
                "label": "Ensembl genes",
                "filetype": "geneAnnotation"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/panTro4/panTro4_rmsk.bb",
                    "height": 30
                }
            ]
        },
        "Genome Comparison": [
            {
                "name": "panTro4tohg19",
                "label": "Query human hg19 to panTro4 blastz",
                "querygenome": "hg19",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/panTro4/panTro4_hg19.gz"
            }
        ]
    }
    ,
    BosTau8: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "refGene",
                "label": "RefSeq genes",
                "filetype": "geneAnnotation"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/bosTau8/rmsk16.bb",
                    "height": 30
                }
            ]
        },
        "Genome Annotation": [
            {
                "type": "bed",
                "name": "CpG Islands",
                "url": "https://epgg-test.wustl.edu/d/bosTau8/cpgisland.gz",
                "height": 30
            }
        ],
        "Genome Comparison": [
            {
                "name": "bosTau8tomm10",
                "label": "Blastz using bosTau8 as reference and mm10 as query",
                "querygenome": "mm10",
                "metadata": {"genome": "mm10"},
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/bosTau8/weaver/bosTau8_mm10_axt.gz"
            }
        ]
    }
    ,
    DAN_RER11: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "refGene",
                "label": "RefSeq genes",
                "filetype": "geneAnnotation"
            }
        ],
        "Transcription Factor": [
            {
                "name": "JASPAR Transcription Factors 2022",
                "type": "jaspar",
                "url": "https://vizhub.wustl.edu/public/JASPAR/2022/JASPAR2022_danRer11.bb"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/danRer11/rmsk16.bb",
                    "height": 30
                }
            ]
        },
        "Genome Comparison": [
            {
                "name": "danRer11tohg38",
                "label": "hg38 to danRer11 blastz",
                "querygenome": "hg38",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/danRer11/weaver/danRer11_hg38_axt.gz"
            },
            {
                "name": "danRer11tomm39",
                "label": "mm39 to danRer11 blastz",
                "querygenome": "mm39",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/danRer11/weaver/danRer11_mm39_axt.gz"
            },
            {
                "name": "danRer11tomm10",
                "label": "mm10 to danRer11 blastz",
                "querygenome": "mm10",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/danRer11/weaver/danRer11_mm10_axt.gz"
            },
            {
                "name": "danRer11tolepOcu1",
                "label": "Ensembl lastz using zebrafish danRer11 as reference and lepOcu1 as query",
                "querygenome": "lepOcu1",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/danRer11/weaver/danRer11.lepocu1.gz"
            }
        ]
    }
    ,
    DAN_RER10: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "refGene",
                "label": "RefSeq genes",
                "filetype": "geneAnnotation"
            }, 
            {
                "name": "Ensembl_GRCz10_91",
                "label": "Ensembl release 91 genes",
                "options": {
                    "categoryColors": {
                        "coding": "rgb(0,60,179)",
                        "nonCoding": "rgb(0,128,0)",
                        "pseudogene": "rgb(230,0,172)",
                        "problem": "rgb(255,0,0)",
                        "polyA": "rgb(0,0,51)"
                    }
                },
                "filetype": "geneAnnotation"
            }
         ],
         "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/danRer10/rmsk16.bb",
                    "height": 30
                }
            ]
        },
        "Genome Annotation": [
            {
                "type": "categorical",
                "name": "CpG Context",
                "url": "https://epgg-test.wustl.edu/d/danRer10/DanRer10_cpgIslands_Shores_Shelves.bed.gz",
                "height": 30,
                "options": {
                  "label": "CpG Context",
                  "category": {
                    "Island": {"name": "Island", "color": "#05B678"},
                    "Shore": { "name": "Shore", "color": "#F5DC69"},
                    "Shelf": { "name": "Shelf", "color": "#07C6EC"}
                  },
                  "backgroundColor":"#071CEC"
                }
            },
            {
                "type": "categorical",
                "name": "CpG Context (unmasked)",
                "url": "https://epgg-test.wustl.edu/d/danRer10/DanRer10_cpgIslands_unmasked_Shores_Shelves.bed.gz",
                "height": 30,
                "options": {
                  "label": "CpG Context (unmasked)",
                  "category": {
                    "Island": {"name": "Island", "color": "#05B678"},
                    "Shore": { "name": "Shore", "color": "#F5DC69"},
                    "Shelf": { "name": "Shelf", "color": "#07C6EC"}
                  },
                  "backgroundColor":"#071CEC"
                }
            },
            {
                "type": "categorical",
                "name": "CpG Islands",
                "url": "https://epgg-test.wustl.edu/d/danRer10/DanRer10_cpgIslands_category.bed.gz",
                "height": 30,
                "options": {
                  "label": "CpG Context",
                  "category": {
                    "CGI": {"name": "CGI", "color": "#FE8801"}
                  }
                }
            },
            {
                "type": "categorical",
                "name": "CpG Islands (unmasked)",
                "url": "https://epgg-test.wustl.edu/d/danRer10/DanRer10_cpgIslands_unmasked_category.bed.gz",
                "height": 30,
                "options": {
                  "label": "CpG Context (unmasked)",
                  "category": {
                    "CGI": {"name": "CGI", "color": "#FE8801"}
                  }
                }
            },
            {
                "name": "CpGs",
                "label": "CpGs",
                "filetype": "bed",
                "url": "https://epgg-test.wustl.edu/d/danRer10/CpG_simple.bed.gz",
                "height": 21,
                "options": {
                    "color": "#cc00cc"
                }
             },
            {
                "name": "gc5Base",
                "label": "GC percent",
                "filetype": "bigwig",
                "url": "https://egg.wustl.edu/d/danRer10/gc5Base.bigWig",
                "height": 30,
                "options": {
                    "color": "#4785C2",
                    "color2": "#4747C2",
                    "yScale": "fixed",
                    "yMin": 0,
                    "yMax": 100
                }
            }
        ],
        "Mappability": [
             {
                "name": "24mer Mapability",
                "label": "24mer alignability",
                "filetype": "bigwig",
                "url": "https://epgg-test.wustl.edu/d/danRer10/danRer10.mappability.24.bw",
                "height": 30,
                "options": {
                    "yScale": "fixed",
                    "yMin": 0,
                    "yMax": 1,
                    "color": "#09B4BC"
                },
                "details": {
                    "datafiletype": "Mapability",
                    "size": "24mer",
                    "software": "GEM",
                    "runby": "R.Sears"
                }
            },
            {
                "name": "36mer Mapability",
                "label": "36mer alignability",
                "filetype": "bigwig",
                "url": "https://epgg-test.wustl.edu/d/danRer10/danRer10.mappability.36.bw",
                "height": 30,
                "options": {
                    "yScale": "fixed",
                    "yMin": 0,
                    "yMax": 1,
                    "color": "#09B4BC"
                },
                "details": {
                    "datafiletype": "Mapability",
                    "size": "36mer",
                    "software": "GEM",
                    "runby": "R.Sears"
                }
            },
            {
                "name": "50mer Mapability",
                "label": "50mer alignability",
                "filetype": "bigwig",
                "url": "https://epgg-test.wustl.edu/d/danRer10/danRer10.mappability.50.bw",
                "height": 30,
                "options": {
                    "yScale": "fixed",
                    "yMin": 0,
                    "yMax": 1,
                    "color": "#09B4BC"
                },
                "details": {
                    "datafiletype": "Mapability",
                    "size": "50mer",
                    "software": "GEM",
                    "runby": "R.Sears"
                }
            },
            {
                "name": "75mer Mapability",
                "label": "75mer alignability",
                "filetype": "bigwig",
                "url": "https://epgg-test.wustl.edu/d/danRer10/danRer10.mappability.75.bw",
                "height": 30,
                "options": {
                    "yScale": "fixed",
                    "yMin": 0,
                    "yMax": 1,
                    "color": "#09B4BC"
                },
                "details": {
                    "datafiletype": "Mapability",
                    "size": "75mer",
                    "software": "GEM",
                    "runby": "R.Sears"
                }
            },  
            {
                "name": "100mer Mapability",
                "label": "100mer alignability",
                "filetype": "bigwig",
                "url": "https://epgg-test.wustl.edu/d/danRer10/danRer10.mappability.100.bw",
                "height": 30,
                "options": {
                    "yScale": "fixed",
                    "yMin": 0,
                    "yMax": 1,
                    "color": "#09B4BC"
                },
                "details": {
                    "datafiletype": "Mapability",
                    "size": "100mer",
                    "software": "GEM",
                    "runby": "R.Sears"
                }
            },
            {
                "name": "150mer Mapability",
                "label": "150mer alignability",
                "filetype": "bigwig",
                "url": "https://epgg-test.wustl.edu/d/danRer10/danRer10.mappability.150.bw",
                "height": 30,
                "options": {
                    "yScale": "fixed",
                    "yMin": 0,
                    "yMax": 1,
                    "color": "#09B4BC"
                },
                "details": {
                    "datafiletype": "Mapability",
                    "size": "150mer",
                    "software": "GEM",
                    "runby": "R.Sears"
                }
            }
        ]
    }
            
    ,
    DAN_RER7: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
    
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/danRer7/danRer7.bb",
                    "height": 30
                }
            ]
        },
        "Genome Annotation": [
            {
                "type": "categorical",
                "name": "CpG Islands (unmasked)",
                "url": "https://vizhub.wustl.edu/public/danRer7/danRer7.CGI.txt.gz",
                "height": 30,
                "options": {
                  "label": "CpG Context (unmasked)",
                  "category": {
                    "CGI": {"name": "CGI", "color": "#FE8801"}
                  }
                }
            }
        ],
        "Genome Comparison": [
    
        ]
    },
    RN6: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "refGene",
                "label": "RefSeq genes",
                "filetype": "geneAnnotation"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/rn6/rmsk16.bb",
                    "height": 30
                }
            ]
        }
    }
    ,
    rn4: {"Ruler": [{"type": "ruler", "label": "Ruler", "name": "Ruler"}], "Genes": [{"name": "refGene", "label": "RefSeq genes", "filetype": "refbed", "url": "https://vizhub.wustl.edu/public/rn4/rn4.refbed.gz"}], "RepeatMasker": {"All Repeats": [{"name": "rmsk_all", "label": "RepeatMasker", "filetype": "repeatmasker", "url": "https://vizhub.wustl.edu/public/rn4/rn4.bb", "height": 30}]}},
    RheMac8: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "refGene",
                "label": "RefSeq genes",
                "filetype": "geneAnnotation"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/rheMac8/rmsk16.bb",
                    "height": 30
                }
            ]
        }
    }
    ,
    rheMac3: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "refGene",
                "label": "RefSeq genes",
                "filetype": "geneAnnotation"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/rheMac3/rheMac3_rmsk.bb",
                    "height": 30
                }
            ]
        },
        "Genome Comparison": [
            {
                "name": "rheMac3tohg19",
                "label": "Query human hg19 to rheMac3 blastz",
                "querygenome": "hg19",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/rheMac3/rheMac3_hg19.gz"
            }
        ]
    }
    ,
    rheMac2: {"Ruler": [{"type": "ruler", "label": "Ruler", "name": "Ruler"}], "Genes": [{"name": "refGene", "label": "RefSeq genes", "filetype": "refbed", "url": "https://vizhub.wustl.edu/public/rheMac2/rheMac2.refbed.gz"}], "RepeatMasker": {"All Repeats": [{"name": "rmsk_all", "label": "RepeatMasker", "filetype": "repeatmasker", "url": "https://vizhub.wustl.edu/public/rheMac2/rheMac2.bb", "height": 30}]}},
    GalGal6: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "refGene",
                "label": "RefSeq genes",
                "filetype": "geneAnnotation"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/galGal6/rmsk16.bb",
                    "height": 30
                }
            ]
        }
    }
    ,
    GalGal5: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "refGene",
                "label": "RefSeq genes",
                "filetype": "geneAnnotation"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/galGal5/rmsk16.bb",
                    "height": 30
                }
            ]
        }
    }
    ,
    DM6: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "refGene",
                "label": "RefSeq genes",
                "filetype": "geneAnnotation"
            }
        ],
        "Transcription Factor": [
            {
                "name": "JASPAR Transcription Factors 2022",
                "type": "jaspar",
                "url": "https://vizhub.wustl.edu/public/JASPAR/2022/JASPAR2022_dm6.bb"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/dm6/rmsk16.bb",
                    "height": 30
                }
            ]
        }
    }
    ,
    CE11: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "refGene",
                "label": "RefSeq genes",
                "filetype": "geneAnnotation"
            }
        ],
        "Transcription Factor": [
            {
                "name": "JASPAR Transcription Factors 2022",
                "type": "jaspar",
                "url": "https://vizhub.wustl.edu/public/JASPAR/2022/JASPAR2022_ce11.bb"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/ce11/rmsk16.bb",
                    "height": 30
                }
            ]
        }
    }
    ,
    APLCAL3: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "refGene",
                "label": "RefSeq genes",
                "filetype": "geneAnnotation"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/aplCal3/aplCal3.bb",
                    "height": 30
                }
            ]
        }
    },
    SACCER3: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "sgdGene",
                "label": "SGD genes",
                "filetype": "geneAnnotation"
            },
            {
                "name": "refGene",
                "label": "NCBI RefSeq genes",
                "filetype": "geneAnnotation"
            }
        ],
        "Transcription Factor": [
            {
                "name": "JASPAR Transcription Factors 2022",
                "type": "jaspar",
                "url": "https://vizhub.wustl.edu/public/JASPAR/2022/JASPAR2022_sacCer3.bb"
            }
        ]
    }
    ,
    Ebola: {
        Ruler: [
            {
                type: "ruler",
                label: "Ruler",
                name: "Ruler",
            },
        ],
        Genes: [
            {
                name: "ncbiGene",
                label: "NCBI genes",
                filetype: "geneAnnotation",
            },
        ],
        Assembly: [
            {
                type: "bedgraph",
                name: "GC Percentage",
                url: "https://vizhub.wustl.edu/public/virus/ebola_CGpct.bedgraph.sort.gz",
            },
        ],
        Diversity: [
            {
                type: "bedgraph",
                name: "Sequence Diversity (Shannon Entropy)",
                url: "https://wangftp.wustl.edu/~cfan/viralBrowser/sme/ebola/diversity/ebola_entropy.bedgraph.sort.gz",
                options: {
                    aggregateMethod: "MEAN",
                    height: 50,
                },
            },
            {
                type: "qbed",
                name: "Mutation Alert",
                url: "https://wangftp.wustl.edu/~cfan/viralBrowser/sme/ebola/diversity/ebola_alert.bed.sort.gz",
            },
        ],
    },
    SARS: {
        Ruler: [
            {
                type: "ruler",
                label: "Ruler",
                name: "Ruler",
            },
        ],
        Genes: [
            {
                name: "ncbiGene",
                label: "NCBI genes",
                filetype: "geneAnnotation",
            },
        ],
        Assembly: [
            {
                type: "bedgraph",
                name: "GC Percentage",
                url: "https://vizhub.wustl.edu/public/virus/sars_CGpct.bedgraph.sort.gz",
            },
        ],
        Diversity: [
            {
                type: "bedgraph",
                name: "Sequence Diversity (Shannon Entropy)",
                url: "https://wangftp.wustl.edu/~cfan/viralBrowser/sme/sars/diversity/sars_entropy.bedgraph.sort.gz",
                options: {
                    aggregateMethod: "MEAN",
                },
            },
            {
                type: "qbed",
                name: "Mutation Alert",
                url: "https://wangftp.wustl.edu/~cfan/viralBrowser/sme/sars/diversity/sars_alert.bed.sort.gz",
            },
        ],
        "Genome Comparison": [
            {
                name: "nCoV2019tosars",
                label: "nCoV2019 to SARS alignment",
                querygenome: "nCoV2019",
                filetype: "genomealign",
                url: "https://vizhub.wustl.edu/public/virus/sars_ncov.genomealign.gz",
            },
            {
                name: "merstosars",
                label: "MERS to SARS alignment",
                querygenome: "MERS",
                filetype: "genomealign",
                url: "https://vizhub.wustl.edu/public/virus/sars_mers.genomealign.gz",
            },
        ],
    },
    MERS: {
        Ruler: [
            {
                type: "ruler",
                label: "Ruler",
                name: "Ruler",
            },
        ],
        Genes: [
            {
                name: "ncbiGene",
                label: "NCBI genes",
                filetype: "geneAnnotation",
            },
        ],
        Assembly: [
            {
                type: "bedgraph",
                name: "GC Percentage",
                url: "https://vizhub.wustl.edu/public/virus/mers_CGpct.bedgraph.sort.gz",
            },
        ],
        Diversity: [
            {
                type: "bedgraph",
                name: "Sequence Diversity (Shannon Entropy)",
                url: "https://wangftp.wustl.edu/~cfan/viralBrowser/sme/mers/diversity/mers_entropy.bedgraph.sort.gz",
                options: {
                    aggregateMethod: "MEAN",
                    height: 50,
                },
            },
            {
                type: "qbed",
                name: "Mutation Alert",
                url: "https://wangftp.wustl.edu/~cfan/viralBrowser/sme/mers/diversity/mers_alert.bed.sort.gz",
            },
        ],
        "Genome Comparison": [
            {
                name: "nCoV2019tomers",
                label: "nCoV2019 to MERS alignment",
                querygenome: "nCoV2019",
                filetype: "genomealign",
                url: "https://vizhub.wustl.edu/public/virus/mers_ncov.genomealign.gz",
            },
            {
                name: "sarstomers",
                label: "SARS to MERS alignment",
                querygenome: "SARS",
                filetype: "genomealign",
                url: "https://vizhub.wustl.edu/public/virus/mers_sars.genomealign.gz",
            },
        ],
    },
    nCoV2019: {
        Ruler: [
            {
                type: "ruler",
                label: "Ruler",
                name: "Ruler",
            },
        ],
        Genes: [
            {
                name: "ncbiGene",
                label: "NCBI genes",
                filetype: "geneAnnotation",
                genome: "SARS-CoV-2",
            },
        ],
        Proteins: [
            {
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
            },
        ],
        Assembly: [
            {
                type: "bedgraph",
                name: "GC Percentage",
                url: "https://vizhub.wustl.edu/public/virus/ncov_CGpct.bedgraph.sort.gz",
            },
        ],
        Diversity: [
            {
                type: "bedgraph",
                name: "Sequence Diversity (Shannon Entropy)",
                url: "https://wangftp.wustl.edu/~cfan/gisaid/latest/diversity/ncov_entropy.bedgraph.sort.gz",
                options: {
                    aggregateMethod: "MAX",
                },
            },
            {
                type: "qbed",
                name: "Mutation Alert",
                url: "https://wangftp.wustl.edu/~cfan/gisaid/latest/diversity/ncov_alert.bed.sort.gz",
            },
        ],
        "Genome Comparison": [
            {
                name: "merstonCoV2019",
                label: "MERS to SARS-CoV-2 alignment",
                querygenome: "MERS",
                filetype: "genomealign",
                url: "https://vizhub.wustl.edu/public/virus/ncov_mers.genomealign.gz",
            },
            {
                name: "sarstonCoV2019",
                label: "SARS to SARS-CoV-2 alignment",
                querygenome: "SARS",
                filetype: "genomealign",
                url: "https://vizhub.wustl.edu/public/virus/ncov_sars.genomealign.gz",
            },
            {
                name: "pangolinCoVtonCoV2019",
                label: "pangolin CoV to SARS-CoV-2 alignment",
                querygenome: "pangolin",
                filetype: "genomealign",
                url: "https://wangftp.wustl.edu/~dli/virusGateway/nCoV-pangolin.fa.genomealign1.gz",
            },
            {
                name: "batCoVtonCoV2019",
                label: "bat CoV to SARS-CoV-2 alignment",
                querygenome: "bat",
                filetype: "genomealign",
                url: "https://wangftp.wustl.edu/~dli/virusGateway/nCoV-RaTG13.fa.genomealign1.gz",
            },
        ],
    },
    hpv16: {
        Ruler: [
            {
                type: "ruler",
                label: "Ruler",
                name: "Ruler",
            },
        ],
        Genes: [
            {
                name: "ncbiGene",
                label: "NCBI genes",
                filetype: "geneAnnotation",
            },
        ],
    },
    LEPOCU1: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "type": "refbed",
                "name": "ensembl_gene",
                "url": "https://vizhub.wustl.edu/public/lepOcu1/lepOcu1_Gene.bed.gz"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/lepOcu1/lepOcu1.bb",
                    "height": 30
                }
            ]
        }
    },
    gorGor4: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/gorGor4/gorGor4.bb",
                    "height": 30
                }
            ]
        },
        "Genome Comparison": [
        ]
    },
    gorGor3: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "ensGene",
                "label": "Ensembl genes",
                "filetype": "geneAnnotation"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/gorGor3/gorGor3_rmsk.bb",
                    "height": 30
                }
            ]
        },
        "Genome Comparison": [
            {
                "name": "gorGor3tohg19",
                "label": "Blastz using gorGor3 as reference and hg19 as query",
                "querygenome": "hg19",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/gorGor3/gorGor3_hg19.gz"
            }
        ]
    }
    ,
    nomLeu3: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "ensGene",
                "label": "Ensembl genes",
                "filetype": "geneAnnotation"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/nomLeu3/nomLeu3_rmsk.bb",
                    "height": 30
                }
            ]
        },
        "Genome Comparison": [
            {
                "name": "nomLeu3tohg19",
                "label": "Query human hg19 to nomLeu3 blastz",
                "querygenome": "hg19",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/nomLeu3/nomLeu3_hg19.gz"
            }
        ]
    }
    ,
    papAnu2: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "ensGene",
                "label": "Ensembl genes",
                "filetype": "geneAnnotation"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/papAnu2/papAnu2_rmsk.bb",
                    "height": 30
                }
            ]
        },
        "Genome Comparison": [
            {
                "name": "papAnu2tohg19",
                "label": "Query human hg19 to papAnu2 blastz",
                "querygenome": "hg19",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/papAnu2/papAnu2_hg19.gz"
            }
        ]
    }
    ,
    oryCun2: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "refGene",
                "label": "RefSeq genes",
                "filetype": "refbed",
                "url": "https://vizhub.wustl.edu/public/oryCun2/oryCun2.refbed.gz"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/oryCun2/oryCun2.bb",
                    "height": 30
                }
            ]
        }
    }
    ,
    canFam3: {"Ruler": [{"type": "ruler", "label": "Ruler", "name": "Ruler"}], "Genes": [{"name": "refGene", "label": "RefSeq genes", "filetype": "refbed", "url": "https://vizhub.wustl.edu/public/canFam3.refbed.gz"}], "RepeatMasker": {"All Repeats": [{"name": "rmsk_all", "label": "RepeatMasker", "filetype": "repeatmasker", "url": "https://vizhub.wustl.edu/public/canFam3.bb", "height": 30}]}},
    canFam2: {"Ruler": [{"type": "ruler", "label": "Ruler", "name": "Ruler"}], "Genes": [{"name": "refGene", "label": "RefSeq genes", "filetype": "refbed", "url": "https://vizhub.wustl.edu/public/canFam2/canFam2.refbed.gz"}], "RepeatMasker": {"All Repeats": [{"name": "rmsk_all", "label": "RepeatMasker", "filetype": "repeatmasker", "url": "https://vizhub.wustl.edu/public/canFam2/canFam2.bb", "height": 30}]}},
    monDom5: {"Ruler": [{"type": "ruler", "label": "Ruler", "name": "Ruler"}], "RepeatMasker": {"All Repeats": [{"name": "rmsk_all", "label": "RepeatMasker", "filetype": "repeatmasker", "url": "https://vizhub.wustl.edu/public/monDom5/monDom5.bb", "height": 30}]}},
    calJac3: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "ncbiGene",
                "label": "NCBI genes",
                "filetype": "geneAnnotation"
            },
            {
                "name": "ensGene",
                "label": "Ensembl genes",
                "filetype": "geneAnnotation"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/calJac3/calJac3_rmsk.bb",
                    "height": 30
                }
            ]
        },
        "Genome Comparison": [
            {
                "name": "calJac3tohg19",
                "label": "Blastz using calJac3 as reference and human hg19 as query",
                "querygenome": "hg19",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/calJac3/calJac3_hg19.gz"
            }
        ]
    }
    ,
    AraTha1: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "gene",
                "label": "TAIR10 genes",
                "filetype": "geneAnnotation"
            }
        ],
        "Transcription Factor": [
            {
                "name": "JASPAR Transcription Factors 2022",
                "type": "jaspar",
                "url": "https://vizhub.wustl.edu/public/JASPAR/2022/JASPAR2022_araTha1.bb"
            }
        ]
    }
    ,
    Pfal3D7: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "PlasmoDBGene",
                "label": "PlasmoDB 9.0 genes",
                "filetype": "geneAnnotation",
                "queryEndpoint": { "name": "PlasmoDB", "endpoint": "https://plasmodb.org/plasmo/app/record/gene/" }
            }
        ]
    }
    
,
    Creinhardtii506: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "PhytozomeGene",
                "label": "Phytozome genes",
                "filetype": "geneAnnotation",
                "queryEndpoint": {
                    "name": "Phytozome",
                    "endpoint": "https://phytozome.jgi.doe.gov/phytomine/portal.do?class=Protein&externalids="
                }
            }
        ]
    }
    ,
    TbruceiTREU927: {
        Ruler: [
            {
                type: "ruler",
                label: "Ruler",
                name: "Ruler",
            },
        ],
        Genes: [
            {
                name: "gene",
                label: "TriTrypDB genes",
                filetype: "geneAnnotation",
                queryEndpoint: { name: "TriTrypDB", endpoint: "https://tritrypdb.org/tritrypdb/app/search?q=" },
            },
        ],
    },
    TbruceiLister427: {
        Ruler: [
            {
                type: "ruler",
                label: "Ruler",
                name: "Ruler",
            },
        ],
        Genes: [
            {
                name: "gene",
                label: "TriTrypDB genes",
                filetype: "geneAnnotation",
                queryEndpoint: { name: "TriTrypDB", endpoint: "https://tritrypdb.org/tritrypdb/app/search?q=" },
            },
        ],
    },
    CHM13v1_1: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "genes",
                "label": "genes from CAT and Liftoff",
                "filetype": "geneAnnotation"
            }
        ],
        "Genome Annotation": [
            {
                "name": "CpG Islands",
                "label": "CpG Islands",
                "filetype": "bigbed",
                "url": "https://vizhub.wustl.edu/public/t2t-chm13-v1.1/t2t-chm13-v1.1.cpgIslandExt.bb"
            },
            {
                "name": "Telomere",
                "label": "Telomere",
                "filetype": "bed",
                "url": "https://vizhub.wustl.edu/public/t2t-chm13-v1.1/chm13.draft_v1.1.telomere.bed.gz"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmskv2",
                    "label": "RepeatMaskerV2",
                    "filetype": "rmskv2",
                    "url": "https://vizhub.wustl.edu/public/t2t-chm13-v1.1/rmsk.bigBed",
                    "height": 40
                }
            ]
        },
        "Genome Comparison": [
            {
                "name": "chm13v1.1tohg38",
                "label": "query hg38 to chm13v1.1 minimap2",
                "querygenome": "hg38",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/t2t-chm13-v1.1/weaver/queryhg38tochm13.align.gz"
            }
        ]
    }
    ,
    xenTro10: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "refGene",
                "label": "RefSeq genes",
                "filetype": "geneAnnotation"
            },
            {
                "name": "ncbiGene",
                "label": "NCBI genes",
                "filetype": "geneAnnotation"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/xenTro10/rmsk16.bb",
                    "height": 30
                }
            ]
        }
    }
    ,
    b_chiifu_v3: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "gene",
                "label": "Brapa genes",
                "filetype": "geneAnnotation"
            }
        ]
    }
    ,
    susScr11: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "refGene",
                "label": "RefSeq genes",
                "filetype": "geneAnnotation"
            },
            {
                "name": "ncbiGene",
                "label": "NCBI genes",
                "filetype": "geneAnnotation"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/susScr11/rmsk16.bb",
                    "height": 30
                }
            ]
        }
    }
    ,
    susScr3: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "refGene",
                "label": "RefSeq genes",
                "filetype": "geneAnnotation"
            },
            {
                "name": "ncbiGene",
                "label": "NCBI genes",
                "filetype": "geneAnnotation"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/susScr3/rmsk16.bb",
                    "height": 30
                }
            ]
        }
    }
    ,
    oviAri4: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "refGene",
                "label": "RefSeq genes",
                "filetype": "geneAnnotation"
            },
            {
                "name": "ncbiGene",
                "label": "NCBI genes",
                "filetype": "geneAnnotation"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/oviAri4/rmsk16.bb",
                    "height": 30
                }
            ]
        }
    }
    ,
    calJac4: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "ncbiGene",
                "label": "NCBI genes",
                "filetype": "geneAnnotation"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/calJac4/rmsk16.bb",
                    "height": 30
                }
            ]
        }
    }
    ,
    rheMac10: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "refGene",
                "label": "RefSeq genes",
                "filetype": "geneAnnotation"
            },
            {
                "name": "ncbiGene",
                "label": "NCBI genes",
                "filetype": "geneAnnotation"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/rheMac10/rmsk16.bb",
                    "height": 30
                }
            ]
        }
    }
    ,
    RN7: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "refGene",
                "label": "RefSeq genes",
                "filetype": "geneAnnotation"
            },
            {
                "name": "ncbiGene",
                "label": "NCBI genes",
                "filetype": "geneAnnotation"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmsk_all",
                    "label": "RepeatMasker",
                    "filetype": "repeatmasker",
                    "url": "https://vizhub.wustl.edu/public/rn7/rmsk16.bb",
                    "height": 30
                }
            ]
        }
    }
    ,
    CHMV2: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "gencodeV35",
                "label": "gencodeV35",
                "filetype": "geneAnnotation"
            }
        ],
        "RepeatMasker": {
            "All Repeats": [
                {
                    "name": "rmskv2",
                    "label": "RepeatMaskerV2",
                    "filetype": "rmskv2",
                    "url": "https://vizhub.wustl.edu/public/t2t-chm13-v2.0/rmsk.bigBed",
                    "height": 40
                }
            ]
        },
        "Genome Comparison": [
            {
                "name": "chm13v2tohg38",
                "label": "query hg38 to chm13v2 minimap2",
                "querygenome": "hg38",
                "filetype": "genomealign",
                "url": "https://vizhub.wustl.edu/public/t2t-chm13-v2.0/weaver/hg38.chm13.align.gz"
            }
        ]
    }
    ,
    GRCg7b: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "gene",
                "label": "Genes",
                "filetype": "geneAnnotation"
            }
        ]
    }
    ,
    GRCg7w: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "gene",
                "label": "Genes",
                "filetype": "geneAnnotation"
            }
        ]
    }
    ,
    phaw5: {
        "Ruler": [
            {
                "type": "ruler",
                "label": "Ruler",
                "name": "Ruler"
            }
        ],
        "Genes": [
            {
                "name": "gene",
                "label": "Genes",
                "filetype": "geneAnnotation"
            }
        ]
    }
    ,

}