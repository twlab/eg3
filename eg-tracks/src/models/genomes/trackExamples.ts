/**
 * Catalog of example track configurations, one per track type / rendering path.
 *
 * This file replaces the large blocks of commented-out `TrackModel`s that used
 * to live inside the individual genome configs (hg38.js, hg19.js, mm10.js).
 * Those comments were the de-facto manual test suite: to exercise a track type
 * you uncommented a block, saved, reloaded and eyeballed the result.
 *
 * Keeping them here instead means the same data drives all of:
 *   - the in-app dev harness (Apps -> Track Harness)
 *   - the Playwright track smoke tests (eg-browser/e2e)
 *   - hub JSON generated for the `?hub=` URL parameter
 *
 * Each example carries the region where that track actually has data, which is
 * the piece of knowledge that was previously scattered across `//` comments.
 */

/** Broad buckets used to filter/slice the catalog. */
export type TrackExampleTag =
  | "annotation"
  | "numerical"
  | "categorical"
  | "methylation"
  | "interaction"
  | "3d"
  | "alignment"
  | "variant"
  | "sequence"
  | "dynamic"
  | "cross-genome"
  | "container"
  | "error-case"
  /**
   * The track config is correct but its data host no longer answers. Kept for
   * reference; the smoke tests assert the browser survives rather than that the
   * data loads. Swap in a live url and drop this tag when one is found.
   */
  | "stale-host"
  | "slow";

export interface TrackExample {
  /** Stable identifier - used in test names and harness URLs. Never reuse. */
  id: string;
  /** Genome this example is meant to load under. */
  genome: string;
  /** Region where this track has visible data. */
  region: string;
  /** Human-readable purpose of the example. */
  description: string;
  tags: TrackExampleTag[];
  /** Free-form caveats carried over from the original comments. */
  note?: string;
  /** Raw track config, in the same shape a hub JSON entry uses. */
  track: Record<string, any>;
}

/**
 * Regions worth jumping to, harvested from the comments that used to sit at the
 * top of the genome configs. Keyed so tests and the harness can refer to them
 * by name rather than pasting coordinates around.
 */
export const NOTABLE_REGIONS: Record<
  string,
  { region: string; description: string }
> = {
  "hg38-default": {
    region: "chr7:27053397-27373765",
    description: "HOXA cluster - the default hg38 view",
  },
  "hg38-tiny": {
    region: "chr7:10000-20000",
    description: "Very small region, base-level rendering",
  },
  "hg38-finemode": {
    region: "chr7:27213325-27213837",
    description: "Fine mode / base-pair zoom",
  },
  "hg38-finemode-wide": {
    region: "chr7:27195171-27202238",
    description: "Fine mode, slightly wider",
  },
  "hg38-broken-area": {
    region: "chr7:27212313-27212454",
    description: "Historically broken rendering area - regression guard",
  },
  "hg38-wide": {
    region: "chr7:157159564-158159564",
    description: "1 Mb view, exercises binning/aggregation",
  },
  "hg38-dupe-test": {
    region: "chr7:30909538-31229914",
    description: "Duplicate-region test (used with a 38-track session)",
  },
  "hg38-genomealign-rough": {
    region: "chr7:24333029-24373096",
    description: "Rough genome align with query sequence",
  },
  "hg38-longrange": {
    region: "chr7:23208969-31218193",
    description: "8 Mb view for long-range interaction tracks",
  },
  "hg38-biginteract": {
    region: "chr3:63836292-64336395",
    description: "bigInteract example data",
  },
  "hg38-dynseq": {
    region: "chr7:74083652-74084068",
    description: "dynseq base-level letters",
  },
  "hg38-4dn": {
    region: "chr5:114534673-136928518",
    description: "22 Mb view for 4DN Hi-C data",
  },
  "mm10-default": {
    region: "chr6:52424900-52425400",
    description: "Default mm10 view - dbedgraph data",
  },
  "mm10-jaspar": {
    region: "chr6:52160767-52161357",
    description: "JASPAR transcription factor motifs",
  },
  "mm10-text-bed": {
    region: "chr1:731189-812737",
    description: "Text-uploaded bed track",
  },
  "mm10-longrange": {
    region: "chr6:52100000-53000000",
    description: "Long-range interactions",
  },
};

const HG38_DEFAULT = NOTABLE_REGIONS["hg38-default"].region;
const HG19_DEFAULT = "chr7:27053397-27373765";
const MM10_DEFAULT = NOTABLE_REGIONS["mm10-default"].region;

/** Shared ChromHMM colour map, referenced by the categorical examples. */
const CHROMHMM_CATEGORIES = {
  1: { name: "Active TSS", color: "#ff0000" },
  2: { name: "Flanking Active TSS", color: "#ff4500" },
  3: { name: "Transcr at gene 5 prime and 3 prime", color: "#32cd32" },
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
};

const MEDIP_BIGWIG = {
  type: "bigwig",
  url: "https://vizhub.wustl.edu/public/tmp/TW463_20-5-bonemarrow_MeDIP.bigWig",
  name: "MeDIP",
  options: { color: "red", backgroundColor: "#FFE7AB" },
  metadata: { sample: "bone", assay: "MeDIP" },
};

const MRE_BIGWIG = {
  type: "bigwig",
  url: "https://vizhub.wustl.edu/public/tmp/TW551_20-5-bonemarrow_MRE.CpG.bigWig",
  name: "MRE",
  options: { color: "blue", backgroundColor: "#C0E3CC" },
  metadata: { sample: "bone", assay: "MRE" },
};

export const TRACK_EXAMPLES: TrackExample[] = [
  // MARK: - Annotation
  {
    id: "ruler",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "Coordinate ruler - no remote data, always renders",
    tags: ["annotation"],
    track: { type: "ruler", name: "Ruler" },
  },
  {
    id: "genes-refgene",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "refGene annotations from the built-in API",
    tags: ["annotation"],
    track: { type: "geneAnnotation", name: "refGene", genome: "hg38" },
  },
  {
    id: "genes-gencode",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "GENCODE V47 annotations",
    tags: ["annotation"],
    track: { type: "geneAnnotation", name: "gencodeV47", genome: "hg38" },
  },
  {
    id: "genes-mane",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "MANE select v1.4",
    tags: ["annotation"],
    track: {
      type: "geneAnnotation",
      name: "MANE_select_1.4",
      label: "MANE selection v1.4",
      genome: "hg38",
    },
  },
  {
    id: "genes-maxrows",
    genome: "hg19",
    region: HG19_DEFAULT,
    description: "Gene annotations with a maxRows cap - row packing",
    tags: ["annotation"],
    track: {
      type: "geneAnnotation",
      name: "refGene",
      genome: "hg19",
      options: { maxRows: 10 },
    },
  },
  {
    id: "repeatmasker",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "RepeatMasker from a bigBed",
    tags: ["annotation"],
    track: {
      type: "repeatmasker",
      name: "rmsk_all",
      options: { label: "RepeatMasker" },
      url: "https://vizhub.wustl.edu/public/hg38/rmsk16.bb",
    },
  },
  {
    id: "refbed",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "refbed with per-category colours",
    tags: ["annotation"],
    track: {
      type: "refbed",
      name: "refbed",
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
    },
  },
  {
    id: "bed",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "Plain bed track",
    tags: ["annotation"],
    track: {
      type: "bed",
      name: "peak bed",
      url: "https://vizhub.wustl.edu/public/misc/dynamicTrack/bed/peak1.bed.gz",
    },
  },
  {
    id: "bigbed",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "bigBed track",
    tags: ["annotation"],
    track: {
      type: "bigbed",
      name: "test bigbed",
      url: "https://vizhub.wustl.edu/hubSample/hg19/bigBed1",
    },
  },
  {
    id: "bigbed-encode",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "bigBed hosted by the ENCODE portal (different CORS setup)",
    tags: ["annotation"],
    track: {
      type: "bigbed",
      name: "band2",
      url: "https://www.encodeproject.org/files/ENCFF362EJP/@@download/ENCFF362EJP.bigBed",
    },
  },
  {
    id: "jaspar",
    genome: "mm10",
    region: NOTABLE_REGIONS["mm10-jaspar"].region,
    description: "JASPAR transcription factor motifs",
    tags: ["annotation"],
    track: {
      name: "JASPAR Transcription Factors 2022",
      type: "jaspar",
      url: "https://hgdownload.soe.ucsc.edu/gbdb/mm10/jaspar/JASPAR2022.bb",
    },
  },
  {
    id: "snp",
    genome: "hg38",
    region: NOTABLE_REGIONS["hg38-finemode"].region,
    description: "SNP track from the built-in API",
    tags: ["annotation", "variant"],
    track: { type: "snp", name: "snp", genome: "hg38" },
  },

  // MARK: - Numerical
  {
    id: "bigwig",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "Standard bigWig",
    tags: ["numerical"],
    track: {
      type: "bigwig",
      name: "example bigwig",
      url: "https://vizhub.wustl.edu/hubSample/hg19/GSM429321.bigWig",
      options: { color: "blue" },
    },
  },
  {
    id: "bigwig-chr-prefix",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "bigWig whose chromosome names carry a chr prefix",
    tags: ["numerical"],
    note: "Pairs with bigwig-no-chr-prefix to check name normalisation",
    track: {
      type: "bigwig",
      name: "bigwig yeschr",
      genome: "hg38",
      url: "https://vizhub.wustl.edu/hubSample/hg19/GSM432686.bigWig",
    },
  },
  {
    id: "bigwig-no-chr-prefix",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "bigWig whose chromosome names lack a chr prefix",
    tags: ["numerical"],
    track: {
      type: "bigwig",
      name: "bigwig nochr",
      genome: "hg38",
      url: "https://vizhub.wustl.edu/hubSample/hg19/GSM429321.bigWig",
    },
  },
  {
    id: "bedgraph",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "bedGraph rendered as a numerical track",
    tags: ["numerical"],
    track: {
      name: "vertebratephastCons46way",
      label: "Vertebrate PhastCons 46-way",
      filetype: "bedgraph",
      url: "https://vizhub.wustl.edu/public/misc/callingcard/hg38/ENCODE_HCT116-H3K4me1_PE_map_sort.bedgraph.gz",
      height: 50,
      options: { color: "#006385" },
    },
  },
  {
    id: "dynseq",
    genome: "hg38",
    region: NOTABLE_REGIONS["hg38-dynseq"].region,
    description: "dynseq - scaled base letters, needs a base-level region",
    tags: ["numerical", "sequence"],
    track: {
      type: "dynseq",
      name: "example dynseq",
      url: "https://target.wustl.edu/dli/tmp/deeplift.example.bw",
      options: { color: "blue", height: 100 },
    },
  },
  {
    id: "boxplot",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "Boxplot display over bigWig data",
    tags: ["numerical"],
    track: {
      type: "boxplot",
      name: "example boxplot",
      url: "https://vizhub.wustl.edu/public/tmp/TW463_20-5-bonemarrow_MeDIP.bigWig",
    },
  },
  {
    id: "qbed",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "qBED insertions with log scaling and sampling",
    tags: ["numerical"],
    track: {
      type: "qbed",
      url: "https://htcf.wustl.edu/files/RdNgrGeQ/HCT116-PBase.qbed.gz",
      name: "piggyBac insertions",
      showOnHubLoad: true,
      options: {
        color: "#D12134",
        height: 100,
        logScale: "log10",
        show: "sample",
        sampleSize: 1000,
        markerSize: 5,
        opacity: [50],
      },
    },
  },
  {
    id: "matplot",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "matplot container wrapping two bigWigs",
    tags: ["numerical", "container"],
    track: {
      type: "matplot",
      name: "matplot wrap",
      tracks: [MEDIP_BIGWIG, MRE_BIGWIG],
    },
  },

  // MARK: - Methylation / categorical
  {
    id: "methylc",
    genome: "hg19",
    region: HG19_DEFAULT,
    description: "methylC with per-context colours and depth",
    tags: ["methylation"],
    track: {
      type: "methylc",
      name: "H1",
      url: "https://vizhub.wustl.edu/public/hg19/methylc2/h1.liftedtohg19.gz",
      options: {
        label: "Methylation",
        colorsForContext: {
          CG: { color: "#648bd8", background: "#d9d9d9" },
          CHG: { color: "#ff944d", background: "#ffe0cc" },
          CHH: { color: "#ff00ff", background: "#ffe5ff" },
        },
        depthColor: "#01E9FE",
      },
    },
  },
  {
    id: "modbed",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "modbed long-read methylation",
    tags: ["methylation"],
    track: {
      type: "modbed",
      name: "examplemod",
      url: "https://vizhub.wustl.edu/public/hg38/modbed/HG00621.remora.modbed.gz",
    },
  },
  {
    id: "categorical-chromhmm",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "Categorical ChromHMM states with an explicit colour map",
    tags: ["categorical"],
    track: {
      type: "categorical",
      name: "ChromHMM",
      url: "https://egg.wustl.edu/d/hg19/E017_15_coreMarks_dense.gz",
      options: { category: CHROMHMM_CATEGORIES },
    },
  },
  {
    id: "categorical-no-colors",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "Categorical track without a colour map - default palette",
    tags: ["categorical"],
    track: {
      type: "categorical",
      name: "categorical test",
      url: "https://wangcluster.wustl.edu/~wzhang/projects/HPRCEN/data/CGI/categorical/HG00097.bed.gz",
      metadata: { genome: "HG00099_1" },
    },
  },

  // MARK: - Variants / alignments
  {
    id: "vcf",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "VCF variant track",
    tags: ["variant"],
    track: {
      type: "vcf",
      name: "testVcf",
      genome: "hg38",
      url: "https://wangcluster.wustl.edu/~wzhang/projects/HPRCEN/data/graph_vcf/hprc-sep8-mc-grch38.wave.vcf.gz",
    },
  },
  {
    id: "vcf-graph",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "Graph VCF (fixed-wave variant of the pangenome VCF)",
    tags: ["variant"],
    track: {
      type: "vcf",
      name: "testVcf fixed wave",
      genome: "hg38",
      url: "https://wangcluster.wustl.edu/~wzhang/projects/HPRCEN/data/graph_vcf/hprc-sep8-mc-grch38.fixed-wave.vcf.gz",
    },
  },
  {
    id: "bam",
    genome: "hg38",
    region: NOTABLE_REGIONS["hg38-finemode"].region,
    description: "BAM alignments - needs a small region",
    tags: ["alignment", "slow"],
    track: {
      type: "bam",
      name: "Test bam",
      url: "https://vizhub.wustl.edu/hubSample/hg19/bam1.bam",
    },
  },
  {
    id: "genomealign-pantro5",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "Genome alignment, hg38 vs panTro5 (chimp)",
    tags: ["alignment", "cross-genome"],
    track: {
      name: "hg38topantro5",
      label: "query Chimpanzee panTro5 to hg38 blastz",
      type: "genomealign",
      querygenome: "panTro5",
      filetype: "genomealign",
      url: "https://vizhub.wustl.edu/public/hg38/weaver/hg38_panTro5_axt.gz",
      details: {
        source: "UCSC Genome Browser",
        "download url":
          "https://hgdownload.soe.ucsc.edu/goldenPath/hg38/vsPanTro5/",
      },
    },
  },
  {
    id: "genomealign-mm10",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "Genome alignment, hg38 vs mm10 (mouse)",
    tags: ["alignment", "cross-genome"],
    track: {
      name: "hg38tomm10",
      label: "Query mouse mm10 to hg38 blastz",
      type: "genomealign",
      querygenome: "mm10",
      filetype: "genomealign",
      url: "https://vizhub.wustl.edu/public/hg38/weaver/hg38_mm10_axt.gz",
    },
  },
  {
    id: "genomealign-rough",
    genome: "hg38",
    region: NOTABLE_REGIONS["hg38-genomealign-rough"].region,
    description: "Rough-mode genome alignment against an HPRC assembly",
    tags: ["alignment", "cross-genome"],
    note: "Rough mode kicks in at this width; zoom in for fine mode",
    track: {
      name: "hap1 vs hg38",
      label: "hap1 vs hg38",
      type: "genomealign",
      querygenome: "HG00099_1",
      filetype: "genomealign",
      url: "https://hprc-epigenome.s3.us-east-2.amazonaws.com/samples/HG00097/hap1_vs_hg38.gz",
    },
  },

  // MARK: - Interaction / 3D
  {
    id: "longrange",
    genome: "hg38",
    region: NOTABLE_REGIONS["hg38-longrange"].region,
    description: "Long-range interactions, heatmap display",
    tags: ["interaction"],
    track: {
      type: "longrange",
      name: "longrange",
      url: "https://egg.wustl.edu/d/hg19/GM06990_obs_1mb.gz",
    },
  },
  {
    id: "longrange-arc",
    genome: "hg38",
    region: NOTABLE_REGIONS["hg38-longrange"].region,
    description: "Long-range interactions forced into arc display mode",
    tags: ["interaction"],
    track: {
      type: "longrange",
      name: "longrange arcs",
      url: "https://egg.wustl.edu/d/hg19/K562_pearson_100kb.gz",
      options: { displayMode: "arc" },
    },
  },
  {
    id: "hic",
    genome: "hg38",
    region: NOTABLE_REGIONS["hg38-longrange"].region,
    description: "Hi-C contact matrix",
    tags: ["interaction", "slow"],
    track: {
      type: "hic",
      name: "test hic",
      url: "https://hicfiles.s3.amazonaws.com/hiseq/gm12878/in-situ/primary.hic",
    },
  },
  {
    id: "biginteract",
    genome: "hg38",
    region: NOTABLE_REGIONS["hg38-biginteract"].region,
    description: "bigInteract long-range format",
    tags: ["interaction", "stale-host"],
    note: "epgg-test.wustl.edu stopped responding (connection reset, verified 2026-08-17). The browser correctly reports it cannot detect chromosome naming; needs a replacement url.",
    track: {
      type: "biginteract",
      name: "test bigInteract",
      url: "https://epgg-test.wustl.edu/dli/long-range-test/interactExample3.inter.bb",
    },
  },
  {
    id: "g3d",
    genome: "hg19",
    region: HG19_DEFAULT,
    description: "3D structure track - opens the 3D viewer app",
    tags: ["3d", "slow"],
    track: {
      type: "g3d",
      url: "https://vizhub.wustl.edu/public/g3d/hg19/GSM3271347_gm12878_01.g3d",
      name: "example 3d track",
      showOnHubLoad: true,
    },
  },

  // MARK: - Dynamic / container tracks
  {
    id: "dynamic-bigwig",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "Dynamic plot cycling through four histone bigWigs",
    tags: ["dynamic", "container", "numerical"],
    track: {
      type: "dynamic",
      name: "dynamic plot example",
      showOnHubLoad: true,
      tracks: [
        {
          type: "bigwig",
          url: "https://vizhub.wustl.edu/public/misc/dynamicTrack/markers/ENCFF051LQD_H3K4me1.bigWig",
          name: "CH12 H3K4me1",
        },
        {
          type: "bigwig",
          url: "https://vizhub.wustl.edu/public/misc/dynamicTrack/markers/ENCFF096TSJ_H3K27ac.bigWig",
          name: "CH12 H3K27ac",
        },
        {
          type: "bigwig",
          url: "https://vizhub.wustl.edu/public/misc/dynamicTrack/markers/ENCFF011TAF_H3K4me3.bigWig",
          name: "CH12 H3K4me3",
        },
        {
          type: "bigwig",
          url: "https://vizhub.wustl.edu/public/misc/dynamicTrack/markers/ENCFF700XWH_H3K36me3.bigWig",
          name: "CH12 H3K36me3",
        },
      ],
    },
  },
  {
    id: "dynamic-bed",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "Dynamic bed cycling through two peak files",
    tags: ["dynamic", "container", "annotation"],
    track: {
      type: "dynamicbed",
      name: "dynamic bed",
      showOnHubLoad: true,
      tracks: [
        {
          type: "bed",
          url: "https://vizhub.wustl.edu/public/misc/dynamicTrack/bed/peak1.bed.gz",
          name: "peak1",
        },
        {
          type: "bed",
          url: "https://vizhub.wustl.edu/public/misc/dynamicTrack/bed/peak2.bed.gz",
          name: "peak2",
        },
      ],
    },
  },
  {
    id: "dynamic-longrange",
    genome: "hg38",
    region: NOTABLE_REGIONS["hg38-longrange"].region,
    description: "Dynamic long-range with custom colours",
    tags: ["dynamic", "container", "interaction"],
    track: {
      name: "dynamiclongrange",
      type: "dynamiclongrange",
      options: { dynamicColors: ["red", "blue"], useDynamicColors: true },
      tracks: [
        {
          type: "longrange",
          url: "https://egg.wustl.edu/d/hg19/GM06990_obs_1mb.gz",
          name: "GM06990",
        },
        {
          type: "longrange",
          url: "https://egg.wustl.edu/d/hg19/K562_pearson_100kb.gz",
          name: "K562",
        },
      ],
      showOnHubLoad: true,
    },
  },
  {
    id: "dynamic-hic",
    genome: "hg38",
    region: NOTABLE_REGIONS["hg38-longrange"].region,
    description: "Dynamic Hi-C with custom colours",
    tags: ["dynamic", "container", "interaction", "slow"],
    track: {
      name: "dynamic hic",
      type: "dynamichic",
      options: { dynamicColors: ["red", "blue"], useDynamicColors: true },
      tracks: [
        {
          type: "hic",
          url: "https://hicfiles.s3.amazonaws.com/hiseq/gm12878/in-situ/combined.hic",
          name: "combined",
        },
        {
          type: "hic",
          url: "https://hicfiles.s3.amazonaws.com/hiseq/gm12878/in-situ/primary.hic",
          name: "primary",
        },
      ],
      showOnHubLoad: true,
    },
  },
  {
    id: "dbedgraph",
    genome: "mm10",
    region: MM10_DEFAULT,
    description: "Dynamic bedGraph with ten labelled stages",
    tags: ["dynamic", "numerical"],
    track: {
      type: "dbedgraph",
      name: "dynamic bedgraph",
      url: "https://wangftp.wustl.edu/~dli/test/a.dbg.gz",
      options: {
        dynamicLabels: [
          "stage1",
          "stage2",
          "stage3",
          "stage4",
          "stage5",
          "stage6",
          "stage7",
          "stage8",
          "stage9",
          "stage10",
        ],
        dynamicColors: ["red", "blue", "#00FF00", "#000000"],
        useDynamicColors: true,
      },
      showOnHubLoad: true,
    },
  },

  // MARK: - Cross-genome (secondary genome in the same view)
  {
    id: "cross-genome-genes",
    genome: "hg19",
    region: HG19_DEFAULT,
    description: "mm10 gene annotations displayed under an hg19 view",
    tags: ["cross-genome", "annotation"],
    note: "Needs a genomealign track present to position correctly",
    track: {
      type: "geneAnnotation",
      name: "refGene",
      genome: "mm10",
      options: { maxRows: 10 },
      metadata: { genome: "mm10" },
    },
  },
  {
    id: "cross-genome-bigwig",
    genome: "hg19",
    region: HG19_DEFAULT,
    description: "mm10 bigWig displayed under an hg19 view",
    tags: ["cross-genome", "numerical", "stale-host"],
    note: "Also hosted on epgg-test.wustl.edu, which no longer responds (verified 2026-08-17).",
    track: {
      name: "mm10 bigwig",
      type: "bigwig",
      url: "https://epgg-test.wustl.edu/d/mm10/ENCFF577HVF.bigWig",
      metadata: { genome: "mm10" },
    },
  },
  {
    id: "cross-genome-ruler",
    genome: "hg19",
    region: HG19_DEFAULT,
    description: "Second ruler bound to the query genome",
    tags: ["cross-genome", "annotation"],
    track: {
      type: "ruler",
      name: "mm10 Ruler",
      metadata: { genome: "mm10" },
    },
  },

  // MARK: - Error cases
  {
    id: "error-unknown-type",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "Unsupported track type - should degrade, not crash",
    tags: ["error-case"],
    track: { type: "hi", url: "", name: "NOTSUPPORTEDTRACKEXAMPLE" },
  },
  {
    id: "error-bad-url",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "bigWig pointing at an unresolvable host",
    tags: ["error-case", "numerical"],
    track: {
      type: "bigwig",
      name: "broken bigwig",
      genome: "hg38",
      url: "https://vizhub",
    },
  },
  {
    id: "error-empty-url",
    genome: "hg38",
    region: HG38_DEFAULT,
    description: "bigWig with an empty url",
    tags: ["error-case", "numerical"],
    track: {
      type: "bigwig",
      name: "empty url bigwig",
      url: "",
      options: { color: "blue" },
    },
  },
];

// MARK: - Lookup helpers

/** Every genome that has at least one example. */
export function getExampleGenomes(): string[] {
  return Array.from(new Set(TRACK_EXAMPLES.map((e) => e.genome))).sort();
}

/** Examples for one genome, or all of them when `genome` is omitted. */
export function getTrackExamples(genome?: string): TrackExample[] {
  if (!genome) return TRACK_EXAMPLES;
  return TRACK_EXAMPLES.filter((e) => e.genome === genome);
}

export function getTrackExample(id: string): TrackExample | undefined {
  return TRACK_EXAMPLES.find((e) => e.id === id);
}

export function getTrackExamplesByTag(tag: TrackExampleTag): TrackExample[] {
  return TRACK_EXAMPLES.filter((e) => e.tags.includes(tag));
}

/** All tags actually in use, sorted, for building filter UI. */
export function getTrackExampleTags(): TrackExampleTag[] {
  const tags = new Set<TrackExampleTag>();
  TRACK_EXAMPLES.forEach((e) => e.tags.forEach((t) => tags.add(t)));
  return Array.from(tags).sort();
}

/**
 * Convert examples into the plain array of track configs that the `?hub=`
 * URL parameter expects, so any slice of the catalog can be loaded without a
 * rebuild.
 */
export function toHubJson(examples: TrackExample[]): Record<string, any>[] {
  return examples.map((e) => ({ ...e.track }));
}
