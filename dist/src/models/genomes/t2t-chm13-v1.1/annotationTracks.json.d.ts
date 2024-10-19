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
;

export default _default;
