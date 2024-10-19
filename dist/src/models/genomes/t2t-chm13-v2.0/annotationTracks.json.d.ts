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
;

export default _default;
