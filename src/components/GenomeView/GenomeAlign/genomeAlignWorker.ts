//src/Worker/worker.ts

import _ from "lodash";
import JSON5 from "json5";
import { Feature } from "../../../models/Feature";
import { PlacedAlignment, PlacedSequenceSegment } from "./GenomeAlign";
import AlignmentRecord from "../../../models/AlignmentRecord";
import { AlignmentSegment } from "../../../models/AlignmentSegment";
import DisplayedRegionModel from "../../../models/DisplayedRegionModel";
import { FeatureSegment } from "../../../models/FeatureSegment";
import LinearDrawingModel from "../../../models/LinearDrawingModel";
import { NavContextBuilder } from "../../../models/NavContextBuilder";
import NavigationContext from "../../../models/NavigationContext";
import OpenInterval from "../../../models/OpenInterval";
import { ViewExpansion } from "../../../models/RegionExpander";
import ChromosomeInterval from "../../../models/ChromosomeInterval";
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

self.onmessage = (event: MessageEvent) => {
  const MIN_GAP_LENGTH = 0.99;

  let records: AlignmentRecord[] = [];
  let recordArr: any = event.data.result;

  for (const record of recordArr) {
    let data = JSON5.parse("{" + record[3] + "}");
    // if (options.isRoughMode) {

    // }
    record[3] = data;
    records.push(new AlignmentRecord(record));
  }

  let oldRecordsArray: Array<RecordsObj> = [];
  oldRecordsArray.push({
    query: event.data.queryGenomeName,
    records: records,
    isBigChain: false,
  });

  let newFeatures: Feature[] = [];

  for (let feature of event.data.visRegion.featureArray!) {
    let newChr = new ChromosomeInterval(
      feature.locus.chr,
      feature.locus.start,
      feature.locus.end
    );
    newFeatures.push(new Feature(feature.name, newChr));
  }

  let newNavContext = new NavigationContext(
    event.data.visRegion.name,
    newFeatures
  );
  let newVisViewDisplay;
  newVisViewDisplay = new DisplayedRegionModel(
    newNavContext,
    event.data.visRegion.start,
    event.data.visRegion.end
  );

  let newFeaturesWindow: Feature[] = [];

  for (let feature of event.data.viewWindowRegion.featureArray!) {
    let newChr = new ChromosomeInterval(
      feature.locus.chr,
      feature.locus.start,
      feature.locus.end
    );
    newFeaturesWindow.push(new Feature(feature.name, newChr));
  }

  let newNavContextWindow = new NavigationContext(
    event.data.viewWindowRegion.name,
    newFeatures
  );
  let newVisDataWindowDisplay = new DisplayedRegionModel(
    newNavContextWindow,
    event.data.viewWindowRegion.start,
    event.data.viewWindowRegion.end
  );

  let newVisData: ViewExpansion = {
    visWidth: event.data.visWidth,

    visRegion: newVisViewDisplay,

    viewWindow: new OpenInterval(
      event.data.viewWindow.start,
      event.data.viewWindow.end
    ),

    /**
     * Unexpanded region; the region displayed in the viewWindow
     */
    viewWindowRegion: newVisDataWindowDisplay,
  };

  function alignFine(
    query: string,
    records: AlignmentRecord[],
    oldVisData: ViewExpansion,
    visData: ViewExpansion,
    allGaps: Array<any>
  ) {
    // There's a lot of steps, so bear with me...
    const { visRegion, visWidth } = visData;
    // drawModel is derived from visData:
    const drawModel = new LinearDrawingModel(visRegion, visWidth);
    // const minGapLength = drawModel.xWidthToBases(MIN_GAP_DRAW_WIDTH);
    const minGapLength = MIN_GAP_LENGTH;

    // Calculate context coordinates of the records and gaps within.
    // calculate navContext and placements using oldVisData so small gaps won't seperate different features:
    const navContext = oldVisData.visRegion.getNavigationContext();
    const placements = computeContextLocations(records, oldVisData);
    // const primaryGaps = this._getPrimaryGenomeGaps(placements, minGapLength);
    const navContextBuilder = new NavContextBuilder(navContext);
    navContextBuilder.setGaps(allGaps); // Use allGaps instead of primaryGaps here so gaps between placements were also included here.
    // With the draw model, we can set x spans for each placed alignment
    // Adjust contextSpan and xSpan in placements using visData:
    for (const placement of placements) {
      const oldContextSpan = placement.contextSpan;
      const visiblePart = placement.visiblePart;
      const newContextSpan = new OpenInterval(
        navContextBuilder.convertOldCoordinates(oldContextSpan.start),
        navContextBuilder.convertOldCoordinates(oldContextSpan.end)
      );

      const xSpan = drawModel.baseSpanToXSpan(newContextSpan);
      const targetSeq = visiblePart.getTargetSequence();
      const querySeq = visiblePart.getQuerySequence();

      placement.contextSpan = newContextSpan;
      placement.targetXSpan = xSpan;
      placement.queryXSpan = xSpan;
      placement.targetSegments = placeSequenceSegments(
        targetSeq,
        minGapLength,
        xSpan.start,
        drawModel
      );
      placement.querySegments = placeSequenceSegments(
        querySeq,
        minGapLength,
        xSpan.start,
        drawModel
      );
    }
    const drawGapTexts: Array<any> = [];
    const targetIntervalPlacer = new IntervalPlacer(MARGIN);
    const queryIntervalPlacer = new IntervalPlacer(MARGIN);
    for (let i = 1; i < placements.length; i++) {
      const lastPlacement = placements[i - 1];
      const placement = placements[i];
      const lastXEnd = lastPlacement.targetXSpan.end;
      const xStart = placement.targetXSpan.start;
      const lastTargetChr = lastPlacement.record.locus.chr;
      const lastTargetEnd = lastPlacement.record.locus.end;
      const lastQueryChr = lastPlacement.record.queryLocus.chr;
      const lastStrand = lastPlacement.record.queryStrand;
      const lastQueryEnd =
        lastStrand === "+"
          ? lastPlacement.record.queryLocus.end
          : lastPlacement.record.queryLocus.start;
      const targetChr = placement.record.locus.chr;
      const targetStart = placement.record.locus.start;
      const queryChr = placement.record.queryLocus.chr;
      const queryStrand = placement.record.queryStrand;
      const queryStart =
        queryStrand === "+"
          ? placement.record.queryLocus.start
          : placement.record.queryLocus.end;
      let placementQueryGap: string;
      if (lastQueryChr === queryChr) {
        if (lastStrand === "+" && queryStrand === "+") {
          placementQueryGap = queryStart >= lastQueryEnd ? "" : "overlap ";
          placementQueryGap += niceBpCount(Math.abs(queryStart - lastQueryEnd));
        } else if (lastStrand === "-" && queryStrand === "-") {
          placementQueryGap = lastQueryEnd >= queryStart ? "" : "overlap ";
          placementQueryGap += niceBpCount(Math.abs(lastQueryEnd - queryStart));
        } else {
          placementQueryGap = "reverse direction";
        }
      } else {
        placementQueryGap = "not connected";
      }
      const placementGapX = (lastXEnd + xStart) / 2;
      const queryPlacementGapX =
        (lastPlacement.queryXSpan!.end + placement.queryXSpan!.start) / 2;
      const placementTargetGap =
        lastTargetChr === targetChr
          ? niceBpCount(targetStart - lastTargetEnd)
          : "not connected";

      const targetTextWidth = placementTargetGap.length * 5; // use font size 10...
      const halfTargetTextWidth = 0.5 * targetTextWidth;
      const preferredTargetStart = placementGapX - halfTargetTextWidth;
      const preferredTargetEnd = placementGapX + halfTargetTextWidth;
      // shift text position only if the width of text is bigger than the gap size:
      const shiftTargetTxt =
        preferredTargetStart <= lastXEnd || preferredTargetEnd >= xStart;
      const targetGapTextXSpan = shiftTargetTxt
        ? targetIntervalPlacer.place(
            new OpenInterval(preferredTargetStart, preferredTargetEnd)
          )
        : new OpenInterval(preferredTargetStart, preferredTargetEnd);
      const targetGapXSpan = new OpenInterval(lastXEnd, xStart);

      const queryTextWidth = placementQueryGap.length * 5; // use font size 10...
      const halfQueryTextWidth = 0.5 * queryTextWidth;
      const preferredQueryStart = queryPlacementGapX - halfQueryTextWidth;
      const preferredQueryEnd = queryPlacementGapX + halfQueryTextWidth;
      // shift text position only if the width of text is bigger than the gap size:
      const shiftQueryTxt =
        preferredQueryStart <= lastPlacement.queryXSpan!.end ||
        preferredQueryEnd >= placement.queryXSpan!.start;
      const queryGapTextXSpan = shiftQueryTxt
        ? queryIntervalPlacer.place(
            new OpenInterval(preferredQueryStart, preferredQueryEnd)
          )
        : new OpenInterval(preferredQueryStart, preferredQueryEnd);
      const queryGapXSpan = new OpenInterval(
        lastPlacement.queryXSpan!.end,
        placement.queryXSpan!.start
      );
      drawGapTexts.push({
        targetGapText: placementTargetGap,
        targetXSpan: targetGapXSpan,
        targetTextXSpan: targetGapTextXSpan,
        queryGapText: placementQueryGap,
        queryXSpan: queryGapXSpan,
        queryTextXSpan: queryGapTextXSpan,
        shiftTarget: shiftTargetTxt,
        shiftQuery: shiftQueryTxt,
      });
    }
    // Finally, using the x coordinates, construct the query nav context

    return {
      isFineMode: true,
      primaryVisData: visData,
      drawData: placements,
      drawGapText: drawGapTexts,
      primaryGenome: event.data.genomeName,
      queryGenome: query,
      basesPerPixel: drawModel.xWidthToBases(1),
      navContextBuilder,
    };
  }
  function placeSequenceSegments(
    sequence: string,
    minGapLength: number,
    startX: number,
    drawModel: LinearDrawingModel
  ) {
    const segments = segmentSequence(sequence, minGapLength);
    segments.sort((a, b) => a.index - b.index);
    let x = startX;
    for (const segment of segments) {
      const bases = segment.isGap
        ? segment.length
        : countBases(sequence.substr(segment.index, segment.length));
      const xSpanLength = drawModel.basesToXWidth(bases);
      (segment as PlacedSequenceSegment).xSpan = new OpenInterval(
        x,
        x + xSpanLength
      );
      x += xSpanLength;
    }
    return segments as PlacedSequenceSegment[];
  }
  function calculatePrimaryVis(
    allGaps: Array<any>,
    oldVisData: ViewExpansion
  ): ViewExpansion {
    // Calculate primary visData that have all the primary gaps from different alignemnts insertions.
    const { visRegion, viewWindow, viewWindowRegion } = oldVisData;
    const oldNavContext = visRegion.getNavigationContext();
    const navContextBuilder = new NavContextBuilder(oldNavContext);
    navContextBuilder.setGaps(allGaps);
    const newNavContext = navContextBuilder.build();
    // Calculate new DisplayedRegionModel and LinearDrawingModel from the new nav context

    const newVisRegion = convertOldVisRegion(visRegion);
    const newViewWindowRegion = convertOldVisRegion(viewWindowRegion);
    const newPixelsPerBase =
      viewWindow.getLength() / newViewWindowRegion.getWidth();
    const newVisWidth = newVisRegion.getWidth() * newPixelsPerBase;
    const newDrawModel = new LinearDrawingModel(newVisRegion, newVisWidth);
    const newViewWindow = newDrawModel.baseSpanToXSpan(
      newViewWindowRegion.getContextCoordinates()
    );

    return {
      visRegion: newVisRegion,
      visWidth: newVisWidth,
      viewWindowRegion: newViewWindowRegion,
      viewWindow: newViewWindow,
    };

    function convertOldVisRegion(visRegion: DisplayedRegionModel) {
      const [contextStart, contextEnd] = visRegion.getContextCoordinates();
      return new DisplayedRegionModel(
        newNavContext,
        navContextBuilder.convertOldCoordinates(contextStart),
        navContextBuilder.convertOldCoordinates(contextEnd)
      );
    }
  }

  function countBases(sequence: string): number {
    return _.sumBy(sequence, (char) => (char === "-" ? 0 : 1));
  }

  function niceBpCount(bases: number, useMinus = false) {
    const rounded = bases >= 1000 ? Math.floor(bases) : Math.round(bases);
    if (rounded >= 750000) {
      return `${(rounded / 1000000).toFixed(1)} Mb`;
    } else if (rounded >= 10000) {
      return `${(rounded / 1000).toFixed(1)} Kb`;
    } else if (rounded > 0) {
      return `${rounded} bp`;
    } else {
      if (useMinus) {
        return "<1 bp";
      } else {
        return "0 bp";
      }
    }
  }

  function computeContextLocations(
    records: AlignmentRecord[],
    visData: ViewExpansion
  ): PlacedAlignment[] {
    const { visRegion, visWidth } = visData;
    return placeFeatures(records, visRegion, visWidth).map((placement) => {
      return {
        record: placement.feature as AlignmentRecord,
        visiblePart: AlignmentSegment.fromFeatureSegment(placement.visiblePart),
        contextSpan: placement.contextLocation,
        targetXSpan: placement.xSpan,
        queryXSpan: null,
      };
    });
  }
  function placeFeatures(
    features: Feature[],
    viewRegion: DisplayedRegionModel,
    width: number,
    useCenter: boolean = false
  ) {
    const drawModel = new LinearDrawingModel(viewRegion, width);
    const viewRegionBounds = viewRegion.getContextCoordinates();
    const navContext = viewRegion.getNavigationContext();

    const placements: Array<any> = [];

    for (const feature of features) {
      for (let contextLocation of feature.computeNavContextCoordinates(
        navContext
      )) {
        contextLocation = contextLocation.getOverlap(viewRegionBounds)!; // Clamp the location to view region
        if (contextLocation) {
          const xSpan = useCenter
            ? drawModel.baseSpanToXCenter(contextLocation)
            : drawModel.baseSpanToXSpan(contextLocation);
          const { visiblePart, isReverse } = locatePlacement(
            feature,
            navContext,
            contextLocation
          );
          placements.push({
            feature,
            visiblePart,
            contextLocation,
            xSpan,
            isReverse,
          });
        }
      }
    }

    return placements;
  }

  function locatePlacement(
    feature: Feature,
    navContext: NavigationContext,
    contextLocation: OpenInterval
  ) {
    // First, get the genomic coordinates of the context location, i.e. the "context locus"
    const contextFeatureCoord = navContext.convertBaseToFeatureCoordinate(
      contextLocation.start
    );
    const placedBase = contextFeatureCoord.getLocus().start;
    const isReverse = contextFeatureCoord.feature.getIsReverseStrand();

    // We have a base number, but it could be the end or the beginning of the context locus.
    let contextLocusStart;
    if (isReverse) {
      // placedBase is the end base number of the context locus.  Convert to the start.
      contextLocusStart = placedBase - contextLocation.getLength() + 1;
    } else {
      contextLocusStart = placedBase;
    }

    // Now, we can compare the context location locus to the feature's locus.
    const distFromFeatureLocus = contextLocusStart - feature.getLocus().start;
    const relativeStart = Math.max(0, distFromFeatureLocus);
    return {
      visiblePart: new FeatureSegment(
        feature,
        relativeStart,
        relativeStart + contextLocation.getLength()
      ),
      isReverse,
    };
  }

  function computeCentroid(intervals: Array<{ [key: string]: any }>) {
    const numerator = _.sumBy(
      intervals,
      (interval) =>
        0.5 * (interval.end - interval.start) * (interval.start + interval.end)
    );
    const denominator = _.sumBy(
      intervals,
      (interval) => interval.end - interval.start
    );

    return numerator / denominator;
  }

  function refineRecordsArray(recordsArray: RecordsObj[]) {
    const minGapLength = MIN_GAP_LENGTH;

    // use a new array of objects to manipulate later, and
    // Combine all gaps from all alignments into a new array:
    const refineRecords: Array<any> = [];
    const allGapsObj = {};
    const placementsArr: Array<any> = [];
    for (const recordsObj of recordsArray) {
      // Calculate context coordinates of the records and gaps within.

      const placements = computeContextLocations(
        recordsObj.records,
        newVisData
      );
      const primaryGaps = getPrimaryGenomeGaps(placements, minGapLength);
      const primaryGapsObj = primaryGaps.reduce((resultObj, gap) => {
        return { ...resultObj, ...{ [gap.contextBase]: gap.length } };
      }, {});
      refineRecords.push({
        recordsObj: recordsObj,
        placements: placements,
        primaryGapsObj: primaryGapsObj,
      });
      for (const contextBase of Object.keys(primaryGapsObj)) {
        if (contextBase in allGapsObj) {
          allGapsObj[contextBase] = Math.max(
            allGapsObj[contextBase],
            primaryGapsObj[contextBase]
          );
        } else {
          allGapsObj[contextBase] = primaryGapsObj[contextBase];
        }
      }
      placementsArr.push(placements);
    }

    // Build a new primary navigation context using the gaps
    const allPrimaryGaps: Array<any> = [];
    for (const contextBase of Object.keys(allGapsObj)) {
      allPrimaryGaps.push({
        contextBase: Number(contextBase),
        length: allGapsObj[contextBase],
      });
    }
    allPrimaryGaps.sort((a, b) => a.contextBase - b.contextBase); // ascending.

    // For each records, insertion gaps to sequences if for contextBase only in allGapsSet:
    if (refineRecords.length > 1) {
      // skip this part for pairwise alignment.
      for (const records of refineRecords) {
        const insertionContexts: Array<any> = [];
        for (const contextBase of Object.keys(allGapsObj)) {
          if (contextBase in records.primaryGapsObj) {
            const lengthDiff =
              allGapsObj[contextBase] - records.primaryGapsObj[contextBase];
            if (lengthDiff > 0) {
              insertionContexts.push({
                contextBase: Number(contextBase),
                length: lengthDiff,
              });
            }
          } else {
            insertionContexts.push({
              contextBase: Number(contextBase),
              length: allGapsObj[contextBase],
            });
          }
        }
        insertionContexts.sort((a, b) => b.contextBase - a.contextBase); // sort descending...
        for (const insertPosition of insertionContexts) {
          const gapString = "-".repeat(insertPosition.length);
          const insertBase = insertPosition.contextBase;
          const thePlacement = records.placements.filter(
            (placement) =>
              placement.contextSpan.start < insertBase &&
              placement.contextSpan.end > insertBase
          )[0]; // There could only be 0 or 1 placement pass the filter.
          if (thePlacement) {
            const visibleTargetSeq =
              thePlacement.visiblePart.getTargetSequence();
            const insertIndex = indexLookup(
              visibleTargetSeq,
              insertBase - thePlacement.contextSpan.start
            );
            const relativePosition =
              thePlacement.visiblePart.sequenceInterval.start + insertIndex;
            const targetSeq = thePlacement.record.targetSeq;
            const querySeq = thePlacement.record.querySeq;
            thePlacement.record.targetSeq =
              targetSeq.slice(0, relativePosition) +
              gapString +
              targetSeq.slice(relativePosition);
            thePlacement.record.querySeq =
              querySeq.slice(0, relativePosition) +
              gapString +
              querySeq.slice(relativePosition);
          }
        }

        records.recordsObj.records = records.placements.map(
          (placement) => placement.record
        );
      }
    }
    const newRecords = refineRecords.map((final) => final.recordsObj);
    return {
      newRecordsArray: newRecords,
      allGaps: allPrimaryGaps,
      placementsArr,
    };

    function indexLookup(sequence: string, base: number): number {
      let index = 0;
      for (const char of sequence) {
        index++;
        if (char !== "-") {
          base--;
        }
        if (base === 0) {
          break;
        }
      }
      return index;
    }
  }

  function getPrimaryGenomeGaps(
    placements: PlacedAlignment[],
    minGapLength: number
  ) {
    const gaps: Array<any> = [];
    for (const placement of placements) {
      const { visiblePart, contextSpan } = placement;
      const segments = segmentSequence(
        visiblePart.getTargetSequence(),
        minGapLength,
        true
      );
      const baseLookup = makeBaseNumberLookup(
        visiblePart.getTargetSequence(),
        contextSpan.start
      );
      for (const segment of segments) {
        gaps.push({
          contextBase: baseLookup[segment.index],
          length: segment.length,
        });
      }
    }
    return gaps;
  }
  function segmentSequence(
    sequence: string,
    minGapLength: number,
    onlyGaps = false
  ) {
    const results: Array<any> = [];
    const gapRegex = new RegExp("-" + "+", "g"); // One or more '-' chars
    let match;
    while ((match = gapRegex.exec(sequence)) !== null) {
      // Find gaps with the regex
      pushSegment(true, match.index, match[0].length, minGapLength);
    }
    if (onlyGaps) {
      return results;
    }

    // Derive non-gaps from the gaps
    let currIndex = 0;
    const gaps = results.slice();
    for (const gap of gaps) {
      pushSegment(false, currIndex, gap.index - currIndex);
      currIndex = gap.index + gap.length;
    }
    // Final segment between the last gap and the end of the sequence
    pushSegment(false, currIndex, sequence.length - currIndex);

    return results;

    function pushSegment(
      isGap: boolean,
      index: number,
      length: number,
      minLength: number = 0
    ) {
      if (length > minLength) {
        results.push({ isGap, index, length });
      }
    }
  }
  function makeBaseNumberLookup(
    sequence: string,
    baseAtStart: number,
    isReverse = false
  ): number[] {
    const diff = isReverse ? -1 : 1;

    const bases: Array<any> = [];
    let currentBase = baseAtStart;
    for (const char of sequence) {
      bases.push(currentBase);
      if (char !== "-") {
        currentBase += diff;
      }
    }
    return bases;
  }
  class IntervalPlacer {
    public leftExtent: number;
    public rightExtent: number;
    public margin: number;
    private _placements: OpenInterval[];

    constructor(margin = 0) {
      this.leftExtent = Infinity;
      this.rightExtent = -Infinity;
      this.margin = margin;
      this._placements = [];
    }

    place(preferredLocation: OpenInterval) {
      let finalLocation = preferredLocation;
      if (
        this._placements.some(
          (placement) => placement.getOverlap(preferredLocation) != null
        )
      ) {
        const center = 0.5 * (preferredLocation.start + preferredLocation.end);
        const isInsertLeft =
          Math.abs(center - this.leftExtent) <
          Math.abs(center - this.rightExtent);
        finalLocation = isInsertLeft
          ? new OpenInterval(
              this.leftExtent - preferredLocation.getLength(),
              this.leftExtent
            )
          : new OpenInterval(
              this.rightExtent,
              this.rightExtent + preferredLocation.getLength()
            );
      }

      this._placements.push(finalLocation);
      if (finalLocation.start < this.leftExtent) {
        this.leftExtent = finalLocation.start - this.margin;
      }
      if (finalLocation.end > this.rightExtent) {
        this.rightExtent = finalLocation.end + this.margin;
      }

      return finalLocation;
    }

    retrievePlacements() {
      return this._placements;
    }
  }

  //______________________________________________________________________________________________________________________________________ROUGHMODE FUNCTION
  function alignRough(
    query: string,
    alignmentRecords: AlignmentRecord[],
    visData: ViewExpansion
  ) {
    const { visRegion, visWidth } = visData;
    const drawModel = new LinearDrawingModel(visRegion, visWidth);
    const mergeDistance = drawModel.xWidthToBases(MERGE_PIXEL_DISTANCE);

    // Count how many bases are in positive strand and how many of them are in negative strand.
    // More in negative strand (<0) => plotStrand = "-".
    const aggregateStrandsNumber = alignmentRecords.reduce(
      (aggregateStrand, record) =>
        aggregateStrand +
        (record.getIsReverseStrandQuery()
          ? -1 * record.getLength()
          : record.getLength()),
      0
    );
    const plotStrand = aggregateStrandsNumber < 0 ? "-" : "+";

    const placedRecords = computeContextLocations(alignmentRecords, visData!);
    // First, merge the alignments by query genome coordinates
    let queryLocusMerges = ChromosomeInterval.mergeAdvanced(
      // Note that the third parameter gets query loci
      placedRecords,
      mergeDistance,
      (placement) => placement.visiblePart.getQueryLocus()
    );

    // Sort so we place the largest query loci first in the next step
    queryLocusMerges = queryLocusMerges.sort(
      (a, b) => b.locus.getLength() - a.locus.getLength()
    );

    const intervalPlacer = new IntervalPlacer(MARGIN);
    const drawData: Array<any> = [];
    for (const merge of queryLocusMerges) {
      const mergeLocus = merge.locus;
      const placementsInMerge = merge.sources; // Placements that made the merged locus
      const mergeDrawWidth = drawModel.basesToXWidth(mergeLocus.getLength());
      const halfDrawWidth = 0.5 * mergeDrawWidth;
      if (mergeDrawWidth < MIN_MERGE_DRAW_WIDTH) {
        continue;
      }

      // Find the center of the primary segments, and try to center the merged query locus there too.
      const drawCenter = computeCentroid(
        placementsInMerge.map((segment) => segment.targetXSpan)
      );
      const targetXStart = Math.min(
        ...placementsInMerge.map((segment) => segment.targetXSpan.start)
      );
      const targetEnd = Math.max(
        ...placementsInMerge.map((segment) => segment.targetXSpan.end)
      );
      const mergeTargetXSpan = new OpenInterval(targetXStart, targetEnd);
      const preferredStart = drawCenter - halfDrawWidth;
      const preferredEnd = drawCenter + halfDrawWidth;
      // Place it so it doesn't overlap other segments
      const mergeXSpan = intervalPlacer.place(
        new OpenInterval(preferredStart, preferredEnd)
      );

      // Put the actual secondary/query genome segments in the placed merged query locus from above
      const queryLoci = placementsInMerge.map(
        (placement) => placement.record.queryLocus
      );
      const isReverse = plotStrand === "-" ? true : false;
      const lociXSpans = placeInternalLoci(
        mergeLocus,
        queryLoci,
        mergeXSpan,
        isReverse,
        drawModel
      );
      for (let i = 0; i < queryLoci.length; i++) {
        placementsInMerge[i].queryXSpan = lociXSpans[i];
      }

      drawData.push({
        queryFeature: new Feature(" ", mergeLocus, plotStrand),
        targetXSpan: mergeTargetXSpan,
        queryXSpan: mergeXSpan,
        segments: placementsInMerge,
      });
    }

    return {
      isFineMode: false,
      primaryVisData: visData,
      drawData,
      plotStrand,
      primaryGenome: event.data.genomeName,
      queryGenome: query,
      basesPerPixel: drawModel.xWidthToBases(1),
    };
  }
  function placeInternalLoci(
    parentLocus: ChromosomeInterval,
    internalLoci: ChromosomeInterval[],
    parentXSpan: OpenInterval,
    drawReverse: boolean,
    drawModel: LinearDrawingModel
  ) {
    const xSpans: Array<any> = [];
    if (drawReverse) {
      // place segments from right to left if drawReverse
      for (const locus of internalLoci) {
        const distanceFromParent = locus.start - parentLocus.start;
        const xDistanceFromParent = drawModel.basesToXWidth(distanceFromParent);
        const locusXEnd = parentXSpan.end - xDistanceFromParent;
        const xWidth = drawModel.basesToXWidth(locus.getLength());
        const xEnd = locusXEnd < parentXSpan.end ? locusXEnd : parentXSpan.end;
        const xStart =
          locusXEnd - xWidth > parentXSpan.start
            ? locusXEnd - xWidth
            : parentXSpan.start;
        xSpans.push(new OpenInterval(xStart, xEnd));
      }
    } else {
      for (const locus of internalLoci) {
        const distanceFromParent = locus.start - parentLocus.start;
        const xDistanceFromParent = drawModel.basesToXWidth(distanceFromParent);
        const locusXStart = parentXSpan.start + xDistanceFromParent;
        const xWidth = drawModel.basesToXWidth(locus.getLength());
        const xStart =
          locusXStart > parentXSpan.start ? locusXStart : parentXSpan.start;
        const xEnd =
          locusXStart + xWidth < parentXSpan.end
            ? locusXStart + xWidth
            : parentXSpan.end;
        xSpans.push(new OpenInterval(xStart, xEnd));
      }
    }
    return xSpans;
  }

  //______________________________________________________________________________________________________________________________

  // use align fine function or align rough function to create draw Data
  let drawDataArr: Array<{ [key: string]: any }> = [];
  if (event.data.viewMode === "fineMode") {

    const { newRecordsArray, allGaps } = refineRecordsArray(oldRecordsArray);

    // use the gaps in bp to create  new  visdata. The gap will cause  the windowWidth to change increasing or decreasing
    const primaryVisData = calculatePrimaryVis(allGaps, newVisData);

    let alignmentDatas = newRecordsArray.reduce(
      (multiAlign, records) => ({
        ...multiAlign,
        [records.query]: alignFine(
          records.query,
          records.records,
          newVisData,
          primaryVisData,
          allGaps
        ),
      }),
      {}
    );

    drawDataArr = Object.values(alignmentDatas);

    let drawData = drawDataArr[0].drawData;

    for (let i = 0; i < drawData.length; i++) {
      let placement = drawData[i];

      const { targetXSpan } = placement;

      let tmpObj = {};
      tmpObj["xStart"] = targetXSpan.start;
      tmpObj["xEnd"] = targetXSpan.end;
      tmpObj["targetSequence"] = placement.visiblePart.getTargetSequence();
      tmpObj["querySequence"] = placement.visiblePart.getQuerySequence();
      tmpObj["baseWidth"] =
        targetXSpan.getLength() / tmpObj["targetSequence"].length;
      tmpObj["targetLocus"] = placement.visiblePart.getLocus().toString();
      tmpObj["queryLocus"] = placement.visiblePart.getQueryLocus().toString();
      const nonGapsTarget = placement.targetSegments.filter(
        (segment) => !segment.isGap
      );

      tmpObj["nonGapTargetData"] = nonGapsTarget.map((segment) => ({
        index: segment.index,
        segXSpanStart: segment.xSpan.start,
        segXSpanEnd: segment.xSpan.end,
        segLength: segment.xSpan.getLength(),
      }));

      const nonGapsQuery = placement.querySegments.filter(
        (segment) => !segment.isGap
      );
      tmpObj["queryLocusFine"] = placement.visiblePart.getQueryLocusFine();
      tmpObj["nonGapQueryData"] = nonGapsQuery.map((segment) => ({
        index: segment.index,
        segXSpanStart: segment.xSpan.start,
        segXSpanEnd: segment.xSpan.end,
        segLength: segment.xSpan.getLength(),
      }));

      drawData[i] = { ...drawData[i], ...tmpObj };
    }
  } else {
    let alignmentDatas: { [key: string]: any } = oldRecordsArray.reduce(
      (multiAlign, records) => ({
        ...multiAlign,
        [records.query]: alignRough(
          records.query,
          records.records,
          newVisData!
        ),
      }),
      {}
    );

    drawDataArr = Object.values(alignmentDatas);

    //default datas
  }
  postMessage({ drawDataArr, xDist: event.data.xDist });
};
