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
;

export default _default;
