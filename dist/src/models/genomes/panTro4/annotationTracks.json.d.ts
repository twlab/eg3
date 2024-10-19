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
;

export default _default;
