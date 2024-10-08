import Chromosome from "../../Chromosome";
import Genome from "../../Genome";
import TrackModel from "../../TrackModel";
import cytobands from "./cytoBand.json";
import annotationTracks from "./annotationTracks.json";

const genome = new Genome("hg38", [
  new Chromosome("chr1", 248956422),
  new Chromosome("chr2", 242193529),
  new Chromosome("chr3", 198295559),
  new Chromosome("chr4", 190214555),
  new Chromosome("chr5", 181538259),
  new Chromosome("chr6", 170805979),
  new Chromosome("chr7", 159345973),
  new Chromosome("chr8", 145138636),
  new Chromosome("chr9", 138394717),
  new Chromosome("chr10", 133797422),
  new Chromosome("chr11", 135086622),
  new Chromosome("chr12", 133275309),
  new Chromosome("chr13", 114364328),
  new Chromosome("chr14", 107043718),
  new Chromosome("chr15", 101991189),
  new Chromosome("chr16", 90338345),
  new Chromosome("chr17", 83257441),
  new Chromosome("chr18", 80373285),
  new Chromosome("chr19", 58617616),
  new Chromosome("chr20", 64444167),
  new Chromosome("chr21", 46709983),
  new Chromosome("chr22", 50818468),
  new Chromosome("chrM", 16569),
  new Chromosome("chrX", 156040895),
  new Chromosome("chrY", 57227415),
]);
//   //chr7:27053397-27373765
//   // chr7:10000-20000
//   //testing finemode  27213325-27213837
//   //chr7:159159564-chr8:224090
// //27195171-27202238
//chr7:26805572-26825594
// big interact chr3:63836292-64336395
// https://target.wustl.edu/dli/tmp/test2.g3d
// chr7:74083652-74084068 dynseq cromorsome
const navContext = genome.makeNavContext();
const defaultRegion = navContext.parse("chr7:27053397-27373765");
const defaultTracks = [
  new TrackModel({
    type: "refbed",
    name: "mm10 gencode basic",
    url: "https://vizhub.wustl.edu/public/tmp/gencodeM18_load_basic_Gene.bed.gz",
    options: {
      categoryColors: {
        coding: "rgb(101,1,168)",
        nonCoding: "rgb(1,193,75)",
        pseudo: "rgb(230,0,172)",
        problem: "rgb(224,2,2)",
        other: "rgb(128,128,128)",
      },
    },
  }),
  new TrackModel({
    type: "matplot",
    name: "matplot wrap",
    tracks: [
      {
        type: "bigwig",
        url: "https://vizhub.wustl.edu/public/tmp/TW463_20-5-bonemarrow_MeDIP.bigWig",
        name: "MeDIP",
        options: {
          color: "red",
          backgroundColor: "#FFE7AB",
        },
        metadata: {
          sample: "bone",
          assay: "MeDIP",
        },
      },
      {
        type: "bigwig",
        url: "https://vizhub.wustl.edu/public/tmp/TW551_20-5-bonemarrow_MRE.CpG.bigWig",
        name: "MRE",
        options: {
          color: "blue",
          backgroundColor: "#C0E3CC",
        },
        metadata: {
          sample: "bone",
          assay: "MRE",
        },
      },
    ],
  }),
  new TrackModel({
    type: "hic",
    name: "test hic",
    url: "https://epgg-test.wustl.edu/dli/long-range-test/test.hic",
    // "options": {
    //     "displayMode": "arc"
    // }
  }),

  new TrackModel({
    type: "bigbed",
    name: "test bigbed",
    url: "https://vizhub.wustl.edu/hubSample/hg19/bigBed1",
  }),
  new TrackModel({
    type: "geneAnnotation",
    name: "refGene",
    genome: "hg38",
  }),
  new TrackModel({
    type: "repeatmasker",
    name: "RepeatMasker",
    url: "https://vizhub.wustl.edu/public/hg19/rmsk16.bb",
  }),
  // new TrackModel({
  //   type: "geneAnnotation",
  //   name: "gencodeV39",
  //   genome: "hg38",
  // }),
  new TrackModel({
    type: "geneAnnotation",
    name: "refGene",
    genome: "mm10",
    metadata: { genome: "mm10" },
  }),
  new TrackModel({
    type: "bed",
    name: "mm10 bed",
    url: "https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands.bed.gz",
  }),
  new TrackModel({
    type: "bigwig",
    name: "example bigwig",
    url: "https://vizhub.wustl.edu/hubSample/hg19/GSM429321.bigWig",
    options: {
      color: "blue",
    },
  }),
  new TrackModel({
    type: "dynseq",
    name: "example dynseq",
    url: "https://target.wustl.edu/dli/tmp/deeplift.example.bw",
    options: {
      color: "blue",
      height: 100,
    },
  }),
  // new TrackModel({
  //   type: "methylc",
  //   name: "H1",
  //   url: "https://vizhub.wustl.edu/public/hg19/methylc2/h1.liftedtohg19.gz",
  //   options: {
  //     label: "Methylation",
  //     colorsForContext: {
  //       CG: { color: "#648bd8", background: "#d9d9d9" },
  //       CHG: { color: "#ff944d", background: "#ffe0cc" },
  //       CHH: { color: "#ff00ff", background: "#ffe5ff" },
  //     },
  //     depthColor: "#01E9FE",
  //   },
  // }),

  new TrackModel({
    name: "hg38tomm10",
    label: "Query mouse mm10 to hg38 blastz",
    type: "genomealign",
    querygenome: "mm10",
    filetype: "genomealign",
    url: "https://vizhub.wustl.edu/public/hg38/weaver/hg38_mm10_axt.gz",
  }),
  new TrackModel({
    type: "categorical",
    name: "ChromHMM",
    url: "https://egg.wustl.edu/d/hg19/E017_15_coreMarks_dense.gz",
    options: {
      category: {
        1: { name: "Active TSS", color: "#ff0000" },
        2: { name: "Flanking Active TSS", color: "#ff4500" },
        3: { name: "Transcr at gene 5' and 3'", color: "#32cd32" },
        4: { name: "Strong transcription", color: "#008000" },
        5: { name: "Weak transcription", color: "#006400" },
        6: { name: "Genic enhancers", color: "#c2e105" },
        7: { name: "Enhancers", color: "#ffff00" },
        8: { name: "ZNF genes & repeats", color: "#66cdaa" },
        9: { name: "Heterochromatin", color: "#8a91d0" },
        10: { name: "Bivalent/Poised TSS", color: "#cd5c5c" },
        11: { name: "Flanking Bivalent TSS/Enh", color: "#e9967a" },
        12: { name: "Bivalent Enhancer", color: "#bdb76b" },
        13: { name: "Repressed PolyComb", color: "#808080" },
        14: { name: "Weak Repressed PolyComb", color: "#c0c0c0" },
        15: { name: "Quiescent/Low", color: "#ffffff" },
      },
    },
  }),
  new TrackModel({
    type: "longrange",
    name: "ES-E14 ChIA-PET",
    url: "https://egg.wustl.edu/d/mm9/GSE28247_st3c.gz",
  }),
  new TrackModel({
    type: "biginteract",
    name: "test bigInteract",
    url: "https://epgg-test.wustl.edu/dli/long-range-test/interactExample3.inter.bb",
  }),
  // new TrackModel({
  //   type: "cool",
  //   name: "Aiden et al. (2009) GM06900 HINDIII 1kb",
  //   url: "Hyc3TZevQVm3FcTAZShLQg",
  //   options: {
  //     displayMode: "arc",
  //   },
  // }),
];

const publicHubData = {
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
};

const publicHubList = [
  {
    collection: "Human Pangenome Reference Consortium (HPRC)",
    name: "HPRC long read methylation data",
    numTracks: 12,
    oldHubFormat: false,
    url: "https://vizhub.wustl.edu/public/hg38/modbed/hub.json",
    description:
      "modbed format methylation track on PacBio and ONT platforms, for 6 sample sources.",
  },
  {
    collection:
      "Reference human epigenomes from Roadmap Epigenomics Consortium",
    name: "All Chromatin states tracks",
    numTracks: 352,
    oldHubFormat: false,
    url: "https://vizhub.wustl.edu/public/hg38/roadmap_hmm.json",
    description:
      "include 15 state core model from observed data, 18 state expanded model from observed data and 25 state model from imputed data. Lifted from hg19 results.",
  },
  {
    collection:
      "Reference human epigenomes from Roadmap Epigenomics Consortium",
    name: "Roadmap ChIP-seq datasets",
    numTracks: 12494,
    oldHubFormat: false,
    url: "https://vizhub.wustl.edu/public/hg38/Roadmap_hg38_ChIPseq_June2021.json",
    description:
      "Roadmap ChIP-seq data. Data are hosted by ENCODE data portal.",
  },
  {
    collection:
      "Reference human epigenomes from Roadmap Epigenomics Consortium",
    name: "Roadmap RNA-seq, WGBS etc. datasets",
    numTracks: 5586,
    oldHubFormat: false,
    url: "https://vizhub.wustl.edu/public/hg38/Roadmap_hg38_others_June2021.json",
    description:
      "Roadmap RNA-seq, WGBS etc. Data are hosted by ENCODE data portal.",
  },
  {
    collection: "Image collection",
    name: "IDR image data",
    numTracks: 28,
    oldHubFormat: false,
    url: "https://vizhub.wustl.edu/public/imagetrack/hg38/hg38.json",
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
    url: "https://vizhub.wustl.edu/public/imagetrack/hg38/4dn/hg38.json",
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
    url: "https://vizhub.wustl.edu/public/hg38/new/mpssur_GRCh38.json",
    description: "signal of unique reads.",
  },
  {
    collection: "Encyclopedia of DNA Elements (ENCODE)",
    name: "ENCODE signal of all reads",
    numTracks: 5230,
    oldHubFormat: false,
    url: "https://vizhub.wustl.edu/public/hg38/new/mpssar_GRCh38.json",
    description: "signal of all reads.",
  },
  {
    collection: "4D Nucleome Network",
    name: "4DN datasets",
    numTracks: 2876,
    oldHubFormat: false,
    url: "https://vizhub.wustl.edu/public/4dn/4dn-GRCh38-July2021.json",
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
    url: "https://vizhub.wustl.edu/public/hg38/new/GRCh38_encode_human_bigwig_metadata_nov142018.json",
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
    url: "https://vizhub.wustl.edu/public/hg38/new/GRCh38_encode_human_hic_metadata_nov142018.json",
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
    url: "https://vizhub.wustl.edu/public/hg38/new/ihec-hg38-urls.json",
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
    url: "https://wangftp.wustl.edu/~dli/eg-hubs/higlass/2019/hg38_cool.json",
  },
  {
    collection:
      "SARS-CoV-2 Host Transcriptional Responses (Blanco-Melo, et al. 2020) Database",
    name: "Human Transcriptional Responses to SARS-CoV-2 and Other Respiratory Infections",
    numTracks: 195,
    oldHubFormat: false,
    url: "https://wangftp.wustl.edu/~jflynn/virus_genome_browser/Blanco_melo_et_al/blanco_melo_et_al.json",
    description: {
      "hub built by": "Jennifer Flynn (jaflynn@wustl.edu)",
      "hub info":
        "Host (human) transcriptional responses to SARS-CoV-2 and other respriatory infections. Aligned to reference genome hg38 using STAR, after first removing mitochondrial and rRNA reads",
      values: "bigWig output from STAR alignment",
    },
  },
];

const HG38 = {
  genome: genome,
  navContext: navContext,
  cytobands: cytobands,
  defaultRegion: defaultRegion,
  defaultTracks: defaultTracks,
  twoBitURL: "https://vizhub.wustl.edu/public/hg38/hg38.2bit",
  publicHubData,
  publicHubList,
  annotationTracks,
};

export default HG38;
