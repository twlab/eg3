declare const _default: {
    "Ruler": [
        {
            "type": "ruler",
            "label": "Ruler",
            "name": "Ruler"
        }
    ],
    "Genes": [

    ],
    "RepeatMasker": {
        "All Repeats": [
            {
                "name": "rmsk_all",
                "label": "RepeatMasker",
                "filetype": "repeatmasker",
                "url": "https://vizhub.wustl.edu/public/danRer7/danRer7.bb",
                "height": 30
            }
        ]
    },
    "Genome Annotation": [
        {
            "type": "categorical",
            "name": "CpG Islands (unmasked)",
            "url": "https://vizhub.wustl.edu/public/danRer7/danRer7.CGI.txt.gz",
            "height": 30,
            "options": {
              "label": "CpG Context (unmasked)",
              "category": {
                "CGI": {"name": "CGI", "color": "#FE8801"}
              }
            }
        }
    ],
    "Genome Comparison": [

    ]
};

export default _default;
