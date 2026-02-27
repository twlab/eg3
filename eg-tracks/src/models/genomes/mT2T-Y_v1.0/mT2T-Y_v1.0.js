import Chromosome from "../../Chromosome";
import Genome from "../../Genome";

const genome = new Genome("mT2T-Y_v1.0", [
    new Chromosome("chr1", 206961486),
    new Chromosome("chr2", 188881415),
    new Chromosome("chr3", 162564770),
    new Chromosome("chr4", 158377951),
    new Chromosome("chr5", 162454759),
    new Chromosome("chr6", 151688775),
    new Chromosome("chr7", 159083935),
    new Chromosome("chr8", 141298708),
    new Chromosome("chr9", 132600537),
    new Chromosome("chr10", 136071582),
    new Chromosome("chr11", 129838740),
    new Chromosome("chr12", 121771411),
    new Chromosome("chr13", 128891460),
    new Chromosome("chr14", 132554820),
    new Chromosome("chr15", 109925427),
    new Chromosome("chr16", 109580749),
    new Chromosome("chr17", 104712397),
    new Chromosome("chr18", 98089046),
    new Chromosome("chr19", 66578199),
    new Chromosome("chrX", 170983574),
    new Chromosome("chrM", 16299),
    new Chromosome("chrY", 95236948),

]);

const navContext = genome.makeNavContext();


const defaultRegion = navContext.parse("chr7:27053397-27373765");
const defaultTracks = [
    // new TrackModel({
    //     type: "ruler",
    //     name: "Ruler",
    // }),
    // new TrackModel({
    //     type: "geneAnnotation",
    //     name: "refGene",
    //     genome: "mT2T-Y_v1.0",
    // }),
    // new TrackModel({
    //     type: "geneAnnotation",
    //     name: "gencodeCompVM25",
    //     genome: "mT2T-Y_v1.0",
    // }),
    // new TrackModel({
    //     type: "repeatmasker",
    //     name: "RepeatMasker",
    //     url: "https://vizhub.wustl.edu/public/mm10/rmsk16.bb",
    // }),
    // new TrackModel({
    //   name: "JASPAR Transcription Factors 2022",
    //   type: "jaspar",
    //   url: "https://hgdownload.soe.ucsc.edu/gbdb/mm10/jaspar/JASPAR2022.bb",
    // }),
    // new TrackModel({
    //   type: "dbedgraph",
    //   url: "https://wangftp.wustl.edu/~dli/test/a.dbg.gz",
    //   options: {
    //     dynamicLabels: [
    //       "stage1",
    //       "stage2",
    //       "stage3",
    //       "stage4",
    //       "stage5",
    //       "stage6",
    //       "stage7",
    //       "stage8",
    //       "stage9",
    //       "stage10",
    //     ],
    //     dynamicColors: ["red", "blue", "#00FF00", 0x000000],
    //     useDynamicColors: true,
    //   },
    //   showOnHubLoad: true,
    // }),
    // new TrackModel({
    //     type: "longrange",
    //     name: "ES-E14 ChIA-PET",
    //     url: "https://egg.wustl.edu/d/mm9/GSE28247_st3c.gz",
    // }),
    // new TrackModel({
    //     type: "biginteract",
    //     name: "test bigInteract",
    //     url: "https://epgg-test.wustl.edu/dli/long-range-test/interactExample3.inter.bb",
    // }),
    // new TrackModel({
    //   type: "repeatmasker",
    //   name: "RepeatMasker",
    //   url: "https://vizhub.wustl.edu/public/mm10/rmsk16.bb",
    // }),
    // new TrackModel({
    //     type: 'cool',
    //     name: 'Cool Track',
    //     url: 'CQMd6V_cRw6iCI_-Unl3PQ'
    // }),
    // new TrackModel({
    //     "type": "dynamicbed",
    //     "name": "dynamic bed",
    //     "showOnHubLoad": true,
    //     "tracks": [
    //     {
    //         "type": "bed",
    //         "url": "https://vizhub.wustl.edu/public/misc/dynamicTrack/bed/peak1.bed.gz",
    //         "name": "peak1"
    //     },
    //     {
    //         "type": "bed",
    //         "url": "https://vizhub.wustl.edu/public/misc/dynamicTrack/bed/peak2.bed.gz",
    //         "name": "peak2"
    //     }
    //     ]
    // })
];

const publicHubData = {

};



const mT2T_Y_v1 = {
    genome: genome,
    navContext: navContext,
    defaultRegion: defaultRegion,
    defaultTracks: defaultTracks,
    twoBitURL: "",

};

export default mT2T_Y_v1;
