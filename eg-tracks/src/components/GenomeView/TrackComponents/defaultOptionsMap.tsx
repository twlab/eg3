import { DEFAULT_OPTIONS as defaultBigBedTrack } from "./bedComponents/BedAnnotation";
import { DEFAULT_OPTIONS as defaultNumericalTrack } from "./commonComponents/numerical/NumericalTrack";
import { DEFAULT_OPTIONS as defaultAnnotationTrack } from "../../../trackConfigs/config-menu-models.tsx/AnnotationTrackConfig";
import { DEFAULT_OPTIONS as defaultOmeroTrack } from "./imageTrackComponents/OmeroTrackComponents";
import { DEFAULT_OPTIONS as defaultCategorical } from "../../../trackConfigs/config-menu-models.tsx/CategoricalTrackConfig";
import { DEFAULT_OPTIONS as defaultMethylc } from "./MethylcComponents/MethylCTrackComputation";
import { DEFAULT_OPTIONS as defaultDynseq } from "./DynseqComponents/DynseqTrackComponents";
import { DEFAULT_OPTIONS as defaultBoxplotTrack } from "./commonComponents/stats/BoxplotTrackComponents";
import { DEFAULT_OPTIONS as defaultQBedTrack } from "./QBedComponents/QBedTrackComponents";
import { DEFAULT_OPTIONS as defaultFiberTrack } from "./bedComponents/FiberTrackComponent";
import { DEFAULT_OPTIONS as defaultInteractTrack } from "./InteractionComponents/InteractionTrackComponent";
import { DEFAULT_OPTIONS as defaultGenomeAlignTrack } from "./GenomeAlignComponents/GenomeAlignComponents";
import { DEFAULT_OPTIONS as defaultDynamic } from "./commonComponents/numerical/DynamicplotTrackComponent";
import { DEFAULT_OPTIONS as defaultMatplot } from "./commonComponents/numerical/MatplotTrackComponent";
import { DEFAULT_OPTIONS as defaultGeneAnnotationTrack } from "./geneAnnotationTrackComponents/GeneAnnotation";
import { DEFAULT_OPTIONS as defaultVcfTrack } from "./VcfComponents/VcfTrack";
import BedAnnotation, {
  DEFAULT_OPTIONS as defaultBedTrack,
} from "./bedComponents/BedAnnotation";

import { RepeatMaskerFeature } from "../../../models/RepeatMaskerFeature";
import OpenInterval from "../../../models/OpenInterval";
import { AnnotationDisplayModes } from "../../../trackConfigs/config-menu-models.tsx/DisplayModes";
import Feature from "../../../models/Feature";
import { DefaultAggregators } from "../../../models/FeatureAggregator";

import { Fiber, JasparFeature } from "../../../models/Feature";
import Vcf from "./VcfComponents/Vcf";

const ROW_VERTICAL_PADDING = 5;

// bam options
const ROW_PADDING = 2;
const BAM_HEIGHT = 10;
const BAM_ROW_HEIGHT = BAM_HEIGHT + ROW_PADDING;

// snp options

const SNP_HEIGHT = 9;
const SNP_ROW_VERTICAL_PADDING = 2;
const SNP_ROW_HEIGHT = SNP_HEIGHT + SNP_ROW_VERTICAL_PADDING;

export const trackOptionMap: { [key: string]: any } = {
  ruler: {
    defaultOptions: { backgroundColor: "var(--bg-color)", height: 40 },
  },
  bigbed: {
    defaultOptions: {
      ...defaultBigBedTrack,
      ...defaultNumericalTrack,
      ...defaultAnnotationTrack,
    },
    getGenePadding: function getGenePadding(gene) {
      return gene.getName().length * 9;
      ``;
    },
    ROW_HEIGHT: 9 + ROW_VERTICAL_PADDING,
  },
  geneannotation: {
    defaultOptions: {
      ...defaultGeneAnnotationTrack,
      ...defaultNumericalTrack,
      ...defaultAnnotationTrack,
    },
    getGenePadding: function getGenePadding(gene) {
      return gene.getName().length * 9;
    },
    ROW_HEIGHT: 9 + ROW_VERTICAL_PADDING,
  },
  genomealign: {
    defaultOptions: {
      ...defaultGenomeAlignTrack,
      displayMode: "full",
    },
  },
  refbed: {
    defaultOptions: {
      ...defaultGeneAnnotationTrack,
      ...defaultNumericalTrack,
      ...defaultAnnotationTrack,
    },
    getGenePadding: function getGenePadding(gene) {
      return gene.getName().length * 9;
    },
    ROW_HEIGHT: 9 + ROW_VERTICAL_PADDING,
  },
  bed: {
    defaultOptions: {
      ...defaultBedTrack,
      ...defaultNumericalTrack,
      ...defaultAnnotationTrack,
    },
    getGenePadding: function getGenePadding(gene) {
      return gene.getName().length * 9;
    },
    ROW_HEIGHT: 9 + ROW_VERTICAL_PADDING,
  },
  repeatmasker: {
    defaultOptions: {
      ...defaultAnnotationTrack,
      maxRows: 1,
      height: 40,
      categoryColors: RepeatMaskerFeature.DEFAULT_CLASS_COLORS,
      displayMode: AnnotationDisplayModes.FULL,
      hiddenPixels: 0.5,
      backgroundColor: "var(--bg-color)",
      alwaysDrawLabel: true,
    },
    getGenePadding: function getGenePadding(
      feature: Feature,
      xSpan: OpenInterval
    ) {
      const width = xSpan.end - xSpan.start;
      const estimatedLabelWidth = feature.getName().length * 9;
      if (estimatedLabelWidth < 0.5 * width) {
        return 5;
      } else {
        return 9 + estimatedLabelWidth;
      }
    },
    ROW_HEIGHT: 9 + ROW_VERTICAL_PADDING,
  },
  vcf: {
    defaultOptions: {
      ...defaultNumericalTrack,

      ...defaultVcfTrack,
    },
    getGenePadding: function paddingFunc(vcf: Vcf, xSpan: OpenInterval) {
      const width = xSpan.end - xSpan.start;
      const estimatedLabelWidth = vcf.getName().length * 9;
      if (estimatedLabelWidth < 0.5 * width) {
        return 5;
      } else {
        return 9 + estimatedLabelWidth;
      }
    },
  },
  omeroidr: {
    defaultOptions: {
      ...defaultOmeroTrack,
      ...defaultNumericalTrack,
      aggregateMethod: DefaultAggregators.types.IMAGECOUNT,
    },
    getGenePadding: function getGenePadding(gene) {
      return gene.getName().length * 9;
    },
    ROW_HEIGHT: 9 + ROW_VERTICAL_PADDING,
  },
  bam: {
    defaultOptions: {
      ...defaultNumericalTrack,
      ...defaultAnnotationTrack,
      mismatchColor: "yellow",
      deletionColor: "black",
      insertionColor: "green",
      color: "red",
      color2: "blue",
      smooth: 0, // for density mode

      aggregateMethod: "COUNT",
    },
    getGenePadding: 5,
    ROW_HEIGHT: BAM_ROW_HEIGHT,
  },
  snp: {
    defaultOptions: {
      ...defaultBedTrack,
      ...defaultNumericalTrack,
      ...defaultAnnotationTrack,
    },
    getGenePadding: 5,
    ROW_HEIGHT: SNP_ROW_HEIGHT,
  },
  modbed: {
    defaultOptions: {
      ...defaultFiberTrack,
    },
    getGenePadding: function getGenePadding(
      feature: Fiber,
      xSpan: OpenInterval
    ) {
      const width = xSpan.end - xSpan.start;
      const estimatedLabelWidth = feature.getName().length * 9;
      if (estimatedLabelWidth < 0.5 * width) {
        return 5;
      } else {
        return 9 + estimatedLabelWidth;
      }
    },
    ROW_HEIGHT: 40,
  },

  //SVG only tracks
  categorical: {
    defaultOptions: {
      ...defaultAnnotationTrack,
      ...defaultCategorical,
      height: 20,
      color: "blue",
      maxRows: 1,
      hiddenPixels: 0.5,
      backgroundColor: "var(--bg-color)",
      alwaysDrawLabel: true,
      category: {},
    },
    getGenePadding: function getGenePadding(
      feature: Feature,
      xSpan: OpenInterval
    ) {
      const width = xSpan.end - xSpan.start;
      const estimatedLabelWidth = feature.getName().length * 9;
      if (estimatedLabelWidth < 0.5 * width) {
        return 5;
      } else {
        return 9 + estimatedLabelWidth;
      }
    },
    ROW_HEIGHT: 9 + ROW_VERTICAL_PADDING,
  },
  jaspar: {
    defaultOptions: {
      ...defaultAnnotationTrack,

      hiddenPixels: 0.5,
      alwaysDrawLabel: true,
      backgroundColor: "var(--bg-color)",
    },
    getGenePadding: function getGenePadding(
      feature: JasparFeature,
      xSpan: OpenInterval
    ) {
      const width = xSpan.end - xSpan.start;
      const estimatedLabelWidth = feature.getName().length * 9;
      if (estimatedLabelWidth < 0.5 * width) {
        return 5;
      } else {
        return 9 + estimatedLabelWidth;
      }
    },
    ROW_HEIGHT: BedAnnotation.HEIGHT + 2,
  },

  // canvas only tracks
  bigwig: {
    defaultOptions: {
      ...defaultNumericalTrack,
    },
  },
  methylc: {
    defaultOptions: {
      ...defaultNumericalTrack,
      ...defaultMethylc,
    },
  },
  dynseq: {
    defaultOptions: {
      ...defaultNumericalTrack,
      ...defaultDynseq,
    },
  },
  boxplot: {
    defaultOptions: {
      ...defaultNumericalTrack,
      ...defaultBoxplotTrack,
    },
  },
  qbed: {
    defaultOptions: {
      ...defaultNumericalTrack,
      ...defaultQBedTrack,
    },
  },
  bedgraph: {
    defaultOptions: {
      ...defaultNumericalTrack,
    },
  },
  // interaction track

  hic: {
    defaultOptions: {
      ...defaultInteractTrack,
    },
  },
  biginteract: {
    defaultOptions: {
      ...defaultInteractTrack,
    },
  },
  longrange: {
    defaultOptions: {
      ...defaultInteractTrack,
    },
  },

  // dynamic expandedloci tracks
  dynamichic: {
    defaultOptions: {
      ...defaultInteractTrack,
    },
  },
  dynamiclongrange: {
    defaultOptions: {
      ...defaultInteractTrack,
    },
  },
  dynamic: {
    defaultOptions: {
      ...defaultNumericalTrack,
      ...defaultDynamic,
    },
  },
  // dynamic both nav
  matplot: {
    defaultOptions: {
      ...defaultNumericalTrack,
      ...defaultMatplot,

      forceSvg: false,
    },
  },
  dbedgraph: {
    defaultOptions: {
      ...defaultAnnotationTrack,
      color: "blue",
      color2: "red",
      rowHeight: 10,
      maxRows: 5,
      hiddenPixels: 0.5,
      speed: [5],
      playing: true,
      dynamicColors: [],
      useDynamicColors: false,
      backgroundColor: "white",
      arrayAggregateMethod: "MEAN",
    },
  },
  dynamicbed: {
    defaultOptions: {
      ...defaultAnnotationTrack,
      color: "blue",
      color2: "red",
      rowHeight: 10,
      maxRows: 5,
      hiddenPixels: 0.5,
      speed: [5],
      playing: true,
      dynamicColors: [],
      useDynamicColors: false,
      backgroundColor: "white",
    },
  },
  dynamicplot: {
    defaultOptions: {
      ...defaultNumericalTrack,
      ...defaultDynamic,
    },
  },
  error: {
    defaultOptions: {
      ...defaultNumericalTrack,
    },
  },
};
