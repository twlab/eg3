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
}
;

export default _default;
