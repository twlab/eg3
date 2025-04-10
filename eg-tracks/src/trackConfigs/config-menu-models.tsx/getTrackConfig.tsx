import { TrackConfig } from "./TrackConfig";
import { BamTrackConfig } from "./BamTrackConfig";
import { BedTrackConfig } from "./BedTrackConfig";
import { DynamicBedTrackConfig } from "./DynamicBedTrackConfig";
import { QBedTrackConfig } from "./QBedTrackConfig";
import { CategoricalTrackConfig } from "./CategoricalTrackConfig";
import { BigBedTrackConfig } from "./BigBedTrackConfig";
import { BedGraphTrackConfig } from "./BedGraphTrackConfig";
import { BigWigTrackConfig } from "./BigWigTrackConfig";
import { GeneAnnotationTrackConfig } from "./GeneAnnotationTrackConfig";
import TrackModel from "../../models/TrackModel";
import { HicTrackConfig } from "./HicTrackConfig";
import { LongRangeTrackConfig } from "./LongRangeTrackConfig";
// import { LongRangeColorTrackConfig } from "./LongRangeColorTrackConfig";
import { BigInteractTrackConfig } from "./BigInteractTrackConfig";
import { MethylCTrackConfig } from "./MethylCTrackConfig";
import { RepeatMaskerTrackConfig } from "./RepeatMaskerTrackConfig";
import { GenomeAlignTrackConfig } from "./GenomeAlignTrackConfig";
import { RulerTrackConfig } from "./RulerTrackConfig";
import { RefBedTrackConfig } from "./RefBedTrackConfig";
import { SnpTrackConfig } from "./SnpTrackConfig";
import { MatplotTrackConfig } from "./MatplotTrackConfig";
import { DynamicplotTrackConfig } from "./DynamicplotTrackConfig";
// import { HammockTrackConfig } from "./HammockTrackConfig";
// import { PairwiseSegmentTrackConfig } from "./PairwiseSegmentTrackConfig";
// import { SnvSegmentTrackConfig } from "./SnvSegmentTrackConfig";
// import { G3dTrackConfig } from "./G3dTrackConfig";
// import { ProteinTrackConfig } from "./ProteinTrackConfig";
import { DynamicBedGraphTrackConfig } from "./DynamicBedGraphTrackConfig";
import { DynamicHicTrackConfig } from "./DynamicHicTrackConfig";
import { DynamicLongrangeTrackConfig } from "./DynamicLongrangeTrackConfig";
import { OmeroidrTrackConfig } from "./OmeroidrTrackConfig";
// import { Omero4dnTrackConfig } from "./Omero4dnTrackConfig";
import { DynseqTrackConfig } from "./DynseqTrackConfig";

// import { RgbpeakTrackConfig } from "./RgbpeakTrackConfig";
import { VcfTrackConfig } from "./VcfTrackConfig";
import { BoxplotTrackConfig } from "./BoxplotTrackConfig";
// import { BedcolorTrackConfig } from "./BedcolorTrackConfig";
// import { Rmskv2TrackConfig } from "./Rmskv2TrackConfig";
import { JasparTrackConfig } from "./JasparTrackConfig";
// import { BrgfaTrackConfig } from "./BrgfaTrackConfig";
import { FiberTrackConfig } from "./FiberTrackConfig";

export const INTERACTION_TYPES = ["hic", "longrange", "biginteract"];
export const ALIGNMENT_TYPES = ["genomealign"];
export const MOD_TYPES = ["modbed"];
export const DYNAMIC_TYPES = [
  "dynamic",
  "dbedgraph",
  "dynamichic",
  "dynamiclongrange",
];

export const TYPE_NAME_TO_CONFIG = {
  bed: BedTrackConfig,
  categorical: CategoricalTrackConfig,
  bigbed: BigBedTrackConfig,
  bigwig: BigWigTrackConfig,
  hic: HicTrackConfig,
  longrange: LongRangeTrackConfig,

  biginteract: BigInteractTrackConfig,
  geneannotation: GeneAnnotationTrackConfig,
  refbed: RefBedTrackConfig,
  methylc: MethylCTrackConfig,
  repeatmasker: RepeatMaskerTrackConfig,
  genomealign: GenomeAlignTrackConfig,

  ruler: RulerTrackConfig,
  matplot: MatplotTrackConfig,
  // hammock: HammockTrackConfig,
  // pairwise: PairwiseSegmentTrackConfig,
  // snv: PairwiseSegmentTrackConfig,
  // snv2: SnvSegmentTrackConfig,
  // protein: ProteinTrackConfig,
  // longrangecolor: LongRangeColorTrackConfig,
  // rgbpeak: RgbpeakTrackConfig,
  vcf: VcfTrackConfig,
  // bedcolor: BedcolorTrackConfig,
  // rmskv2: Rmskv2TrackConfig, !
  // bigchain: GenomeAlignTrackConfig,

  dynseq: DynseqTrackConfig,

  omeroidr: OmeroidrTrackConfig,
  // omero4dn: Omero4dnTrackConfig,

  bam: BamTrackConfig,
  // brgfa: BrgfaTrackConfig,
  snp: SnpTrackConfig,
  dynamiclongrange: DynamicLongrangeTrackConfig,
  dynamicbed: DynamicBedTrackConfig,
  dbedgraph: DynamicBedGraphTrackConfig,
  dynamichic: DynamicHicTrackConfig,
  jaspar: JasparTrackConfig,
  boxplot: BoxplotTrackConfig,
  // g3d: G3dTrackConfig, !
  qbed: QBedTrackConfig,
  bedgraph: BedGraphTrackConfig,
  dynamic: DynamicplotTrackConfig,
  modbed: FiberTrackConfig,
};

const DefaultConfig = TrackConfig;

if (process.env.NODE_ENV !== "production") {
  // Check if all the subtypes are clean
  for (const subtypeName in TYPE_NAME_TO_CONFIG) {
    if (subtypeName.toLowerCase() !== subtypeName) {
      throw new TypeError(
        `Type names may not contain uppercase letters.  Offender: "${subtypeName}"`
      );
    }
  }
}

/**
 * Gets the appropriate TrackConfig from a trackModel.  This function is separate from TrackConfig because it would
 * cause a circular dependency.
 *
 * @param {TrackModel} trackModel - track model
 * @return {TrackConfig} renderer for that track model
 */
export function getTrackConfig(trackModel: TrackModel): TrackConfig {
  let type = trackModel.type || trackModel.filetype || "";
  type = type.toLowerCase();
  const TrackConfigSubtype = TYPE_NAME_TO_CONFIG[type];
  if (TrackConfigSubtype) {
    return new TrackConfigSubtype(trackModel);
  } else {
    return new DefaultConfig(trackModel);
  }
}
