declare const _default: {
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
;

export default _default;
