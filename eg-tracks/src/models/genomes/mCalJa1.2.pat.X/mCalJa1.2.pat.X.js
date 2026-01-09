import Chromosome from "../../Chromosome";
import Genome from "../../Genome";
import TrackModel from "../../TrackModel";
import annotationTracks from "./annotationTracks.json";

const genome = new Genome("mCalJa1.2.pat.X", [
    new Chromosome("chr1", 216975769),
    new Chromosome("chr2", 202808461),
    new Chromosome("chr3", 189455076),
    new Chromosome("chr4", 173414057),
    new Chromosome("chr5", 161716902),
    new Chromosome("chr6", 159674559),
    new Chromosome("chr7", 156129252),
    new Chromosome("chr8", 126104592),
    new Chromosome("chr9", 132900640),
    new Chromosome("chr10", 136971485),
    new Chromosome("chr11", 128529401),
    new Chromosome("chr12", 123697827),
    new Chromosome("chr13", 117638787),
    new Chromosome("chr14", 112969529),
    new Chromosome("chr15", 98621277),
    new Chromosome("chr16", 98110366),
    new Chromosome("chr17", 74700100),
    new Chromosome("chr18", 47063576),
    new Chromosome("chr19", 50540917),
    new Chromosome("chr20", 44412365),
    new Chromosome("chr21", 50614742),
    new Chromosome("chr22", 49900457),
    new Chromosome("chrX", 146897247),
    new Chromosome("chrY", 4974773),
    new Chromosome("chrM", 16489),
]);

const navContext = genome.makeNavContext();
const defaultRegion = navContext.parse("chr8:28982644-29067973");
const defaultTracks = [
    new TrackModel({
        type: "ruler",
        name: "Ruler",
    }),
    new TrackModel({
        type: "geneAnnotation",
        name: "ncbiGene",
        label: "NCBI genes",
        genome: "mCalJa1.2.pat.X",
    }),
];

const mCalJa1_2_pat_X = {
    genome: genome,
    navContext: navContext,
    cytobands: {},
    defaultRegion: defaultRegion,
    defaultTracks: defaultTracks,
    twoBitURL: "https://vizhub.wustl.edu/public/mCalJa1.2.pat.X/mCalJa1.2.pat.X.2bit",
    annotationTracks,
};

export default mCalJa1_2_pat_X;
