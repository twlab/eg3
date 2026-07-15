import Chromosome from "../../Chromosome";
import Genome from "../../Genome";
import TrackModel from "../../TrackModel";

const genome = new Genome("PAN028Mat", [
  new Chromosome("chr1", 247024343),
  new Chromosome("chr2", 242507436),
  new Chromosome("chr3", 201412341),
  new Chromosome("chr4", 192392786),
  new Chromosome("chr5", 183839769),
  new Chromosome("chr6", 171872025),
  new Chromosome("chr7", 160164195),
  new Chromosome("chr8", 147174836),
  new Chromosome("chr9", 129071659),
  new Chromosome("chr10", 134377711),
  new Chromosome("chr11", 134800386),
  new Chromosome("chr12", 134857747),
  new Chromosome("chr13", 109439378),
  new Chromosome("chr14", 100407932),
  new Chromosome("chr15", 98030079),
  new Chromosome("chr16", 91592379),
  new Chromosome("chr17", 84214674),
  new Chromosome("chr18", 81158628),
  new Chromosome("chr19", 62746178),
  new Chromosome("chr20", 66228142),
  new Chromosome("chr21", 43389355),
  new Chromosome("chr22", 48474193),
  new Chromosome("chrX", 153709541),
]);

const navContext = genome.makeNavContext();
const defaultRegion = "chr7:27053397-27373765";

const defaultTracks = [
  new TrackModel({
    type: "ruler",
    name: "Ruler",
  }),
  new TrackModel({
    name: "pan028MatRefbed",
    label: "pan028MatRefbed",
    type: "refbed",
    url: "https://wangcluster.wustl.edu/~sdong/sdong/refGenome/ipsc_indvidual_genome_from_MigaLab/correct_POR/washu_browser/prep_for_WashuEpiBro_PAN028Mat/PAN028Mat.refbed.gz",
  }),
  new TrackModel({
    type: "bigbedcolor",
    name: "pan028MatRepeatMasker",
    label: "pan028MatRepeatMasker",
    url: "https://wangcluster.wustl.edu/~sdong/sdong/refGenome/ipsc_indvidual_genome_from_MigaLab/correct_POR/washu_browser/prep_for_WashuEpiBro_PAN028Mat/PAN028Mat_repeatMasker.bb",
  }),
  new TrackModel({
    type: "bigbedcolor",
    name: "PAN028Mat_cenSat",
    url: "https://wangcluster.wustl.edu/~sdong/sdong/refGenome/ipsc_indvidual_genome_from_MigaLab/correct_POR/washu_browser/prep_for_WashuEpiBro_PAN028Mat/PAN028Mat_cenSat.bb",
  }),
];

const publicHubList = [
  {
    collection: "PAN028 Mat Methylation FIRE",
    name: "PAN028 Mat Methylation FIRE",
    url: "https://wangcluster.wustl.edu/~sdong/sdong/washu_epi_browser/washu_t2t_browser/important_json_fils/PAN028Mat_more_data_tracks.json",
  },
];
const PAN028Mat = {
  genome: genome,
  navContext: navContext,
  defaultRegion: defaultRegion,
  defaultTracks: defaultTracks,
  publicHubList: publicHubList,
  twoBitURL:
    "https://wangcluster.wustl.edu/~sdong/sdong/refGenome/ipsc_indvidual_genome_from_MigaLab/correct_POR/washu_browser/prep_for_WashuEpiBro_PAN028Mat/PAN028Mat.2bit",
};

export default PAN028Mat;
