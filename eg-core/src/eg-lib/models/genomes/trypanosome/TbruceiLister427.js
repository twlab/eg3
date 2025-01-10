import Chromosome from "../../Chromosome";
import Genome from "../../Genome";
import TrackModel from "../../TrackModel";

const genome = new Genome("TbruceiLister427", [
    new Chromosome("Chr1_3A_Tb427v10", 2154499),
    new Chromosome("Chr1_3B_Tb427v10", 745022),
    new Chromosome("Chr1_5A_Tb427v10", 223324),
    new Chromosome("Chr1_5B_Tb427v10", 100458),
    new Chromosome("Chr1_core_Tb427v10", 844108),
    new Chromosome("Chr2_5A_Tb427v10", 201304),
    new Chromosome("Chr2_core_Tb427v10", 882890),
    new Chromosome("Chr3_3A_Tb427v10", 129844),
    new Chromosome("Chr3_5A_Tb427v10", 501007),
    new Chromosome("Chr3_5B_Tb427v10", 25795),
    new Chromosome("Chr3_core_Tb427v10", 1459197),
    new Chromosome("Chr4_3A_Tb427v10", 930449),
    new Chromosome("Chr4_3B_Tb427v10", 285386),
    new Chromosome("Chr4_5A_Tb427v10", 85426),
    new Chromosome("Chr4_5B_Tb427v10", 50071),
    new Chromosome("Chr4_core_Tb427v10", 1412180),
    new Chromosome("Chr5_3A_Tb427v10", 539199),
    new Chromosome("Chr5_3B_Tb427v10", 374842),
    new Chromosome("Chr5_core_Tb427v10", 1438284),
    new Chromosome("Chr6_3A_Tb427v10", 1329496),
    new Chromosome("Chr6_3B_Tb427v10", 1075566),
    new Chromosome("Chr6_core_Tb427v10", 1303620),
    new Chromosome("Chr7_5A_Tb427v10", 863524),
    new Chromosome("Chr7_core_Tb427v10", 2289182),
    new Chromosome("Chr8_3A_Tb427v10", 504318),
    new Chromosome("Chr8_3B_Tb427v10", 20420),
    new Chromosome("Chr8_5A_Tb427v10", 780781),
    new Chromosome("Chr8_5B_Tb427v10", 788462),
    new Chromosome("Chr8_core_Tb427v10", 2357098),
    new Chromosome("Chr9_3A_Tb427v10", 1485494),
    new Chromosome("Chr9_3B_Tb427v10", 512722),
    new Chromosome("Chr9_5A_Tb427v10", 336964),
    new Chromosome("Chr9_5B_Tb427v10", 101509),
    new Chromosome("Chr9_core_Tb427v10", 2192908),
    new Chromosome("Chr10_3A_Tb427v10", 1615950),
    new Chromosome("Chr10_3B_Tb427v10", 967186),
    new Chromosome("Chr10_5A_Tb427v10", 58970),
    new Chromosome("Chr10_5B_Tb427v10", 76626),
    new Chromosome("Chr10_core_Tb427v10", 4021098),
    new Chromosome("Chr11_3A_Tb427v10", 1072949),
    new Chromosome("Chr11_3B_Tb427v10", 904798),
    new Chromosome("Chr11_5A_Tb427v10", 32082),
    new Chromosome("Chr11_5B_Tb427v10", 14616),
    new Chromosome("Chr11_core_Tb427v10", 4633729),
    new Chromosome("BES10_Tb427v10", 41824),
    new Chromosome("BES11_Tb427v10", 66776),
    new Chromosome("BES12_Tb427v10", 48283),
    new Chromosome("BES13_Tb427v10", 63954),
    new Chromosome("BES14_Tb427v10", 77389),
    new Chromosome("BES15_Tb427v10", 91008),
    new Chromosome("BES17_Tb427v10", 86318),
    new Chromosome("BES1_Tb427v10", 78658),
    new Chromosome("BES2_Tb427v10", 82248),
    new Chromosome("BES3_Tb427v10", 64902),
    new Chromosome("BES4_Tb427v10", 68373),
    new Chromosome("BES5_Tb427v10", 67356),
    new Chromosome("BES7_Tb427v10", 88196),
    new Chromosome("Tb427VSG-1117_unitig_Tb427v10", 10844),
    new Chromosome("Tb427VSG-1387_unitig_Tb427v10", 17906),
    new Chromosome("Tb427VSG-1389_unitig_restricted_Tb427v10", 1983),
    new Chromosome("Tb427VSG-1849_unitig_Tb427v10", 22784),
    new Chromosome("Tb427VSG-1942_unitig_restricted_Tb427v10", 1021),
    new Chromosome("Tb427VSG-1963_unitig_Tb427v10", 10145),
    new Chromosome("Tb427VSG-1_unitig_Tb427v10", 10498),
    new Chromosome("Tb427VSG-2061_unitig_Tb427v10", 21020),
    new Chromosome("Tb427VSG-2075_unitig_Tb427v10", 15754),
    new Chromosome("Tb427VSG-23_unitig_Tb427v10", 24475),
    new Chromosome("Tb427VSG-3039_unitig_Tb427v10", 7442),
    new Chromosome("Tb427VSG-3338_unitig_Tb427v10", 11240),
    new Chromosome("Tb427VSG-3340_unitig_Tb427v10", 19056),
    new Chromosome("Tb427VSG-3513_unitig_restricted_Tb427v10", 1408),
    new Chromosome("Tb427VSG-365_unitig_Tb427v10", 13011),
    new Chromosome("Tb427VSG-374_unitig_Tb427v10", 7153),
    new Chromosome("Tb427VSG-3777_unitig_Tb427v10", 6546),
    new Chromosome("Tb427VSG-416_unitig_Tb427v10", 18232),
    new Chromosome("Tb427VSG-417_unitig_Tb427v10", 8913),
    new Chromosome("Tb427VSG-444_unitig_Tb427v10", 19852),
    new Chromosome("Tb427VSG-504_unitig_Tb427v10", 15367),
    new Chromosome("Tb427VSG-507_unitig_Tb427v10", 24537),
    new Chromosome("Tb427VSG-542_unitig_Tb427v10", 12002),
    new Chromosome("Tb427VSG-575_unitig_Tb427v10", 23359),
    new Chromosome("Tb427VSG-600_unitig_Tb427v10", 7697),
    new Chromosome("Tb427VSG-615_unitig_Tb427v10", 10519),
    new Chromosome("Tb427VSG-618_unitig_Tb427v10", 22172),
    new Chromosome("Tb427VSG-620_unitig_Tb427v10", 21550),
    new Chromosome("Tb427VSG-622_unitig_Tb427v10", 18806),
    new Chromosome("Tb427VSG-637_unitig_Tb427v10", 11294),
    new Chromosome("Tb427VSG-646_unitig_Tb427v10", 13182),
    new Chromosome("Tb427VSG-647_unitig_Tb427v10", 10484),
    new Chromosome("Tb427VSG-662_unitig_Tb427v10", 14759),
    new Chromosome("Tb427VSG-666_unitig_Tb427v10", 21920),
    new Chromosome("Tb427VSG-671_unitig_Tb427v10", 31606),
    new Chromosome("Tb427VSG-717_unitig_Tb427v10", 14803),
    new Chromosome("Tb427VSG-775_unitig_Tb427v10", 14192),
    new Chromosome("Tb427VSG-826_unitig_Tb427v10", 12065),
    new Chromosome("Tb427VSG19_unitig_Tb427v10", 22049),
]);

const navContext = genome.makeNavContext();
const defaultRegion = navContext.parse("Chr1_3A_Tb427v10:0-7906");
const defaultTracks = [
    new TrackModel({
        type: "geneAnnotation",
        name: "gene",
        label: "TriTrypDB genes",
        genome: "TbruceiLister427",
        queryEndpoint: { name: "TriTrypDB", endpoint: "https://tritrypdb.org/tritrypdb/app/search?q=" },
    }),
    new TrackModel({
        type: "ruler",
        name: "Ruler",
    }),
];

const annotationTracks = {
    Ruler: [
        {
            type: "ruler",
            label: "Ruler",
            name: "Ruler",
        },
    ],
    Genes: [
        {
            name: "gene",
            label: "TriTrypDB genes",
            filetype: "geneAnnotation",
            queryEndpoint: { name: "TriTrypDB", endpoint: "https://tritrypdb.org/tritrypdb/app/search?q=" },
        },
    ],
};

const TbruceiLister427 = {
    genome: genome,
    navContext: navContext,
    cytobands: {},
    defaultRegion: defaultRegion,
    defaultTracks: defaultTracks,
    twoBitURL: "https://vizhub.wustl.edu/public/trypanosome/TriTrypDB-51_TbruceiLister427_2018_Genome.2bit",
    annotationTracks,
};

export default TbruceiLister427;
