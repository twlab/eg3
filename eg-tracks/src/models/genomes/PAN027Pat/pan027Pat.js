import Chromosome from "../../Chromosome";
import Genome from "../../Genome";
import TrackModel from "../../TrackModel";

const genome = new Genome("PAN027Pat", [
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
    name: "pan027PatRefbed",
    label: "pan027PatRefbed",
    type: "refbed",
    url: "https://wangcluster.wustl.edu/~sdong/sdong/refGenome/ipsc_indvidual_genome_from_MigaLab/correct_POR/washu_browser/prep_for_WashuEpiBro_PAN027Pat/PAN027Pat.refbed.gz",
  }),
  new TrackModel({
    type: "bigbedcolor",
    name: "pan027PatRepeatMasker",
    label: "pan027PatRepeatMasker",
    url: "https://wangcluster.wustl.edu/~sdong/sdong/refGenome/ipsc_indvidual_genome_from_MigaLab/correct_POR/washu_browser/prep_for_WashuEpiBro_PAN027Pat/PAN027Pat_repeatMasker.bb",
  }),
  new TrackModel({
    type: "bigbedcolor",
    name: "PAN027Pat_cenSat",
    url: "https://wangcluster.wustl.edu/~sdong/sdong/refGenome/ipsc_indvidual_genome_from_MigaLab/correct_POR/washu_browser/prep_for_WashuEpiBro_PAN027Pat/PAN027Pat_cenSat.bb",
  }),
];

const publicHubList = [
  {
    collection: "PAN027 Pat Methylation FIRE",
    name: "PAN027 Pat Methylation FIRE",
    url: "https://wangcluster.wustl.edu/~sdong/sdong/washu_epi_browser/washu_t2t_browser/important_json_fils/PAN027Pat_more_data_tracks.json",
  },
];

const PAN027Pat = {
  genome: genome,
  navContext: navContext,
  defaultRegion: defaultRegion,
  defaultTracks: defaultTracks,
  publicHubList,
  twoBitURL:
    "https://wangcluster.wustl.edu/~sdong/sdong/refGenome/ipsc_indvidual_genome_from_MigaLab/correct_POR/washu_browser/prep_for_WashuEpiBro_PAN027Pat/PAN027Pat.2bit",
};

export default PAN027Pat;
