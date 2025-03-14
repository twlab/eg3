---
sidebar_position: 2
---

# Example data hub

Pasted below is an example data hub for mouse mm10:

``` json
[
    {
    "type": "bigwig",
    "url": "https://vizhub.wustl.edu/public/tmp/TW463_20-5-bonemarrow_MeDIP.bigWig",
    "name": "MeDIP",
    "options": {
        "color": "red",
        "backgroundColor":"#FFE7AB"
        },
    "metadata": {
        "sample": "bone",
        "assay": "MeDIP"
        }
    },
    {
    "type": "bigwig",
    "url": "https://vizhub.wustl.edu/public/tmp/TW551_20-5-bonemarrow_MRE.CpG.bigWig",
    "name": "MRE",
    "options": {
        "color": "blue",
        "backgroundColor":"#C0E3CC"
        },
    "metadata": {
        "sample": "bone",
        "assay": "MRE"
        }
    }
]
```

## Example bigWig track

``` json
{
    "type": "bigwig",
    "name": "example bigwig",
    "url": "https://vizhub.wustl.edu/hubSample/hg19/GSM429321.bigWig",
    "options": {
        "color": "blue"
    }
}
```

## Example dynseq track

``` json
{
    "type": "dynseq",
    "name": "example dynseq",
    "url": "https://target.wustl.edu/dli/tmp/deeplift.example.bw",
    "options": {
        "color": "blue",
        "height: 100
    }
}
```

## Example methylC track

``` json
{
  "type": "methylc",
  "name": "H1",
  "url": "https://vizhub.wustl.edu/public/hg19/methylc2/h1.liftedtohg19.gz",
  "options": {
    "label": "Methylation",
    "colorsForContext": {
      "CG": { "color": "#648bd8", "background": "#d9d9d9" },
      "CHG": { "color": "#ff944d", "background": "#ffe0cc" },
      "CHH": { "color": "#ff00ff", "background": "#ffe5ff" }
    },
    "depthColor": "#01E9FE"
  },
}
```

## Example categorical track

``` json
{
  "type": "categorical",
  "name": "ChromHMM",
  "url": "https://egg.wustl.edu/d/hg19/E017_15_coreMarks_dense.gz",
  "options": {
      "category": {
          "1": {"name": "Active TSS", "color": "#ff0000"},
          "2": {"name": "Flanking Active TSS", "color": "#ff4500"},
          "3": {"name": "Transcr at gene 5' and 3'", "color": "#32cd32"},
          "4": {"name": "Strong transcription", "color": "#008000"},
          "5": {"name": "Weak transcription", "color": "#006400"},
          "6": {"name": "Genic enhancers", "color": "#c2e105"},
          "7": {"name": "Enhancers", "color": "#ffff00"},
          "8": {"name": "ZNF genes & repeats", "color": "#66cdaa"},
          "9": {"name": "Heterochromatin", "color": "#8a91d0"},
          "10": {"name": "Bivalent/Poised TSS", "color": "#cd5c5c"},
          "11": {"name": "Flanking Bivalent TSS/Enh", "color": "#e9967a"},
          "12": {"name": "Bivalent Enhancer", "color": "#bdb76b"},
          "13": {"name": "Repressed PolyComb", "color": "#808080"},
          "14": {"name": "Weak Repressed PolyComb", "color": "#c0c0c0"},
          "15": {"name": "Quiescent/Low", "color": "#ffffff"}
      }
  }
}
```

Supported options: [backgroundColor](#backgroundcolor), [color](#color), [color2](#color2), [yScale](#yscale), [yMax](#ymax), and [yMin](#ymin).

## Example longrange track

``` json
{
    "type": "longrange",
    "name": "ES-E14 ChIA-PET",
    "url": "https://egg.wustl.edu/d/mm9/GSE28247_st3c.gz"
}
```

## Example bigInteract track

``` json
{
    "type": "biginteract",
    "name": "test bigInteract",
    "url": "https://epgg-test.wustl.edu/dli/long-range-test/interactExample3.inter.bb"
}
```

## Example repeatmasker track

``` json
{
    "type": "repeatmasker",
    "name": "RepeatMasker",
    "url": "https://vizhub.wustl.edu/public/mm10/rmsk16.bb"
}
```

## Example geneAnnotation track

``` json
{
    "type": "geneAnnotation",
    "name": "refGene",
    "genome": "mm10"
}
```

:::info note

Please specify the `genome` attibute for gene annotation tracks.
:::

## Example bigbed track

``` json
{
    "type": "bigbed",
    "name": "test bigbed",
    "url": "https://vizhub.wustl.edu/hubSample/hg19/bigBed1"
}
```

## Example bed track

``` json
{
    "type": "bed",
    "name": "mm10 bed",
    "url": "https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands.bed.gz"
}
```

## Example refbed track

``` json
{
    "type": "refbed",
    "name": "mm10 gencode basic",
    "url": "https://vizhub.wustl.edu/public/tmp/gencodeM18_load_basic_Gene.bed.gz",
    "options": {
            "categoryColors": {
                "coding": "rgb(101,1,168)",
                "nonCoding": "rgb(1,193,75)",
                "pseudo": "rgb(230,0,172)",
                "problem": "rgb(224,2,2)",
                "other":"rgb(128,128,128)"
            }
        }
}
```

:::info note

`categoryColors` designates colors for the gene type as indicated in the 9th column. The default scheme is shown above for the five classes created by the `Converting_Gencode_or_Ensembl_GTF_to_refBed.bash` script, but any number of categories can be defined.
:::

## Example HiC track

``` json
{
    "type": "hic",
    "name": "test hic",
    "url": "https://epgg-test.wustl.edu/dli/long-range-test/test.hic",
    "options": {
        "displayMode": "arc"
    }
}
```

## Example cool track

``` json
{
    "type": "cool",
    "name": "Aiden et al. (2009) GM06900 HINDIII 1kb",
    "url": "Hyc3TZevQVm3FcTAZShLQg",
    "options": {
        "displayMode": "arc"
    }
}
```

:::info note

please note we are using the uuid `Hyc3TZevQVm3FcTAZShLQg` here from [higlass API server](http://higlass.io/api/v1/tilesets) instead of a file URL to represent a cool track.
:::

## Example genomealign track

``` json
{
    "name": "hg19 to mm10 alignment",
    "type": "genomealign",
    "metadata": {
        "genome": "mm10"
    }
}
```

## Example qBED track

``` json
{
    "type":"qbed",
    "url":"https://htcf.wustl.edu/files/RdNgrGeQ/HCT116-PBase.qbed.gz",
    "name":"piggyBac insertions",
    "showOnHubLoad":"true",
    "options":{
        "color":"#D12134",
        "height":100,
        "logScale":"log10",
        "show":"sample",
        "sampleSize":1000,
        "markerSize":5,
        "opacity":[50],
      },
}
```

:::info note

Default qBED track options are `"logScale":"none"`, `"show":"all"`, `"markersize":3`, and `"opacity":[100]`. Log-scaling can be set by specifying `"logScale":"log10"`. To change opacity, pass a single value in brackets, as in the above example. qBED tracks will, by default, plot all entries in view. For information-dense regions, this can lead to excessive memory consumption. To plot a random subsample instead, specify `"show":"sample"` and pass the number of points to visualize to `"sampleSize"`, e.g. `"sampleSize":1000`
:::

## Example matplot track

``` json
{
    "type": "matplot",
    "name": "matplot wrap",
    "tracks": [
        {
        "type": "bigwig",
        "url": "https://vizhub.wustl.edu/public/tmp/TW463_20-5-bonemarrow_MeDIP.bigWig",
        "name": "MeDIP",
        "options": {
            "color": "red",
            "backgroundColor":"#FFE7AB"
            },
        "metadata": {
            "sample": "bone",
            "assay": "MeDIP"
            }
        },
        {
        "type": "bigwig",
        "url": "https://vizhub.wustl.edu/public/tmp/TW551_20-5-bonemarrow_MRE.CpG.bigWig",
        "name": "MRE",
        "options": {
            "color": "blue",
            "backgroundColor":"#C0E3CC"
            },
        "metadata": {
            "sample": "bone",
            "assay": "MRE"
            }
        }
    ]
}
```

## Example g3d track

``` json
{
    "type": "g3d",
    "url": "https://wangftp.wustl.edu/~dli/tmp/test.g3d",
    "name": "example 3d track",
    "showOnHubLoad": true
}
```

## Example Ruler track

``` json
{
    "type": "ruler",
    "name": "Ruler"
}
```
