import { GraphNode } from "../GraphNode";
import DisplayedRegionModel from "../DisplayedRegionModel";
import Feature, {
  computeNavContextCoordinates,
  getFeatureLength,
  getFeatureLocus,
  getFeatureValue,
} from "../Feature";
import OpenInterval from "../OpenInterval";
import LinearDrawingModel from "../LinearDrawingModel";
import NavigationContext from "../NavigationContext";
import { FeatureSegment } from "../FeatureSegment";
import { GenomeInteraction } from "../../getRemoteData/GenomeInteraction";
import ChromosomeInterval from "../ChromosomeInterval";
import { FeaturePlacementResult, PlacedFeatureGroup } from "../FeatureArranger";

/**
 * Draw information for a Feature
 */
export interface PlacedFeature {
  feature: Feature; // The feature that was placed
  /**
   * The feature's *visible* part.  "Visible" means the parts of the feature that lie inside the nav context, as some
   * parts might fall outside.  For example, the feature is chr1:0-200 but the context only contains chr1:50-100.
   */
  visiblePart: FeatureSegment;
  contextLocation: OpenInterval; // The feature's *visible* part in navigation context coordinates
  xSpan: OpenInterval; // Horizontal location of the feature's *visible* part
  isReverse: boolean; // Whether the feature was placed into a reversed part of the navigation context
}

export interface PlacedSegment {
  segment: FeatureSegment; // The segment, truncated to the visible part
  xSpan: OpenInterval; // The x span of the segment
}

export class PlacedInteraction {
  interaction: GenomeInteraction; // The interaction
  /**
   * x span to draw the first region of the interaction.  Guaranteed to have the lower start of both the two spans.
   */
  xSpan1: OpenInterval;
  xSpan2: OpenInterval; // x span to draw the second region of the interaction

  constructor(
    interaction: GenomeInteraction,
    xSpan1: OpenInterval,
    xSpan2: OpenInterval,
  ) {
    this.interaction = interaction;
    if (xSpan1.start <= xSpan2.start) {
      // Ensure the x spans are ordered
      this.xSpan1 = xSpan1;
      this.xSpan2 = xSpan2;
    } else {
      this.xSpan1 = xSpan2;
      this.xSpan2 = xSpan1;
    }
  }

  /**
   * @return {number} the length of the interaction in draw coordinates
   */
  getWidth(): number {
    const start = this.xSpan1.start; // Guaranteed to have to lower start
    const end = Math.max(this.xSpan1.end, this.xSpan2.end);
    return end - start;
  }

  generateKey(): string {
    return (
      "" +
      this.xSpan1.start +
      this.xSpan1.end +
      this.xSpan2.start +
      this.xSpan2.end
    );
  }
}

export type PaddingFunc = (feature: Feature, xSpan: OpenInterval) => number;

export enum PlacementMode {
  NUMERICAL = "numerical", // Build aggregation arrays for numerical tracks
  PLACEMENT = "placement", // Return PlacedFeature[]
  ANNOTATION = "annotation", // Return PlacedFeatureGroup[] with adjacent features grouped and rows assigned
  BOXPLOT = "boxplot", // Build windowed map for boxplot visualization
}

export interface PlaceFeaturesOptions {
  features: Feature[] | any[];
  viewRegion: DisplayedRegionModel;
  width: number;
  useCenter?: boolean;
  mode?: PlacementMode; // Defaults to PLACEMENT
  viewWindow?: { start: number; end: number };
  // For ANNOTATION mode (combines adjacent + assigns rows)
  padding?: number | PaddingFunc;
  hiddenPixels?: number; // Minimum pixel width to display a feature
  // For NUMERICAL mode
  xToFeaturesForward?: Feature[][];
  xToFeaturesReverse?: Feature[][];
  aggregateFunc?: (features: Feature[]) => any;
  xToAggregatedForward?: any[];
  xToAggregatedReverse?: any[];
  // For BOXPLOT mode
  windowSize?: number; // Window size for binning features
  xToWindowMap?: { [x: number]: Feature[] }; // Output map for boxplot
}

function sortPlacedFeatureIntoXMap(
  placedFeature: PlacedFeature,
  xToFeatures: Feature[][],
  width: number,
) {
  const startX = Math.max(0, Math.floor(placedFeature.xSpan.start));
  const endX = Math.min(width - 1, Math.ceil(placedFeature.xSpan.end));

  for (let x = startX; x <= endX; x++) {
    xToFeatures[x].push(placedFeature.feature);
  }
}

// Raw grouped records carry no chr of their own — it lives on the enclosing
// `{ chr, data }` group. The numerical/annotation placers read chr/start/end/
// value straight off each record (see the getFeature* accessors), so we stamp
// the group's chr onto the record. The cached records may be deep-frozen (e.g.
// by an Immer-managed store), in which case we can't mutate them — so we return
// a shallow copy that preserves array indices and named props with chr added.
function stampGroupChr(record: any, chr: string): any {
  if (record.chr !== undefined) {
    return record;
  }
  if (Object.isExtensible(record)) {
    record.chr = chr;
    return record;
  }
  const copy: any = Array.isArray(record) ? [] : {};
  for (const key in record) {
    copy[key] = record[key];
  }
  copy.chr = chr;
  return copy;
}

// Lazily yields the individual records to place from one region entry, without
// building an intermediate array. An entry may be a plain array, a cache entry
// with `dataCache`, a single feature, or a `{ chr, data }` group cached as raw
// data. Multi-file tracks (matplot/dynamic/dynamicbed) nest one level deeper
// after `groupTracksArrMatPlot` re-buckets them by sub-track — a bucket is
// `[region][ { chr, data } groups ]` — so we recurse into nested arrays /
// dataCache entries and only yield leaf records.
function* expandFeatureRecords(item: any): Generator<any> {
  const entries = Array.isArray(item)
    ? item
    : item?.dataCache
      ? item.dataCache
      : [item];

  if (!Array.isArray(entries)) {
    return;
  }

  for (const entry of entries) {
    if (!entry) {
      continue;
    }
    if (
      typeof entry === "object" &&
      !Array.isArray(entry) &&
      Array.isArray(entry.data) &&
      "chr" in entry
    ) {
      const groupChr = entry.chr;
      for (const record of entry.data) {
        if (!record) {
          continue;
        }
        yield stampGroupChr(record, groupChr);
      }
    } else if (Array.isArray(entry) || entry?.dataCache) {
      // Nested array (per-region groups within a sub-track bucket) or a further
      // dataCache wrapper — unwrap it the same way rather than treating the
      // whole array as a single record.
      yield* expandFeatureRecords(entry);
    } else {
      yield entry;
    }
  }
}

export class FeaturePlacer {
  /**
   * Computes context and draw locations for a list of features.
   * Accepts nested arrays (e.g., from combinedData with dataCache) and processes them without flattening.
   *
   * Three modes:
   * 1. NUMERICAL: Builds aggregation arrays, returns empty array
   * 2. PLACEMENT: Returns PlacedFeature[] for rendering
   * 3. ANNOTATION: Returns PlacedFeatureGroup[] with adjacent features grouped and rows assigned
   *
   * @param {PlaceFeaturesOptions} options - configuration object
   * @return {FeaturePlacementResult} draw info with placements and metadata
   */
  placeFeatures(
    options: PlaceFeaturesOptions,
  ): FeaturePlacementResult | PlacedFeature {
    const {
      features,
      viewRegion,
      width,
      useCenter = false,
      mode = PlacementMode.PLACEMENT,
      xToFeaturesForward,
      xToFeaturesReverse,
      hiddenPixels = 0.5,
    } = options;

    const drawModel = new LinearDrawingModel(viewRegion, width);
    const navContext = viewRegion.getNavigationContext();
    const viewRegionBounds = viewRegion.getContextCoordinates();
    const placementsForward: Array<PlacedFeature | PlacedFeatureGroup> = [];
    const placementsReverse: Array<PlacedFeature | PlacedFeatureGroup> = [];
    let numHidden = 0;
    const isAnnotationMode = mode === PlacementMode.ANNOTATION;

    // The 3 stitched region entries can point to the *same* underlying data
    // array (raw tracks cache one fetch across all 3 dataIdx slots). Skip an
    // entry whose data array we've already placed so identical regions aren't
    // walked (and rendered) 3×. Genuinely different regions have different refs
    // and are all processed.
    const seenDataRefs = new Set<any>();

    // Dedupes placements by their drawn span (contextLocation start/end). The
    // same span can arrive more than once — e.g. a feature split across nav
    // context pieces, or overlapping fetch regions returning the same record.
    // A string key is compact and O(1); an object Set wouldn't work since every
    // placement is a fresh object (reference identity never matches).
    const seenSpans = new Set<string>();

    // Loop through outer array (regions: features[0]=region1, features[1]=region2, features[2]=region3)
    for (let regionIndex = 0; regionIndex < features.length; regionIndex++) {
      const item = features[regionIndex];

      const dataRef = Array.isArray(item)
        ? item
        : item?.dataCache
          ? item.dataCache
          : undefined;
      if (dataRef !== undefined) {
        if (seenDataRefs.has(dataRef)) {
          continue;
        }
        seenDataRefs.add(dataRef);
      }

      // Unwraps arrays / dataCache entries / raw { chr, data } groups in place.
      for (const feature of expandFeatureRecords(item)) {
        if (!feature) {
          continue;
        }

        // Check size for ANNOTATION mode
        if (
          isAnnotationMode &&
          drawModel.basesToXWidth(getFeatureLength(feature)) < hiddenPixels
        ) {
          numHidden++;
          continue;
        }

        // Collect placements for this feature
        const tmpPlacementForward: PlacedFeature[] = [];
        const tmpPlacementReverse: PlacedFeature[] = [];

        for (const baseInterval of computeNavContextCoordinates(
          feature,
          navContext,
        )) {
          const contextLocation = baseInterval.getOverlap(viewRegionBounds);
          if (!contextLocation) {
            continue;
          }

          // Skip a span we've already placed (same drawn span).
          const spanKey = `${contextLocation.start}-${contextLocation.end}`;
          if (seenSpans.has(spanKey)) {
            continue;
          }
          seenSpans.add(spanKey);

          const xSpan = useCenter
            ? drawModel.baseSpanToXCenter(contextLocation)
            : drawModel.baseSpanToXSpan(contextLocation);

          const { visiblePart, isReverse } = this._locatePlacement(
            feature,
            navContext,
            contextLocation,
          );

          const placement: PlacedFeature = {
            feature,
            visiblePart,
            contextLocation,
            xSpan,
            isReverse,
          };

          const featureValue =
            getFeatureValue(feature) ?? feature.values ?? undefined;

          // Only genuinely negative values render on the reverse strand. undefined
          // and NaN (e.g. raw bed annotation records whose column 3 is a name, not
          // a number) must go forward — otherwise `arrange`, which returns only the
          // forward placements, would drop every annotation.
          if (!(featureValue < 0) || Array.isArray(featureValue)) {
            if (mode === PlacementMode.NUMERICAL && xToFeaturesForward) {
          
              sortPlacedFeatureIntoXMap(placement, xToFeaturesForward, width);
            } else {
              tmpPlacementForward.push(placement);
            }
          } else {
            if (mode === PlacementMode.NUMERICAL && xToFeaturesReverse) {
              sortPlacedFeatureIntoXMap(placement, xToFeaturesReverse, width);
            } else {
              tmpPlacementReverse.push(placement);
            }
          }
        }

        if (mode === PlacementMode.NUMERICAL) {
          continue;
        }

        if (isAnnotationMode) {
          if (tmpPlacementForward.length > 0) {
            placementsForward.push(
              ...this._combineAdjacent(tmpPlacementForward),
            );
          }
          if (tmpPlacementReverse.length > 0) {
            placementsReverse.push(
              ...this._combineAdjacent(tmpPlacementReverse),
            );
          }
        } else {
          if (tmpPlacementForward.length > 0) {
            placementsForward.push(...tmpPlacementForward);
          }
          if (tmpPlacementReverse.length > 0) {
            placementsReverse.push(...tmpPlacementReverse);
          }
        }
      }
    }
    // NUMERICAL mode writes its results into the passed-in xToFeatures* maps and
    // has nothing to return. PLACEMENT and ANNOTATION both return placements.
    if (mode === PlacementMode.NUMERICAL) {
      return;
    }
    const resultPlacements = isAnnotationMode
      ? (placementsForward as PlacedFeatureGroup[])
      : (placementsForward as PlacedFeature[]);
    const resultPlacementsReverse = isAnnotationMode
      ? (placementsReverse as PlacedFeatureGroup[])
      : (placementsReverse as PlacedFeature[]);

    return {
      placements: resultPlacements,
      placementsForward: resultPlacements,
      placementsReverse: resultPlacementsReverse,
      numHidden: numHidden,
    };
  }

  _combineAdjacent(placements: PlacedFeature[]): PlacedFeatureGroup[] {
    if (placements.length === 0) {
      return [];
    }

    const groups: PlacedFeatureGroup[] = [];
    let i = 0;

    while (i < placements.length) {
      let j = i + 1;

      while (j < placements.length) {
        const locusA = placements[j - 1].visiblePart.getLocus();
        const locusB = placements[j].visiblePart.getLocus();
        if (locusA.end !== locusB.start && locusA.start !== locusB.end) {
          break;
        }
        j++;
      }

      const placementsInGroup = placements.slice(i, j);
      const firstPlacement = placementsInGroup[0];
      const lastPlacement = placementsInGroup[placementsInGroup.length - 1];

      groups.push({
        feature: firstPlacement.feature,
        row: -1,
        xSpan: new OpenInterval(
          firstPlacement.xSpan.start,
          lastPlacement.xSpan.end,
        ),
        placedFeatures: placementsInGroup,
      });

      i = j;
    }

    return groups;
  }

  /**
   * Gets the visible part of a feature after it has been placed in a navigation context, as well as if was placed
   * into a reversed part of the nav context.
   *
   * @param {Feature} feature - feature placed in a navigation context
   * @param {NavigationContext} contextLocation - navigation context in which the feature was placed
   * @param {OpenInterval} navContext - the feature's visible part in navigation context coordinates
   * @return {object} - placement details of the feature
   */
  _locatePlacement(
    feature: Feature,
    navContext: NavigationContext,
    contextLocation: OpenInterval,
  ) {
    // First, get the genomic coordinates of the context location, i.e. the "context locus"
    const contextFeatureCoord = navContext.convertBaseToFeatureCoordinate(
      contextLocation.start,
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
    const distFromFeatureLocus =
      contextLocusStart - getFeatureLocus(feature).start;
    const relativeStart = Math.max(0, distFromFeatureLocus);
    return {
      visiblePart: new FeatureSegment(
        feature,
        relativeStart,
        relativeStart + contextLocation.getLength(),
      ),
      isReverse,
    };
  }
  /**
   * Gets draw spans for feature segments, given a parent feature that has already been placed.
   *
   * @param {PlacedFeature} placedFeature
   * @param {FeatureSegment[]} segments
   * @return {PlacedSegment[]}
   */
  placeFeatureSegments(
    placedFeature: PlacedFeature,
    segments: FeatureSegment[],
  ): PlacedSegment[] {
    const pixelsPerBase =
      placedFeature.xSpan.getLength() /
      placedFeature.contextLocation.getLength();
    const placements: Array<any> = [];
    for (let segment of segments) {
      segment = segment.getOverlap(placedFeature.visiblePart)!;
      if (segment) {
        const basesFromVisiblePart =
          segment.relativeStart - placedFeature.visiblePart.relativeStart;
        const distanceFromXSpan = basesFromVisiblePart * pixelsPerBase;
        const xSpanLength = segment.getLength() * pixelsPerBase;
        let xSpanStart;
        if (placedFeature.isReverse) {
          xSpanStart =
            placedFeature.xSpan.end - distanceFromXSpan - xSpanLength;
        } else {
          xSpanStart = placedFeature.xSpan.start + distanceFromXSpan;
        }
        placements.push({
          segment,
          xSpan: new OpenInterval(xSpanStart, xSpanStart + xSpanLength),
        });
      }
    }

    return placements;
  }

  placeInteractions(
    interactions: GenomeInteraction[],
    viewRegion: DisplayedRegionModel,
    width: number,
  ): PlacedInteraction[] {
    const drawModel = new LinearDrawingModel(viewRegion, width);
    const viewRegionBounds = viewRegion.getContextCoordinates();
    const navContext = viewRegion.getNavigationContext();

    const mappedInteractions: Array<any> = [];
    for (const interaction of interactions) {
      let contextLocations1 = navContext.convertGenomeIntervalToBases(
        interaction.locus1 as ChromosomeInterval,
      );
      let contextLocations2 = navContext.convertGenomeIntervalToBases(
        interaction.locus2 as ChromosomeInterval,
      );
      // Clamp the locations to the view region
      contextLocations1 = contextLocations1.map(
        (location) => location.getOverlap(viewRegionBounds)!,
      );
      contextLocations2 = contextLocations2.map(
        (location) => location.getOverlap(viewRegionBounds)!,
      );
      for (const location1 of contextLocations1) {
        for (const location2 of contextLocations2) {
          if (location1 && location2) {
            const xSpan1 = drawModel.baseSpanToXSpan(location1);
            const xSpan2 = drawModel.baseSpanToXSpan(location2);
            mappedInteractions.push(
              new PlacedInteraction(interaction, xSpan1, xSpan2),
            );
          }
        }
      }
    }

    return mappedInteractions;
  }

  /**
   * pretty much same as palceFeatures, but return feature not place-able. aka, out of view region
   *
   * @param nodes
   * @param viewRegion
   * @param width
   * @returns
   */
  placeGraphNodes(
    nodes: GraphNode[],
    viewRegion: DisplayedRegionModel,
    width: number,
  ): {
    placements: PlacedFeature[];
    nodesOutOfView: GraphNode[];
  } {
    const drawModel = new LinearDrawingModel(viewRegion, width);
    const viewRegionBounds = viewRegion.getContextCoordinates();
    const navContext = viewRegion.getNavigationContext();

    const placements: Array<any> = [],
      nodesOutOfView: Array<any> = [];
    for (const node of nodes) {
      for (let contextLocation of node.computeNavContextCoordinates(
        navContext,
      )) {
        contextLocation = contextLocation.getOverlap(viewRegionBounds)!; // Clamp the location to view region
        if (contextLocation) {
          const xSpan = drawModel.baseSpanToXSpan(contextLocation);
          const { visiblePart, isReverse } = this._locatePlacement(
            node,
            navContext,
            contextLocation,
          );
          placements.push({
            feature: node,
            visiblePart,
            contextLocation,
            xSpan,
            isReverse,
          });
        } else {
          nodesOutOfView.push(node);
        }
      }
    }

    return { placements, nodesOutOfView };
  }
}
