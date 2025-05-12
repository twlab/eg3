import { TrackConfig } from "./TrackConfig";
import { BamTrackConfig } from "./BamTrackConfig";
import { BedTrackConfig } from "./BedTrackConfig";
import { BedcolorTrackConfig } from "./BedcolorTrackConfig";
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
import { BigInteractTrackConfig } from "./BigInteractTrackConfig";
import { MethylCTrackConfig } from "./MethylCTrackConfig";
import { RepeatMaskerTrackConfig } from "./RepeatMaskerTrackConfig";
import { GenomeAlignTrackConfig } from "./GenomeAlignTrackConfig";
import { RulerTrackConfig } from "./RulerTrackConfig";
import { RefBedTrackConfig } from "./RefBedTrackConfig";
import { SnpTrackConfig } from "./SnpTrackConfig";
import { MatplotTrackConfig } from "./MatplotTrackConfig";
import { DynamicplotTrackConfig } from "./DynamicplotTrackConfig";
import { DynamicBedGraphTrackConfig } from "./DynamicBedGraphTrackConfig";
import { DynamicHicTrackConfig } from "./DynamicHicTrackConfig";
import { DynamicLongrangeTrackConfig } from "./DynamicLongrangeTrackConfig";
import { OmeroidrTrackConfig } from "./OmeroidrTrackConfig";
import { DynseqTrackConfig } from "./DynseqTrackConfig";
import { VcfTrackConfig } from "./VcfTrackConfig";
import { BoxplotTrackConfig } from "./BoxplotTrackConfig";
import { JasparTrackConfig } from "./JasparTrackConfig";
import { FiberTrackConfig } from "./FiberTrackConfig";
export declare const INTERACTION_TYPES: string[];
export declare const ALIGNMENT_TYPES: string[];
export declare const MOD_TYPES: string[];
export declare const DYNAMIC_TYPES: string[];
export declare const TYPE_NAME_TO_CONFIG: {
    bed: typeof BedTrackConfig;
    categorical: typeof CategoricalTrackConfig;
    bigbed: typeof BigBedTrackConfig;
    bigwig: typeof BigWigTrackConfig;
    hic: typeof HicTrackConfig;
    longrange: typeof LongRangeTrackConfig;
    bedcolor: typeof BedcolorTrackConfig;
    biginteract: typeof BigInteractTrackConfig;
    geneannotation: typeof GeneAnnotationTrackConfig;
    refbed: typeof RefBedTrackConfig;
    methylc: typeof MethylCTrackConfig;
    repeatmasker: typeof RepeatMaskerTrackConfig;
    genomealign: typeof GenomeAlignTrackConfig;
    ruler: typeof RulerTrackConfig;
    matplot: typeof MatplotTrackConfig;
    vcf: typeof VcfTrackConfig;
    dynseq: typeof DynseqTrackConfig;
    omeroidr: typeof OmeroidrTrackConfig;
    bam: typeof BamTrackConfig;
    snp: typeof SnpTrackConfig;
    dynamiclongrange: typeof DynamicLongrangeTrackConfig;
    dynamicbed: typeof DynamicBedTrackConfig;
    dbedgraph: typeof DynamicBedGraphTrackConfig;
    dynamichic: typeof DynamicHicTrackConfig;
    jaspar: typeof JasparTrackConfig;
    boxplot: typeof BoxplotTrackConfig;
    qbed: typeof QBedTrackConfig;
    bedgraph: typeof BedGraphTrackConfig;
    dynamic: typeof DynamicplotTrackConfig;
    modbed: typeof FiberTrackConfig;
};
/**
 * Gets the appropriate TrackConfig from a trackModel.  This function is separate from TrackConfig because it would
 * cause a circular dependency.
 *
 * @param {TrackModel} trackModel - track model
 * @return {TrackConfig} renderer for that track model
 */
export declare function getTrackConfig(trackModel: TrackModel): TrackConfig;
