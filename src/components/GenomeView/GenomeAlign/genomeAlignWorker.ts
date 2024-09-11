//src/Worker/worker.ts

import _ from "lodash";
import JSON5 from "json5";
import memoizeOne from "memoize-one";
// import { GuaranteeMap } from '../../model/GuaranteeMap';

import {
  segmentSequence,
  makeBaseNumberLookup,
  countBases,
  SequenceSegment,
  GAP_CHAR,
} from "../../../models/AlignmentStringUtils";
import AlignmentRecord from "../../../models/AlignmentRecord";
import { AlignmentSegment } from "../../../models/AlignmentSegment";

import { NavContextBuilder, Gap } from "../../../models/NavContextBuilder";
import ChromosomeInterval from "../../../models/ChromosomeInterval";
import OpenInterval from "../../../models/OpenInterval";
import NavigationContext from "../../../models/NavigationContext";
import LinearDrawingModel from "../../../models/LinearDrawingModel";
import Feature from "../../../models/Feature";

import { ViewExpansion } from "../../../models/RegionExpander";
import { FeaturePlacer } from "../../../models/getXSpan/FeaturePlacer";
import DisplayedRegionModel from "../../../models/DisplayedRegionModel";
import { niceBpCount } from "../../../models/util";
import { FeatureSegment } from "../../../models/FeatureSegment";
import { GenomeConfig } from "../../../models/genomes/GenomeConfig";
import { MultiAlignmentViewCalculator } from "./MultiAlignmentViewCalculator";
import TrackModel from "../../../models/TrackModel";
import test from "node:test";
export interface PlacedAlignment {
  record: AlignmentRecord;
  visiblePart: AlignmentSegment;
  contextSpan: OpenInterval;
  targetXSpan: OpenInterval;
  queryXSpan: OpenInterval | null;
  targetSegments?: PlacedSequenceSegment[]; // These only present in fine mode
  querySegments?: PlacedSequenceSegment[];
}

export interface PlacedSequenceSegment extends SequenceSegment {
  xSpan: OpenInterval;
}

interface QueryGenomePiece {
  queryFeature: Feature;
  queryXSpan: OpenInterval;
}

export interface PlacedMergedAlignment extends QueryGenomePiece {
  segments: PlacedAlignment[];
  targetXSpan: OpenInterval;
}

export interface GapText {
  targetGapText: string;
  targetXSpan: OpenInterval;
  targetTextXSpan: OpenInterval;
  queryGapText: string;
  queryXSpan: OpenInterval;
  queryTextXSpan: OpenInterval;
  shiftTarget: boolean; // Whether target txt width > gap width
  shiftQuery: boolean; // Whether query txt width > gap width
}

export interface Alignment {
  isFineMode: boolean; // Display mode
  primaryVisData: ViewExpansion; // Primary genome view region data
  queryRegion: DisplayedRegionModel; // Query genome view region
  /**
   * PlacedAlignment[] in fine mode; PlacedMergedAlignment in rough mode.
   */
  drawData: PlacedAlignment[] | PlacedMergedAlignment[];
  drawGapText?: GapText[]; // An array holding gap size information between placedAlignments, fineMode only
  plotStrand?: string; // rough mode plot positive or negative
  primaryGenome: string;
  queryGenome: string;
  basesPerPixel: number;
  navContextBuilder?: NavContextBuilder;
}

export interface MultiAlignment {
  [genome: string]: Alignment;
}

interface RecordsObj {
  query: string;
  records: AlignmentRecord[];
  isBigChain?: boolean;
}

interface RefinedObj {
  newRecordsArray: RecordsObj[];
  allGaps: Gap[];
}

// const MIN_GAP_DRAW_WIDTH = 3;

const FEATURE_PLACER = new FeaturePlacer();

const DEFAULT_OPTIONS = {
  height: 80,
  primaryColor: "darkblue",
  queryColor: "#B8008A",
};
const RECT_HEIGHT = 15;
// multiAlignCal defaults
interface RecordsObj {
  query: string;
  records: AlignmentRecord[];
  isBigChain?: boolean;
}
const MAX_FINE_MODE_BASES_PER_PIXEL = 10;
const MARGIN = 5;
// const MIN_GAP_DRAW_WIDTH = 3;
const FONT_SIZE = 10;
const MERGE_PIXEL_DISTANCE = 200;
const MIN_MERGE_DRAW_WIDTH = 5;
const MIN_GAP_LENGTH = 0.99;

self.onmessage = (event: MessageEvent) => {
  let visRegionFeatures: Feature[] = [];

  for (let feature of event.data.visData.visRegion._navContext._features) {
    let newChr = new ChromosomeInterval(
      feature.locus.chr,
      feature.locus.start,
      feature.locus.end
    );
    visRegionFeatures.push(new Feature(feature.name, newChr));
  }

  let visRegionNavContext = new NavigationContext(
    event.data.visData.visRegion._navContext._name,
    visRegionFeatures
  );

  let visRegion = new DisplayedRegionModel(
    visRegionNavContext,
    event.data.visData.visRegion._startBase,
    event.data.visData.visRegion._endBase
  );

  console.log(visRegion);

  let viewWindowRegionFeatures: Feature[] = [];

  for (let feature of event.data.visData.viewWindowRegion._navContext
    ._features) {
    let newChr = new ChromosomeInterval(
      feature.locus.chr,
      feature.locus.start,
      feature.locus.end
    );
    viewWindowRegionFeatures.push(new Feature(feature.name, newChr));
  }

  let viewWindowRegionNavContext = new NavigationContext(
    event.data.visData.viewWindowRegion._navContext._name,
    viewWindowRegionFeatures
  );
  let viewWindowRegion = new DisplayedRegionModel(
    viewWindowRegionNavContext,
    event.data.visData.viewWindowRegion._startBase,
    event.data.visData.viewWindowRegion._endBase
  );

  let visData: ViewExpansion = {
    visWidth: event.data.visData.visWidth,

    visRegion,

    viewWindow: new OpenInterval(
      event.data.visData.viewWindow.start,
      event.data.visData.viewWindow.end
    ),

    viewWindowRegion,
  };

  let records: AlignmentRecord[] = [];
  let recordArr: any = event.data.result;

  for (const record of recordArr) {
    let data = JSON5.parse("{" + record[3] + "}");
    // if (options.isRoughMode) {

    // }
    record[3] = data;
    records.push(new AlignmentRecord(record));
  }

  let [genConfig] = event.data.defaultTracks;

  let oldRecordsArray: Array<RecordsObj> = [];
  oldRecordsArray.push({
    query: event.data.querygenomeName,
    records: records,
    isBigChain: false,
  });

  let multiCalInstance = new MultiAlignmentViewCalculator(
    event.data.genomeName
  );
  let alignment = multiCalInstance.multiAlign(visData, oldRecordsArray);
  // add another loop for mutiple genome aligns query genomes
  for (
    let i = 0;
    i < alignment[`${event.data.querygenomeName}`].drawData.length;
    i++
  ) {
    let placement = alignment[`${event.data.querygenomeName}`].drawData[i];
    console.log(placement);
    const { targetXSpan } = placement;
    const targetSequence = placement.visiblePart.getTargetSequence();
    const querySequence = placement.visiblePart.getQuerySequence();
    const baseWidth = targetXSpan.getLength() / targetSequence.length;
    const targetLocus = placement.visiblePart.getLocus().toString();
    const queryLocus = placement.visiblePart.getQueryLocus().toString();
    const nonGaps = placement.targetSegments.filter(
      (segment) => !segment.isGap
    );

    const isReverseStrandQuery = placement.record.getIsReverseStrandQuery();
    let tempObj = {
      targetSequence,
      querySequence,
      baseWidth,
      targetLocus,
      queryLocus,
      nonGaps,
      isReverseStrandQuery,
    };
    alignment[`${event.data.querygenomeName}`].drawData[i] = {
      ...placement,
      ...tempObj,
    };
  }
  let id = `${event.data.id}`;

  postMessage({
    [`${id}`]: alignment,
    side: event.data.trackSide,
    xDist: event.data.xDist,
    genomeName: event.data.genomeName,
    querygenomeName: event.data.querygenomeName,
  });
};
