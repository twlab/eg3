export const PublicHubAllData: any = {
  HG38: {
    publicHubData: {
      "4D Nucleome Network":
        "The 4D Nucleome Network aims to understand the principles underlying nuclear organization " +
        "in space and time, the role nuclear organization plays in gene expression and cellular function, and how changes " +
        "in nuclear organization affect normal development as well as various diseases. The program is developing novel " +
        "tools to explore the dynamic nuclear architecture and its role in gene expression programs, " +
        "models to examine the relationship between nuclear organization and function, " +
        "and reference maps of nuclear architecture in a variety of cells and tissues as a community resource.",
      "Encyclopedia of DNA Elements (ENCODE)":
        "The Encyclopedia of DNA Elements (ENCODE) Consortium is an " +
        "international collaboration of research groups funded by the National Human Genome Research Institute " +
        "(NHGRI). The goal of ENCODE is to build a comprehensive parts list of functional elements in the human " +
        "genome, including elements that act at the protein and RNA levels, and regulatory elements that control " +
        "cells and circumstances in which a gene is active.",
      "SARS-CoV-2 Host Transcriptional Responses (Blanco-Melo, et al. 2020) Database":
        "A database consisting of host (human) transcriptional changes resulting from SARS-CoV-2 and other respiratory infections in in vitro, ex vivo, and in vivo systems.",
      "Reference human epigenomes from Roadmap Epigenomics Consortium":
        "The NIH Roadmap Epigenomics Mapping Consortium was launched with the goal of producing a public resource of human epigenomic data to catalyze basic biology and disease-oriented research. The Consortium leverages experimental pipelines built around next-generation sequencing technologies to map DNA methylation, histone modifications, chromatin accessibility and small RNA transcripts in stem cells and primary ex vivo tissues selected to represent the normal counterparts of tissues and organ systems frequently involved in human disease (quoted from Roadmap website).",
      "Image collection":
        "Image data from the Image Data Resource (IDR) or 4DN. Images are mapped to genomic coordinates with annotation gene id or symbol.",
      "Human Pangenome Reference Consortium (HPRC)":
        "The Human Pangenome Reference Consortium (HPRC) is a project funded by the National Human Genome Research Institute to sequence and assemble genomes from individuals from diverse populations in order to better represent genomic landscape of diverse human populations.",
    },
    publicHubList: [
      {
        collection: "Human Pangenome Reference Consortium (HPRC)",
        name: "HPRC long read methylation data",
        numTracks: 12,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/hg38/modbed/hub.jsx",
        description:
          "modbed format methylation track on PacBio and ONT platforms, for 6 sample sources.",
      },
      {
        collection:
          "Reference human epigenomes from Roadmap Epigenomics Consortium",
        name: "All Chromatin states tracks",
        numTracks: 352,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/hg38/roadmap_hmm.jsx",
        description:
          "include 15 state core model from observed data, 18 state expanded model from observed data and 25 state model from imputed data. Lifted from hg19 results.",
      },
      {
        collection:
          "Reference human epigenomes from Roadmap Epigenomics Consortium",
        name: "Roadmap ChIP-seq datasets",
        numTracks: 12494,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/hg38/Roadmap_hg38_ChIPseq_June2021.jsx",
        description:
          "Roadmap ChIP-seq data. Data are hosted by ENCODE data portal.",
      },
      {
        collection:
          "Reference human epigenomes from Roadmap Epigenomics Consortium",
        name: "Roadmap RNA-seq, WGBS etc. datasets",
        numTracks: 5586,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/hg38/Roadmap_hg38_others_June2021.jsx",
        description:
          "Roadmap RNA-seq, WGBS etc. Data are hosted by ENCODE data portal.",
      },
      {
        collection: "Image collection",
        name: "IDR image data",
        numTracks: 28,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/imagetrack/hg38/hg38.jsx",
        description: {
          "hub built by": "Daofeng Li (dli23@wustl.edu)",
          "total number of images": 539977,
          "hub built notes": "covered 28 human datasets from IDR",
        },
      },
      {
        collection: "Image collection",
        name: "4dn image data",
        numTracks: 1,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/imagetrack/hg38/4dn/hg38.jsx",
        description: {
          "hub built by": "Daofeng Li (dli23@wustl.edu)",
          "total number of images": 601,
          "hub built notes": "mixed image datasets for hg38 in 4dn",
        },
      },
      {
        collection: "Encyclopedia of DNA Elements (ENCODE)",
        name: "ENCODE signal of unique reads",
        numTracks: 5230,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/hg38/new/mpssur_GRCh38.jsx",
        description: "signal of unique reads.",
      },
      {
        collection: "Encyclopedia of DNA Elements (ENCODE)",
        name: "ENCODE signal of all reads",
        numTracks: 5230,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/hg38/new/mpssar_GRCh38.jsx",
        description: "signal of all reads.",
      },
      {
        collection: "4D Nucleome Network",
        name: "4DN datasets",
        numTracks: 2876,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/4dn/4dn-GRCh38-July2021.jsx",
        description: {
          "hub built by": "Daofeng Li (dli23@wustl.edu)",
          "last update": "Jul 14 2021",
          "hub built notes":
            "metadata information are obtained directly from 4DN data portal",
        },
      },
      {
        collection: "Encyclopedia of DNA Elements (ENCODE)",
        name: "Human ENCODE from ENCODE data portal",
        numTracks: 38092,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/hg38/new/GRCh38_encode_human_bigwig_metadata_nov142018.jsx",
        description: {
          "hub built by": "Daofeng Li (dli23@wustl.edu)",
          "hub built date": "Nov 14 2018",
          "hub built notes":
            "metadata information are obtained directly from ENCODE data portal, track files are hosted by ENCODE data portal as well",
        },
      },
      {
        collection: "Encyclopedia of DNA Elements (ENCODE)",
        name: "Human ENCODE HiC from ENCODE data portal",
        numTracks: 20,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/hg38/new/GRCh38_encode_human_hic_metadata_nov142018.jsx",
        description: {
          "hub built by": "Daofeng Li (dli23@wustl.edu)",
          "hub built date": "Nov 14 2018",
          "hub built notes":
            "metadata information are obtained directly from ENCODE data portal, track files are hosted by ENCODE data portal as well",
        },
      },
      {
        collection: "International Human Epigenome Consortium (IHEC) ",
        name: "International Human Epigenome Consortium (IHEC) epigenomic datasets",
        numTracks: 6800,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/hg38/new/ihec-hg38-urls.jsx",
        description: {
          "hub built by": "Daofeng Li (dli23@wustl.edu)",
          "hub built date": "Nov 30 2018",
          "hub built notes": "track files are hosted by IHEC data portal",
        },
      },
      {
        collection: "HiC interaction from HiGlass",
        name: "HiC interaction from HiGlass",
        numTracks: 39,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~dli/eg-hubs/higlass/2019/hg38_cool.jsx",
      },
      {
        collection:
          "SARS-CoV-2 Host Transcriptional Responses (Blanco-Melo, et al. 2020) Database",
        name: "Human Transcriptional Responses to SARS-CoV-2 and Other Respiratory Infections",
        numTracks: 195,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~jflynn/virus_genome_browser/Blanco_melo_et_al/blanco_melo_et_al.jsx",
        description: {
          "hub built by": "Jennifer Flynn (jaflynn@wustl.edu)",
          "hub info":
            "Host (human) transcriptional responses to SARS-CoV-2 and other respriatory infections. Aligned to reference genome hg38 using STAR, after first removing mitochondrial and rRNA reads",
          values: "bigWig output from STAR alignment",
        },
      },
    ],
  },
  HG19: {
    publicHubData: {
      "Encyclopedia of DNA Elements (ENCODE)":
        "The Encyclopedia of DNA Elements (ENCODE) Consortium is an " +
        "international collaboration of research groups funded by the National Human Genome Research Institute " +
        "(NHGRI). The goal of ENCODE is to build a comprehensive parts list of functional elements in the human " +
        "genome, including elements that act at the protein and RNA levels, and regulatory elements that control " +
        "cells and circumstances in which a gene is active.",
      "Reference human epigenomes from Roadmap Epigenomics Consortium":
        "The NIH Roadmap Epigenomics Mapping Consortium was launched with the goal of producing a public resource of human epigenomic data to catalyze basic biology and disease-oriented research. The Consortium leverages experimental pipelines built around next-generation sequencing technologies to map DNA methylation, histone modifications, chromatin accessibility and small RNA transcripts in stem cells and primary ex vivo tissues selected to represent the normal counterparts of tissues and organ systems frequently involved in human disease (quoted from Roadmap website).",
      "3D structures":
        "3D stucure data collected from: Tan L, Xing D, Chang CH, Li H et al. Three-dimensional genome structures of single diploid human cells. Science 2018 Aug 31;361(6405):924-928. The 3dg data were used and converted to g3d format using g3dtools.",
      "Image collection":
        "Image data from the Image Data Resource (IDR) or 4DN. Images are mapped to genomic coordinates with annotation gene id or symbol.",
    },
    publicHubList: [
      {
        collection:
          "Reference human epigenomes from Roadmap Epigenomics Consortium",
        name: "Roadmap Data from GEO",
        numTracks: 2728,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/hg19/new/roadmap9_methylC.md",
      },
      {
        collection: "3D structures",
        name: "3D structures from Science 2018 Aug 31;361(6405):924-928",
        numTracks: 34,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/g3d/hg19/hub",
      },
      {
        collection: "Image collection",
        name: "IDR image data",
        numTracks: 28,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/imagetrack/hg19/hg19.jsx",
        description: {
          "hub built by": "Daofeng Li (dli23@wustl.edu)",
          "total number of images": "544,814",
          "hub built notes": "covered 28 human datasets from IDR",
        },
      },
      {
        collection:
          "Reference human epigenomes from Roadmap Epigenomics Consortium",
        name: "methylCRF tracks from Roadmap",
        numTracks: 16,
        oldHubFormat: false,
        description:
          "Single CpG methylation value prediction by methylCRF algorithm (PMID:23804401) using Roadmap data.",
        url: "https://vizhub.wustl.edu/public/hg19/new/methylCRF.roadmap.hub",
      },
      {
        collection:
          "Reference human epigenomes from Roadmap Epigenomics Consortium",
        name: "Observed DNase and ChIP-seq Pvalue and Normalized RPKM RNAseq signal tracks",
        numTracks: 1136,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/hg19/new/roadmap_consolidated_02182015.jsx.md.pvalsig",
        description:
          "Observed data Pvalue tracks for DNase and ChIP-seq, and Normalized RPKM signal tracks for RNAseq",
      },
      {
        collection:
          "Reference human epigenomes from Roadmap Epigenomics Consortium",
        name: "Observed DNase and ChIP-seq Fold-change and Normalized RPKM RNAseq signal tracks",
        numTracks: 1136,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/hg19/new/roadmap_consolidated_02182015.jsx.md.fcsig",
        description:
          "Observed data Fold-change tracks for DNase and ChIP-seq, and Normalized RPKM signal tracks for RNAseq",
      },
      {
        collection:
          "Reference human epigenomes from Roadmap Epigenomics Consortium",
        name: "All Chromatin states tracks",
        numTracks: 352,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/hg19/new/roadmap_consolidated_02182015.jsx.md.hmm",
        description:
          "include 15 state core model from observed data, 18 state expanded model from observed data and 25 state model from imputed data",
      },
      {
        collection:
          "Reference human epigenomes from Roadmap Epigenomics Consortium",
        name: "Imputed data signal tracks",
        numTracks: 4315,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/hg19/new/roadmap_consolidated_02182015.jsx.md.impsig",
        description: "All data types (histone, DNase, RNA and methylation)",
      },
      {
        collection:
          "Reference human epigenomes from Roadmap Epigenomics Consortium",
        name: "Unconsolidated epigenomes, Observed DNase and ChIP-seq Pvalue signal tracks",
        numTracks: 1915,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/hg19/new/roadmap_unconsolidated_02182015.jsx.md.pvalsig",
        description:
          "For the unconsolidated epigenomes, observed data Pvalue tracks for DNase and ChIP-seq",
      },
      {
        collection:
          "Reference human epigenomes from Roadmap Epigenomics Consortium",
        name: "Unconsolidated epigenomes, Observed DNase and ChIP-seq Fold-change signal tracks",
        numTracks: 1915,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/hg19/new/roadmap_unconsolidated_02182015.jsx.md.fcsig",
        description:
          "For the unconsolidated epigenomes,observed data Fold-change tracks for DNase and ChIP-seq",
      },
      {
        collection:
          "Reference human epigenomes from Roadmap Epigenomics Consortium",
        name: "Complete Consolidated dataset",
        numTracks: 18181,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/hg19/new/roadmap_consolidated_02182015.jsx.md",
        description:
          "This is the complete set of Roadmap Epigenomics Integrative Analysis Hub. Consolidated refer to the 127 reference epigenomes that uses additional steps of pooling and subsampling and these are the ones used in the paper. All data types were reprocessed for the consolidated epigenomes.Also please     refer to <a href=https://egg2.wustl.edu/roadmap/web_portal/ target=_blank>web portal</a> if get slow loading of this hub.",
      },
      {
        collection:
          "Reference human epigenomes from Roadmap Epigenomics Consortium",
        name: "Roadmap Epigenomics Analysis Hub Unconsolidated set",
        numTracks: 9990,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/hg19/new/roadmap_unconsolidated_02182015.jsx.md",
        description:
          "Unconsolidated data is basically all the ChIP-seq and DNase Release 9 data at the EDACC as it was except filtered for 36 bp read length mappability and processed to create peak calls and signal tracks.",
      },
      {
        collection: "Encyclopedia of DNA Elements (ENCODE)",
        name: "Human ENCODE from ENCODE data portal",
        numTracks: 48657,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/hg19/new/hg19_encode_human_bigwig_metadata_nov142018.jsx",
        description: {
          "hub built by": "Daofeng Li (dli23@wustl.edu)",
          "hub built date": "Nov 14 2018",
          "hub built notes":
            "metadata information are obtained directly from ENCODE data portal, track files are hosted by ENCODE data portal as well",
        },
      },
      {
        collection: "Encyclopedia of DNA Elements (ENCODE)",
        name: "Human ENCODE HiC from ENCODE data portal",
        numTracks: 104,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/hg19/new/hg19_encode_human_hic_metadata_nov142018.jsx",
        description: {
          "hub built by": "Daofeng Li (dli23@wustl.edu)",
          "hub built date": "Nov 14 2018",
          "hub built notes":
            "metadata information are obtained directly from ENCODE data portal, track files are hosted by ENCODE data portal as well",
        },
      },
      {
        collection: "Encyclopedia of DNA Elements (ENCODE)",
        name: "ENCODE signal of unique reads, expression",
        numTracks: 7729,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/hg19/new/hg19_mpssur.jsx",
      },
      {
        collection: "Encyclopedia of DNA Elements (ENCODE)",
        name: "ENCODE signal of all reads, expression",
        numTracks: 7842,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/hg19/new/hg19_mpssar.jsx",
      },
      {
        collection: "Encyclopedia of DNA Elements (ENCODE)",
        name: "ENCODE all other types",
        numTracks: 5937,
        oldHubFormat: false,
        description:
          "Base overlap signal, fold change over control, genome compartments, percentage normalized signal, etc.",
        url: "https://vizhub.wustl.edu/public/hg19/new/hg19_other_rmdup.jsx",
      },
      {
        collection: "Encyclopedia of DNA Elements (ENCODE)",
        name: "ENCODE legacy hub",
        numTracks: 4253,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/hg19/new/encode.md",
      },
      {
        collection: "International Human Epigenome Consortium (IHEC) ",
        name: "International Human Epigenome Consortium (IHEC) epigenomic datasets",
        numTracks: 15097,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/hg19/new/ihec-hg19-urls.jsx",
        description: {
          "hub built by": "Daofeng Li (dli23@wustl.edu)",
          "hub built date": "Nov 30 2018",
          "hub built notes": "track files are hosted by IHEC data portal",
        },
      },
      {
        collection: "Long-range chromatin interaction experiments",
        name: "Long-range chromatin interaction experiments",
        numTracks: 156,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/hg19/new/longrange4",
      },
      {
        collection: "HiC interaction from Juicebox",
        name: "HiC interaction from Juicebox",
        numTracks: 202,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/hg19/new/hg19-juiceboxhub",
      },
      {
        collection: "HiC interaction from HiGlass",
        name: "HiC interaction from HiGlass",
        numTracks: 210,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~dli/eg-hubs/higlass/2019/hg19_cool.jsx",
      },
      {
        collection: "Human 450K and 27K array data from TCGA",
        name: "Human 450K and 27K array data from TCGA",
        numTracks: 2551,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/hg19/new/TCGA-450k-hub2",
      },
    ],
  },
  MM39: {},
  MM10: {
    publicHubData: {
      "4D Nucleome Network":
        "The 4D Nucleome Network aims to understand the principles underlying nuclear " +
        "organization in space and time, the role nuclear organization plays in gene expression and cellular function, " +
        "and how changes in nuclear organization affect normal development as well as various diseases.  The program is " +
        "developing novel tools to explore the dynamic nuclear architecture and its role in gene expression programs, " +
        "models to examine the relationship between nuclear organization and function, and reference maps of nuclear" +
        "architecture in a variety of cells and tissues as a community resource.",
      "Encyclopedia of DNA Elements (ENCODE)":
        "The Encyclopedia of DNA Elements (ENCODE) Consortium is an " +
        "international collaboration of research groups funded by the National Human Genome Research Institute " +
        "(NHGRI). The goal of ENCODE is to build a comprehensive parts list of functional elements in the human " +
        "genome, including elements that act at the protein and RNA levels, and regulatory elements that control " +
        "cells and circumstances in which a gene is active.",
      "Toxicant Exposures and Responses by Genomic and Epigenomic Regulators of Transcription (TaRGET)":
        "The TaRGET(Toxicant Exposures and Responses by Genomic and Epigenomic Regulators of Transcription) program is a research consortium funded by the National Institute of Environmental Health Sciences (NIEHS). The goal of the collaboration is to address the role of environmental exposures in disease pathogenesis as a function of epigenome perturbation, including understanding the environmental control of epigenetic mechanisms and assessing the utility of surrogate tissue analysis in mouse models of disease-relevant environmental exposures.",
      "3D structures": "3D stucure data collection",
      "Image collection":
        "Image data from the Image Data Resource (IDR) or 4DN. Images are mapped to genomic coordinates with annotation gene id or symbol.",
    },
    publicHubList: [
      {
        collection: "Encyclopedia of DNA Elements (ENCODE)",
        name: "Mouse ENCODE",
        numTracks: 1616,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/mm10/new/mm10encode2015",
        description:
          "The Mouse ENCODE Consortium consisted of a number of Data Production Centers and made use of the human ENCODE Data Coordination Center (DCC) at the University of California, Santa Cruz (currently at Stanford University). Production Centers generally focused on different data types, including transcription     factor and polymerase occupancy, DNaseI hypersensitivity, histone modification, and RNA transcription.",
      },
      {
        collection: "4D Nucleome Network",
        name: "4DN datasets",
        numTracks: 670,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/4dn/4dn-GRCm38-July2021.jsx",
        description: {
          "hub built by": "Daofeng Li (dli23@wustl.edu)",
          "last update": "Jul 14 2021",
          "hub built notes":
            "metadata information are obtained directly from 4DN data portal",
        },
      },
      {
        collection:
          "Toxicant Exposures and Responses by Genomic and Epigenomic Regulators of Transcription (TaRGET)",
        name: "Mouse TaRGET",
        numTracks: 965,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/mm10/new/20190130_TaRGET_datahub.jsx",
        description: {
          "hub built by": "Wanqing Shao (wanqingshao@wustl.edu)",
          "hub built date": "Jan 30 2019",
        },
      },
      {
        collection: "3D structures",
        name: "3D structures from Science 2018 Aug 31;361(6405):924-928",
        numTracks: 10,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/g3d/mm10/hub",
      },
      {
        collection: "3D structures",
        name: "3D structures from Nat Struct Mol Biol 2019 Apr;26(4):297-307",
        numTracks: 1227,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/g3d/mm10/GSE121791/hub",
      },
      {
        collection: "3D structures",
        name: "3D structures from Cell 2021 Feb 4;184(3):741-758.e17",
        numTracks: 9770,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/g3d/mm10/GSE162511/hub",
      },
      {
        collection: "Image collection",
        name: "4dn image data",
        numTracks: 1,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/imagetrack/mm10/4dn/mm10.jsx",
        description: {
          "hub built by": "Daofeng Li (dli23@wustl.edu)",
          "total number of images": 124,
          "hub built notes": "mixed image datasets for mm10 in 4dn",
        },
      },
      {
        collection: "Encyclopedia of DNA Elements (ENCODE)",
        name: "Mouse ENCODE from ENCODE data portal",
        numTracks: 13001,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/mm10/new/mm10_encode_mouse_bigwig_metadata_nov142018.jsx",
        description: {
          "hub built by": "Daofeng Li (dli23@wustl.edu)",
          "hub built date": "Nov 14 2018",
          "hub built notes":
            "metadata information are obtained directly from ENCODE data portal, track files are hosted by ENCODE data portal as well",
        },
      },
      {
        collection: "International Human Epigenome Consortium (IHEC) ",
        name: "International Human Epigenome Consortium (IHEC) epigenomic datasets",
        numTracks: 266,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/mm10/new/ihec-mm10-urls.jsx",
        description: {
          "hub built by": "Daofeng Li (dli23@wustl.edu)",
          "hub built date": "Nov 30 2018",
          "hub built notes": "track files are hosted by IHEC data portal",
        },
      },
      {
        collection: "HiC interaction from HiGlass",
        name: "HiC interaction from HiGlass",
        numTracks: 78,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~dli/eg-hubs/higlass/2019/mm10_cool.jsx",
      },
      // {
      //     collection: "Neural Epigenome Atlas",
      //     name: "Neural Epigenome Atlas (R. L. Sears et al, in prep)",
      //     numTracks: 76,
      //     oldHubFormat: false,
      //     url: "https://vizhub.wustl.edu/public/mm10/Neural_Epigenome_Atlas/Epigenome_Atlas_vizhub.jsx"
      // },
    ],
  },
  MM9: {},
  PANTRO6: {},
  PANTRO5: {},
  panTro4: {},
  BosTau8: {},
  DAN_RER11: {},
  DAN_RER10: {},
  DAN_RER7: {},
  RN6: {},
  rn4: {},
  RheMac8: {},
  rheMac3: {},
  rheMac2: {},
  GalGal6: {},
  GalGal5: {
    publicHubData: {
      "4D Nucleome Network":
        "The 4D Nucleome Network aims to understand the principles underlying nuclear " +
        "organization in space and time, the role nuclear organization plays in gene expression and cellular function, " +
        "and how changes in nuclear organization affect normal development as well as various diseases.  The program is " +
        "developing novel tools to explore the dynamic nuclear architecture and its role in gene expression programs, " +
        "models to examine the relationship between nuclear organization and function, and reference maps of nuclear" +
        "architecture in a variety of cells and tissues as a community resource.",
    },
    publicHubList: [
      {
        collection: "4D Nucleome Network",
        name: "4DN datasets",
        numTracks: 103,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/4dn/4dn-galGal5-July2021.jsx",
        description: {
          "hub built by": "Daofeng Li (dli23@wustl.edu)",
          "last update": "Jul 14 2021",
          "hub built notes":
            "metadata information are obtained directly from 4DN data portal",
        },
      },
    ],
  },
  DM6: {
    publicHubData: {
      "4D Nucleome Network":
        "The 4D Nucleome Network aims to understand the principles underlying nuclear " +
        "organization in space and time, the role nuclear organization plays in gene expression and cellular function, " +
        "and how changes in nuclear organization affect normal development as well as various diseases.  The program is " +
        "developing novel tools to explore the dynamic nuclear architecture and its role in gene expression programs, " +
        "models to examine the relationship between nuclear organization and function, and reference maps of nuclear" +
        "architecture in a variety of cells and tissues as a community resource.",
    },
    publicHubList: [
      {
        collection: "4D Nucleome Network",
        name: "4DN datasets",
        numTracks: 6,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/4dn/4dn-dm6-July2021.jsx",
        description: {
          "hub built by": "Daofeng Li (dli23@wustl.edu)",
          "last update": "Jul 14 2021",
          "hub built notes":
            "metadata information are obtained directly from 4DN data portal",
        },
      },
    ],
  },
  CE11: {},
  APLCAL3: {},
  SACCER3: {
    publicHubData: {
      "3D structures": "3D stucure data collection",
    },
    publicHubList: [
      {
        collection: "3D structures",
        name: "3D structures from Nature 465, 363–367 (2010)",
        numTracks: 1,
        oldHubFormat: false,
        url: "https://target.wustl.edu/dli/tmp/2010_nature_yeast_3d.jsx",
      },
    ],
  },
  Ebola: {},
  SARS: {},
  MERS: {},
  nCoV2019: {
    publicHubData: {
      "UniProt protein annotation":
        '<span> compiled by{" "} <a href="https://genome.ucsc.edu/cgi-bin/hgTables?hgsid=1276980573_aa3KBxjbtSRpAuTf9vi5WxRKX9b8&clade=virus&org=SARS-CoV-2&db=wuhCor1&hgta_group=uniprot&hgta_track=ncbiGeneBGP&hgta_table=0&hgta_regionType=range&position=NC_045512v2%3A1-29%2C903&hgta_outputType=primaryTable&hgta_outFileName=" target="_blank" rel="noopener noreferrer" > UCSC </a> </span> ',
      "NCBI database":
        "SNV tracks of all SARS-CoV-2 strains on NCBI Genbank displaying their sequence variation from reference",
      "Nextstrain database":
        "SNV tracks of all SARS-CoV-2 strains from Nextstrain, displaying their sequence variation from the reference",
      "GISAID database":
        "SNV tracks of SARS-CoV-2 strains from GISAID, displaying their sequence variation from the reference",
      Diagnostics: "Primers, gRNAs, etc. for diagnostic tests",
      "Epitope predictions":
        "SARS-CoV-2 Epitope Predictions Across HLA-1 Alleles",
      "Recombination events":
        "Recombination events detected by junction-spanning RNA-seq",
      "Viral RNA modifications":
        "RNA modifications detected using Nanopore direct RNA sequencing",
      "Viral RNA expression": "Viral RNA expression measured by Nanopore",
      "Sequence variation":
        "Demo tracks for using the browser to study sequence variation and diversity across strains",
      "Putative SARS-CoV-2 Immune Epitopes":
        "Datahubs with tracks providing predicted epitope sequences across the SARS-CoV-2 reference genome",
      "Image data from IDR":
        "Images from IDR (https://idr.openmicroscopy.org/)",
      "SARS-CoV-2 CRISPR Screen Database":
        "A database containing tracks displaying the log2 fold changes and p-values in SARS-CoV-2 infected populations vs uninfected control.",
      "Variants of Interest and Variants of Concern":
        "A database containing all 8 SARS-CoV-2 Variants of Interest and all 5 Variants of Concern, as defined by the CDC as of May 25, 2021: https://www.cdc.gov/coronavirus/2019-ncov/variants/variant-info.html#Interest",
    },
    publicHubList: [
      {
        collection: "UniProt protein annotation",
        name: "UniProt protein annotation",
        numTracks: 13,
        oldHubFormat: false,
        url: "https://epigenome.wustl.edu/SARS-CoV-2/uniprot/tracks.jsx",
        description: {
          "data source":
            "compiled by ucsc, assessed through https://genome.ucsc.edu/cgi-bin/hgTables?hgsid=1276980573_aa3KBxjbtSRpAuTf9vi5WxRKX9b8&clade=virus&org=SARS-CoV-2&db=wuhCor1&hgta_group=uniprot&hgta_track=ncbiGeneBGP&hgta_table=0&hgta_regionType=range&position=NC_045512v2%3A1-29%2C903&hgta_outputType=primaryTable&hgta_outFileName=",
        },
      },
      {
        collection: "SARS-CoV-2 CRISPR Screen Database",
        name: "SARS-CoV-2 CRISPR Screen Database",
        numTracks: 12,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~jflynn/virus_genome_browser/crispr_screen/crispr_screen.jsx",
        description: {
          "hub built by": "Jennifer Karlow (Flynn) (jaflynn@wustl.edu)",
          "data source":
            "Baggen, J., Persoons, L., Vanstreels, E. et al. Genome-wide CRISPR screening identifies TMEM106B as a proviral host factor for SARS-CoV-2. Nat Genet 53, 435–444 (2021). https://doi.org/10.1038/s41588-021-00805-2",
          "hub info":
            "This datahub contains 12 tracks - 4 for each stringency/adjustment levels: one showing log2 fold change values and the other 3 showing p-values for SARS-CoV-2 infected populations vs uninfected controls (14 days after exposure). The data displayed are from Supplementary Table 11: Supplementary Table 11. SARS-CoV-2 low stringency screen - gene-level analysis SARS-CoV-2 versus control - adjusted, Supplementary Table 7: Supplementary Table 7. SARS-CoV-2 high stringency screen - gene-level analysis, and Supplementary Table 10. SARS-CoV-2 low stringency screen - gene-level analysis SARS-CoV-2 versus control.",
        },
      },
      {
        collection: "Variants of Interest and Variants of Concern",
        name: "Variants of Interest and Variants of Concern",
        numTracks: 13,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~jflynn/virus_genome_browser/variants_of_concern/voi_and_voc.jsx",
        description: {
          "hub built by": "Jennifer Karlow (Flynn) (jaflynn@wustl.edu)",
          "hub info":
            "A database containing all 8 SARS-CoV-2 Variants of Interest and all 5 Variants of Concern, as defined by the CDC as of May 25, 2021: https://www.cdc.gov/coronavirus/2019-ncov/variants/variant-info.html#Interest",
        },
      },
      {
        collection: "Diagnostics",
        name: "Primers",
        numTracks: 9,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/viralBrowser/primers/primers.jsx",
        description: {
          "hub built by": "Changxu Fan (fanc@wustl.edu)",
          "hub info": "CDC primers and WHO non-CDC primers",
          "data source:":
            "https://www.who.int/emergencies/diseases/novel-coronavirus-2019/technical-guidance/laboratory-guidance",
        },
      },
      {
        collection: "Diagnostics",
        name: "CRISPR-based diagnostic tests",
        numTracks: 2,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/viralBrowser/v2/others/hubs/gmatt/crispr_diagnostic_tests.jsx",
        description: {
          "hub built by": "Gavriel Matt (gavrielmatt@wustl.edu)",
          "hub info": "CRISPR-based assays for detecting SARS-CoV-2.",
          "SHERLOCK diagnostic test track":
            "Primer and guide RNA sequences used in the CRISPR-Cas13a-based SHERLOCK assay for detecting SARS-CoV-2 (source: https://www.broadinstitute.org/files/publications/special/COVID-19%20detection%20(updated).pdf; accessed on 05-08-20).",
          "DETECTR diagnostic test track":
            "Primer and guide RNA sequences used in the CRISPR-Cas12-based DETECTR assay for detecting SARS-CoV-2 (source: Broughton et al., 2020; doi: https://doi.org/10.1038/s41587-020-0513-4).",
        },
      },
      {
        collection: "Putative SARS-CoV-2 Immune Epitopes",
        name: "SARS-CoV-2 Epitopes Predicted to Bind HLA Class 1 Proteins Database",
        numTracks: 1,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~jflynn/virus_genome_browser/Campbell_et_al/campbell_et_al.jsx",
        description: {
          "hub built by": "Jennifer Flynn (jaflynn@wustl.edu)",
          "hub info":
            "Predicted SARS-CoV-2 epitopes that bind to class 1 HLA proteins",
          values:
            "Values represent number of strains with the predicted epitope. Only epitope predictions with 100% sequence identity in SARS-CoV-2 are displayed.",
          "data source":
            "Campbell, et al. (2020) pre-print (DOI: 10.1101/2020.03.30.016931)",
        },
      },
      {
        collection: "Putative SARS-CoV-2 Immune Epitopes",
        name: "Congeneric (or Closely-related) Putative SARS Immune Epitopes Locations (this publication)",
        numTracks: 1,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~mchoudhary/viralBrowser/IEDB_NC_045512.2_SARS-tblastn-nCoV_3H3V6ZBF01R.hub",
        description: {
          "hub built by": "Mayank Choudhary (mayank-choudhary@wustl.edu)",
          "hub info":
            "Congeneric (or closely-related) putative SARS linear immune epitopes catalogued in IEDB mapped to exact-match locations in SARS-CoV-2",
        },
      },
      {
        collection: "Putative SARS-CoV-2 Immune Epitopes",
        name: "Putative SARS-CoV-2 Epitopes",
        numTracks: 14,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~mchoudhary/viralBrowser/SARS-CoV-2_immune_epitopes.hub",
        description: {
          "hub built by": "Mayank Choudhary (mayank-choudhary@wustl.edu)",
          "hub info":
            "SARS-CoV-2 Immune Epitopes from various pre-prints and publications",
        },
      },
      {
        collection: "Recombination events",
        name: "Recombination events (Kim et al., 2020)",
        numTracks: 3,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/viralBrowser/v2/others/hubs/gmatt/recombinationEvents.jsx",
        description: {
          "hub built by": "Gavriel Matt (gavrielmatt@wustl.edu)",
          "hub info":
            "Coordinates of transcription regulatory sequences (TRSs) were retrieved from (Wu et al., 2020; DOI: 10.1038/s41586-020-2008-3). Recombination events were detected by junction-spanning RNA-seq reads that were generated by (Kim et al., 2020; DOI: 10.1016/j.cell.2020.04.011). The color intensity of the arc corresponds to the number of reads supporting the recombination event.",
          TRS: "Transcription regulatory sequences (TRSs). The leader TRS (TRS-L) is colored black and body TRSs (TRS-B) are colored red.",
          "TRS-L-dependent recombination track":
            "Recombination events mediated by TRS-L. Scale 0-7000000 reads.",
          "TRS-L-independent recombination track":
            "Recombination events not mediated by TRS-L. Scale 0-1000 reads.",
        },
      },
      {
        collection: "Viral RNA modifications",
        name: "Viral RNA modifications (Kim et al., 2020)",
        numTracks: 10,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~mchoudhary/viralBrowser/studies/kim-2020/rnamodifications.jsx",
        description: {
          "hub built by": "Mayank Choudhary (mayank-choudhary@wustl.edu)",
          "hub info":
            "RNA modifications detected using Nanopore direct RNA sequencing (Kim et al., 2020; DOI: 10.1016/j.cell.2020.04.011). Values are displayed as fractions",
          "data source": "Supplementary Table 5, Kim et al 2020",
        },
      },
      {
        collection: "Viral RNA expression",
        name: "Viral RNA expression (Kim et al., 2020)",
        numTracks: 1,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/virus/nanoporeBW.jsx",
        description: {
          "hub built by": "Xiaoyu Zhuo (xzhuo@wustl.edu)",
          "hub info":
            "a bigwig track displaying nanopore expression from SARS-CoV-2 infected Vero cells (Kim et al., 2020; DOI: 10.1016/j.cell.2020.04.011).",
        },
      },
      {
        collection: "Sequence variation",
        name: "D614G prevalence across time",
        numTracks: 1,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~mchoudhary/viralBrowser/D614G_byweek.hub",
        description: {
          "hub built by": "Mayank Choudhary (mayank-choudhary@wustl.edu)",
          "hub info":
            "Percentage of strains with D614G mutation collected in each week between 12/23/2019 and 05/04/2020",
        },
      },
      {
        collection: "SARS-CoV-2 database",
        name: "Non-canonical ORFs",
        numTracks: 1,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/viralBrowser/v2/others/hubs/gmatt/sars-cov-2_finkel2020_novelORFs.jsx",
        description: {
          "hub built by": "Gavriel Matt (gavrielmatt@wustl.edu)",
          "hub info":
            "Non-canonical open reading frames (ORFs) in SARS-CoV-2. Abbreviations: iORF = internal ORF; uORF = upstream ORF; ext = extended ORF.",
          "data source": "Finkel et al., 2020 (PMID: 32906143)",
        },
      },
      {
        collection: "Image data from IDR",
        name: "Images from IDR (https://idr.openmicroscopy.org/)",
        numTracks: 1,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/virus/imagehub.jsx",
        description: {
          "hub built by": "Daofeng Li (dli23@wustl.edu)",
          "hub info": "Images are displayed through API provided by IDR.",
          "data source": "https://idr.openmicroscopy.org/",
        },
      },
      {
        collection: "NCBI database",
        name: "All NCBI SARS-CoV-2 isolates",
        numTracks: 53248,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/ncbi/2021-02-16/browser_strains.jsx",
        description: {
          "hub built by": "Changxu Fan (fanc@wustl.edu)",
          "hub info":
            "All SARS-CoV-2 strains available on NCBI. Aligned to reference genome (NC_045512.2) using EMBL 'stretcher'.",
          "data source": "https://www.ncbi.nlm.nih.gov/nuccore",
          "white space": "Matching the reference",
          "colored bars":
            "Variation from the reference. Details are color coded. Zoom in to click on the bar to see detail",
          "long stretches of rosy brown": "Unsequenced regions",
        },
      },
      {
        collection: "NCBI database",
        name: "All NCBI SARS-CoV-2 isolates, in SNV2 format",
        numTracks: 53248,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/ncbi/2021-02-16/browser_strains_snv2.jsx",
        description: {
          "hub built by": "Changxu Fan (fanc@wustl.edu)",
          "hub info":
            "All SARS-CoV-2 strains available on NCBI. Aligned to reference genome (NC_045512.2) using EMBL 'stretcher'.",
          format: "SNV2: suggests putative amino acid level mutations",
          "data source": "https://www.ncbi.nlm.nih.gov/nuccore",
        },
      },
      {
        collection: "Nextstrain database",
        name: "All Nextstrain SARS-CoV-2 isolates",
        numTracks: 3890,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/nextstrain/2021-04-27/browser_strains.jsx",
        description: {
          "hub built by": "Changxu Fan (fanc@wustl.edu)",
          "track type":
            "SNV tracks of all SARS-CoV-2 strains from Nextstrain, displaying their sequence variation from the reference",
          "data source": "http://data.Nextstrain.org/ncov.jsx",
        },
      },
      {
        collection: "Nextstrain database",
        name: "All Nextstrain SARS-CoV-2 isolates, in SNV2 format",
        numTracks: 3890,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/nextstrain/2021-04-27/browser_strains_snv2.jsx",
        description: {
          "hub built by": "Changxu Fan (fanc@wustl.edu)",
          "track type":
            "SNV tracks of all SARS-CoV-2 strains from Nextstrain, displaying their sequence variation from the reference and suggesting putative amino acid level mutations",
          "data source": "http://data.Nextstrain.org/ncov.jsx",
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (-5/22/2020)",
        numTracks: 30612,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/5-22/browser_strains.jsx",
        description: {
          "track type":
            "SNV tracks of all SARS-CoV-2 strains available on GISAID as of 5/22/2020, displaying their sequence variation from the reference",
          "data source":
            '<a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"> <img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /> </a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database SNV2 format (-5/22/2020)",
        numTracks: 30612,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/5-22/browser_strains_snv2.jsx",
        description: {
          "track type":
            "SNV2 tracks of all SARS-CoV-2 strains available on GISAID as of 5/22/2020, displaying their sequence variation from the reference and suggesting putative amino acid level mutations",
          "data source":
            '<a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"> <img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /> </a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (5/22/2020-7/28/2020)",
        numTracks: 42199,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/7-28/browser_strains_new.jsx",
        description: {
          "track type":
            "SNV tracks of all SARS-CoV-2 strains that became available on GISAID between 5/22/2020 and 7/28/2020 , displaying their sequence variation from the reference",
          "data source":
            ' <a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"> <img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /> </a>',
        },
      },

      {
        collection: "GISAID database",
        name: "GISAID database SNV2 format (5/22/2020-7/28/2020)",
        numTracks: 42199,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/7-28/browser_strains_new_snv2.jsx",
        description: {
          "track type":
            "SNV2 tracks of all SARS-CoV-2 strains that became available on GISAID between 5/22/2020 and 7/28/2020, displaying their sequence variation from the reference and suggesting putative amino acid level mutations",
          "data source":
            ' <a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"> <img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /> </a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (7/28/2020 - 9/21/2020)",
        numTracks: 33785,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/9-21/browser_strains_new.jsx",
        description: {
          "track type":
            "SNV tracks of all SARS-CoV-2 isolates that became available on GISAID from 7/28/2020 to 9/21/2020, displaying their sequence variation from the reference",
          "data source":
            ' <a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"> <img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /></a> ',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database SNV2 format (7/28/2020 - 9/21/2020)",
        numTracks: 33785,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/9-21/browser_strains_new_snv2.jsx",
        description: {
          "track type":
            "SNV tracks of all SARS-CoV-2 isolates that became available on GISAID from 7/28/2020 to 9/21/2020, displaying their sequence variation from the reference and suggesting putative amino acid level mutations",
          "data source":
            ' <a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"> <img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /> </a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (9/21/2020 - 10/28/2020)",
        numTracks: 59667,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/10-28/browser_strains_new.jsx",
        description: {
          "track type":
            "SNV tracks of all SARS-CoV-2 isolates that became available on GISAID from 9/21/2020 to 10/28/2020, displaying their sequence variation from the reference",
          "data source":
            '<a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"> <img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /> </a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database SNV2 format (9/21/2020 - 10/28/2020)",
        numTracks: 59667,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/10-28/browser_strains_new_snv2.jsx",
        description: {
          "track type":
            "SNV tracks of all SARS-CoV-2 isolates that became available on GISAID from 9/21/2020 to 10/28/2020, displaying their sequence variation from the reference and suggesting putative amino acid level mutations",
          "data source":
            '<a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"> <img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /> </a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (10/28/2020 - 12/5/2020)",
        numTracks: 74375,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/12-5/browser_strains_new.jsx",
        description: {
          "track type":
            "SNV tracks of all SARS-CoV-2 isolates that became available on GISAID from 10/28/2020 to 12/5/2020, displaying their sequence variation from the reference",
          "data source":
            '<a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"> <img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /></a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database SNV2 format (10/28/2020 - 12/5/2020)",
        numTracks: 74375,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/12-5/browser_strains_new_snv2.jsx",
        description: {
          "track type":
            "SNV tracks of all SARS-CoV-2 isolates that became available on GISAID from 10/28/2020 to 12/5/2020, displaying their sequence variation from the reference and suggesting putative amino acid level mutations",
          "data source":
            '<a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"> <img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /> </a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (12/5/2020 - 2/16/2021) part1",
        numTracks: 55198,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-02-16/browser_strains_new_part1.jsx",
        description: {
          "track type":
            "SNV tracks of all SARS-CoV-2 isolates that became available on GISAID from 12/5/2020 to 2/16/2021, displaying their sequence variation from the reference",
          "data source":
            ' <a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"> <img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /> </a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database SNV2 format (12/5/2020 - 2/16/2021) part1",
        numTracks: 55198,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-02-16/browser_strains_new_snv2_part1.jsx",
        description: {
          "track type":
            "SNV tracks of all SARS-CoV-2 isolates that became available on GISAID from 12/5/2020 to 2/16/2021, displaying their sequence variation from the reference and suggesting putative amino acid level mutations",
          "data source":
            ' <a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"> <img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /> </a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (12/5/2020 - 2/16/2021) part2",
        numTracks: 55198,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-02-16/browser_strains_new_part2.jsx",
        description: {
          "track type":
            "SNV tracks of all SARS-CoV-2 isolates that became available on GISAID from 12/5/2020 to 2/16/2021, displaying their sequence variation from the reference",
          "data source":
            '<a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"> <img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /> </a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database SNV2 format (12/5/2020 - 2/16/2021) part2",
        numTracks: 55198,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-02-16/browser_strains_new_snv2_part2.jsx",
        description: {
          "track type":
            "SNV tracks of all SARS-CoV-2 isolates that became available on GISAID from 12/5/2020 to 2/16/2021, displaying their sequence variation from the reference and suggesting putative amino acid level mutations",
          "data source":
            '<a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"> <img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /> </a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (12/5/2020 - 2/16/2021) part3",
        numTracks: 55198,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-02-16/browser_strains_new_part3.jsx",
        description: {
          "track type":
            "SNV tracks of all SARS-CoV-2 isolates that became available on GISAID from 12/5/2020 to 2/16/2021, displaying their sequence variation from the reference",
          "data source":
            '<a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"> <img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /> </a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database SNV2 format (12/5/2020 - 2/16/2021) part3",
        numTracks: 55198,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-02-16/browser_strains_new_snv2_part3.jsx",
        description: {
          "track type":
            "SNV tracks of all SARS-CoV-2 isolates that became available on GISAID from 12/5/2020 to 2/16/2021, displaying their sequence variation from the reference and suggesting putative amino acid level mutations",
          "data source":
            '<a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"> <img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /> </a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (12/5/2020 - 2/16/2021) part4",
        numTracks: 55198,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-02-16/browser_strains_new_part4.jsx",
        description: {
          "track type":
            "SNV tracks of all SARS-CoV-2 isolates that became available on GISAID from 12/5/2020 to 2/16/2021, displaying their sequence variation from the reference",
          "data source":
            '    <a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"> <img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /> </a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database SNV2 format (12/5/2020 - 2/16/2021) part4",
        numTracks: 55198,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-02-16/browser_strains_new_snv2_part4.jsx",
        description: {
          "track type":
            "SNV tracks of all SARS-CoV-2 isolates that became available on GISAID from 12/5/2020 to 2/16/2021, displaying their sequence variation from the reference and suggesting putative amino acid level mutations",
          "data source":
            '  <a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"> <img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /> </a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (12/5/2020 - 2/16/2021) part5",
        numTracks: 55195,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-02-16/browser_strains_new_part5.jsx",
        description: {
          "track type":
            "SNV tracks of all SARS-CoV-2 isolates that became available on GISAID from 12/5/2020 to 2/16/2021, displaying their sequence variation from the reference",
          "data source":
            ' <a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"> <img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /> </a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database SNV2 format (12/5/2020 - 2/16/2021) part5",
        numTracks: 55195,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-02-16/browser_strains_new_snv2_part5.jsx",
        description: {
          "track type":
            "SNV tracks of all SARS-CoV-2 isolates that became available on GISAID from 12/5/2020 to 2/16/2021, displaying their sequence variation from the reference and suggesting putative amino acid level mutations",
          "data source":
            '         <a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"> <img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /> </a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (2021-04-27 update) part 1",
        numTracks: 74745,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-04-27/browser_strains_new_part1.jsx",
        description: {
          "data source":
            '<a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"> <img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /> </a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (2021-04-27 update) part 2",
        numTracks: 74747,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-04-27/browser_strains_new_part2.jsx",
        description: {
          "data source":
            '<a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"> <img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /> </a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (2021-04-27 update) part 3",
        numTracks: 74785,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-04-27/browser_strains_new_part3.jsx",
        description: {
          "data source":
            ' <a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"> <img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /> </a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (2021-04-27 update) part 4",
        numTracks: 74749,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-04-27/browser_strains_new_part4.jsx",
        description: {
          "data source":
            '<a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"> <img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /> </a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (2021-04-27 update) part 5",
        numTracks: 74781,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-04-27/browser_strains_new_part5.jsx",
        description: {
          "data source":
            ' <a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"><img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /> </a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (2021-04-27 update) part 6",
        numTracks: 74781,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-04-27/browser_strains_new_part6.jsx",
        description: {
          "data source":
            '<a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"> <img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /> </a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (2021-04-27 update) part 7",
        numTracks: 74755,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-04-27/browser_strains_new_part7.jsx",
        description: {
          "data source":
            '<a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"><img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /></a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (2021-04-27 update) part 8",
        numTracks: 74759,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-04-27/browser_strains_new_part8.jsx",
        description: {
          "data source":
            '<a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"><img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /></a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (2021-04-27 update) part 9",
        numTracks: 74747,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-04-27/browser_strains_new_part9.jsx",
        description: {
          "data source":
            '<a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"><img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /></a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (2021-04-27 update) part 10",
        numTracks: 74736,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-04-27/browser_strains_new_part10.jsx",
        description: {
          "data source":
            '<a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"> <img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /> </a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (2021-04-27 update) part 1, in SNV2 format ",
        numTracks: 74745,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-04-27/browser_strains_new_snv2_part1.jsx",
        description: {
          "data source":
            '<a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"><img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /></a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (2021-04-27 update) part 2, in SNV2 format ",
        numTracks: 74747,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-04-27/browser_strains_new_snv2_part2.jsx",
        description: {
          "data source":
            '<a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"><img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /></a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (2021-04-27 update) part 3, in SNV2 format ",
        numTracks: 74785,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-04-27/browser_strains_new_snv2_part3.jsx",
        description: {
          "data source":
            '<a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"><img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /></a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (2021-04-27 update) part 4, in SNV2 format ",
        numTracks: 74749,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-04-27/browser_strains_new_snv2_part4.jsx",
        description: {
          "data source":
            ' <a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"><img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /></a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (2021-04-27 update) part 5, in SNV2 format ",
        numTracks: 74781,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-04-27/browser_strains_new_snv2_part5.jsx",
        description: {
          "data source":
            ' <a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"><img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /></a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (2021-04-27 update) part 6, in SNV2 format ",
        numTracks: 74781,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-04-27/browser_strains_new_snv2_part6.jsx",
        description: {
          "data source":
            '<a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"><img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /></a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (2021-04-27 update) part 7, in SNV2 format ",
        numTracks: 74755,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-04-27/browser_strains_new_snv2_part7.jsx",
        description: {
          "data source":
            '<a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"><img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /></a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (2021-04-27 update) part 8, in SNV2 format ",
        numTracks: 74759,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-04-27/browser_strains_new_snv2_part8.jsx",
        description: {
          "data source":
            '<a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"><img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /></a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (2021-04-27 update) part 9, in SNV2 format ",
        numTracks: 74747,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-04-27/browser_strains_new_snv2_part9.jsx",
        description: {
          "data source":
            '<a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"><img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /></a>',
        },
      },
      {
        collection: "GISAID database",
        name: "GISAID database (2021-04-27 update) part 10, in SNV2 format ",
        numTracks: 74736,
        oldHubFormat: false,
        url: "https://wangftp.wustl.edu/~cfan/gisaid/2021-04-27/browser_strains_new_snv2_part10.jsx",
        description: {
          "data source":
            ' <a href="https://www.gisaid.org/" target="_blank" rel="noopener noreferrer"><img src="https://www.gisaid.org/fileadmin/gisaid/img/schild.png" alt="GISAID logo" /></a>',
        },
      },
    ],
  },
  hpv16: {},
  LEPOCU1: {
    publicHubData: {
      "Noble lab":
        "Published data from Noble lab (https://noble.gs.washington.edu/)",
      "3D structures": "3D stucure data collection",
    },
    publicHubList: [
      {
        collection: "Noble lab",
        name: "Long-range chromatin interaction experiments",
        numTracks: 11,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/Pfalciparum3D7/long",
        description:
          "A collection of long-range chromatin interaction data sets from https://noble.gs.washington.edu/proj/plasmo3d/",
      },
      {
        collection: "3D structures",
        name: "3D structures from Genome Res. 2014 Jun; 24(6): 974–988.",
        numTracks: 3,
        oldHubFormat: false,
        url: "https://target.wustl.edu/dli/tmp/pfal3d7_3d.jsx",
      },
    ],
  },
  gorGor4: {
    publicHubData: [],
    publicHubList: [],
  },
  gorGor3: {
    publicHubData: [],
    publicHubList: [],
  },
  nomLeu3: {
    publicHubData: [],
    publicHubList: [],
  },
  papAnu2: {
    publicHubData: [],
    publicHubList: [],
  },
  oryCun2: {
    publicHubData: [],
    publicHubList: [],
  },
  canFam3: {
    publicHubData: [],
    publicHubList: [],
  },
  canFam2: {
    publicHubData: [],
    publicHubList: [],
  },
  monDom5: {
    publicHubData: [],
    publicHubList: [],
  },
  calJac3: {
    publicHubData: [],
    publicHubList: [],
  },
  AraTha1: {
    publicHubData: [],
    publicHubList: [],
  },
  Pfal3D7: {
    publicHubData: [],
    publicHubList: [],
  },
  Creinhardtii506: {
    publicHubData: [],
    publicHubList: [],
  },
  TbruceiTREU927: {
    publicHubData: [],
    publicHubList: [],
  },
  TbruceiLister427: {
    publicHubData: [],
    publicHubList: [],
  },
  CHM13v1_1: {
    publicHubData: [],
    publicHubList: [],
  },
  xenTro10: {
    publicHubData: [],
    publicHubList: [],
  },
  b_chiifu_v3: {
    publicHubData: [],
    publicHubList: [],
  },
  susScr11: {
    publicHubData: [],
    publicHubList: [],
  },
  susScr3: {
    publicHubData: [],
    publicHubList: [],
  },
  oviAri4: {
    publicHubData: [],
    publicHubList: [],
  },
  calJac4: {
    publicHubData: [],
    publicHubList: [],
  },
  rheMac10: {
    publicHubData: [],
    publicHubList: [],
  },
  RN7: {
    publicHubData: [],
    publicHubList: [],
  },
  CHMV2: {
    publicHubData: [],
    publicHubList: [],
  },
  GRCg7b: {
    publicHubData: [],
    publicHubList: [],
  },
  GRCg7w: {
    publicHubData: [],
    publicHubList: [],
  },
  phaw5: {
    publicHubData: [],
    publicHubList: [],
  },
};
