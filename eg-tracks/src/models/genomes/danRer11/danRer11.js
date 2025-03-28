import Chromosome from "../../Chromosome";
import { Genome } from "../../Genome";
import TrackModel from "../../TrackModel";
import annotationTracks from "./annotationTracks.json";
import cytobands from "./cytoBandIdeo.json";

const GENOME_NAME = "danRer11";

const genome = new Genome(GENOME_NAME, [
    new Chromosome("chr1", 59578282),
    new Chromosome("chr2", 59640629),
    new Chromosome("chr3", 62628489),
    new Chromosome("chr4", 78093715),
    new Chromosome("chr5", 72500376),
    new Chromosome("chr6", 60270059),
    new Chromosome("chr7", 74282399),
    new Chromosome("chr8", 54304671),
    new Chromosome("chr9", 56459846),
    new Chromosome("chr10", 45420867),
    new Chromosome("chr11", 45484837),
    new Chromosome("chr12", 49182954),
    new Chromosome("chr13", 52186027),
    new Chromosome("chr14", 52660232),
    new Chromosome("chr15", 48040578),
    new Chromosome("chr16", 55266484),
    new Chromosome("chr17", 53461100),
    new Chromosome("chr18", 51023478),
    new Chromosome("chr19", 48449771),
    new Chromosome("chr20", 55201332),
    new Chromosome("chr21", 45934066),
    new Chromosome("chr22", 39133080),
    new Chromosome("chr23", 46223584),
    new Chromosome("chr24", 42172926),
    new Chromosome("chr25", 37502051),
    new Chromosome("chrM", 16596),
]);

const navContext = genome.makeNavContext();
const defaultRegion = navContext.parse("chr19:18966019-19564024");
const defaultTracks = [
    new TrackModel({
        type: "geneAnnotation",
        name: "refGene",
        genome: GENOME_NAME,
    }),
    new TrackModel({
        type: "ruler",
        name: "Ruler",
    }),
    new TrackModel({
        type: "repeatmasker",
        name: "RepeatMasker",
        url: "https://vizhub.wustl.edu/public/danRer11/rmsk16.bb",
    }),
];

const publicHubData = {
    "4D Nucleome Network":
        "The 4D Nucleome Network aims to understand the principles underlying nuclear " +
        "organization in space and time, the role nuclear organization plays in gene expression and cellular function, " +
        "and how changes in nuclear organization affect normal development as well as various diseases.  The program is " +
        "developing novel tools to explore the dynamic nuclear architecture and its role in gene expression programs, " +
        "models to examine the relationship between nuclear organization and function, and reference maps of nuclear" +
        "architecture in a variety of cells and tissues as a community resource.",
};

const publicHubList = [
    {
        collection: "4D Nucleome Network",
        name: "(2025) 4DN datasets",
        numTracks: 35,
        oldHubFormat: false,
        url: "https://vizhub.wustl.edu/public/update2025/4dn-GRCz11-mar2025.json",
        description: {
            "hub built by": "Daofeng Li (dli23@wustl.edu)",
            "last update": "Mar 3 2025",
            "hub built notes": "metadata information are obtained directly from 4DN data portal",
        },
    },
];

const DAN_RER11 = {
    genome,
    navContext,
    cytobands,
    defaultRegion,
    defaultTracks,
    twoBitURL: "https://vizhub.wustl.edu/public/danRer11/danRer11.2bit",
    publicHubData,
    publicHubList,
    annotationTracks,
};

export default DAN_RER11;
