import Chromosome from "../../Chromosome";
import Genome from "../../Genome";
import TrackModel from "../../TrackModel";

import annotationTracks from "./annotationTracks.json";
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


const defaultRegion = "chr7:27053397-27373765";
const defaultTracks = [
    new TrackModel({
        type: "ruler",
        name: "Ruler"
    }),
    new TrackModel({
        "name": "mhaESC",
        "label": "mhaESC",
        "type": "refbed",
        "url": "https://wangcluster.wustl.edu/~juanfmacias/mT2T-Y_v1.0/mhaESC.annotation.v1.1.1.20250623_nameCorrected.refbed.gz",

    }),
    new TrackModel({
        type: "RepeatMasker",
        name: "mT2T-Y.repeats",
        url: "https://wangcluster.wustl.edu/~juanfmacias/mT2T-Y_v1.0/mT2T-Y.rmsk16.bb",

    })
];

const publicHubData = {

};



const mT2T_Y_v1 = {
    genome: genome,
    navContext: navContext,
    defaultRegion: defaultRegion,
    defaultTracks: defaultTracks,
    twoBitURL: "https://vizhub.wustl.edu/public/mT2T-Y_v1.0/renamed_mhaESC_v1.1_with_mT2T-Y_v1.0.250617.2bit",
    annotationTracks
};

export default mT2T_Y_v1;
