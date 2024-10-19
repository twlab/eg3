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
};

export default _default;
