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
;

export default _default;
