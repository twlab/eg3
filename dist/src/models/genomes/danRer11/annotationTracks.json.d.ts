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
;

export default _default;
