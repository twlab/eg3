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
;

export default _default;
