---
sidebar_position: 3
---

# API based tracks

API based tracks get data from sending request to an API server. For now, the `geneannotation` tracks, `snp` track and `cool` track are API based.

## Gene tracks

:::info note

Our gene search API is located at https://lambda.epigenomegateway.org/v3

:::

We are using an API to provide gene annotation for gene symbol search and data for `geneannotation` track. For example, the JSON syntax below can be included in your datahub to include the gencodeV47 track:

```json
{
            "name": "gencodeV47",
            "label": "GENCODE V47 genes",
            "options": {
                "categoryColors": {
                    "coding": "rgb(0,60,179)",
                    "nonCoding": "rgb(0,128,0)",
                    "pseudogene": "rgb(230,0,172)",
                    "problem": "rgb(255,0,0)",
                    "polyA": "rgb(0,0,51)"
                }
            },
            "genome": "hg38",
            "filetype": "geneAnnotation"
        },
```

## cool

Thanks to the higlass team who provides the data API, the browser is able to display cool tracks by using the data uuid from the higlass server, for example, you can use the uuid `Hyc3TZevQVm3FcTAZShLQg` to represent the track for *Aiden et al. (2009) GM06900 HINDIII 1kb*, for a full list of available cool tracks please check [http://higlass.io/api/v1/tilesets/?dt=matrix](http://higlass.io/api/v1/tilesets/?dt=matrix)

## snp

For human hg19 and hg38 we used the API from Ensembl to query the SNV data, the API URLs we used are listed below:

```javascript
const SNP_ENDPOINTS = {
  hg19: "https://grch37.rest.ensembl.org/variation/human",
  hg38: "https://rest.ensembl.org/variation/human",
};
```
In a datahub json file, include the following can add the SNV track:

```json
{
    "name": "SNVs from Ensembl",
    "label": "SNVs from Ensembl",
    "type": "snp"
}
```
